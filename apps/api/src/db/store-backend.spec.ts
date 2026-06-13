import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// store-backend는 모듈 로드 시 './client'의 db/dbEnabled를 읽는다. 시나리오마다
// resetModules + doMock 후 동적 import 해 fresh 싱글턴을 얻는다.

function deferred<T = void>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// 모든 마이크로태스크가 정리될 때까지 대기(매크로태스크 경계).
const drain = () => new Promise((r) => setTimeout(r, 0))

describe('StoreBackend', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.doUnmock('./client')
    vi.restoreAllMocks()
  })

  it('DATABASE_URL 미설정: enabled=false, write/read no-op, flush 무해', async () => {
    vi.doMock('./client', () => ({ db: null, dbEnabled: false }))
    const { storeBackend } = await import('./store-backend')

    expect(storeBackend.enabled).toBe(false)
    storeBackend.write('x.json', { items: [1] })
    expect(storeBackend.read('x.json')).toBeUndefined()
    await expect(storeBackend.flush()).resolves.toBeUndefined()
  })

  it('hydrate 실패 시 파일 백엔드로 폴백한다(enabled=false, throw 안 함)', async () => {
    const from = vi.fn(() => Promise.reject(new Error('unreachable')))
    const select = vi.fn(() => ({ from }))
    vi.doMock('./client', () => ({ db: { select }, dbEnabled: true }))
    const { storeBackend } = await import('./store-backend')

    expect(storeBackend.enabled).toBe(true)
    await expect(storeBackend.hydrate()).resolves.toBeUndefined()
    expect(storeBackend.enabled).toBe(false)

    // 폴백 후 write는 no-op(파일 백엔드가 담당).
    storeBackend.write('x.json', { items: [1] })
    expect(storeBackend.read('x.json')).toBeUndefined()
  })

  it('같은 컬렉션 upsert를 호출 순서대로 직렬화한다(이전이 끝나야 다음 시작)', async () => {
    const started: Array<number | undefined> = []
    const firstGate = deferred()
    const select = vi.fn(() => ({ from: vi.fn(() => Promise.resolve([])) }))
    const insert = vi.fn(() => ({
      values: (value: { data: { seq?: number } }) => {
        const { seq } = value.data
        started.push(seq)
        return { onConflictDoUpdate: () => (seq === 1 ? firstGate.promise : Promise.resolve()) }
      },
    }))
    vi.doMock('./client', () => ({ db: { select, insert }, dbEnabled: true }))
    const { storeBackend } = await import('./store-backend')
    await storeBackend.hydrate()

    storeBackend.write('c.json', { items: [], seq: 1 })
    storeBackend.write('c.json', { items: [], seq: 2 })

    // 첫 upsert가 게이트에 막혀 두 번째는 아직 시작되지 않아야 한다.
    await drain()
    expect(started).toEqual([1])

    firstGate.resolve()
    await storeBackend.flush()
    expect(started).toEqual([1, 2]) // 직렬 실행
    expect(storeBackend.read('c.json')?.seq).toBe(2) // 캐시는 last-writer
  })

  it('flush가 인플라이트 upsert를 드레인한다', async () => {
    let persisted = false
    const gate = deferred()
    const select = vi.fn(() => ({ from: vi.fn(() => Promise.resolve([])) }))
    const insert = vi.fn(() => ({
      values: () => ({
        onConflictDoUpdate: () =>
          gate.promise.then(() => {
            persisted = true
          }),
      }),
    }))
    vi.doMock('./client', () => ({ db: { select, insert }, dbEnabled: true }))
    const { storeBackend } = await import('./store-backend')
    await storeBackend.hydrate()

    storeBackend.write('c.json', { items: [] })
    expect(persisted).toBe(false)
    gate.resolve()
    await storeBackend.flush()
    expect(persisted).toBe(true)
  })

  it('write는 호출 시점 상태를 깊은 스냅샷한다(이후 변경이 새지 않음)', async () => {
    const captured: unknown[][] = []
    const select = vi.fn(() => ({ from: vi.fn(() => Promise.resolve([])) }))
    const insert = vi.fn(() => ({
      values: (value: { data: { items: unknown[] } }) => {
        captured.push(value.data.items)
        return { onConflictDoUpdate: () => Promise.resolve() }
      },
    }))
    vi.doMock('./client', () => ({ db: { select, insert }, dbEnabled: true }))
    const { storeBackend } = await import('./store-backend')
    await storeBackend.hydrate()

    const state = { items: ['a'] }
    storeBackend.write('c.json', state)
    state.items.push('b') // write 이후 외부 변경
    await storeBackend.flush()
    expect(captured[0]).toEqual(['a']) // 스냅샷이라 'b'가 새지 않음
  })
})
