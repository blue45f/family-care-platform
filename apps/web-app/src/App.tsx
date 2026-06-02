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
  isReadOnly: boolean;
};

const RouteShell = ({
  routeContext,
  heroMetrics,
  onNavigate,
  onRefresh,
  isLoading,
  isReadOnly,
}: RouteShellProps) => {
  const { route, pageBlueprint, trail, sectionFlow, globalFlow } = routeContext;
  const topTabs = pageBlueprint.topTabs;
  const sectionTabs = pageBlueprint.sectionTabs;
  const sectionQuickActions = pageBlueprint.sectionQuickActions;
  const primaryAction = sectionQuickActions[0] ?? null;
  const secondaryActions = sectionQuickActions.slice(1);
  const composition = getRouteCompositionState(route.path);
  const hasSectionTabs = sectionTabs.length > 0;
  const currentActionHint =
    route.summary ?? "현재 화면의 다음 액션을 바로 진행하세요.";
  const isHome = route.path === "/";

  return (
    <header className="app-header panel">
      <div className="app-shell-topline">
        <div className="app-shell-identity">
          <p className="kicker">{routeContext.pageBlueprint.heroText.kicker}</p>
          <h1>{routeContext.pageBlueprint.heroText.title}</h1>
          <p className="hero-description">
            {routeContext.pageBlueprint.heroText.description}
          </p>
          <p className="hero-intent" id="route-intent">
            {currentActionHint}
          </p>
        </div>

        <div className="route-progress" aria-label="현재 위치">
          <span className="meta-chip">
            {isHome ? "홈" : `${composition.globalRouteProgress}% 완성도`}
          </span>
          <span className="meta-chip">현재: {route.section}</span>
          <span className="meta-chip">
            단계 {globalFlow.index + 1}/{globalFlow.total}
          </span>
        </div>
      </div>

      {isReadOnly ? (
        <p className="route-readonly-note" role="note">
          현재 조회 전용 모드입니다. 이동은 가능하지만 저장/수정은 잠시 비활성화됩니다.
        </p>
      ) : null}

      <div className="hero-metrics" role="list" aria-label="주요 현황">
        {heroMetrics.map((metric) => (
          <article className="kpi-ribbon" role="listitem" key={metric.label}>
            <p>{metric.label}</p>
            <strong aria-label={metric.aria}>{metric.value}</strong>
          </article>
        ))}
      </div>

      <nav className="top-nav route-top-nav" role="tablist" aria-label="주요 메뉴">
        {topTabs.map((item) => {
          const isActive = routeContext.activeTopRoutePath === item.path;
          return (
            <button
              type="button"
              className={`route-tab route-tab-main ${isActive ? "active" : ""}`}
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
              aria-label={`${primaryAction.label}로 이동`}
            >
              {primaryAction.label}로 바로 가기
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
              지금 화면에서 바로 할 일이 없으면 위 메뉴에서 원하는 업무를 선택하세요.
            </p>
          ) : null}
        </div>
      </section>

      <section className="route-controls" aria-label="탐색 가이드">
        <div className="route-command-row">
          {hasSectionTabs ? (
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
                onClick={() =>
                  sectionFlow.next && onNavigate(sectionFlow.next)
                }
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
            aria-label="이전 화면으로 이동"
          >
            이전 화면
          </button>
          <button
            type="button"
            className="route-tab route-tab-subtle"
            onClick={() => globalFlow.next && onNavigate(globalFlow.next)}
            disabled={!globalFlow.next}
            aria-label="다음 화면으로 이동"
          >
            다음 화면
          </button>
          <button
            type="button"
            className="route-tab route-tab-outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "새로고침 중" : "새로고침"}
          </button>
        </div>

        {!isHome && sectionFlow.next ? (
          <button
            type="button"
            className="btn btn-primary route-accelerator"
            onClick={() => sectionFlow.next && onNavigate(sectionFlow.next)}
          >
            다음 할 일로 이동
          </button>
        ) : null}

        {hasSectionTabs ? (
          <div
            className="section-tabs"
            role="tablist"
            aria-label="하위 화면 탭"
          >
            {sectionTabs.map((item) => (
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
            ))}
          </div>
        ) : (
          <p className="route-command-empty" role="note">
            이 화면은 단독 화면입니다.
          </p>
        )}
      </section>
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
        label: "돌봄 가구",
        value: `${data.activeHouseholds}개`,
        aria: `돌봄 가구 ${data.activeHouseholds}개`,
      },
      {
        label: "이번 달 정산",
        value: formatWon(data.totalSettlement),
        aria: `이번 달 정산 ${formatWon(data.totalSettlement)}`,
      },
      {
        label: "확인할 청구",
        value: `${data.pendingClaims}건`,
        aria: `확인할 청구 ${data.pendingClaims}건`,
      },
    ];
  }

  if (route.mode === "admin") {
    return [
      {
        label: "월 관리 금액",
        value: formatWon(data.kpiMonthlyRevenue),
        aria: `월 관리 금액 ${formatWon(data.kpiMonthlyRevenue)}`,
      },
      {
        label: "청구 승인률",
        value: formatRate(data.scenarioRevenue.conversionRate),
        aria: `청구 승인률 ${formatRate(data.scenarioRevenue.conversionRate)}`,
      },
      {
        label: "목표 진행률",
        value: `${data.scenarioRevenue.goalRate}%`,
        aria: `목표 진행률 ${data.scenarioRevenue.goalRate}%`,
      },
    ];
  }

  return [
    {
      label: "돌봄 가구",
      value: `${data.activeHouseholds}개`,
      aria: `돌봄 가구 ${data.activeHouseholds}개`,
    },
    {
      label: "이번 달 정산",
      value: formatWon(data.totalSettlement),
      aria: `이번 달 정산 ${formatWon(data.totalSettlement)}`,
    },
    {
      label: "청구 승인률",
      value: `${data.approvalRate.toFixed(1)}%`,
      aria: `청구 승인률 ${data.approvalRate.toFixed(1)}퍼센트`,
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
          isReadOnly={hasReadOnlyError}
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
        isReadOnly={hasReadOnlyError}
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
        isReadOnly={hasReadOnlyError}
      />

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
