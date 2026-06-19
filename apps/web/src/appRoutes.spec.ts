import { describe, expect, it } from 'vitest'

import {
  authRouteEntries,
  getUnauthenticatedRouteIntent,
  protectedRouteEntries,
  publicRouteEntries,
} from './appRoutes'
import {
  communityRoutes,
  managementRoutes,
  publicLandingRoutes,
  todayFirstRoutes,
} from './routeConfig'

describe('appRoutes', () => {
  it('비로그인 공개 라우트는 홈페이지를 먼저 보여준다', () => {
    expect(publicRouteEntries.map((entry) => entry.path)).toEqual([...publicLandingRoutes])
  })

  it('인증 후 라우트는 오늘 업무 흐름 → 커뮤니티 → 관리 화면 순서를 보존한다', () => {
    expect(protectedRouteEntries.map((entry) => entry.path)).toEqual([
      '/',
      ...todayFirstRoutes,
      ...communityRoutes,
      ...managementRoutes,
      '/account',
      '/overview',
      '/terms',
      '/privacy',
    ])
  })

  it('인증 라우트는 로그인과 회원가입으로만 분리한다', () => {
    expect(authRouteEntries.map((entry) => entry.path)).toEqual(['/login', '/register'])
  })

  it('모든 라우트 엔트리는 React Router에 연결할 렌더 함수를 가진다', () => {
    for (const entry of [...publicRouteEntries, ...protectedRouteEntries, ...authRouteEntries]) {
      expect(entry.render).toEqual(expect.any(Function))
    }
  })

  it('미인증 사용자는 루트에서 홈페이지를 보고 보호 화면에서는 로그인 안내로 이동한다', () => {
    expect(getUnauthenticatedRouteIntent('/overview')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/tutorial')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/guide')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/plans')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/community')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/terms')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/privacy')).toBe('public')
    expect(getUnauthenticatedRouteIntent('/login')).toBe('auth')
    expect(getUnauthenticatedRouteIntent('/register')).toBe('auth')
    expect(getUnauthenticatedRouteIntent('/schedule')).toBe('protected')
    expect(getUnauthenticatedRouteIntent('/claims')).toBe('protected')
    // 쪽지/상담/회원 관리는 개인·관리 데이터라 미인증 시 로그인 안내로 보낸다.
    expect(getUnauthenticatedRouteIntent('/messages')).toBe('protected')
    expect(getUnauthenticatedRouteIntent('/support')).toBe('protected')
    expect(getUnauthenticatedRouteIntent('/inquiry')).toBe('protected')
    expect(getUnauthenticatedRouteIntent('/members')).toBe('protected')
    expect(getUnauthenticatedRouteIntent('/account')).toBe('protected')
  })
})
