import type {
  AppRoute,
  RouteTopNavItem,
  HomeLandingSectionBlueprint,
} from "../../routeConfig";
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
  const metrics = [
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
  const quickActionCards = secondaryActions.slice(0, 3);
  const recommendedActionLabel = primaryAction?.label ?? "운영 메뉴";
  const homeTasks = [
    {
      title: "돌봄 기록 남기기",
      summary: "방문, 상담, 투약 같은 오늘의 돌봄 내용을 적습니다.",
      path: "/operations/care" as const,
    },
    {
      title: "돌봄비 계산하기",
      summary: "돌봄 시간과 금액을 입력해 정산액을 확인합니다.",
      path: "/operations/settlement" as const,
    },
    {
      title: "보험청구 확인하기",
      summary: "요청, 검토, 승인 상태를 가족이 함께 확인합니다.",
      path: "/operations/claims" as const,
    },
  ];

  return (
    <section className="view-stack">
      <section className="panel panel-overview home-start-panel">
        <div className="panel-head">
          <div className="home-hero-copy">
            <p className="kicker">빠른 시작</p>
            <h2>가장 먼저 할 일을 바로 확인하세요</h2>
            <p className="subtle">
              돌봄 기록 → 돌봄비 정산 → 보험청구를 순서대로 진행하면 오늘 업무를
              빠르게 마무리할 수 있습니다.
            </p>
          </div>
          {hasReadOnlyError ? (
            <p className="feedback feedback-warning" role="note">
              읽기 전용 모드에서는 등록/수정이 제한될 수 있습니다.
            </p>
          ) : null}
        </div>

        <div className="home-start-strip" aria-label="권장 순서">
          <p>추천 시작 순서</p>
          <p className="home-start-current" role="status" aria-live="polite">
            지금은 <strong>{recommendedActionLabel}</strong>로 시작하세요.
          </p>
        </div>

        <div className="home-hero-callout" role="note">
          <p className="home-hero-callout-title">
            처음 오면 이 순서가 가장 쉬운 출발점입니다.
          </p>
          <p className="home-hero-callout-subtle">
            돌봄 기록 → 정산 → 보험청구 순으로 1개씩만 진행하면 오늘 관리가 완성됩니다.
          </p>
        </div>

        <div className="home-hero-actions" role="group" aria-label="빠른 시작">
          <div className="home-task-list" role="list" aria-label="추천 시작">
            {homeTasks.map((task, index) => (
              <button
                type="button"
                className="home-task-row"
                key={task.path}
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
            ))}
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
              {primaryAction.label} 시작
            </button>
          ) : null}

          {quickActionCards.length > 0 ? (
            <div className="home-quick-grid compact">
              {quickActionCards.map((item) => (
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
                >
                  <span
                    aria-hidden="true"
                    className="home-icon"
                    role="presentation"
                  >
                    {item.emoji}
                  </span>
                  <strong>{item.label}</strong>
                  <p>
                    {item.summary ??
                      "해당 화면으로 이동해서 작업을 시작하세요."}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {entryActions.length === 0 ? (
          <p className="route-command-empty">
            지금 표시할 빠른 시작 메뉴가 없습니다.
          </p>
        ) : null}
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
                <p className="subtle">필요한 일을 골라 바로 시작하세요.</p>
              </div>
              <div className="home-grid">
                {group.routes.map((route) => (
                  <button
                    type="button"
                    key={route.path}
                    className="home-card"
                    onClick={() => onNavigate(route.path)}
                    aria-label={`${route.title}로 이동`}
                  >
                    <span aria-hidden="true" className="home-icon">
                      {route.emoji}
                    </span>
                    <strong>{route.title}</strong>
                    <p>{route.summary}</p>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel-summary">
        <div className="panel-head">
          <div>
            <h2>현재 상태</h2>
            <p className="subtle">오늘 확인할 돌봄 현황입니다.</p>
          </div>
        </div>
        <div className="kpi-ribbons">
          {metrics.map((metric) => (
            <article className="kpi-ribbon" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export { HomePage };
