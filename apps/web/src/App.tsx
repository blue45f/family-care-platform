import { useEffect, useMemo, useRef, useState } from 'react'

import { ThemeToggle } from './components/common/ThemeToggle'
import { AdminPage } from './components/pages/AdminPage'
import { HomePage } from './components/pages/HomePage'
import { OperationsPage } from './components/pages/OperationsPage'
import {
  type AppRoute,
  type NonHomeRoutePath,
  type HomeLandingSectionBlueprint,
  RouteCompositionMeta,
  type RouteContext,
  type RouteTopNavItem,
  getRouteCompositionState,
  type OperationsRouteModule,
  routeModeDefinitions,
  type AdminRouteModule,
} from './routeConfig'
import { formatRate, formatWon } from './utils'
import { usePlatformData } from './state/usePlatformData'
import { useRouteState } from './useRouteState'

type RouteModeMetric = {
  label: string
  value: string
  aria: string
}

type RouteShellProps = {
  routeContext: RouteContext
  heroMetrics: RouteModeMetric[]
  onNavigate: (path: AppRoute) => void
  onRefresh: () => void
  isLoading: boolean
  isReadOnly: boolean
}

const RouteShell = ({
  routeContext,
  heroMetrics,
  onNavigate,
  onRefresh,
  isLoading,
  isReadOnly,
}: RouteShellProps) => {
  const { route, pageBlueprint, trail, sectionFlow, globalFlow } = routeContext
  const topTabs = pageBlueprint.topTabs
  const sectionTabs = pageBlueprint.sectionTabs
  const sectionQuickActions = pageBlueprint.sectionQuickActions
  const routeQuickActions = sectionQuickActions.slice(0, 3)
  const primaryAction = routeQuickActions[0] ?? null
  const secondaryActions = routeQuickActions.slice(1)
  const hasSectionTabs = sectionTabs.length > 0
  const composition = getRouteCompositionState(route.path)
  const currentActionHint = route.summary ?? '현재 화면의 다음 액션을 바로 진행하세요.'
  const isHome = route.path === '/'
  const routeModeLabel = isHome
    ? '홈'
    : routeContext.route.mode === 'operations'
      ? '돌봄 운영'
      : '서비스 관리'
  const progressLabel = `${globalFlow.index + 1}/${globalFlow.total}`
  const commandHints = isHome
    ? ['첫 번째: 돌봄 기록', '두 번째: 정산 계산', '세 번째: 청구 상태 점검']
    : [currentActionHint]
  const assistantPhrase = isHome
    ? '처음이어도 3단계만 따라가면 시작됩니다.'
    : `${route.title}에서 바로 할 일을 안내합니다.`
  const quickActionRows = secondaryActions.slice(0, 2)
  const quickActionsOverflow = Math.max(0, secondaryActions.length - quickActionRows.length)
  const commandHint = isHome
    ? '지금은 기록 → 정산 → 보험청구 순으로 진행하세요.'
    : currentActionHint
  const commandAssist = isHome
    ? '복잡한 메뉴 탐색은 생략하고 필요한 동작만 순서대로 보여줍니다.'
    : `${route.title}의 핵심 동작만 보여줍니다.`
  const heroNextAction = isHome ? '기록 → 정산 → 보험청구' : (commandHints[0] ?? currentActionHint)
  const quickActionCountText =
    secondaryActions.length > 0
      ? `${secondaryActions.length}개 보조 동작`
      : '바로 가기 동작이 없습니다.'

  const showSectionFlowPanel = sectionFlow.previous !== null || sectionFlow.next !== null
  const routeReadout = route.title

  return (
    <header className="app-header panel app-header-v2">
      <ThemeToggle />
      <div className="route-hero-grid">
        <section className="route-kicker-stack">
          <p className="kicker">{routeContext.pageBlueprint.heroText.kicker}</p>
          <h1>{routeContext.pageBlueprint.heroText.title}</h1>
          <p className="hero-description">{routeContext.pageBlueprint.heroText.description}</p>
          <p className="hero-intent" id="route-intent">
            <span aria-hidden="true">다음 액션</span>
            <strong>{heroNextAction}</strong>
          </p>
          <p className="hero-assistant">{assistantPhrase}</p>
        </section>

        <section className="route-progress-band" aria-label="현재 진행률">
          <div className="route-progress-meta route-progress-top">
            <p className="route-progress-label">진행 상태</p>
            <div className="route-progress-meta-wrap" role="status" aria-live="polite">
              <span className="meta-chip route-progress-main">{routeModeLabel}</span>
              <span className="meta-chip">완료 {composition.globalRouteProgress}%</span>
              <span className="meta-chip">단계 {progressLabel}</span>
            </div>
          </div>
          <div className="route-progress-meter-wrap" aria-hidden="true">
            <div
              className="route-progress-meter-fill"
              style={{ width: `${composition.globalRouteProgress}%` }}
            />
          </div>
          <div className="route-progress-actions">
            <button
              type="button"
              className="route-tab route-tab-subtle"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? '새로고침 중' : '최신화'}
            </button>
            <p className="small-note" aria-live="polite">
              최근 업데이트:{' '}
              {new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </section>
      </div>

      {isReadOnly ? (
        <p className="route-readonly-note" role="note">
          현재 조회 전용 모드입니다. 이동은 가능하지만 저장/수정은 잠시 비활성화됩니다.
        </p>
      ) : null}

      <nav className="top-nav route-top-nav route-main-nav" role="tablist" aria-label="주요 메뉴">
        {topTabs.map((item) => {
          const isActive = routeContext.activeTopRoutePath === item.path
          return (
            <button
              type="button"
              className={`route-tab route-tab-main ${isActive ? 'active' : ''}`}
              key={item.path}
              onClick={() => onNavigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <section className="route-command-band" aria-label="업무 탐색 가이드">
        <div className="route-command-row route-command-row-with-breadcrumb">
          <nav className="route-breadcrumb" aria-label="현재 경로" aria-describedby="route-intent">
            <span className="route-breadcrumb-label">현재 경로</span>
            <div className="breadcrumb" role="navigation" aria-label="현재 경로">
              {trail.map((item, index) => (
                <span className="crumb" key={`${item.path}-${index}`}>
                  {index > 0 && <span aria-hidden="true">/</span>}
                  <button
                    type="button"
                    className="crumb-link"
                    onClick={() => onNavigate(item.path)}
                    disabled={item.path === route.path}
                    aria-current={item.path === route.path ? 'page' : undefined}
                  >
                    {item.title}
                  </button>
                </span>
              ))}
            </div>
          </nav>

          {hasSectionTabs ? (
            <div className="route-section-status" role="status">
              <p className="route-breadcrumb-label">섹션 상태</p>
              <p className="small-note">현재 위치: {isHome ? '홈' : routeReadout}</p>
              <p className="small-note">단계 {progressLabel}</p>
            </div>
          ) : null}
        </div>

        <nav className="section-tabs" role="tablist" aria-label="하위 화면 탭">
          {hasSectionTabs ? (
            sectionTabs.map((item) => (
              <button
                type="button"
                key={item.path}
                className={`route-tab ${route.path === item.path ? 'active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-current={route.path === item.path ? 'page' : undefined}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <p className="route-command-empty" role="note">
              현재 화면은 단계 탭이 없습니다.
            </p>
          )}
        </nav>

        <section
          className="route-command-surface"
          aria-label="빠른 동작"
          aria-describedby="route-intent"
        >
          <div className="route-command-copy">
            <p className="route-command-kicker">
              {isHome ? '지금 바로 시작' : '이 화면의 다음 동작'}
            </p>
            <p className="route-command-title">{commandHint}</p>
            <p className="route-command-subtitle">{commandAssist}</p>
          </div>

          <div className="route-command-grid">
            <div className="route-primary-actions">
              {primaryAction ? (
                <button
                  type="button"
                  className="btn btn-primary route-primary-cta"
                  onClick={() => onNavigate(primaryAction.path)}
                  title={`${primaryAction.label} 화면으로 이동`}
                  aria-label={`${primaryAction.label}로 이동`}
                >
                  {primaryAction.label} 시작
                </button>
              ) : null}
              {!primaryAction && isHome ? (
                <p className="route-command-empty" role="note">
                  표시할 핵심 동작이 아직 없습니다.
                </p>
              ) : null}
              {isHome && (
                <button
                  type="button"
                  className="route-tab route-tab-subtle"
                  onClick={() => onNavigate('/operations')}
                  aria-label="운영 화면으로 이동"
                >
                  운영 시작하기
                </button>
              )}
            </div>
            <div className="route-command-meta" aria-live="polite">
              <p className="route-command-kicker">바로가기</p>
              <p className="route-command-subtitle">{quickActionCountText}</p>

              <div className="route-quick-actions" role="list" aria-label="바로 가기 작업">
                {secondaryActions.map((action) => (
                  <button
                    type="button"
                    className="route-tab route-tab-subtle route-quick-action"
                    key={action.path}
                    onClick={() => onNavigate(action.path)}
                    aria-label={`${action.label} 빠른 이동`}
                  >
                    <span aria-hidden="true" className="route-quick-action-emoji">
                      {action.emoji}
                    </span>
                    <span>{action.label}</span>
                  </button>
                ))}
                {quickActionsOverflow > 0 ? (
                  <p className="route-command-overflow" role="note">
                    외 {quickActionsOverflow}개는 아래 메뉴에서 이어서 이동하세요.
                  </p>
                ) : null}
                {quickActionRows.length === 0 && (
                  <p className="route-command-empty" role="note">
                    현재 표시할 바로가기 작업이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {showSectionFlowPanel ? (
            <div className="route-command-stepper" role="group" aria-label="단계 이동">
              <button
                type="button"
                className="route-tab route-tab-subtle"
                onClick={() => sectionFlow.previous && onNavigate(sectionFlow.previous)}
                disabled={!sectionFlow.previous}
                aria-label="이전 업무로 이동"
              >
                이전 업무
              </button>
              <button
                type="button"
                className="route-tab route-tab-subtle"
                onClick={() => sectionFlow.next && onNavigate(sectionFlow.next)}
                disabled={!sectionFlow.next}
                aria-label="다음 업무로 이동"
              >
                다음 업무
              </button>
            </div>
          ) : null}
        </section>
      </section>

      <div className="hero-metrics" role="list" aria-label="주요 현황">
        {heroMetrics.map((metric) => (
          <article className="kpi-ribbon" role="listitem" key={metric.label}>
            <p>{metric.label}</p>
            <strong aria-label={metric.aria}>{metric.value}</strong>
          </article>
        ))}
      </div>
    </header>
  )
}

const getQuickEntries = (context: RouteContext): RouteTopNavItem[] => {
  return context.pageBlueprint.topTabs.filter((item) => item.path !== '/')
}

const getHeroMetrics = (
  context: RouteContext,
  data: ReturnType<typeof usePlatformData>,
): RouteModeMetric[] => {
  const { route } = context

  if (route.mode === 'operations') {
    return [
      {
        label: '돌봄 가구',
        value: `${data.activeHouseholds}개`,
        aria: `돌봄 가구 ${data.activeHouseholds}개`,
      },
      {
        label: '이번 달 정산',
        value: formatWon(data.totalSettlement),
        aria: `이번 달 정산 ${formatWon(data.totalSettlement)}`,
      },
      {
        label: '확인할 청구',
        value: `${data.pendingClaims}건`,
        aria: `확인할 청구 ${data.pendingClaims}건`,
      },
    ]
  }

  if (route.mode === 'admin') {
    return [
      {
        label: '월 관리 금액',
        value: formatWon(data.kpiMonthlyRevenue),
        aria: `월 관리 금액 ${formatWon(data.kpiMonthlyRevenue)}`,
      },
      {
        label: '청구 승인률',
        value: formatRate(data.scenarioRevenue.conversionRate),
        aria: `청구 승인률 ${formatRate(data.scenarioRevenue.conversionRate)}`,
      },
      {
        label: '목표 진행률',
        value: `${data.scenarioRevenue.goalRate}%`,
        aria: `목표 진행률 ${data.scenarioRevenue.goalRate}%`,
      },
    ]
  }

  return [
    {
      label: '돌봄 가구',
      value: `${data.activeHouseholds}개`,
      aria: `돌봄 가구 ${data.activeHouseholds}개`,
    },
    {
      label: '이번 달 정산',
      value: formatWon(data.totalSettlement),
      aria: `이번 달 정산 ${formatWon(data.totalSettlement)}`,
    },
    {
      label: '청구 승인률',
      value: `${data.approvalRate.toFixed(1)}%`,
      aria: `청구 승인률 ${data.approvalRate.toFixed(1)}퍼센트`,
    },
  ]
}

const getCompositionMeta = (routeContext: RouteContext): RouteCompositionMeta => {
  if (routeContext.route.mode === 'operations') {
    return routeModeDefinitions.operations.compositionMeta
  }
  return routeModeDefinitions.admin.compositionMeta
}

const ROUTE_MAIN_ID = 'route-main-content'

const App = () => {
  const { routeContext, navigate, isFallback, mainRef } = useRouteState<HTMLDivElement>()
  const data = usePlatformData()

  const heroMetrics = useMemo(() => getHeroMetrics(routeContext, data), [routeContext, data])
  const quickEntries = useMemo(() => getQuickEntries(routeContext), [routeContext])

  // 라우트별 문서 타이틀 + 라우트 변경 시 보조기술 안내(aria-live). 포커스/스크롤 이동은
  // useRouteState 가 이미 처리하므로 여기서는 타이틀과 announce 만 담당한다.
  const routeTitle = routeContext.route.title
  const [routeAnnouncement, setRouteAnnouncement] = useState('')
  const hasAnnouncedRef = useRef(false)
  useEffect(() => {
    document.title = `${routeTitle} · 가족 돌봄 운영`
    if (!hasAnnouncedRef.current) {
      hasAnnouncedRef.current = true
      return
    }
    setRouteAnnouncement(`${routeTitle} 페이지로 이동했습니다`)
  }, [routeTitle])

  const hasReadOnlyError =
    data.errorMessage.includes('권한이 없어') ||
    data.errorMessage.includes('401') ||
    data.errorMessage.includes('403')

  const renderPage = () => {
    if (routeContext.route.mode === 'home') {
      const sections =
        (
          routeContext.pageBlueprint as {
            sections: readonly HomeLandingSectionBlueprint[]
          }
        ).sections ?? []

      return (
        <HomePage
          sections={sections}
          topCards={quickEntries}
          scenario={{
            activeHouseholds: data.activeHouseholds,
            totalSettlement: data.totalSettlement,
            claimsLength: data.claims.length,
            conversionRate: data.approvalRate,
          }}
          onNavigate={(path) => navigate(path)}
          hasReadOnlyError={hasReadOnlyError}
        />
      )
    }

    if (routeContext.route.mode === 'operations') {
      return (
        <OperationsPage
          modules={routeContext.modules as readonly OperationsRouteModule[]}
          compositionMeta={getCompositionMeta(routeContext)}
          data={data}
          onNavigate={(path) => navigate(path)}
          activeRoutePath={routeContext.route.path as NonHomeRoutePath}
          isReadOnly={hasReadOnlyError}
        />
      )
    }

    return (
      <AdminPage
        modules={routeContext.modules as readonly AdminRouteModule[]}
        compositionMeta={getCompositionMeta(routeContext)}
        data={data}
        onNavigate={(path) => navigate(path)}
        activeRoutePath={routeContext.route.path as NonHomeRoutePath}
        isReadOnly={hasReadOnlyError}
      />
    )
  }

  return (
    <main className="page">
      <a className="skip-link" href={`#${ROUTE_MAIN_ID}`}>
        본문 바로가기
      </a>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </p>

      <RouteShell
        routeContext={routeContext}
        heroMetrics={heroMetrics}
        onNavigate={(path) => navigate(path)}
        onRefresh={() => void data.load()}
        isLoading={data.loading}
        isReadOnly={hasReadOnlyError}
      />

      {isFallback ? (
        <p className="feedback feedback-warning" role="status" aria-live="polite">
          요청하신 주소를 찾을 수 없어 가까운 화면으로 이동했습니다.
          <button type="button" className="inline-action" onClick={() => navigate('/')}>
            홈으로
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

      <div
        id={ROUTE_MAIN_ID}
        ref={mainRef}
        tabIndex={-1}
        role="region"
        aria-label="현재 화면 본문"
        className="route-main"
      >
        {renderPage()}
      </div>
    </main>
  )
}

export { App }
