import { describe, expect, it, vi } from 'vitest'

import swSource from '../public/sw.js?raw'

const ORIGIN = 'https://family-care.test'

type MockResponse = {
  ok: boolean
  status: number
  body: string
  clone: () => MockResponse
}

type MockRequest = { url: string; method: string; mode: string }

/** sw.js 소스에서 현재 캐시명을 읽는다 (버전 범프 검증 겸 테스트 시드용). */
function currentCacheName(): string {
  const match = swSource.match(/const CACHE_NAME = '([^']+)'/)
  if (!match) throw new Error('sw.js에서 CACHE_NAME 선언을 찾지 못했습니다')
  return match[1]
}

const CACHE_NAME = currentCacheName()

function makeResponse(body: string, status = 200): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    body,
    clone: () => makeResponse(body, status),
  }
}

function makeRequest(path: string, init: Partial<MockRequest> = {}): MockRequest {
  return { url: new URL(path, ORIGIN).href, method: 'GET', mode: 'no-cors', ...init }
}

/** sw.js를 가짜 서비스워커 전역(self/caches/fetch)으로 실행해 등록된 리스너를 구동한다. */
function bootWorker(fetchImpl: (request: MockRequest) => Promise<MockResponse>) {
  const stores = new Map<string, Map<string, MockResponse>>()
  const listeners = new Map<string, (event: unknown) => void>()
  const keyOf = (target: MockRequest | string) =>
    new URL(typeof target === 'string' ? target : target.url, ORIGIN).href
  const openStore = (name: string) => {
    const store = stores.get(name) ?? new Map<string, MockResponse>()
    stores.set(name, store)
    return store
  }

  const cacheStorage = {
    open: async (name: string) => {
      const store = openStore(name)
      return {
        put: async (request: MockRequest, response: MockResponse) => {
          store.set(keyOf(request), response)
        },
      }
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (target: MockRequest | string) => {
      for (const store of stores.values()) {
        const cached = store.get(keyOf(target))
        if (cached) return cached
      }
      return undefined
    },
  }

  const claim = vi.fn(async () => {})
  const scope = {
    location: { origin: ORIGIN },
    skipWaiting: () => {},
    clients: { claim },
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      listeners.set(type, handler)
    },
  }

  new Function('self', 'caches', 'fetch', swSource)(scope, cacheStorage, fetchImpl)

  const listenerOf = (type: string) => {
    const handler = listeners.get(type)
    if (!handler) throw new Error(`sw.js가 ${type} 리스너를 등록하지 않았습니다`)
    return handler
  }

  return {
    stores,
    claim,
    seedCache: (name: string, path: string, response: MockResponse) => {
      openStore(name).set(keyOf(path), response)
    },
    activate: async () => {
      let pending: Promise<unknown> = Promise.resolve()
      listenerOf('activate')({
        waitUntil: (settled: Promise<unknown>) => {
          pending = settled
        },
      })
      await pending
    },
    dispatchFetch: async (request: MockRequest) => {
      let pending: Promise<MockResponse | undefined> | undefined
      listenerOf('fetch')({
        request,
        respondWith: (responded: Promise<MockResponse | undefined>) => {
          pending = responded
        },
      })
      const response = pending ? await pending : undefined
      // respondWith 체인 밖의 fire-and-forget cache.put 마이크로태스크까지 흘려보낸다.
      await new Promise((resolve) => setTimeout(resolve, 0))
      return response
    },
  }
}

describe('service worker', () => {
  it('캐시명이 v2로 범프되어 구버전 캐시 키와 충돌하지 않는다', () => {
    expect(CACHE_NAME).toBe('family-care-platform-pwa-v2')
  })

  it('activate 시 CACHE_NAME이 아닌 구버전 캐시를 삭제하고 클라이언트를 클레임한다', async () => {
    const worker = bootWorker(() => Promise.reject(new Error('offline')))
    worker.seedCache('family-care-platform-pwa-v1', '/', makeResponse('구버전 셸'))
    worker.seedCache(CACHE_NAME, '/', makeResponse('현행 셸'))
    await worker.activate()
    expect([...worker.stores.keys()]).toEqual([CACHE_NAME])
    expect(worker.claim).toHaveBeenCalledTimes(1)
  })

  it('같은 출처 /assets/ GET 성공 응답을 CACHE_NAME 캐시에 저장한다', async () => {
    const bundleUrl = new URL('/assets/index-abc123.js', ORIGIN).href
    const fetchImpl = vi.fn(async () => makeResponse('번들'))
    const worker = bootWorker(fetchImpl)
    const response = await worker.dispatchFetch(makeRequest('/assets/index-abc123.js'))
    expect(response?.body).toBe('번들')
    expect(worker.stores.get(CACHE_NAME)?.get(bundleUrl)?.body).toBe('번들')
  })

  it('캐시된 /assets/ 번들은 오프라인에서도 네트워크 없이 서빙된다 (cache-first)', async () => {
    const fetchImpl = vi.fn(async () => makeResponse('번들'))
    const worker = bootWorker(fetchImpl)
    await worker.dispatchFetch(makeRequest('/assets/index-abc123.js'))
    fetchImpl.mockRejectedValue(new Error('offline'))
    const response = await worker.dispatchFetch(makeRequest('/assets/index-abc123.js'))
    expect(response?.body).toBe('번들')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('실패 응답(404)은 캐시에 저장하지 않고 그대로 통과시킨다', async () => {
    const fetchImpl = vi.fn(async () => makeResponse('없음', 404))
    const worker = bootWorker(fetchImpl)
    const response = await worker.dispatchFetch(makeRequest('/assets/missing.js'))
    expect(response?.status).toBe(404)
    expect(worker.stores.get(CACHE_NAME)?.size ?? 0).toBe(0)
  })

  it('교차 출처·비GET 요청에는 관여하지 않는다', async () => {
    const fetchImpl = vi.fn(async () => makeResponse('외부'))
    const worker = bootWorker(fetchImpl)
    const crossOrigin = await worker.dispatchFetch(
      makeRequest('https://cdn.example.com/assets/lib.js')
    )
    const nonGet = await worker.dispatchFetch(makeRequest('/assets/log', { method: 'POST' }))
    expect(crossOrigin).toBeUndefined()
    expect(nonGet).toBeUndefined()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('오프라인 navigate는 캐시된 셸(/)로 폴백한다 — 기존 동작 보존', async () => {
    const worker = bootWorker(() => Promise.reject(new Error('offline')))
    worker.seedCache(CACHE_NAME, '/', makeResponse('셸'))
    const response = await worker.dispatchFetch(makeRequest('/care', { mode: 'navigate' }))
    expect(response?.body).toBe('셸')
  })
})
