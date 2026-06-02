import type {
  AppRoute,
  HomeLandingSectionBlueprint,
  RouteTopNavItem,
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
  const kpis = [
    { label: "돌봄 가구", value: `${scenario.activeHouseholds}개` },
    { label: "이번 달 정산", value: formatWon(scenario.totalSettlement) },
    { label: "보험청구", value: `${scenario.claimsLength}건` },
    {
      label: "청구 승인률",
      value: `${scenario.conversionRate.toFixed(1)}%`,
    },
  ];

  const onboardingFlow = [
    {
      step: 1,
      title: "돌봄 기록",
      description: "보호자와 대상, 돌봄 내용을 입력해요.",
    },
    {
      step: 2,
      title: "돌봄비 정산",
      description: "돌봄 시간·금액을 넣으면 합계가 즉시 계산돼요.",
    },
    {
      step: 3,
      title: "보험청구",
      description: "기관·금액·상태를 남겨 승인 흐름을 점검해요.",
    },
  ];

  const quickActions = topCards
    .filter((item) => item.path !== "/")
    .slice(0, 4);

  const primaryAction = quickActions[0] ?? null;
  const secondaryActions = quickActions.slice(1);
  const quickActionOverflow = Math.max(0, quickActions.length - 3);

  const isDataReady =
    scenario.activeHouseholds > 0 ||
    scenario.totalSettlement > 0 ||
    scenario.claimsLength > 0;
  const quickActionSummary = quickActions.length > 0 ? `${quickActions.length}개` : "0개";

  const homeTasks = [
    {
      title: "돌봄 기록 남기기",
      summary: "보호자·돌봄 받는 분·내용을 한 번에 입력",
      path: "/operations/care" as const,
      primaryButton: "기록 입력으로 이동",
    },
    {
      title: "돌봄비 정산",
      summary: "돌봄 시간·단가로 정산액을 계산",
      path: "/operations/settlement" as const,
      primaryButton: "정산 화면으로 이동",
    },
    {
      title: "보험청구 점검",
      summary: "요청/검토/승인 상태를 빠르게 점검",
      path: "/operations/claims" as const,
      primaryButton: "청구 화면으로 이동",
    },
  ];

  return (
    <section className="view-stack home-view-stack">
      <section className="panel panel-overview home-start-panel">
        <div className="panel-head home-panel-head">
          <div className="home-hero-copy">
            <p className="kicker">빠른 시작</p>
            <h2>3단계로 바로 시작하세요</h2>
            <p className="subtle">
              기록 → 정산 → 보험청구 순으로 진행하면 처음이더라도 빠르게 끝낼 수 있습니다.
            </p>
            {isDataReady ? (
              <p className="home-start-current" role="status" aria-live="polite">
                현재 상태 기준으로 <strong>다음 작업</strong>을 추천합니다.
              </p>
            ) : (
              <p className="feedback feedback-warning" role="note">
                아직 데이터가 없습니다. 지금 바로 기록을 시작해 주세요.
              </p>
            )}
          </div>
          <div className="home-start-strip">
            <p className="small-note">주요 바로가기</p>
            <p className="home-start-count" aria-label={`${quickActionSummary}개 바로가기 항목`}>
              {quickActionSummary}
            </p>
          </div>
        </div>

        <div className="home-hero-actions">
          <div className="home-quick-grid compact" role="list" aria-label="빠른 이동">
            {primaryAction ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate(primaryAction.path)}
                role="listitem"
                aria-describedby="home-quick-start-description"
              >
                {primaryAction.label}로 시작하기
              </button>
            ) : null}
            {secondaryActions.map((item) => (
              <button
                type="button"
                key={item.path}
                className="route-tab route-tab-subtle"
                onClick={() => onNavigate(item.path)}
                aria-label={`${item.label}로 이동`}
                role="listitem"
                aria-describedby="home-quick-start-description"
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          {quickActionOverflow > 0 ? (
            <p className="home-quick-overflow" role="note">
              아래 전체 메뉴에서 더 많은 항목으로 이동할 수 있습니다.
            </p>
          ) : null}
        </div>

        <div className="home-flow-list-wrap">
          <p className="home-quick-title">오늘의 업무 흐름</p>
          <ol className="home-flow-list" aria-label="시작 가이드">
            {onboardingFlow.map((flow) => (
              <li key={flow.title}>
                <span className="home-flow-index" aria-hidden="true">
                  {flow.step}
                </span>
                <span className="home-flow-copy">
                  <strong>{flow.title}</strong>
                  <small>{flow.description}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-main-grid">
        <section className="panel panel-summary">
          <div className="panel-head">
            <h2>오늘 바로 처리</h2>
            <p className="subtle">한 번 누르면 바로 다음 화면으로 이동합니다.</p>
          </div>
          <ol className="home-task-list" aria-label="추천 작업">
            {homeTasks.map((task, index) => (
              <li key={task.path}>
                <button
                  type="button"
                  className="home-task-row"
                  onClick={() => onNavigate(task.path)}
                  aria-label={`${task.title}로 이동`}
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
            <h2>현재 핵심 지표</h2>
            <p className="subtle">의사결정에 필요한 핵심 숫자만 표시</p>
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
          <p className="subtle">운영·관리를 빠르게 찾아 필요한 작업으로 바로 이동하세요.</p>
          </div>
          {hasReadOnlyError ? (
            <p className="feedback feedback-warning" role="note">
              조회 전용 모드입니다. 이동은 가능하지만 저장/수정은 제한됩니다.
            </p>
          ) : null}
        </div>
        <p id="home-quick-start-description" className="sr-only">
          버튼을 누르면 이동할 수 있는 빠른 시작 경로입니다.
        </p>

        {sections.length === 0 ? (
          <p className="feedback feedback-error" role="note">
            현재 표시할 메뉴가 없습니다. 잠시 후 새로고침해 주세요.
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
