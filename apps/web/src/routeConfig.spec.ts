import { describe, expect, it } from 'vitest'

import {
  type AppRoute,
  communityRoutes,
  DEFAULT_ROUTE,
  managementRoutes,
  navGroups,
  publicLandingRoutes,
  todayFirstRoutes,
  isAppRoute,
  operationalWorkflowRoutes,
  resolveRoute,
  resolveRouteResult,
  routeDefs,
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
    const result = resolveRouteResult('/care/')
    expect(result.route).toBe('/care')
    expect(result.isFallback).toBe(false)
    expect(result.isCanonical).toBe(false)
  })

  it('쿼리·해시는 무시하고 경로만 보고 해석한다', () => {
    expect(resolveRoute('/plans?tab=x#top')).toBe('/plans')
  })

  it('미등록 경로는 기본 라우트로 폴백된다', () => {
    expect(resolveRouteResult('/care/unknown')).toMatchObject({
      route: DEFAULT_ROUTE,
      isFallback: true,
    })
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
    expect(isAppRoute('/claims')).toBe(true)
    expect(isAppRoute('/care')).toBe(true)
    expect(isAppRoute('/care/')).toBe(false)
    expect(isAppRoute('/nope')).toBe(false)
  })

  it('좁혀진 값은 AppRoute로 안전하게 다룰 수 있다', () => {
    const raw: string = '/analytics'
    if (isAppRoute(raw)) {
      const narrowed: AppRoute = raw
      expect(narrowed).toBe('/analytics')
    } else {
      throw new Error('기대한 라우트가 가드를 통과하지 못했습니다.')
    }
  })
})

describe('상용 서비스 정보 구조', () => {
  it('오늘 화면에서 이어지는 핵심 업무 흐름을 라우터 단일 소스로 제공한다', () => {
    expect(todayFirstRoutes).toEqual(['/schedule', '/care', '/settlements', '/claims'])
    expect(operationalWorkflowRoutes).toEqual(['/schedule', '/care', '/settlements', '/claims'])
  })

  it('운영 업무와 서비스 관리 화면을 내비게이션 성격별로 분리한다', () => {
    expect(managementRoutes).toEqual(['/analytics', '/plans', '/tutorial', '/guide', '/members'])

    for (const path of todayFirstRoutes) {
      expect(routeDefs[path]).toMatchObject({
        section: 'main',
        inNav: true,
        placeholder: false,
      })
    }

    for (const path of managementRoutes) {
      expect(routeDefs[path]).toMatchObject({
        section: 'manage',
        inNav: true,
        placeholder: false,
      })
    }
  })

  it('커뮤니티(게시판·쪽지·상담)는 별도 내비게이션 그룹으로 노출된다', () => {
    expect(communityRoutes).toEqual(['/community', '/messages', '/support'])

    for (const path of communityRoutes) {
      expect(routeDefs[path]).toMatchObject({
        section: 'community',
        inNav: true,
        placeholder: false,
      })
    }

    const communityGroup = navGroups.find((group) => group.section === 'community')
    expect(communityGroup?.label).toBe('커뮤니티')
    expect(communityGroup?.items.map((item) => item.path)).toEqual([...communityRoutes])
  })

  it('회원 관리는 관리자 전용 플래그를 갖는다(일반 회원 사이드바에서 숨김)', () => {
    expect(routeDefs['/members']).toMatchObject({
      title: '회원 관리',
      section: 'manage',
      inNav: true,
      adminOnly: true,
    })
    // 관리자 전용은 회원 관리 하나뿐이다(의도 밖 확산 방지).
    expect(routeMap.filter((route) => route.adminOnly).map((route) => route.path)).toEqual([
      '/members',
    ])
  })

  it('공개 랜딩 라우트는 확장 가능한 별도 목록으로 관리한다', () => {
    expect(publicLandingRoutes).toEqual([
      '/',
      '/overview',
      '/tutorial',
      '/guide',
      '/community',
      '/plans',
      '/terms',
      '/privacy',
    ])
    expect(publicLandingRoutes).toContain('/guide')
    expect(publicLandingRoutes).toContain('/tutorial')
    expect(publicLandingRoutes).toContain('/plans')
    expect(publicLandingRoutes).toContain('/community')
    expect(publicLandingRoutes).toContain('/terms')
    expect(publicLandingRoutes).toContain('/privacy')
    expect(publicLandingRoutes).not.toContain('/login')
  })

  it('약관/개인정보 페이지는 공개 탐색에서 노출되지만 네비게이션에선 제외된다', () => {
    // 커뮤니티는 로그인 후 실게시판으로 사이드바에 노출된다(공개 /community는 데모 유지).
    expect(routeDefs['/community']).toMatchObject({ inNav: true, section: 'community' })
    expect(routeDefs['/terms']).toMatchObject({ inNav: false })
    expect(routeDefs['/privacy']).toMatchObject({ inNav: false })
  })

  it('튜토리얼 라우트가 공개 탐색과 서비스 관리 메뉴에 반영된다', () => {
    expect(routeDefs['/tutorial']).toMatchObject({
      title: '튜토리얼',
      inNav: true,
      section: 'manage',
      icon: 'book-open',
      placeholder: false,
    })
  })

  it('서비스 소개 라우트가 등록되고 메인 탐색에서 제외된다', () => {
    expect(routeDefs['/overview']).toMatchObject({
      title: '서비스 소개',
      inNav: false,
      section: 'manage',
      icon: 'guide',
      placeholder: false,
    })
  })

  it('인증 라우트는 본문 내비게이션에 노출하지 않는다', () => {
    expect(routeDefs['/account']).toMatchObject({ section: 'account', inNav: true })
    expect(routeDefs['/login']).toMatchObject({ section: 'account', inNav: false })
    expect(routeDefs['/register']).toMatchObject({ section: 'account', inNav: false })
    const accountGroup = navGroups.find((group) => group.section === 'account')
    expect(accountGroup?.items.map((item) => item.path)).toEqual(['/account'])
  })

  it('사용법 가이드는 서비스 관리 내비게이션에 노출된다', () => {
    expect(routeDefs['/guide']).toMatchObject({
      title: '사용 가이드',
      section: 'manage',
      inNav: true,
      placeholder: false,
    })
  })

  it('방문 일정은 돌봄 운영 첫 라우트로 노출된다', () => {
    expect(routeDefs['/schedule']).toMatchObject({
      title: '방문 일정',
      section: 'main',
      inNav: true,
      placeholder: false,
    })
  })
})
