import { useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from './components/shell/AppShell'
import { DashboardPage } from './components/pages/DashboardPage'
import { PlaceholderPage } from './components/pages/PlaceholderPage'
import type { AppRoute } from './routeConfig'
import { usePlatformData } from './state/usePlatformData'
import { useRouteMeta } from './useRouteMeta'
import { useRouteState } from './useRouteState'

const ROUTE_MAIN_ID = 'route-main-content'

const App = () => {
  const { activeRoute, routeDef, navigate, isFallback, mainRef } = useRouteState<HTMLDivElement>()
  const data = usePlatformData()

  // 라우트별 문서 타이틀 + OG/Twitter/canonical 메타 동기화(네이티브 훅).
  useRouteMeta(activeRoute, routeDef.title)

  // 라우트 변경 시 보조기술 안내(aria-live). 포커스/스크롤 이동은 useRouteState가
  // 이미 처리하므로 여기서는 announce만 담당한다.
  const [routeAnnouncement, setRouteAnnouncement] = useState('')
  const hasAnnouncedRef = useRef(false)
  useEffect(() => {
    if (!hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true
      return
    }
    setRouteAnnouncement(`${routeDef.title} 페이지로 이동했습니다`)
  }, [routeDef.title])

  const hasReadOnlyError =
    data.errorMessage.includes('권한이 없어') ||
    data.errorMessage.includes('401') ||
    data.errorMessage.includes('403')

  const isOnline = !data.errorMessage.includes('연결')

  const navBadges = useMemo<Partial<Record<AppRoute, number>>>(
    () => (data.pendingClaims > 0 ? { '/claims': data.pendingClaims } : {}),
    [data.pendingClaims],
  )

  const renderPage = () => {
    if (activeRoute === '/') {
      return <DashboardPage data={data} onNavigate={navigate} />
    }
    return <PlaceholderPage def={routeDef} onNavigate={navigate} />
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </p>

      <AppShell
        activeRoute={activeRoute}
        routeTitle={routeDef.title}
        onNavigate={navigate}
        badges={navBadges}
        isOnline={isOnline}
        mainRef={mainRef}
        mainId={ROUTE_MAIN_ID}
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

        {renderPage()}
      </AppShell>
    </>
  )
}

export { App }
