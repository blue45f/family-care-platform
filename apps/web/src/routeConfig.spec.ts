import { describe, expect, it } from 'vitest'

import {
  type AppRoute,
  DEFAULT_ROUTE,
  isAppRoute,
  resolveRoute,
  resolveRouteResult,
  routeMap,
} from './routeConfig'

describe('routeConfig 라우트 해석', () => {
  it('등록된 정규 경로는 그대로(폴백 없이) 해석된다', () => {
    for (const route of routeMap) {
      const result = resolveRouteResult(route.path)
      expect(result.route).toBe(route.path)
      expect(result.isFallback).toBe(false)
      expect(result.isCanonical).toBe(true)
    }
  })

  it('트레일링 슬래시는 정규형으로 보정(폴백은 아님)된다', () => {
    const result = resolveRouteResult('/operations/care/')
    expect(result.route).toBe('/operations/care')
    expect(result.isFallback).toBe(false)
    expect(result.isCanonical).toBe(false)
  })

  it('쿼리·해시는 무시하고 경로만 보고 해석한다', () => {
    expect(resolveRoute('/admin/plans?tab=x#top')).toBe('/admin/plans')
  })

  it('미등록 하위 경로는 가장 가까운 섹션 루트로 상향 폴백된다', () => {
    expect(resolveRouteResult('/operations/unknown')).toMatchObject({
      route: '/operations',
      isFallback: true,
    })
    expect(resolveRouteResult('/admin/does-not-exist')).toMatchObject({
      route: '/admin',
      isFallback: true,
    })
  })

  it('그 외 알 수 없는 경로는 기본 라우트로 폴백된다', () => {
    expect(resolveRouteResult('/totally/unknown')).toMatchObject({
      route: DEFAULT_ROUTE,
      isFallback: true,
    })
    expect(resolveRoute('')).toBe(DEFAULT_ROUTE)
  })

  it('기본 라우트는 등록된 정규 라우트여야 한다', () => {
    expect(isAppRoute(DEFAULT_ROUTE)).toBe(true)
  })
})

describe('isAppRoute 타입 가드', () => {
  it('등록된 경로에는 true, 미등록 경로에는 false를 반환한다', () => {
    expect(isAppRoute('/admin/simulator')).toBe(true)
    expect(isAppRoute('/operations/care')).toBe(true)
    expect(isAppRoute('/operations/care/')).toBe(false)
    expect(isAppRoute('/nope')).toBe(false)
  })

  it('좁혀진 값은 AppRoute로 안전하게 다룰 수 있다', () => {
    const raw: string = '/admin'
    if (isAppRoute(raw)) {
      const narrowed: AppRoute = raw
      expect(narrowed).toBe('/admin')
    } else {
      throw new Error('기대한 라우트가 가드를 통과하지 못했습니다.')
    }
  })
})
