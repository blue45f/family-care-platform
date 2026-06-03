import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

// proto-live(backend/src/projects/projects.store.ts)의 "atomic JSON file store" 패턴을
// 가족 돌봄 API에 이식한 재사용 헬퍼다. DB/ORM 없이 node:fs만으로 재시작 후에도
// 데이터가 살아남도록 한다.
//
// 핵심 설계
// - 원자적 쓰기: temp 파일에 쓴 뒤 rename으로 교체해 부분 기록(half-written)을 막는다.
// - 시작 시 로드: 파일이 없으면 seed()로 초기화하고, 있으면 관용적으로 역직렬화한다.
// - 관용적 역직렬화: items 누락/형식 오류 시 빈 배열로, seq 누락 시 데이터에서 복원한다
//   (proto-live의 missing-field tolerance = 스키마 마이그레이션 안전장치).
// - 테스트 친화: vitest/NODE_ENV=test 환경에서는 파일 I/O 없이 인메모리로만 동작하고
//   save()는 no-op이다. 각 서비스가 항상 seed에서 출발하던 기존 테스트 격리를 그대로 유지한다.

export type StoredCollection<T> = {
  items: T[]
  // 자동 증가 id를 쓰는 컬렉션만 seq를 사용한다(요금제처럼 고정 id 컬렉션은 undefined).
  seq?: number
}

type SerializedCollection = {
  items?: unknown
  seq?: unknown
}

function isTestEnv(): boolean {
  return process.env.VITEST !== undefined || process.env.NODE_ENV === 'test'
}

/**
 * JSON 스토어가 실제로 사용하는 데이터 디렉터리 경로를 계산한다.
 * FCP_DATA_DIR로 덮어쓸 수 있고, 기본값은 api 실행 위치 기준 data/ 디렉터리다.
 * 모든 컬렉션이 이 한 곳을 백킹 디렉터리로 공유하므로, 헬스 체크(readiness)도
 * 같은 경로의 쓰기 가능 여부를 검사하도록 외부에 노출한다.
 */
export function resolveDataDir(): string {
  return process.env.FCP_DATA_DIR?.trim() || resolve(process.cwd(), 'data')
}

/**
 * 단일 JSON 파일을 백킹 스토어로 사용하는 컬렉션 저장소.
 *
 * @param fileName 데이터 디렉터리 하위 파일명 (예: 'care-logs.json')
 * @param seed     파일이 없을 때 사용할 초기 상태를 만드는 팩토리(매 호출 새 인스턴스 반환)
 */
export class JsonCollectionStore<T> {
  private readonly filePath: string
  private readonly testMode: boolean
  // 컬렉션이 자동 증가 id(seq)를 쓰는지 seed 모양으로 한 번 판별한다. 파일에 seq가
  // 누락돼도 이 플래그로 "seq 컬렉션인지"를 잃지 않고 maxId+1로 복원할 수 있다.
  private readonly usesSeq: boolean

  constructor(
    private readonly fileName: string,
    private readonly seed: () => StoredCollection<T>,
    dataDir: string = resolveDataDir(),
  ) {
    this.filePath = join(dataDir, fileName)
    this.testMode = isTestEnv()
    this.usesSeq = seed().seq !== undefined
  }

  /** 시작 시 1회 호출. 파일이 있으면 로드, 없으면 seed로 초기화한다. */
  load(): StoredCollection<T> {
    if (this.testMode || !existsSync(this.filePath)) {
      return this.normalize(this.seed())
    }

    const contents = readFileSync(this.filePath, 'utf8')
    if (!contents.trim()) {
      return this.normalize(this.seed())
    }

    try {
      const parsed = JSON.parse(contents) as SerializedCollection
      return this.deserialize(parsed)
    } catch {
      // 손상된 파일은 seed로 폴백한다(개발 편의 + 깨진 상태로 부팅 방지).
      return this.normalize(this.seed())
    }
  }

  /** 현재 상태를 원자적으로 파일에 기록한다. 테스트 환경에서는 no-op. */
  save(state: StoredCollection<T>): void {
    if (this.testMode) {
      return
    }

    mkdirSync(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`
    writeFileSync(temporaryPath, `${JSON.stringify(this.normalize(state), null, 2)}\n`, 'utf8')
    renameSync(temporaryPath, this.filePath)
  }

  private deserialize(parsed: SerializedCollection): StoredCollection<T> {
    const items = Array.isArray(parsed.items) ? (parsed.items as T[]) : []
    const seq = Number.isInteger(parsed.seq) ? (parsed.seq as number) : undefined
    return this.normalize({ items, seq })
  }

  // seq를 쓰는 컬렉션에서 seq가 비어 있거나 데이터보다 작으면 최대 id+1로 복원한다.
  private normalize(state: StoredCollection<T>): StoredCollection<T> {
    const items = Array.isArray(state.items) ? state.items : []
    if (!this.usesSeq) {
      return { items }
    }

    const maxId = items.reduce<number>((max, item) => {
      const id = (item as { id?: unknown }).id
      return typeof id === 'number' && id > max ? id : max
    }, 0)
    const seq =
      state.seq !== undefined && Number.isInteger(state.seq) && state.seq > maxId
        ? state.seq
        : maxId + 1
    return { items, seq }
  }
}
