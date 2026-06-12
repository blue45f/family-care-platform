import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { retryImport } from './lazyRetry'

const RETRY_KEY = 'family-care-chunk-retry'

type StorageStub = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const makeStorage = (): StorageStub => {
  const store = new Map<string, string>()
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}

describe('retryImport', () => {
  let storage: StorageStub
  let reload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    storage = makeStorage()
    reload = vi.fn()
    vi.stubGlobal('sessionStorage', storage)
    vi.stubGlobal('window', { location: { reload } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('성공 로드 시 모듈을 반환하고 재시도 가드를 해제한다', async () => {
    // 직전 reload에서 넘어온 가드가 있어도 성공하면 지운다(다음 배포 실패에 대비).
    storage.setItem(RETRY_KEY, '1')
    const mod = { default: () => null }

    await expect(retryImport(async () => mod)).resolves.toBe(mod)
    expect(storage.getItem(RETRY_KEY)).toBeNull()
    expect(reload).not.toHaveBeenCalled()
  })

  it('첫 실패는 가드를 기록하고 전체 새로고침으로 복구한다', async () => {
    const pending = retryImport(async () => {
      throw new Error('chunk load failed')
    })

    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(storage.getItem(RETRY_KEY)).toBe('1')

    // reload가 처리되는 동안 Suspense fallback을 유지한다 — promise는 settle되지 않는다.
    const outcome = await Promise.race([
      pending.then(
        () => 'settled',
        () => 'settled',
      ),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve('pending'), 25)
      }),
    ])
    expect(outcome).toBe('pending')
  })

  it('reload 후에도 실패하면 에러를 던져 ErrorBoundary에 노출한다', async () => {
    storage.setItem(RETRY_KEY, '1')
    const failure = new Error('chunk load failed twice')

    await expect(
      retryImport(async () => {
        throw failure
      }),
    ).rejects.toBe(failure)
    expect(reload).not.toHaveBeenCalled()
    // 가드는 성공 로드 시에만 해제한다.
    expect(storage.getItem(RETRY_KEY)).toBe('1')
  })
})
