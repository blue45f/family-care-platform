import { db, dbEnabled } from './client'
import { collections } from './schema'

type State = { items: unknown[]; seq?: number }

/**
 * 컬렉션 스토어의 Neon 백엔드.
 * - 시작 시 `hydrate()`로 모든 컬렉션을 메모리 캐시로 적재(NestFactory.create 이전 1회).
 * - `read()`는 동기로 캐시를 반환해 기존 `JsonCollectionStore.load()`의 동기 계약을 유지한다.
 * - `write()`는 캐시 갱신 + 비동기 upsert(write-behind)로 Neon에 반영한다(실패는 로그).
 * DATABASE_URL 미설정 시 비활성 → JsonCollectionStore는 파일 백엔드로 동작한다.
 */
class StoreBackend {
  private cache = new Map<string, State>()
  private hydrated = false

  get enabled(): boolean {
    return dbEnabled
  }

  async hydrate(): Promise<void> {
    if (!dbEnabled || !db || this.hydrated) return
    const rows = await db.select().from(collections)
    for (const row of rows) {
      this.cache.set(row.name, row.data as State)
    }
    this.hydrated = true
  }

  read(name: string): State | undefined {
    return this.cache.get(name)
  }

  write(name: string, state: State): void {
    if (!dbEnabled || !db) return
    this.cache.set(name, state)
    void db
      .insert(collections)
      .values({ name, data: state })
      .onConflictDoUpdate({
        target: collections.name,
        set: { data: state, updatedAt: new Date() },
      })
      .catch((error: unknown) => {
        // 동기 계약 유지를 위해 write-behind — 실패는 데이터 손실 위험이라 로그로 가시화.
        console.error(`[store-backend] upsert failed for ${name}:`, error)
      })
  }
}

export const storeBackend = new StoreBackend()
