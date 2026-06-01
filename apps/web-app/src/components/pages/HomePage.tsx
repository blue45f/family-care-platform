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
    { label: "현재 가구 수", value: `${scenario.activeHouseholds}개` },
    { label: "월 정산 가용성", value: formatWon(scenario.totalSettlement) },
    { label: "청구건수", value: `${scenario.claimsLength}건` },
    {
      label: "예상 승인 전환",
      value: `${scenario.conversionRate.toFixed(1)}%`,
    },
  ];

  const entryActions = topCards.filter((item) => item.path !== "/");
  const primaryAction = entryActions[0] ?? null;
  const secondaryActions = entryActions.slice(1);

  return (
    <section className="view-stack">
      <section className="panel panel-overview">
        <div className="panel-head">
          <div>
            <p className="kicker">운영 허브 시작점</p>
            <h2>가족 돌봄 운영을 바로 실행할 수 있는 첫 화면</h2>
            <p className="subtle">
              보호자 가정 운영, 정산 처리, 보험청구 대응, 수익 운영의 첫 동작을
              즉시 시작하세요.
            </p>
          </div>
          {hasReadOnlyError ? (
            <p className="feedback feedback-error" role="note">
              읽기 전용 모드에서는 등록/수정이 제한될 수 있습니다.
            </p>
          ) : null}
        </div>

        <div className="home-hero-actions" role="group" aria-label="빠른 시작">
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
              {primaryAction.label}로 시작
            </button>
          ) : null}

          {secondaryActions.length > 0 ? (
            <div className="home-quick-grid compact">
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
            현재 표시할 빠른 진입점이 없습니다.
          </p>
        ) : null}
      </section>

      <section className="panel panel-overview">
        <div className="panel-head">
          <div>
            <h2>운영 지도</h2>
            <p className="subtle">
              섹션별로 필요한 화면을 선택해 작업을 이어 보세요.
            </p>
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="feedback feedback-error" role="note">
            현재 구성 데이터가 없습니다. 홈 섹션 구성이 비어 있습니다.
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
                <p className="subtle">
                  하위 화면으로 이동해 작업을 바로 처리합니다.
                </p>
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
            <h2>현재 기준 하이라이트</h2>
            <p className="subtle">운영 판단에 바로 쓸 수 있는 수치입니다.</p>
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
