import { useMemo } from "react";

import { AdminPage } from "./components/pages/AdminPage";
import { HomePage } from "./components/pages/HomePage";
import { OperationsPage } from "./components/pages/OperationsPage";
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
} from "./routeConfig";
import { formatRate, formatWon } from "./utils";
import { usePlatformData } from "./state/usePlatformData";
import { useRouteState } from "./useRouteState";

type RouteModeMetric = {
  label: string;
  value: string;
  aria: string;
};

type RouteShellProps = {
  routeContext: RouteContext;
  heroMetrics: RouteModeMetric[];
  onNavigate: (path: AppRoute) => void;
  onRefresh: () => void;
  isLoading: boolean;
};

const RouteShell = ({
  routeContext,
  heroMetrics,
  onNavigate,
  onRefresh,
  isLoading,
}: RouteShellProps) => {
  const { route, pageBlueprint, trail, sectionFlow, globalFlow } = routeContext;
  const topTabs = pageBlueprint.topTabs;
  const sectionTabs = pageBlueprint.sectionTabs;
  const sectionQuickActions = pageBlueprint.sectionQuickActions;
  const primaryAction = sectionQuickActions[0] ?? null;
  const secondaryActions = sectionQuickActions.slice(1);
  const composition = getRouteCompositionState(route.path);
  const currentActionHint =
    route.summary ?? "현재 화면의 다음 액션을 바로 진행하세요.";

  return (
    <header className="app-header panel">
      <div className="app-shell-top">
        <div className="hero-copy">
          <p className="kicker">{routeContext.pageBlueprint.heroText.kicker}</p>
          <h1>{routeContext.pageBlueprint.heroText.title}</h1>
          <p className="hero-description">
            {routeContext.pageBlueprint.heroText.description}
          </p>
          <p className="hero-intent" id="route-intent">
            {currentActionHint}
          </p>
        </div>

        <div className="route-progress" aria-label="현재 경로 진행률">
          <span className="meta-chip">
            {route.path === "/"
              ? "홈"
              : `STEP ${routeContext.globalFlow.index}`}
          </span>
          <span className="meta-chip">현재 섹션: {route.section}</span>
          <span className="meta-chip">
            전체 {composition.globalRouteProgress}%
          </span>
        </div>
      </div>

      <div className="hero-metrics" role="list" aria-label="핵심 KPI">
        {heroMetrics.map((metric) => (
          <article className="kpi-ribbon" role="listitem" key={metric.label}>
            <p>{metric.label}</p>
            <strong aria-label={metric.aria}>{metric.value}</strong>
          </article>
        ))}
      </div>

      <nav className="top-nav" role="tablist" aria-label="영역 전환">
        {topTabs.map((item) => {
          const isActive = routeContext.activeTopRoutePath === item.path;
          return (
            <button
              type="button"
              className={`route-tab ${isActive ? "active" : ""}`}
              key={item.path}
              onClick={() => onNavigate(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section
        className="breadcrumb-and-actions"
        aria-label="현재 경로와 다음 액션"
        aria-describedby="route-intent"
      >
        <div className="breadcrumb" role="navigation" aria-label="현재 경로">
          {trail.map((item, index) => (
            <span className="crumb" key={`${item.path}-${index}`}>
              {index > 0 && <span aria-hidden="true">/</span>}
              <button
                type="button"
                className="crumb-link"
                onClick={() => onNavigate(item.path)}
                disabled={item.path === route.path}
                aria-current={item.path === route.path ? "page" : undefined}
              >
                {item.title}
              </button>
            </span>
          ))}
        </div>

        <div className="primary-actions">
          {primaryAction ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate(primaryAction.path)}
            >
              {primaryAction.label}
            </button>
          ) : null}

          {secondaryActions.length > 0 ? (
            <div
              className="action-strip"
              role="list"
              aria-label="바로가기 액션"
            >
              {secondaryActions.map((action) => (
                <button
                  type="button"
                  className="route-tab route-tab-subtle"
                  key={action.path}
                  onClick={() => onNavigate(action.path)}
                  aria-label={`${action.label} 이동`}
                >
                  <span aria-hidden="true">{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {sectionQuickActions.length === 0 ? (
            <p className="route-command-empty" role="note">
              현재 화면은 하위 바로가기 액션이 없어 상단 탭 또는 섹션 탭으로
              이동하세요.
            </p>
          ) : null}
        </div>
      </section>

      <section className="route-controls" aria-label="탐색 가이드">
        <div className="route-command-row">
          {routeContext.hasSectionTabs ? (
            <>
              <button
                type="button"
                className="route-tab route-tab-subtle"
                onClick={() =>
                  sectionFlow.previous && onNavigate(sectionFlow.previous)
                }
                disabled={!sectionFlow.previous}
                aria-label="이전 섹션으로 이동"
              >
                이전 섹션
              </button>
              <button
                type="button"
                className="route-tab route-tab-subtle"
                onClick={() => sectionFlow.next && onNavigate(sectionFlow.next)}
                disabled={!sectionFlow.next}
                aria-label="다음 섹션으로 이동"
              >
                다음 섹션
              </button>
            </>
          ) : null}

          <button
            type="button"
            className="route-tab route-tab-subtle"
            onClick={() =>
              globalFlow.previous && onNavigate(globalFlow.previous)
            }
            disabled={!globalFlow.previous}
            aria-label="이전 전체 화면으로 이동"
          >
            이전 전체
          </button>
          <button
            type="button"
            className="route-tab route-tab-subtle"
            onClick={() => globalFlow.next && onNavigate(globalFlow.next)}
            disabled={!globalFlow.next}
            aria-label="다음 전체 화면으로 이동"
          >
            다음 전체
          </button>
          <button
            type="button"
            className="route-tab route-tab-outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "동기화 중" : "데이터 동기화"}
          </button>
        </div>

        {route.mode !== "home" && sectionFlow.next ? (
          <button
            type="button"
            className="btn btn-primary route-accelerator"
            onClick={() => sectionFlow.next && onNavigate(sectionFlow.next)}
          >
            다음 단계로 바로가기
          </button>
        ) : null}

        <div className="section-tabs" role="tablist" aria-label="하위 화면 탭">
          {routeContext.hasSectionTabs ? (
            sectionTabs.map((item) => (
              <button
                type="button"
                key={item.path}
                className={`route-tab ${route.path === item.path ? "active" : ""}`}
                onClick={() => onNavigate(item.path)}
                aria-current={route.path === item.path ? "page" : undefined}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))
          ) : (
            <p className="route-command-empty" role="note">
              {"현재 경로는 하위 섹션이 없는 단일 화면입니다."}
            </p>
          )}
        </div>
      </section>

      {route.mode !== "home" ? (
        <section className="route-composition" aria-label="페이지 구성도">
          <header className="route-composition-head">
            <p className="route-composition-title">섹션 구성</p>
            <p className="route-composition-meta">
              현재 섹션 진행 {composition.globalRouteProgress}%
            </p>
          </header>

          <div
            className="route-composition-section-strip"
            role="list"
            aria-label="섹션 상태 요약"
          >
            {composition.sectionSummaries.map((summary) => (
              <article
                className={`route-composition-section-card route-composition-section-card-${summary.state}`}
                key={summary.sectionId}
                role="listitem"
              >
                <p className="route-composition-section-card-title">
                  <span aria-hidden="true">{summary.icon}</span>
                  {summary.title}
                </p>
                <p className="route-composition-section-card-progress">
                  {summary.progressRate}%
                </p>
                <p className="route-composition-section-card-meta">
                  <span>{summary.completedRoutes} 완료</span>
                  <span>
                    {summary.routesCount - summary.completedRoutes} 예정
                  </span>
                </p>
              </article>
            ))}
          </div>

          <div className="route-composition-meter" aria-hidden="true">
            <span
              className="route-composition-meter-fill"
              style={{ width: `${composition.globalRouteProgress}%` }}
            />
          </div>
        </section>
      ) : null}
    </header>
  );
};

const getQuickEntries = (context: RouteContext): RouteTopNavItem[] => {
  return context.pageBlueprint.topTabs.filter((item) => item.path !== "/");
};

const getHeroMetrics = (
  context: RouteContext,
  data: ReturnType<typeof usePlatformData>,
): RouteModeMetric[] => {
  const { route } = context;

  if (route.mode === "operations") {
    return [
      {
        label: "활성 가구",
        value: `${data.activeHouseholds}개`,
        aria: `활성 가구 ${data.activeHouseholds}개`,
      },
      {
        label: "월 정산 합계",
        value: formatWon(data.totalSettlement),
        aria: `월 정산 합계 ${formatWon(data.totalSettlement)}`,
      },
      {
        label: "미승인 청구",
        value: `${data.pendingClaims}건`,
        aria: `미승인 청구 ${data.pendingClaims}건`,
      },
    ];
  }

  if (route.mode === "admin") {
    return [
      {
        label: "현재 MRR",
        value: formatWon(data.kpiMonthlyRevenue),
        aria: `현재 MRR ${formatWon(data.kpiMonthlyRevenue)}`,
      },
      {
        label: "요금제 전환율",
        value: formatRate(data.scenarioRevenue.conversionRate),
        aria: `요금제 전환율 ${formatRate(data.scenarioRevenue.conversionRate)}`,
      },
      {
        label: "목표 달성률",
        value: `${data.scenarioRevenue.goalRate}%`,
        aria: `목표 달성률 ${data.scenarioRevenue.goalRate}%`,
      },
    ];
  }

  return [
    {
      label: "총 가구 수",
      value: `${data.activeHouseholds}개`,
      aria: `총 가구 수 ${data.activeHouseholds}개`,
    },
    {
      label: "월 정산 가용성",
      value: formatWon(data.totalSettlement),
      aria: `월 정산 가용성 ${formatWon(data.totalSettlement)}`,
    },
    {
      label: "청구 승인 전환",
      value: `${data.approvalRate.toFixed(1)}%`,
      aria: `청구 승인 전환 ${data.approvalRate.toFixed(1)}퍼센트`,
    },
  ];
};

const getCompositionMeta = (
  routeContext: RouteContext,
): RouteCompositionMeta => {
  if (routeContext.route.mode === "operations") {
    return routeModeDefinitions.operations.compositionMeta;
  }
  return routeModeDefinitions.admin.compositionMeta;
};

const App = () => {
  const { routeContext, navigate } = useRouteState();
  const data = usePlatformData();

  const heroMetrics = useMemo(
    () => getHeroMetrics(routeContext, data),
    [routeContext, data],
  );
  const quickEntries = useMemo(
    () => getQuickEntries(routeContext),
    [routeContext],
  );

  const hasReadOnlyError =
    data.errorMessage.includes("권한이 없어") ||
    data.errorMessage.includes("401") ||
    data.errorMessage.includes("403");

  const renderPage = () => {
    if (routeContext.route.mode === "home") {
      const sections =
        (
          routeContext.pageBlueprint as {
            sections: readonly HomeLandingSectionBlueprint[];
          }
        ).sections ?? [];

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
      );
    }

    if (routeContext.route.mode === "operations") {
      return (
        <OperationsPage
          modules={routeContext.modules as readonly OperationsRouteModule[]}
          compositionMeta={getCompositionMeta(routeContext)}
          data={data}
          onNavigate={(path) => navigate(path)}
          activeRoutePath={routeContext.route.path as NonHomeRoutePath}
        />
      );
    }

    return (
      <AdminPage
        modules={routeContext.modules as readonly AdminRouteModule[]}
        compositionMeta={getCompositionMeta(routeContext)}
        data={data}
        onNavigate={(path) => navigate(path)}
        activeRoutePath={routeContext.route.path as NonHomeRoutePath}
      />
    );
  };

  return (
    <main className="page">
      <RouteShell
        routeContext={routeContext}
        heroMetrics={heroMetrics}
        onNavigate={(path) => navigate(path)}
        onRefresh={() => void data.load()}
        isLoading={data.loading}
      />

      {hasReadOnlyError ? (
        <p
          className="feedback feedback-warning"
          role="status"
          aria-live="polite"
        >
          현재 계정은 일부 기능이 제한될 수 있습니다.
        </p>
      ) : null}

      {data.errorMessage ? (
        <p
          className="feedback feedback-error"
          role="alert"
          aria-live="assertive"
        >
          {data.errorMessage}
          <button
            type="button"
            className="inline-action"
            onClick={data.clearError}
          >
            닫기
          </button>
        </p>
      ) : null}

      {data.loading ? (
        <p
          className="feedback feedback-loading"
          role="status"
          aria-live="polite"
        >
          최신 데이터를 불러오는 중입니다.
        </p>
      ) : null}

      {renderPage()}
    </main>
  );
};

export { App };
