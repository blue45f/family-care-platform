import type { AppRoute, RouteTopNavItem, HomeLandingSectionBlueprint } from "../../routeConfig";
import { formatWon } from "../../utils";

type HomeScenarioValues = {
  activeHouseholds: number;
  totalSettlement: number;
  claimsLength: number;
  conversionRate: number;
};

type HomePageProps = {
  sections: readonly HomeLandingSectionBlueprint[];
  topCards: readonly RouteTopNavItem[];
  scenario: HomeScenarioValues;
  onNavigate: (path: AppRoute) => void;
  hasReadOnlyError?: boolean;
};

const HomePage = ({
  sections,
  topCards,
  scenario,
  onNavigate,
  hasReadOnlyError = false,
}: HomePageProps) => {
  const kpis = [
    { label: "돌봄 가구", value: `${scenario.activeHouseholds}개` },
    { label: "이번 달 정산", value: formatWon(scenario.totalSettlement) },
    { label: "보험청구", value: `${scenario.claimsLength}건` },
    {
      label: "청구 승인률",
      value: `${scenario.conversionRate.toFixed(1)}%`,
    },
  ];

  const entryActions = topCards.filter((item) => item.path !== "/");
  const primaryAction = entryActions[0] ?? null;
  const secondaryActions = entryActions.slice(1);
  const homeTasks = [
    {
      title: "돌봄 기록 남기기",
      summary: "방문, 상담, 투약 같은 오늘의 돌봄 내용을 기록합니다.",
      path: "/operations/care" as const,
    },
    {
      title: "돌봄비 계산하기",
      summary: "돌봄 시간과 금액을 입력해 정산액을 확인합니다.",
      path: "/operations/settlement" as const,
    },
    {
      title: "보험청구 확인하기",
      summary: "요청, 검토, 승인 상태를 빠르게 점검합니다.",
      path: "/operations/claims" as const,
    },
  ];

  return (
    <section className="view-stack">
      <section className="panel panel-overview home-start-panel">
        <div className="home-hero-layout">
          <div className="panel-head">
            <div className="home-hero-copy">
              <p className="kicker">빠른 시작</p>
              <h2>가장 먼저 할 일을 바로 확인하세요</h2>
              <p className="subtle">
                처음이라도 3단계로 시작할 수 있습니다.
              </p>
            </div>
            {hasReadOnlyError ? (
              <p className="feedback feedback-warning" role="note">
                읽기 전용 모드에서는 등록/수정이 제한될 수 있습니다.
              </p>
            ) : null}
          </div>

          <div className="home-start-strip" aria-label="추천 시작 순서">
            <p>오늘의 시작 흐름</p>
            <p className="home-start-current" role="status" aria-live="polite">
              지금은 <strong>돌봄 기록 → 정산 → 보험청구</strong> 순서를 권장해요.
            </p>
          </div>

          <div className="home-hero-callout" role="note">
            <p className="home-hero-callout-title">처음 보는 사용자용 플로우</p>
            <p className="home-hero-callout-subtle">
              돌봄 기록에서 시작해 정산·보험청구로 이어서 진행하면 운영이 누락 없이 끝납니다.
            </p>
          </div>

          {primaryAction ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate(primaryAction.path)}
              disabled={
                hasReadOnlyError &&
                primaryAction.path !== "/operations" &&
                primaryAction.path !== "/admin"
              }
            >
              {primaryAction.label} 시작하기
            </button>
          ) : null}

          {secondaryActions.length > 0 ? (
            <div className="home-quick-grid compact" role="list" aria-label="빠른 메뉴">
              {secondaryActions.map((item) => (
                <button
                  type="button"
                  className="home-quick-card"
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  aria-label={`${item.label} 시작`}
                  disabled={
                    hasReadOnlyError &&
                    item.path !== "/operations" &&
                    item.path !== "/admin"
                  }
                  role="listitem"
                >
                  <span aria-hidden="true" className="home-icon" role="presentation">
                    {item.emoji}
                  </span>
                  <strong>{item.label}</strong>
                  <p>{item.summary ?? "해당 화면으로 이동해 작업을 시작하세요."}</p>
                </button>
              ))}
            </div>
          ) : null}

          {entryActions.length === 0 ? (
            <p className="route-command-empty">현재 표시할 빠른 메뉴가 없습니다.</p>
          ) : null}
        </div>
      </section>

      <section className="home-main-grid">
        <section className="panel panel-summary">
          <div className="panel-head">
            <h2>추천 시작하기</h2>
            <p className="subtle">오늘 바로 처리해야 할 핵심 흐름입니다.</p>
          </div>
          <ol className="home-task-list" aria-label="오늘의 추천 작업">
            {homeTasks.map((task, index) => (
              <li key={task.path}>
                <button
                  type="button"
                  className="home-task-row"
                  onClick={() => onNavigate(task.path)}
                  aria-label={`${task.title} 화면으로 이동`}
                >
                  <span className="home-task-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.summary}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel panel-overview">
          <div className="panel-head">
            <h2>현재 상태</h2>
            <p className="subtle">오늘 확인할 돌봄 운영 현황입니다.</p>
          </div>
          <div className="kpi-ribbons kpi-ribbons--compact">
            {kpis.map((metric) => (
              <article className="kpi-ribbon" key={metric.label}>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="panel panel-overview">
        <div className="panel-head">
          <div>
            <h2>전체 메뉴</h2>
            <p className="subtle">
              필요한 일을 고르면 해당 화면으로 바로 이동합니다.
            </p>
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="feedback feedback-error" role="note">
            현재 표시할 메뉴가 없습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : null}

        <div className="home-section-grid">
          {sections.map((group) => (
            <article key={group.section} className="home-section-block">
              <div className="home-section-head">
                <h3>
                  <span aria-hidden="true">{group.icon}</span>
                  {group.section}
                </h3>
                <p className="subtle">원하는 작업을 골라 바로 시작하세요.</p>
              </div>
              <ul className="home-route-list">
                {group.routes.map((route) => (
                  <li key={route.path}>
                    <button
                      type="button"
                      className="home-route-row"
                      onClick={() => onNavigate(route.path)}
                      aria-label={`${route.title}로 이동`}
                    >
                      <span aria-hidden="true" className="home-icon">
                        {route.emoji}
                      </span>
                      <span className="home-route-labels">
                        <strong>{route.title}</strong>
                        <span className="muted">{route.summary}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export { HomePage };
