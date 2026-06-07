import { describe, expect, it, vi } from 'vitest'

import {
  applyRouteEntrySideEffects,
  canonicalizeLocation,
  type HistoryLike,
  reconcileLocationToRoute,
} from './routeNavigation'

describe('canonicalizeLocation', () => {
  it('정규 경로는 보정이 필요 없다', () => {
    const result = canonicalizeLocation({ pathname: '/care' })
    expect(result.route).toBe('/care')
    expect(result.shouldReplace).toBe(false)
    expect(result.isFallback).toBe(false)
  })

  it('정규 경로에 붙은 쿼리·해시는 보존하며 보정 대상이 아니다', () => {
    const result = canonicalizeLocation({
      pathname: '/plans',
      search: '?tab=fee',
      hash: '#row',
    })
    expect(result.route).toBe('/plans')
    expect(result.nextUrl).toBe('/plans?tab=fee#row')
    expect(result.shouldReplace).toBe(false)
  })

  it('미등록 딥링크는 폴백 경로로 보정하되 쿼리·해시는 이어 붙인다', () => {
    const result = canonicalizeLocation({
      pathname: '/ghost',
      search: '?ref=email',
    })
    expect(result.route).toBe('/')
    expect(result.nextUrl).toBe('/?ref=email')
    expect(result.shouldReplace).toBe(true)
    expect(result.isFallback).toBe(true)
  })

  it('트레일링 슬래시는 정규형으로 보정한다(폴백 아님)', () => {
    const result = canonicalizeLocation({ pathname: '/claims/' })
    expect(result.route).toBe('/claims')
    expect(result.shouldReplace).toBe(true)
    expect(result.isFallback).toBe(false)
  })
})

describe('reconcileLocationToRoute', () => {
  const makeHistory = () => {
    const replaceState = vi.fn()
    const history: HistoryLike = { pushState: vi.fn(), replaceState }
    return { history, replaceState }
  }

  it('정규 경로에서는 replaceState를 호출하지 않는다', () => {
    const { history, replaceState } = makeHistory()
    const route = reconcileLocationToRoute(history, {
      pathname: '/care',
    })
    expect(route).toBe('/care')
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('미등록 경로는 정규 URL로 replaceState 보정한다', () => {
    const { history, replaceState } = makeHistory()
    const route = reconcileLocationToRoute(history, {
      pathname: '/unknown',
      search: '?x=1',
    })
    expect(route).toBe('/')
    expect(replaceState).toHaveBeenCalledTimes(1)
    expect(replaceState).toHaveBeenCalledWith({}, '', '/?x=1')
  })
})

describe('applyRouteEntrySideEffects', () => {
  it('윈도를 맨 위로 스크롤하고 메인 요소로 포커스를 옮긴다', () => {
    const scrollTo = vi.fn()
    const focus = vi.fn()
    const mainEl = { focus } as unknown as HTMLElement

    applyRouteEntrySideEffects(mainEl, { scrollTo })

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('메인 요소가 없으면 스크롤만 수행하고 throw하지 않는다', () => {
    const scrollTo = vi.fn()
    expect(() => applyRouteEntrySideEffects(null, { scrollTo })).not.toThrow()
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('스크롤 대상이 없는 환경(SSR/테스트)에서도 throw하지 않는다', () => {
    const focus = vi.fn()
    const mainEl = { focus } as unknown as HTMLElement
    expect(() => applyRouteEntrySideEffects(mainEl, undefined)).not.toThrow()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })
})
