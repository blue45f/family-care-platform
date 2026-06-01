import { type ReactNode } from "react";

import {
  adminModuleMeta,
  adminModuleRoute,
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

  return (
    <section className="panel panel-admin panel-overview">
      <div className="panel-head">
        <div>
          <span className="panel-chip">{adminModuleMeta.kpi.panelChip}</span>
          <h2>{adminModuleMeta.kpi.panelTitle}</h2>
          <p className="subtle">{adminModuleMeta.kpi.panelDescription}</p>
        </div>
      </div>

      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <caption className="sr-only">어드민 핵심 KPI</caption>
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">현재 값</th>
              <th scope="col">해석</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">활성 가구</th>
              <td>
                <strong>
                  {adminOverview.activeHouseholds || data.activeHouseholds}개
                </strong>
              </td>
              <td>현재 집계 기준의 운영 가구 수</td>
            </tr>
            <tr>
              <th scope="row">월 정산 규모</th>
              <td>
                <strong>
                  {formatWon(
                    adminOverview.thisMonthSettlement || data.totalSettlement,
                  )}
                </strong>
              </td>
              <td>이번 달 누적 정산 금액</td>
            </tr>
            <tr>
              <th scope="row">청구 승인률</th>
              <td>
                <strong>
                  {formatRate(
                    adminOverview.totalClaims
                      ? adminOverview.conversionRate
                      : approvalRate,
                  )}
                </strong>
              </td>
              <td>
                {adminOverview.totalClaims
                  ? `${adminOverview.approvedClaims}/${adminOverview.totalClaims} 건 승인`
                  : `총 ${data.claims.length}건 중 ${approvedClaims}건`}
              </td>
            </tr>
            <tr>
              <th scope="row">평균 정산액</th>
              <td>
                <strong>
                  {formatWon(
                    adminOverview.averageSettlement ||
                      (data.activeHouseholds > 0
                        ? Math.round(
                            data.totalSettlement / data.activeHouseholds,
                          )
                        : 0),
                  )}
                </strong>
              </td>
              <td>가구당 평균 정산액</td>
            </tr>
            <tr>
              <th scope="row">월 반복매출(MRR)</th>
              <td>
                <strong>
                  {formatWon(
                    adminOverview.monthlyRecurringRevenue ||
                      data.kpiMonthlyRevenue,
                  )}
                </strong>
              </td>
              <td>요금제 기반 월 반복 매출</td>
            </tr>
            <tr>
              <th scope="row">요금제 전환률</th>
              <td>
                <strong>
                  {formatRate(
                    adminOverview.planTakeRate ||
                      data.scenarioRevenue.conversionRate,
                  )}
                </strong>
              </td>
              <td>요금제 전환 상태의 전환 신호</td>
            </tr>
            <tr>
              <th scope="row">연환산 추정치</th>
              <td>
                <strong>{formatWon(data.kpiAnnualRevenue)}</strong>
              </td>
              <td>보수적 가정 기준</td>
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
        클라이언트 폴백 계산은 브라우저 데이터 기준입니다. 백엔드 집계 응답이
        있을 경우 수치는 보정됩니다.
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
              정산액{" "}
              {entry.hasPreviousMonth
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
              청구건수{" "}
              {entry.hasPreviousMonth
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
              승인률{" "}
              {entry.hasPreviousMonth
                ? `${formatSignedRatePoint(entry.approvalRateDelta)} (${formatSignedRate(entry.approvalRateDeltaRate)})`
                : "비교 데이터 없음"}
            </p>
            <p className="small-note">
              현재 값: 청구 {entry.claimCount}건, 승인{" "}
              {entry.approvedClaimCount}건
            </p>
          </article>
        ))
      ) : (
        <p className="empty">표시할 월별 추세 데이터가 없습니다.</p>
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
}: {
  plans: PlatformData["plans"];
  planDrafts: PlatformData["planDrafts"];
  updatePlanDraft: PlatformData["updatePlanDraft"];
  onPlanNameInput: PlatformData["onPlanNameInput"];
  onPlanDescriptionInput: PlatformData["onPlanDescriptionInput"];
  submitPlan: PlatformData["submitPlan"];
  savingPlanId: string | null;
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
              />
              <span className="tag">활성 고객 {draft.activeClients}명</span>
            </div>

            <label>
              월 구독료
              <input
                type="number"
                min={0}
                value={draft.monthlyPrice}
                onChange={(event) =>
                  updatePlanDraft(plan.id, "monthlyPrice", event.target.value)
                }
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
              />
            </label>
            <label>
              보유 고객 수
              <input
                type="number"
                min={0}
                value={draft.activeClients}
                onChange={(event) =>
                  updatePlanDraft(plan.id, "activeClients", event.target.value)
                }
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
              />
            </label>

            <div className="plan-feature">{draft.featureFlags.join(" · ")}</div>

            <div className="plan-footer">
              <p>
                <span
                  aria-label={`요금제 월 매출 ${formatWon(planContribution)}, 연 매출 ${formatWon(Math.round(annualContribution))}`}
                >
                  월 {formatWon(planContribution)} · 연{" "}
                  {formatWon(Math.round(annualContribution))}
                </span>
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void submitPlan(plan.id)}
                disabled={savingPlanId === plan.id}
              >
                {savingPlanId === plan.id ? "저장 중..." : "요금제 저장"}
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
}: {
  scenarioRevenue: PlatformData["scenarioRevenue"];
  onPriceLiftInput: PlatformData["onPriceLiftInput"];
  onUpgradePushInput: PlatformData["onUpgradePushInput"];
  priceLiftPercent: number;
  upgradePushPercent: number;
  growthRecommendations: string[];
}): ReactNode => (
  <section className="panel panel-admin panel-simulator">
    <div className="panel-head">
      <span className="panel-chip">{adminModuleMeta.simulator.panelChip}</span>
      <h2>{adminModuleMeta.simulator.panelTitle}</h2>
      <p className="subtle">{adminModuleMeta.simulator.panelDescription}</p>
    </div>

    <div className="sim-grid">
      <label className="control-card">
        가격 인상율
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={priceLiftPercent}
          onChange={onPriceLiftInput}
        />
        <strong>{priceLiftPercent}%</strong>
      </label>
      <label className="control-card">
        업셀링 유도율
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={upgradePushPercent}
          onChange={onUpgradePushInput}
        />
        <strong>+{upgradePushPercent}%</strong>
      </label>
    </div>

    <div className="outcome-grid">
      <article>
        <p>시나리오 기준 MRR</p>
        <strong
          aria-label={`시나리오 MRR ${formatWon(scenarioRevenue.scenarioMRR)}`}
        >
          {formatWon(scenarioRevenue.scenarioMRR)}
        </strong>
        <span className="small-note">
          현재 MRR 대비 {scenarioRevenue.upliftFromCurrent >= 0 ? "+" : ""}
          {formatWon(scenarioRevenue.upliftFromCurrent)}
        </span>
      </article>
      <article>
        <p>목표 달성률</p>
        <div className="goal-bar" aria-hidden="true">
          <div
            className="goal-fill"
            style={{ width: `${scenarioRevenue.goalRate}%` }}
          />
        </div>
        <strong aria-label={`목표 달성률 ${scenarioRevenue.goalRate}%`}>
          {scenarioRevenue.goalRate}%
        </strong>
      </article>
      <article>
        <p>목표 차이</p>
        <strong aria-label={`목표 차이 ${formatWon(scenarioRevenue.goalGap)}`}>
          {formatWon(scenarioRevenue.goalGap)}
        </strong>
        <span className="small-note">목표값: 5,000,000원</span>
      </article>
      <article>
        <p>연 매출 환산</p>
        <strong
          aria-label={`연 매출 환산 ${formatWon(scenarioRevenue.scenarioAnnualMRR)}`}
        >
          {formatWon(scenarioRevenue.scenarioAnnualMRR)}
        </strong>
      </article>
      <article>
        <p>청구 기반 월 기여</p>
        <strong
          aria-label={`청구 기반 월 기여 ${formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}`}
        >
          {formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}
        </strong>
        <span className="small-note">
          승인율 {formatRate(scenarioRevenue.conversionRate)} 적용
        </span>
      </article>
    </div>

    <div className="recommend-box">
      <h3>실행 가이드</h3>
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
        <strong>현재 기준 월 매출:</strong> {formatWon(kpiMonthlyRevenue)}
      </p>
      <p>
        <strong>연 환산 목표(보수):</strong> {formatWon(planPotentialAnnual)}
      </p>
      <p className="small-note">
        수익 레버리지는 요금제 업셀링, 단가 관리, 승인율 개선 세 가닥이 동시에
        맞아야 지속됩니다.
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
      }),
    simulator: () =>
      renderSimulator({
        scenarioRevenue: data.scenarioRevenue,
        onPriceLiftInput: data.onPriceLiftInput,
        onUpgradePushInput: data.onUpgradePushInput,
        priceLiftPercent: data.priceLiftPercent,
        upgradePushPercent: data.upgradePushPercent,
        growthRecommendations: data.growthRecommendations,
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

  return (
    <section className="view-stack">
      <section
        className={`panel panel-overview ${compositionMeta.compositionPanelClass}`}
      >
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-chip">
              {compositionMeta.compositionChip}
            </span>
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
                <p className="subtle" aria-hidden="true">
                  {config.chip}
                </p>
                <strong>{config.title}</strong>
                <p>{config.note}</p>
              </button>
            );
          })}
        </div>
      </section>

      {modules.map((moduleName) => (
        <div className="panel-stack-item" key={moduleName}>
          {moduleRenderers[moduleName]()}
        </div>
      ))}

      <section className="panel panel-summary">
        <h2 className="sr-only">요약 액션</h2>
        <div className="recommend-box">
          <p className="small-note">
            추천 순서: KPI 검토 → 추세 확인 → 요금제 조정 → 시뮬레이션 적용으로
            우선순위를 고정하세요.
          </p>
        </div>
      </section>
    </section>
  );
};

export { AdminPage };
