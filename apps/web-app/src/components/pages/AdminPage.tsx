import { type ReactNode } from "react";

import {
  adminModuleMeta,
  adminModuleRoute,
  adminModuleSequence,
  type AdminRouteModule,
  type NonHomeRoutePath,
  type RouteCompositionMeta,
} from "../../routeConfig";
import {
  formatRate,
  formatSignedRate,
  formatSignedRatePoint,
  formatSignedWon,
  formatWon,
  formatMonthLabel,
  trendDirectionLabel,
} from "../../utils";
import { type PlatformData } from "../../state/usePlatformData";

type AdminPageProps = {
  modules: readonly AdminRouteModule[];
  compositionMeta: RouteCompositionMeta;
  data: PlatformData;
  onNavigate: (path: NonHomeRoutePath) => void;
  activeRoutePath: NonHomeRoutePath;
  isReadOnly: boolean;
};

const renderKpiTable = ({
  adminOverview,
  data,
}: {
  adminOverview: PlatformData["adminOverview"];
  data: PlatformData;
}): ReactNode => {
  const approvedClaims = data.claims.filter(
    (item) => item.status === "승인",
  ).length;
  const approvalRate =
    data.claims.length > 0 ? (approvedClaims / data.claims.length) * 100 : 0;

  const totalHouseholds =
    adminOverview.activeHouseholds || data.activeHouseholds;
  const totalSettlement =
    adminOverview.thisMonthSettlement || data.totalSettlement;
  const claimRate = adminOverview.totalClaims
    ? adminOverview.conversionRate
    : approvalRate;
  const claimCount = adminOverview.totalClaims
    ? adminOverview.totalClaims
    : data.claims.length;
  const approvedCount = adminOverview.totalClaims
    ? adminOverview.approvedClaims
    : approvedClaims;

  return (
    <section className="panel panel-admin panel-overview">
      <div className="panel-head">
        <div>
          <span className="panel-chip">{adminModuleMeta.kpi.panelChip}</span>
          <h2>{adminModuleMeta.kpi.panelTitle}</h2>
          <p className="subtle">{adminModuleMeta.kpi.panelDescription}</p>
        </div>
      </div>

      <div className="kpi-ribbons">
        <article className="kpi-ribbon">
          <p>돌봄 가구</p>
          <strong>{totalHouseholds}개</strong>
          <span className="small-note">현재 관리 중인 가구 수</span>
        </article>
        <article className="kpi-ribbon">
          <p>이번 달 정산액</p>
          <strong>{formatWon(totalSettlement)}</strong>
          <span className="small-note">돌봄비 누적 합계</span>
        </article>
        <article className="kpi-ribbon">
          <p>보험청구 승인률</p>
          <strong>{formatRate(claimRate)}</strong>
          <span className="small-note">{approvedCount}/{claimCount}건</span>
        </article>
        <article className="kpi-ribbon">
          <p>월 관리 금액</p>
          <strong>
            {formatWon(
              adminOverview.monthlyRecurringRevenue || data.kpiMonthlyRevenue,
            )}
          </strong>
          <span className="small-note">요금제 기반 예산</span>
        </article>
      </div>

      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <caption className="sr-only">서비스 전체 현황</caption>
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">현재 값</th>
              <th scope="col">의미</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">가구당 평균 정산액</th>
              <td>
                <strong>
                  {formatWon(
                    adminOverview.averageSettlement ||
                      (data.activeHouseholds > 0
                        ? Math.round(data.totalSettlement / data.activeHouseholds)
                        : 0),
                  )}
                </strong>
              </td>
              <td>가구별 평균 돌봄비</td>
            </tr>
            <tr>
              <th scope="row">요금제 이용률</th>
              <td>
                <strong>
                  {formatRate(
                    adminOverview.planTakeRate || data.scenarioRevenue.conversionRate,
                  )}
                </strong>
              </td>
              <td>요금제를 이용 중인 비율</td>
            </tr>
            <tr>
              <th scope="row">예상 연 금액</th>
              <td>
                <strong>{formatWon(data.kpiAnnualRevenue)}</strong>
              </td>
              <td>현재 월 금액 기준 12개월 추정</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

const renderTrends = ({
  monthlyTrendWithDelta,
  isUsingServerTrend,
  trendSourceMeta,
}: {
  monthlyTrendWithDelta: PlatformData["monthlyTrendWithDelta"];
  isUsingServerTrend: boolean;
  trendSourceMeta: PlatformData["trendSourceMeta"];
}): ReactNode => (
  <section className="panel panel-admin panel-trend">
    <div className="panel-head">
      <div>
        <span className="panel-chip">{adminModuleMeta.trends.panelChip}</span>
        <h2>{adminModuleMeta.trends.panelTitle}</h2>
        <p className="subtle">{adminModuleMeta.trends.panelDescription}</p>
      </div>
      <p
        className={`trend-source ${trendSourceMeta.sourceClass}`}
        role="note"
        aria-label={`월별 추세 데이터 출처는 ${trendSourceMeta.sourceText}입니다.`}
      >
        {trendSourceMeta.sourceLabel}
      </p>
    </div>

    {!isUsingServerTrend ? (
      <p className="trend-fallback-banner" role="note" aria-live="polite">
        서버 월별 집계를 불러오지 못해 현재 브라우저 데이터로 계산했습니다.
      </p>
    ) : null}

    <div className="trend-grid">
      {monthlyTrendWithDelta.length > 0 ? (
        monthlyTrendWithDelta.map((entry) => (
          <article key={entry.month} className="trend-card">
            <p>{formatMonthLabel(entry.month)}</p>
            <strong
              aria-label={`월별 정산 합계 ${formatWon(entry.settlementTotal)}`}
            >
              {formatWon(entry.settlementTotal)}
            </strong>

            <p
              className={`trend-delta trend-delta-${entry.settlementDeltaDirection}`}
              aria-label={`전월 대비 정산액 증감 ${
                entry.hasPreviousMonth
                  ? `${trendDirectionLabel(entry.settlementDeltaDirection)} ${formatSignedWon(entry.settlementDelta)} ${formatSignedRate(entry.settlementDeltaRate)}`
                  : "전월 비교 데이터 없음"
              }`}
            >
              정산액 {entry.hasPreviousMonth
                ? `${formatSignedWon(entry.settlementDelta)} (${formatSignedRate(entry.settlementDeltaRate)})`
                : "비교 데이터 없음"}
            </p>

            <p
              className={`trend-delta trend-delta-${entry.claimCountDeltaDirection}`}
              aria-label={`전월 대비 청구건수 증감 ${
                entry.hasPreviousMonth
                  ? `${trendDirectionLabel(entry.claimCountDeltaDirection)} ${formatSignedRatePoint(entry.claimCountDelta)} ${formatSignedRate(entry.claimCountDeltaRate)}`
                  : "전월 비교 데이터 없음"
              }`}
            >
              청구 건수 {entry.hasPreviousMonth
                ? `${entry.claimCountDelta} (${formatSignedRate(entry.claimCountDeltaRate)})`
                : "비교 데이터 없음"}
            </p>
            <p
              className={`trend-delta trend-delta-${entry.approvalRateDeltaDirection}`}
              aria-label={`전월 대비 승인률 증감 ${
                entry.hasPreviousMonth
                  ? `${trendDirectionLabel(entry.approvalRateDeltaDirection)} ${formatSignedRatePoint(entry.approvalRateDelta)} ${formatSignedRate(entry.approvalRateDeltaRate)}`
                  : "전월 비교 데이터 없음"
              }`}
            >
              승인률 {entry.hasPreviousMonth
                ? `${formatSignedRatePoint(entry.approvalRateDelta)} (${formatSignedRate(entry.approvalRateDeltaRate)})`
                : "비교 데이터 없음"}
            </p>
            <p className="small-note">
              현재 값: 청구 {entry.claimCount}건, 승인 {entry.approvedClaimCount}건
            </p>
          </article>
        ))
      ) : (
        <p className="empty">아직 표시할 월별 변화 데이터가 없습니다.</p>
      )}
    </div>
  </section>
);

const renderPlans = ({
  plans,
  planDrafts,
  updatePlanDraft,
  onPlanNameInput,
  onPlanDescriptionInput,
  submitPlan,
  savingPlanId,
  isReadOnly,
}: {
  plans: PlatformData["plans"];
  planDrafts: PlatformData["planDrafts"];
  updatePlanDraft: PlatformData["updatePlanDraft"];
  onPlanNameInput: PlatformData["onPlanNameInput"];
  onPlanDescriptionInput: PlatformData["onPlanDescriptionInput"];
  submitPlan: PlatformData["submitPlan"];
  savingPlanId: string | null;
  isReadOnly: boolean;
}): ReactNode => (
  <section className="panel panel-admin panel-plans">
    <div className="panel-head">
      <span className="panel-chip">{adminModuleMeta.plans.panelChip}</span>
      <h2>{adminModuleMeta.plans.panelTitle}</h2>
      <p className="subtle">{adminModuleMeta.plans.panelDescription}</p>
    </div>

    <div className="plan-grid">
      {plans.map((plan) => {
        const draft = planDrafts[plan.id] ?? plan;
        const planContribution = draft.monthlyPrice * draft.activeClients;
        const annualContribution =
          draft.monthlyPrice *
          12 *
          (1 - draft.annualDiscountRate) *
          draft.activeClients;

        return (
          <article key={plan.id} className="plan-card">
            <div className="plan-head">
              <input
                value={draft.name}
                onChange={(event) =>
                  onPlanNameInput(plan.id, event.target.value)
                }
                className="plan-title"
                aria-label={`${plan.id} 요금제명 입력`}
                disabled={isReadOnly || savingPlanId === plan.id}
              />
              <span className="tag">이용 가구 {draft.activeClients}개</span>
            </div>

            <label>
              월 요금
              <input
                type="number"
                min={0}
                value={draft.monthlyPrice}
                onChange={(event) =>
                  updatePlanDraft(plan.id, "monthlyPrice", event.target.value)
                }
                disabled={isReadOnly || savingPlanId === plan.id}
              />
            </label>
            <label>
              연 결제 할인율
              <input
                type="number"
                min={0}
                max={0.99}
                step={0.01}
                value={draft.annualDiscountRate}
                onChange={(event) =>
                  updatePlanDraft(
                    plan.id,
                    "annualDiscountRate",
                    event.target.value,
                  )
                }
                disabled={isReadOnly || savingPlanId === plan.id}
              />
            </label>
            <label>
              이용 가구 수
              <input
                type="number"
                min={0}
                value={draft.activeClients}
                onChange={(event) =>
                  updatePlanDraft(plan.id, "activeClients", event.target.value)
                }
                disabled={isReadOnly || savingPlanId === plan.id}
              />
            </label>
            <label>
              설명
              <input
                value={draft.description}
                onChange={(event) =>
                  onPlanDescriptionInput(plan.id, event.target.value)
                }
                aria-label={`${draft.name} 설명 입력`}
                disabled={isReadOnly || savingPlanId === plan.id}
              />
            </label>

            <div className="plan-feature">{draft.featureFlags.join(" · ")}</div>

            <div className="plan-footer">
              <p>
                <span
                  aria-label={`월 예상 금액 ${formatWon(planContribution)}, 연 예상 금액 ${formatWon(Math.round(annualContribution))}`}
                >
                  월 {formatWon(planContribution)} · 연 {formatWon(Math.round(annualContribution))}
                </span>
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void submitPlan(plan.id)}
                disabled={isReadOnly || savingPlanId === plan.id}
              >
                {savingPlanId === plan.id ? "저장 중..." : "요금 저장"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  </section>
);

const renderSimulator = ({
  scenarioRevenue,
  onPriceLiftInput,
  onUpgradePushInput,
  priceLiftPercent,
  upgradePushPercent,
  growthRecommendations,
  isReadOnly,
}: {
  scenarioRevenue: PlatformData["scenarioRevenue"];
  onPriceLiftInput: PlatformData["onPriceLiftInput"];
  onUpgradePushInput: PlatformData["onUpgradePushInput"];
  priceLiftPercent: number;
  upgradePushPercent: number;
  growthRecommendations: string[];
  isReadOnly: boolean;
}): ReactNode => (
  <section className="panel panel-admin panel-simulator">
    <div className="panel-head">
      <span className="panel-chip">{adminModuleMeta.simulator.panelChip}</span>
      <h2>{adminModuleMeta.simulator.panelTitle}</h2>
      <p className="subtle">{adminModuleMeta.simulator.panelDescription}</p>
    </div>

    <div className="sim-grid">
      <label className="control-card">
        요금 변화
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={priceLiftPercent}
          onChange={onPriceLiftInput}
          disabled={isReadOnly}
        />
        <strong>{priceLiftPercent}%</strong>
      </label>
      <label className="control-card">
        상위 요금제로 변경
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={upgradePushPercent}
          onChange={onUpgradePushInput}
          disabled={isReadOnly}
        />
        <strong>+{upgradePushPercent}%</strong>
      </label>
    </div>

    <div className="outcome-grid">
      <article>
        <p>예상 월 금액</p>
        <strong
          aria-label={`예상 월 금액 ${formatWon(scenarioRevenue.scenarioMRR)}`}
        >
          {formatWon(scenarioRevenue.scenarioMRR)}
        </strong>
        <span className="small-note">
          현재 월 금액 대비 {scenarioRevenue.upliftFromCurrent >= 0 ? "+" : ""}
          {formatWon(scenarioRevenue.upliftFromCurrent)}
        </span>
      </article>
      <article>
        <p>목표 진행률</p>
        <div className="goal-bar" aria-hidden="true">
          <div
            className="goal-fill"
            style={{ width: `${scenarioRevenue.goalRate}%` }}
          />
        </div>
        <strong aria-label={`목표 진행률 ${scenarioRevenue.goalRate}%`}>
          {scenarioRevenue.goalRate}%
        </strong>
      </article>
      <article>
        <p>목표까지 남은 금액</p>
        <strong aria-label={`목표 차이 ${formatWon(scenarioRevenue.goalGap)}`}>
          {formatWon(scenarioRevenue.goalGap)}
        </strong>
        <span className="small-note">목표값: 5,000,000원</span>
      </article>
      <article>
        <p>예상 연 금액</p>
        <strong
          aria-label={`예상 연 금액 ${formatWon(scenarioRevenue.scenarioAnnualMRR)}`}
        >
          {formatWon(scenarioRevenue.scenarioAnnualMRR)}
        </strong>
      </article>
      <article>
        <p>청구 반영 후 월 금액</p>
        <strong
          aria-label={`예상 월 금액 ${formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}`}
        >
          {formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}
        </strong>
        <span className="small-note">
          승인율 {formatRate(scenarioRevenue.conversionRate)} 적용
        </span>
      </article>
    </div>

    <div className="recommend-box">
      <h3>확인 가이드</h3>
      <ul>
        {growthRecommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  </section>
);

const renderSummary = ({
  kpiMonthlyRevenue,
  planPotentialAnnual,
}: {
  kpiMonthlyRevenue: number;
  planPotentialAnnual: number;
}): ReactNode => (
  <section className="panel panel-admin panel-summary">
    <div className="panel-head">
      <span className="panel-chip">{adminModuleMeta.summary.panelChip}</span>
      <h2>{adminModuleMeta.summary.panelTitle}</h2>
      <p className="subtle">{adminModuleMeta.summary.panelDescription}</p>
    </div>
    <div className="growth-summary">
      <p>
        <strong>현재 월 관리 금액:</strong> {formatWon(kpiMonthlyRevenue)}
      </p>
      <p>
        <strong>예상 연 금액:</strong> {formatWon(planPotentialAnnual)}
      </p>
      <p className="small-note">
        요금, 이용 가구 수, 보험청구 승인률을 함께 보면 다음 관리 방향을 정하기 쉽습니다.
      </p>
    </div>
  </section>
);

const AdminPage = ({
  modules,
  compositionMeta,
  data,
  onNavigate,
  activeRoutePath,
  isReadOnly,
}: AdminPageProps) => {
  const moduleRenderers: Record<AdminRouteModule, () => ReactNode> = {
    kpi: () => renderKpiTable({ adminOverview: data.adminOverview, data }),
    trends: () =>
      renderTrends({
        monthlyTrendWithDelta: data.monthlyTrendWithDelta,
        isUsingServerTrend: data.isUsingServerTrend,
        trendSourceMeta: data.trendSourceMeta,
      }),
    plans: () =>
      renderPlans({
        plans: data.plans,
        planDrafts: data.planDrafts,
        updatePlanDraft: data.updatePlanDraft,
        onPlanNameInput: data.onPlanNameInput,
        onPlanDescriptionInput: data.onPlanDescriptionInput,
        submitPlan: data.submitPlan,
        savingPlanId: data.savingPlanId,
        isReadOnly,
      }),
    simulator: () =>
      renderSimulator({
        scenarioRevenue: data.scenarioRevenue,
        onPriceLiftInput: data.onPriceLiftInput,
        onUpgradePushInput: data.onUpgradePushInput,
        priceLiftPercent: data.priceLiftPercent,
        upgradePushPercent: data.upgradePushPercent,
        growthRecommendations: data.growthRecommendations,
        isReadOnly,
      }),
    summary: () =>
      renderSummary({
        kpiMonthlyRevenue: data.kpiMonthlyRevenue,
        planPotentialAnnual: data.planPotentialAnnual,
      }),
  };

  const resolveActiveModule = (moduleName: AdminRouteModule) => {
    if (moduleName === "summary") {
      return false;
    }
    if (activeRoutePath === "/admin") {
      return moduleName === "kpi";
    }
    return adminModuleRoute[moduleName] === activeRoutePath;
  };

  const visibleModules = getAdminFocusModules(modules, activeRoutePath);
  const nextAction = getAdminNextAction(modules, activeRoutePath);

  return (
    <section className="view-stack">
      <section
        className={`panel panel-overview ${compositionMeta.compositionPanelClass}`}
      >
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-chip">{compositionMeta.compositionChip}</span>
            <h2>{compositionMeta.compositionTitle}</h2>
          </div>
          <p className="subtle">{compositionMeta.compositionDescription}</p>
        </div>
        <div
          className="module-composition"
          role="list"
          aria-label="현재 페이지 구성요소"
        >
          {modules.map((moduleName) => {
            const config = adminModuleMeta[moduleName];
            const modulePath = adminModuleRoute[moduleName];
            const isActiveModule = resolveActiveModule(moduleName);

            return (
              <button
                key={moduleName}
                type="button"
                className={`module-composition-item ${isActiveModule ? "module-composition-item-current" : ""}`}
                role="listitem"
                onClick={() => onNavigate(modulePath)}
                aria-label={`${config.title}로 ${isActiveModule ? "현재 보기" : "이동"}`}
                aria-current={isActiveModule ? "page" : undefined}
                title={config.note}
              >
                <p className="small-note" aria-hidden="true">
                  {config.chip}
                </p>
                <strong>{config.title}</strong>
                <p>{config.note}</p>
              </button>
            );
          })}
        </div>
      </section>

      {visibleModules.map((moduleName) => (
        <div className="panel-stack-item" key={moduleName}>
          {moduleRenderers[moduleName]()}
        </div>
      ))}

      <section className="panel panel-summary">
        <h2 className="sr-only">요약 액션</h2>
        <div className="recommend-box">
          <p className="small-note">추천 순서: {nextAction}</p>
        </div>
      </section>
    </section>
  );
};

const getAdminActiveModule = (
  modules: readonly AdminRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): AdminRouteModule => {
  if (activeRoutePath === "/admin") {
    return "kpi";
  }

  return (
    modules.find((moduleName) => adminModuleRoute[moduleName] === activeRoutePath) ??
    "kpi"
  );
};

const getAdminFocusModules = (
  modules: readonly AdminRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): AdminRouteModule[] => {
  const ordered = modules.length > 0 ? modules : adminModuleSequence;
  const activeModule = getAdminActiveModule(ordered, activeRoutePath);
  const activeIndex = ordered.indexOf(activeModule);

  if (activeIndex < 0) {
    return ["kpi", "trends", "plans"];
  }

  if (activeRoutePath === "/admin") {
    return ["kpi", "trends", "plans"];
  }

  const previous = ordered[activeIndex - 1];
  const next = ordered[activeIndex + 1];

  return Array.from(
    new Set(
      [previous, activeModule, next].filter(
        (item): item is AdminRouteModule => Boolean(item),
      ),
    ),
  );
};

const getAdminNextAction = (
  modules: readonly AdminRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): string => {
  if (activeRoutePath === "/admin") {
    return "전체 현황 → 월별 변화 → 요금 구성";
  }

  const ordered = modules.length > 0 ? modules : adminModuleSequence;
  const activeModule = getAdminActiveModule(ordered, activeRoutePath);
  const activeIndex = ordered.indexOf(activeModule);
  const next = activeIndex >= 0 ? ordered[activeIndex + 1] : undefined;

  if (!next) {
    return "요약 화면에서 위험 신호를 점검하고 저장";
  }

  return `${adminModuleMeta[next].title}로 이동`;
};

export { AdminPage };
