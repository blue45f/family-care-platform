import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import {
  authRouteEntries,
  findProtectedRouteEntry,
  protectedRouteEntries,
  publicRouteEntries,
} from './appRoutes'
import { useAuth } from './auth/useAuth'
import { RouteFallback } from './components/common/RouteFallback'
import { PlaceholderPage } from './components/pages/PlaceholderPage'
import { AppShell } from './components/shell/AppShell'
import { getRouteDef, SITE_NAME, type AppRoute, type RouteDef } from './routeConfig'
import { applyRouteEntrySideEffects, canonicalizeLocation } from './routeNavigation'
import { usePlatformData } from './state/usePlatformData'
import { isReadOnlyErrorMessage } from './utils'
import { useRouteMeta } from './useRouteMeta'

const ROUTE_MAIN_ID = 'route-main-content'

type RouteState = {
  activeRoute: AppRoute
  routeDef: RouteDef
  navigate: (path: AppRoute, state?: unknown) => void
  isFallback: boolean
  mainRef: RefObject<HTMLDivElement | null>
}

/**
 * 인증된 운영 화면. usePlatformData가 여기서 마운트되므로(=로그인 이후에만)
 * 토큰이 실린 상태에서 데이터를 가져온다. 셸 + 라우트별 페이지를 렌더한다.
 */
const AuthedApp = ({ route }: { route: RouteState }) => {
  const { activeRoute, routeDef, navigate, isFallback, mainRef } = route
  const auth = useAuth()
  const data = usePlatformData()
  const shellRoute = activeRoute === '/login' || activeRoute === '/register' ? '/' : activeRoute
  const shellRouteDef = getRouteDef(shellRoute)

  // 로그인 상태에서 인증 전용 경로(/login·/register)로 들어오면 대시보드로 보낸다.
  useEffect(() => {
    if (activeRoute === '/login' || activeRoute === '/register') {
      navigate('/')
    }
  }, [activeRoute, navigate])

  // 라우트 변경 시 보조기술 안내(aria-live).
  const [routeAnnouncement, setRouteAnnouncement] = useState('')
  const hasAnnouncedRef = useRef(false)
  useEffect(() => {
    if (!hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true
      return
    }
    setRouteAnnouncement(`${routeDef.title} 페이지로 이동했습니다`)
  }, [routeDef.title])

  const hasReadOnlyError = isReadOnlyErrorMessage(data.errorMessage)

  const isOnline = !data.errorMessage.includes('연결')

  const navBadges = useMemo<Partial<Record<AppRoute, number>>>(
    () => (data.pendingClaims > 0 ? { '/claims': data.pendingClaims } : {}),
    [data.pendingClaims]
  )

  const fallbackEntry = findProtectedRouteEntry(activeRoute)
  const fallbackPage = fallbackEntry ? (
    fallbackEntry.render({ data, navigate })
  ) : (
    <PlaceholderPage def={routeDef} onNavigate={navigate} />
  )

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </p>

      <AppShell
        routeTitle={shellRouteDef.title}
        badges={navBadges}
        isOnline={isOnline}
        mainRef={mainRef}
        mainId={ROUTE_MAIN_ID}
        userName={auth.user?.name}
        onLogout={auth.logout}
        isAdmin={auth.user?.role === 'admin'}
      >
        {isFallback ? (
          <p className="feedback feedback-warning" role="status" aria-live="polite">
            요청하신 주소를 찾을 수 없어 대시보드로 이동했습니다.
            <button type="button" className="inline-action" onClick={() => navigate('/')}>
              대시보드로
            </button>
          </p>
        ) : null}

        {hasReadOnlyError ? (
          <p className="feedback feedback-warning" role="status" aria-live="polite">
            현재 계정은 일부 기능이 제한될 수 있습니다.
          </p>
        ) : null}

        {data.errorMessage ? (
          <p className="feedback feedback-error" role="alert" aria-live="assertive">
            {data.errorMessage}
            <button type="button" className="inline-action" onClick={data.clearError}>
              닫기
            </button>
          </p>
        ) : null}

        {data.loading ? (
          <p className="feedback feedback-loading" role="status" aria-live="polite">
            최신 데이터를 불러오는 중입니다.
          </p>
        ) : null}

        {/* 라우트 청크 로딩 동안 셸은 유지한 채 본문만 폴백을 보여준다. */}
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {protectedRouteEntries.map((entry) => (
              <Route
                key={entry.path}
                path={entry.path}
                element={entry.render({ data, navigate })}
              />
            ))}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={fallbackPage} />
          </Routes>
        </Suspense>
      </AppShell>
    </>
  )
}

/**
 * 최상위 게이트: 저장된 토큰 확인(isResolving) → 미인증이면 로그인/회원가입(풀스크린,
 * 셸 밖) → 인증되면 AuthedApp. 라우터는 한 번만 구독해 자식에 전달한다.
 */
const App = () => {
  const location = useLocation()
  const routerNavigate = useNavigate()
  const auth = useAuth()
  const mainRef = useRef<HTMLDivElement | null>(null)
  const hasEnteredRef = useRef(false)

  const canonical = useMemo(
    () =>
      canonicalizeLocation({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }),
    [location.hash, location.pathname, location.search]
  )

  const activeRoute = canonical.route
  const routeDef = getRouteDef(activeRoute)

  const navigate = useCallback(
    (path: AppRoute, state?: unknown) => {
      routerNavigate(path, state ? { state: state as Record<string, unknown> } : undefined)
    },
    [routerNavigate]
  )

  useEffect(() => {
    if (canonical.shouldReplace) {
      routerNavigate(canonical.nextUrl, { replace: true })
    }
  }, [canonical.nextUrl, canonical.shouldReplace, routerNavigate])

  useEffect(() => {
    if (!hasEnteredRef.current) {
      hasEnteredRef.current = true
      return
    }
    applyRouteEntrySideEffects(mainRef.current)
  }, [location.key])

  const route: RouteState = {
    activeRoute,
    routeDef,
    navigate,
    isFallback: canonical.isFallback,
    mainRef,
  }

  const locationState = location.state as {
    from?: AppRoute
    source?: string
    plan?: string
    fromLanding?: boolean
  } | null
  const redirectTo = locationState?.from ?? '/'

  const metaTitle = !auth.isAuthenticated && activeRoute === '/' ? SITE_NAME : routeDef.title

  useRouteMeta(activeRoute, metaTitle)

  if (auth.isResolving) {
    return (
      <div className="auth-splash" role="status" aria-live="polite">
        <span className="auth-splash-dot" aria-hidden="true" />
        <p>불러오는 중…</p>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {publicRouteEntries.map((entry) => (
            <Route key={entry.path} path={entry.path} element={entry.render({ navigate })} />
          ))}
          {authRouteEntries.map((entry) => (
            <Route
              key={entry.path}
              path={entry.path}
              element={entry.render({ navigate, redirectTo })}
            />
          ))}
          {protectedRouteEntries
            .filter((entry) => entry.path !== '/')
            .map((entry) => (
              <Route
                key={entry.path}
                path={entry.path}
                element={<Navigate to="/login" replace state={{ from: entry.path }} />}
              />
            ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return <AuthedApp route={route} />
}

export { App }
