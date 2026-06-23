import { db, dbEnabled } from './client'
import { collections } from './schema'

type State = { items: unknown[]; seq?: number }

/**
 * 컬렉션 스토어의 Neon 백엔드.
 * - 시작 시 `hydrate()`로 모든 컬렉션을 메모리 캐시로 적재(NestFactory.create 이전 1회).
 * - `read()`는 동기로 캐시를 반환해 기존 `JsonCollectionStore.load()`의 동기 계약을 유지한다.
 * - `write()`는 캐시 갱신 + 비동기 upsert(write-behind)로 Neon에 반영한다.
 *   같은 컬렉션의 upsert는 호출 순서대로 직렬화해 순서 역전에 의한 stale 회귀를 막고,
 *   인플라이트 upsert는 종료 시 `flush()`로 드레인한다.
 * - hydrate가 실패하거나 DATABASE_URL 미설정이면 비활성 → JsonCollectionStore가 파일 백엔드로 동작.
 */
class StoreBackend {
  private cache = new Map<string, State>()
  private hydrated = false
  private failed = false
  // 컬렉션별 마지막 write-behind 프라미스 — 다음 upsert를 여기에 체이닝해 호출 순서와
  // 일치시킨다(last-writer-wins). flush()가 이 값들을 await한다.
  private tails = new Map<string, Promise<unknown>>()

  get enabled(): boolean {
    return dbEnabled && !this.failed
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return
    if (!dbEnabled || !db) {
      throw new Error(
        '[store-backend] DATABASE_URL is not set. Database is required in non-test mode.'
      )
    }
    try {
      const rows = await db.select().from(collections)
      for (const row of rows) {
        this.cache.set(row.name, row.data as State)
      }
      this.hydrated = true
    } catch (error) {
      this.failed = true
      console.error('[store-backend] hydrate failed:', error)
      throw error
    }
  }

  read(name: string): State | undefined {
    return this.cache.get(name)
  }

  write(name: string, state: State): void {
    if (!this.enabled || !db) return
    const database = db // 비동기 클로저에서 non-null 내로잉 유지를 위해 로컬에 고정.
    // 호출 시점 상태를 깊은 스냅샷으로 고정 — 직렬화 지연 동안의 외부 변경이
    // 인플라이트 upsert에 새지 않게 한다.
    const snapshot: State = structuredClone(state)
    this.cache.set(name, snapshot)
    const previous = this.tails.get(name) ?? Promise.resolve()
    const next = previous
      .catch(() => {})
      .then(() =>
        database
          .insert(collections)
          .values({ name, data: snapshot })
          .onConflictDoUpdate({
            target: collections.name,
            set: { data: snapshot, updatedAt: new Date() },
          })
      )
      .catch((error: unknown) => {
        // 동기 계약 유지를 위해 write-behind — 실패는 데이터 손실 위험이라 로그로 가시화.
        console.error(`[store-backend] upsert failed for ${name}:`, error)
      })
    this.tails.set(name, next)
  }

  /**
   * 인플라이트 write-behind upsert를 모두 드레인한다. graceful 종료(SIGTERM/SIGINT,
   * 재배포) 직전에 호출해 마지막 쓰기 유실을 막는다. SIGKILL 즉시 종료는 설계상 불가.
   */
  async flush(): Promise<void> {
    await Promise.allSettled([...this.tails.values()])
  }
}

export const storeBackend = new StoreBackend()
