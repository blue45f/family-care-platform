import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
  fetchAdminOverview,
  fetchAdminPlans,
  fetchCareLogs,
  fetchClaims,
  fetchSettlements,
  patchClaimStatus,
  postCareLog,
  postClaim,
  postSettlement,
  updateAdminPlan,
} from './api';
import type {
  AdminOverview,
  CareLog,
  Claim,
  ClaimDraft,
  ClaimStatus,
  AdminMonthlyTrend,
  RevenuePlan,
  RevenuePlanDraft,
  Settlement,
  SettlementDraft,
} from './types';
import {
  TREND_SOURCE_FALLBACK,
  TREND_SOURCE_SERVER,
  calculateTrendDelta,
  claimStatusClass,
  formatInputNumber,
  formatMonthLabel,
  formatRate,
  formatSignedCount,
  formatSignedRate,
  formatSignedRatePoint,
  formatSignedWon,
  formatWon,
  trendDirectionLabel,
  TrendDeltaDirection,
} from './utils';

type ViewMode = 'operations' | 'admin';
type DraftPlanMap = Record<string, RevenuePlan>;

type AdminMonthlyTrendWithDelta = AdminMonthlyTrend & {
  settlementDelta: number;
  settlementDeltaRate: number;
  settlementDeltaDirection: TrendDeltaDirection;
  claimCountDelta: number;
  claimCountDeltaRate: number;
  claimCountDeltaDirection: TrendDeltaDirection;
  approvalRateDelta: number;
  approvalRateDeltaRate: number;
  approvalRateDeltaDirection: TrendDeltaDirection;
  hasPreviousMonth: boolean;
};

const careLogTypes = ['방문', '원격상담', '투약', '식사관리', '기타'] as const;
type CareLogDraftState = {
  recipient: string;
  caregiver: string;
  type: (typeof careLogTypes)[number];
  note: string;
  date: string;
};
const claimStatuses = ['요청', '검토중', '승인', '거절'] as const;

const PLAN_TARGET_MONTHLY = 5_000_000;

const initialAdminOverview: AdminOverview = {
  activeHouseholds: 0,
  thisMonthSettlement: 0,
  approvedClaims: 0,
  totalClaims: 0,
  averageSettlement: 0,
  monthlyRecurringRevenue: 0,
  conversionRate: 0,
  planTakeRate: 0,
  monthlyTrend: [],
  monthlyTrendSource: TREND_SOURCE_FALLBACK,
};

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('operations');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const [adminOverview, setAdminOverview] = useState<AdminOverview>(initialAdminOverview);
  const [plans, setPlans] = useState<RevenuePlan[]>([]);
  const [planDrafts, setPlanDrafts] = useState<DraftPlanMap>({});
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [updatingClaimId, setUpdatingClaimId] = useState<number | null>(null);

  const [priceLiftPercent, setPriceLiftPercent] = useState(4);
  const [upgradePushPercent, setUpgradePushPercent] = useState(8);

  const [careLogDraft, setCareLogDraft] = useState<CareLogDraftState>({
    recipient: '',
    caregiver: '',
    type: careLogTypes[0],
    note: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [settlementDraft, setSettlementDraft] = useState<SettlementDraft>({
    recipient: '',
    date: new Date().toISOString().slice(0, 10),
    careHours: 1,
    baseRate: 42000,
    note: '',
  });

  const [claimDraft, setClaimDraft] = useState<ClaimDraft>({
    recipient: '',
    claimType: '장기요양보험',
    expectedAmount: 0,
    hospitalName: '',
    issueDate: new Date().toISOString().slice(0, 10),
    status: '요청',
    note: '',
  });

  const totalSettlement = useMemo(
    () => settlements.reduce((sum, settlement) => sum + settlement.totalAmount, 0),
    [settlements],
  );

  const activeHouseholds = useMemo(() => {
    const recipients = new Set(
      [...careLogs.map((log) => log.recipient), ...settlements.map((settlement) => settlement.recipient)],
    );
    return recipients.size;
  }, [careLogs, settlements]);

  const approvedClaims = useMemo(() => claims.filter((item) => item.status === '승인').length, [claims]);
  const pendingClaims = useMemo(() => claims.filter((item) => item.status !== '승인').length, [claims]);
  const approvalRate = useMemo(() => (claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0), [approvedClaims, claims]);

  const kpiMonthlyRevenue = useMemo(
    () =>
      plans.reduce((sum, plan) => {
        return sum + plan.monthlyPrice * plan.activeClients;
      }, 0),
    [plans],
  );

  const kpiAnnualRevenue = kpiMonthlyRevenue * 12;

  const planPotentialAnnual = useMemo(() => {
    return plans.reduce((sum, plan) => {
      const annualPrice = plan.monthlyPrice * 12 * (1 - plan.annualDiscountRate);
      return sum + annualPrice * plan.activeClients;
    }, 0);
  }, [plans]);

  const buildMonthKeys = (monthCount = 3): string[] => {
    const now = new Date();
    return Array.from({ length: monthCount }, (_, index) => {
      const cursor = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      return `${cursor.getFullYear()}-${month}`;
    });
  };

  const monthlyTrendFallback: AdminMonthlyTrend[] = useMemo(() => {
    return buildMonthKeys(3).map((month) => {
      const claimsByMonth = claims.filter((claim) => claim.issueDate.startsWith(month));
      const settlementsByMonth = settlements.filter((settlement) => settlement.date.startsWith(month));
      const approvedClaimsByMonth = claimsByMonth.filter((claim) => claim.status === '승인').length;
      const claimCount = claimsByMonth.length;

      return {
        month,
        settlementTotal: settlementsByMonth.reduce((sum, settlement) => sum + settlement.totalAmount, 0),
        claimCount,
        approvedClaimCount: approvedClaimsByMonth,
        approvalRate: claimCount > 0 ? Number(((approvedClaimsByMonth / claimCount) * 100).toFixed(1)) : 0,
      };
    });
  }, [claims, settlements]);

  const monthlyTrend = useMemo(
    () =>
      adminOverview.monthlyTrendSource === TREND_SOURCE_SERVER && adminOverview.monthlyTrend.length > 0
        ? adminOverview.monthlyTrend
        : monthlyTrendFallback,
    [adminOverview.monthlyTrend, adminOverview.monthlyTrendSource, monthlyTrendFallback],
  );

  const monthlyTrendWithDelta = useMemo<AdminMonthlyTrendWithDelta[]>(() => {
    return monthlyTrend.map((entry, index) => {
      const previous = monthlyTrend[index + 1];
      if (!previous) {
        return {
          ...entry,
          settlementDelta: 0,
          settlementDeltaRate: 0,
          settlementDeltaDirection: 'flat',
          claimCountDelta: 0,
          claimCountDeltaRate: 0,
          claimCountDeltaDirection: 'flat',
          approvalRateDelta: 0,
          approvalRateDeltaRate: 0,
          approvalRateDeltaDirection: 'flat',
          hasPreviousMonth: false,
        };
      }

      const settlementTrend = calculateTrendDelta(entry.settlementTotal, previous.settlementTotal);
      const claimCountTrend = calculateTrendDelta(entry.claimCount, previous.claimCount);
      const approvalRateTrend = calculateTrendDelta(entry.approvalRate, previous.approvalRate);

      return {
        ...entry,
        settlementDelta: settlementTrend.delta,
        settlementDeltaRate: settlementTrend.deltaRate,
        settlementDeltaDirection: settlementTrend.direction,
        claimCountDelta: claimCountTrend.delta,
        claimCountDeltaRate: claimCountTrend.deltaRate,
        claimCountDeltaDirection: claimCountTrend.direction,
        approvalRateDelta: approvalRateTrend.delta,
        approvalRateDeltaRate: approvalRateTrend.deltaRate,
        approvalRateDeltaDirection: approvalRateTrend.direction,
        hasPreviousMonth: true,
      };
    });
  }, [monthlyTrend]);

  const isUsingServerTrend = useMemo(
    () => adminOverview.monthlyTrendSource === TREND_SOURCE_SERVER,
    [adminOverview.monthlyTrendSource],
  );

  const trendSourceMeta = useMemo(() => {
    return isUsingServerTrend
      ? { sourceLabel: '데이터 출처: 백엔드 월별 집계', sourceClass: 'trend-source-server', sourceText: '서버 집계 기반' }
      : { sourceLabel: '데이터 출처: 클라이언트 계산(폴백)', sourceClass: 'trend-source-fallback', sourceText: '클라이언트 폴백' };
  }, [isUsingServerTrend]);

  const totalClaimExpected = useMemo(() => claims.reduce((sum, claim) => sum + claim.expectedAmount, 0), [claims]);

  const scenarioRevenue = useMemo(() => {
    const starter = plans.find((plan) => plan.id === 'starter');
    const pro = plans.find((plan) => plan.id === 'pro');
    const enterprise = plans.find((plan) => plan.id === 'enterprise');

    const starterCount = starter?.activeClients ?? 0;
    const proCount = pro?.activeClients ?? 0;
    const enterpriseCount = enterprise?.activeClients ?? 0;

    const starterPrice = (starter?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100);
    const proPrice = (pro?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100);
    const enterprisePrice = (enterprise?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100);

    const starterToPro = Math.floor(starterCount * (upgradePushPercent / 100));
    const proToEnterprise = Math.floor(proCount * (upgradePushPercent / 200));

    const newStarterCount = Math.max(starterCount - starterToPro, 0);
    const newProCount = Math.max(proCount + starterToPro - proToEnterprise, 0);
    const newEnterpriseCount = enterpriseCount + proToEnterprise;

    const scenarioMRR = Math.round(newStarterCount * starterPrice + newProCount * proPrice + newEnterpriseCount * enterprisePrice);
      const scenarioAnnualMRR = scenarioMRR * 12;

      const conversionEffect = claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0;
      const claimImpact = (totalClaimExpected * conversionEffect) / 100;

      return {
        scenarioMRR,
        scenarioAnnualMRR,
        scenarioStarterCount: newStarterCount,
        scenarioProCount: newProCount,
        scenarioEnterpriseCount: newEnterpriseCount,
        conversionRate: Number(conversionEffect.toFixed(1)),
        claimImpact,
        expectedMonthlyAfterConversion: Math.round(scenarioMRR + claimImpact / 12),
        goalGap: Math.max(PLAN_TARGET_MONTHLY - scenarioMRR, 0),
        goalRate: Math.min(100, Math.round((scenarioMRR / PLAN_TARGET_MONTHLY) * 100)),
      upliftFromCurrent: Math.max(0, scenarioMRR - kpiMonthlyRevenue),
    };
  }, [plans, priceLiftPercent, upgradePushPercent, approvedClaims, claims.length, totalClaimExpected, kpiMonthlyRevenue, planPotentialAnnual]);

  const growthRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    if (priceLiftPercent < 10) {
      recommendations.push('요금 인상 여지(상위 플랜 중심 +4~8%)를 1분기 단위로 단계 적용해 이탈률을 관리하세요.');
    }
    if (upgradePushPercent < 12) {
      recommendations.push('Starter→Pro 업셀링 프로세스를 운영표준 체크리스트로 추가해 자동 추천 코멘트를 발송하세요.');
    }
    if (scenarioRevenue.conversionRate < 70) {
      recommendations.push('보험청구 상태 전환 SLA를 48시간 이내로 단축해 승인률/전환율 개선 여지를 만드세요.');
    }
    if (scenarioRevenue.goalRate < 80) {
      recommendations.push('기본 MRR 목표가치(5,000,000원)에 도달하지 못합니다. 고가치 가구 우선 영업 대상 1~2개 라운드를 확대하세요.');
    }
    if (recommendations.length === 0) {
      recommendations.push('현재 수치 기준으로 안정적입니다. 다음 액션은 할인 쿠폰과 계약 갱신 알림 자동화를 동시 운영하세요.');
    }
    return recommendations;
  }, [priceLiftPercent, upgradePushPercent, scenarioRevenue.conversionRate, scenarioRevenue.goalRate]);

  const load = async () => {
    setLoading(true);
    try {
      setErrorMessage('');
      const [logsResult, settlementsResult, claimsResult, overviewResult, plansResult] = await Promise.all([
        fetchCareLogs(),
        fetchSettlements(),
        fetchClaims(),
        fetchAdminOverview(),
        fetchAdminPlans(),
      ]);

      setCareLogs(logsResult);
      setSettlements(settlementsResult);
      setClaims(claimsResult);
      setAdminOverview(overviewResult);
      setPlans(plansResult);

      const newDrafts: DraftPlanMap = {};
      plansResult.forEach((plan) => {
        newDrafts[plan.id] = { ...plan };
      });
      setPlanDrafts(newDrafts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submitCareLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!careLogDraft.recipient || !careLogDraft.caregiver || !careLogDraft.note) {
      setErrorMessage('돌봄 기록은 보호자명, 돌봄인력, 내용이 모두 필요합니다.');
      return;
    }

    try {
      const next = await postCareLog(careLogDraft);
      setCareLogs((prev) => [next, ...prev]);
      setCareLogDraft({
        recipient: '',
        caregiver: '',
        type: careLogTypes[0],
        note: '',
        date: new Date().toISOString().slice(0, 10),
      });
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '돌봄 기록 등록에 실패했습니다.');
    }
  };

  const submitSettlement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settlementDraft.recipient) {
      setErrorMessage('정산은 보호자명이 필요합니다.');
      return;
    }
    if (settlementDraft.careHours <= 0 || settlementDraft.baseRate <= 0) {
      setErrorMessage('돌봄 시간과 시간당 요금은 0보다 커야 합니다.');
      return;
    }

    try {
      const next = await postSettlement(settlementDraft);
      setSettlements((prev) => [next, ...prev]);
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '정산 등록에 실패했습니다.');
    }
  };

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!claimDraft.recipient || !claimDraft.hospitalName || claimDraft.expectedAmount <= 0) {
      setErrorMessage('보험청구는 보호자명, 병원명, 청구액이 필요합니다.');
      return;
    }

    try {
      const next = await postClaim(claimDraft);
      setClaims((prev) => [next, ...prev]);
      setClaimDraft((prev) => ({ ...prev, expectedAmount: 0, note: '' }));
      await load();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '보험청구 등록 실패');
    }
  };

  const submitPlan = async (planId: string) => {
    const draft = planDrafts[planId];
    if (!draft) {
      return;
    }

    if (draft.monthlyPrice <= 0) {
      setErrorMessage('요금은 0보다 커야 합니다.');
      return;
    }

    if (draft.annualDiscountRate < 0 || draft.annualDiscountRate >= 1) {
      setErrorMessage('연 할인율은 0 ~ 1 미만으로 입력하세요.');
      return;
    }

    try {
      setSavingPlanId(planId);
      setErrorMessage('');
      const next = await updateAdminPlan(draft as RevenuePlanDraft);
      setPlans((prev) => prev.map((plan) => (plan.id === next.id ? next : plan)));
      setPlanDrafts((prev) => ({
        ...prev,
        [next.id]: { ...next },
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '요금제 저장 실패');
    } finally {
      setSavingPlanId(null);
    }
  };

  const updatePlanDraft = (planId: string, key: keyof RevenuePlan, value: string) => {
    setPlanDrafts((prev) => {
      const target = prev[planId];
      if (!target) {
        return prev;
      }

      let nextValue: string | number = value;
      if (key === 'monthlyPrice' || key === 'activeClients' || key === 'annualDiscountRate') {
        nextValue = Number.isFinite(Number(value)) ? Number(value) : 0;
      }

      return {
        ...prev,
        [planId]: {
          ...target,
          [key]: nextValue,
        },
      };
    });
  };

  const updateClaimStatus = async (claimId: number, nextStatus: ClaimStatus) => {
    const current = claims.find((item) => item.id === claimId)?.status;
    if (!current || current === nextStatus) {
      return;
    }

    try {
      setUpdatingClaimId(claimId);
      setErrorMessage('');
      const updated = await patchClaimStatus(claimId, nextStatus);
      setClaims((prev) => prev.map((claim) => (claim.id === updated.id ? updated : claim)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '보험청구 상태 변경 실패');
    } finally {
      setUpdatingClaimId(null);
    }
  };

  const operationsTab = () => (
    <div className="view-stack">
      <section className="panel glass panel-ops panel-overview">
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-chip">운영 대시보드</span>
            <p className="kicker">운영 대시보드</p>
            <h2>실행 우선 순위형 운영 스위트</h2>
          </div>
          <p className="subtle">보호자와 돌봄 현장을 기준으로 기록·정산·보험청구를 즉시 처리합니다.</p>
        </div>

        <div className="kpi-ribbons">
          <article className="kpi-ribbon">
            <p>활성 가구</p>
            <strong>{activeHouseholds}개</strong>
          </article>
          <article className="kpi-ribbon">
            <p>미승인 청구</p>
            <strong>{pendingClaims}건</strong>
          </article>
          <article className="kpi-ribbon">
            <p>월간 정산</p>
            <strong>{formatWon(totalSettlement)}</strong>
          </article>
          <article className="kpi-ribbon">
            <p>실시간 승인률</p>
            <strong>{formatRate(approvalRate)}</strong>
          </article>
        </div>

        <div className="kpi-table-wrap">
          <table className="kpi-table">
            <caption className="sr-only">운영 페이지 핵심 지표</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">현재 수치</th>
                <th scope="col">참고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">활성 가구</th>
                <td>
                  <strong aria-label={`활성 가구 ${activeHouseholds}개`}>{activeHouseholds}개</strong>
                </td>
                <td className="trend">지난주 대비 +3건</td>
              </tr>
              <tr>
                <th scope="row">미승인 보험청구</th>
                <td>
                  <strong aria-label={`미승인 보험청구 ${pendingClaims}건`}>{pendingClaims}건</strong>
                </td>
                <td>정산 전 검토 대기</td>
              </tr>
              <tr>
                <th scope="row">이번 달 운영 정산</th>
                <td>
                  <strong aria-label={`이번 달 운영 정산 ${formatWon(totalSettlement)}`}>{formatWon(totalSettlement)}</strong>
                </td>
                <td>이번 달 합산 기준</td>
              </tr>
              <tr>
                <th scope="row">실시간 승인률</th>
                <td>
                  <strong aria-label={`실시간 승인률 ${formatRate(approvalRate)}`}>{formatRate(approvalRate)}</strong>
                </td>
                <td>총 {claims.length}건 중 {approvedClaims}건 승인</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel glass panel-ops panel-workflow">
        <div className="panel-head">
          <span className="panel-chip">A</span>
          <h2>돌봄 기록</h2>
          <p className="subtle">매일 접수되는 상태를 타임라인처럼 등록합니다.</p>
        </div>

        <form className="row" onSubmit={submitCareLog}>
          <input
            value={careLogDraft.recipient}
            onChange={(event) => setCareLogDraft((prev) => ({ ...prev, recipient: event.target.value }))}
            placeholder="보호자명"
          />
          <input
            value={careLogDraft.caregiver}
            onChange={(event) => setCareLogDraft((prev) => ({ ...prev, caregiver: event.target.value }))}
            placeholder="돌봄인력"
          />
          <select
            value={careLogDraft.type}
            onChange={(event) =>
              setCareLogDraft((prev) => ({ ...prev, type: event.target.value as typeof careLogTypes[number] }))
            }
          >
            {careLogTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={careLogDraft.date}
            onChange={(event) => setCareLogDraft((prev) => ({ ...prev, date: event.target.value }))}
          />
          <input
            value={careLogDraft.note}
            onChange={(event) => setCareLogDraft((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="돌봄 내용 (메모)"
          />
          <button type="submit">돌봄 기록 등록</button>
        </form>

        <ul className="list">
          {careLogs.map((log) => (
            <li key={log.id}>
              <div>
                <strong>{log.recipient}</strong> / <span className="muted">{log.caregiver}</span>
              </div>
              <p>
                [{log.type}] {log.date} — {log.note}
              </p>
            </li>
          ))}
          {careLogs.length === 0 ? <li className="empty">등록된 돌봄 기록이 없습니다.</li> : null}
        </ul>
      </section>

      <section className="panel glass panel-ops panel-workflow panel-alt">
        <div className="panel-head">
          <span className="panel-chip">B</span>
          <h2>가족 운영 정산</h2>
          <p className="subtle">정산 단가/시간 기록을 누적하고 합산 수익을 즉시 확인합니다.</p>
        </div>

        <form className="row" onSubmit={submitSettlement}>
          <input
            value={settlementDraft.recipient}
            onChange={(event) => setSettlementDraft((prev) => ({ ...prev, recipient: event.target.value }))}
            placeholder="보호자명"
          />
          <input
            type="date"
            value={settlementDraft.date}
            onChange={(event) => setSettlementDraft((prev) => ({ ...prev, date: event.target.value }))}
          />
          <input
            type="number"
            value={settlementDraft.careHours}
            min={1}
            onChange={(event) =>
              setSettlementDraft((prev) => ({ ...prev, careHours: Number(event.target.value) || 0 }))
            }
            placeholder="돌봄시간"
          />
          <input
            type="number"
            value={settlementDraft.baseRate}
            min={1}
            onChange={(event) =>
              setSettlementDraft((prev) => ({ ...prev, baseRate: Number(event.target.value) || 0 }))
            }
            placeholder="시간당 요금"
          />
          <input
            value={settlementDraft.note}
            onChange={(event) => setSettlementDraft((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="메모"
          />
          <button type="submit">정산 항목 생성</button>
        </form>

        <ul className="list">
          {settlements.map((settlement) => (
            <li key={settlement.id}>
              <div>
                <strong>{settlement.recipient}</strong> / <span>{settlement.date}</span>
              </div>
              <p>
                돌봄시간 {settlement.careHours}h × {formatWon(settlement.baseRate)} ={' '}
                <strong aria-label={`정산 합계 ${formatWon(settlement.totalAmount)}`}>{formatWon(settlement.totalAmount)}</strong>
              </p>
              <p className="subtle">{settlement.note}</p>
            </li>
          ))}
          {settlements.length === 0 ? <li className="empty">정산 데이터가 없습니다.</li> : null}
        </ul>
      </section>

      <section className="panel glass panel-ops panel-workflow">
        <div className="panel-head">
          <span className="panel-chip">C</span>
          <h2>보험청구</h2>
          <p className="subtle">청구 상태를 운영자가 즉시 바꿔 승인 프로세스를 단축합니다.</p>
        </div>

        <form className="row" onSubmit={submitClaim}>
          <input
            value={claimDraft.recipient}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, recipient: event.target.value }))}
            placeholder="보호자명"
          />
          <input
            value={claimDraft.hospitalName}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, hospitalName: event.target.value }))}
            placeholder="기관/병원명"
          />
          <input
            type="number"
            value={claimDraft.expectedAmount}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, expectedAmount: Number(event.target.value) || 0 }))}
            placeholder="예상청구액"
          />
          <input
            type="date"
            value={claimDraft.issueDate}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, issueDate: event.target.value }))}
          />
          <select
            value={claimDraft.status}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, status: event.target.value as ClaimStatus }))}
          >
            {claimStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            value={claimDraft.note}
            onChange={(event) => setClaimDraft((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="기록/특이사항"
          />
          <button type="submit">보험청구 등록</button>
        </form>

        <ul className="list">
          {claims.map((claim) => (
              <li key={claim.id} className="claim-row">
                <div className="claim-title">
                  <div>
                    <strong>{claim.recipient}</strong> / {claim.hospitalName} / {claim.claimType}
                  </div>
                  <span className={`status-pill ${claimStatusClass(claim.status)}`}>{claim.status}</span>
                </div>
                <p>
                  <span aria-label={`보험청구 금액 ${formatWon(claim.expectedAmount)}, 접수일 ${claim.issueDate}`}>
                    청구액 {formatWon(claim.expectedAmount)} · 접수일 {claim.issueDate}
                  </span>
                </p>
              <p className="subtle">비고: {claim.note}</p>
              <label className="inline-label">
                처리 상태 변경
                <select
                  value={claim.status}
                  className={`status-select ${claimStatusClass(claim.status)}`}
                  onChange={(event) => void updateClaimStatus(claim.id, event.target.value as ClaimStatus)}
                  disabled={updatingClaimId === claim.id}
                >
                  {claimStatuses.map((status) => (
                    <option key={`${claim.id}-${status}`} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
          {claims.length === 0 ? <li className="empty">보험청구 항목이 없습니다.</li> : null}
        </ul>
      </section>
    </div>
  );

  const adminTab = () => (
    <div className="view-stack">
      <section className="panel glass panel-admin panel-overview">
        <div className="panel-head">
          <div>
            <span className="panel-chip">1</span>
            <h2>수익성 센터</h2>
            <p className="subtle">어드민에서 요금/전환/승인율을 함께 관리해 매출 엔진을 정교화합니다.</p>
          </div>
        </div>

        <div className="kpi-table-wrap">
          <table className="kpi-table">
            <caption className="sr-only">어드민 핵심 KPI 표</caption>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">현재 수치</th>
                <th scope="col">참고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">활성 가구(시스템 기준)</th>
                <td>
                  <strong
                    aria-label={`시스템 기준 활성 가구 ${adminOverview.activeHouseholds || activeHouseholds}개`}
                  >
                    {adminOverview.activeHouseholds || activeHouseholds}개
                  </strong>
                </td>
                <td>일반 정산/기록 합산</td>
              </tr>
              <tr>
                <th scope="row">월 정산 규모(실적)</th>
                <td>
                  <strong aria-label={`월 정산 규모 ${formatWon(adminOverview.thisMonthSettlement || totalSettlement)}`}>
                    {formatWon(adminOverview.thisMonthSettlement || totalSettlement)}
                  </strong>
                </td>
                <td>월 기준 누적</td>
              </tr>
              <tr>
                <th scope="row">청구 승인률</th>
                <td>
                  <strong
                    aria-label={`청구 승인률 ${adminOverview.totalClaims ? formatRate(adminOverview.conversionRate) : '0.0%'}`}
                  >
                    {adminOverview.totalClaims ? formatRate(adminOverview.conversionRate) : '0.0%'}
                  </strong>
                </td>
                <td>총 {adminOverview.totalClaims}건 요청 중 {adminOverview.approvedClaims}건 승인</td>
              </tr>
              <tr>
                <th scope="row">평균 정산/가구</th>
                <td>
                  <strong
                    aria-label={`가구당 평균 정산액 ${formatWon(
                      adminOverview.averageSettlement || (activeHouseholds > 0 ? Math.round(totalSettlement / activeHouseholds) : 0),
                    )}`}
                  >
                    {formatWon(
                      adminOverview.averageSettlement || (activeHouseholds > 0 ? Math.round(totalSettlement / activeHouseholds) : 0),
                    )}
                  </strong>
                </td>
                <td>활성 가구 기준 계산</td>
              </tr>
              <tr>
                <th scope="row">월간 반복매출(MRR)</th>
                <td>
                  <strong aria-label={`월간 반복매출 ${formatWon(adminOverview.monthlyRecurringRevenue || kpiMonthlyRevenue)}`}>
                    {formatWon(adminOverview.monthlyRecurringRevenue || kpiMonthlyRevenue)}
                  </strong>
                </td>
                <td>요금제 운영 기준</td>
              </tr>
              <tr>
                <th scope="row">요금제 전환률</th>
                <td>
                  <strong aria-label={`요금제 전환률 ${formatRate(adminOverview.planTakeRate)}`}>{formatRate(adminOverview.planTakeRate)}</strong>
                </td>
                <td>요금제 보유율 합산</td>
              </tr>
              <tr>
                <th scope="row">예상 연환산</th>
                <td>
                  <strong aria-label={`예상 연환산 수익 ${formatWon(kpiAnnualRevenue + kpiAnnualRevenue * 0.08)}`}>
                    {formatWon(kpiAnnualRevenue + kpiAnnualRevenue * 0.08)}
                  </strong>
                </td>
                <td>보수적 가정 반영</td>
              </tr>
              <tr>
                <th scope="row">승인 청구 총합</th>
                <td>
                  <strong aria-label={`승인 청구 총합 ${formatWon(totalClaimExpected)}`}>{formatWon(totalClaimExpected)}</strong>
                </td>
                <td>총 청구액 집계</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel glass panel-admin panel-trend">
        <div className="panel-head">
          <div>
            <span className="panel-chip">2</span>
            <h2>월별 운영 추세 (최근 3개월)</h2>
            <p className="subtle">정산 합계/청구 건수/승인률을 월 단위로 확인해 수익 변동 포인트를 식별합니다.</p>
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
            ⚠ 클라이언트 폴백 데이터는 화면 데이터 기준으로 재계산됩니다. 백엔드 집계 응답 부재 시 실시간 변동치가 다소 다르게 보일 수 있습니다.
          </p>
        ) : null}

        <div className="trend-grid">
          {monthlyTrendWithDelta.map((entry) => (
            <article key={entry.month} className="trend-card">
              <p>{formatMonthLabel(entry.month)}</p>
              <strong aria-label={`월별 정산 합계 ${formatWon(entry.settlementTotal)}`}>{formatWon(entry.settlementTotal)}</strong>
              <p
                className={`trend-delta trend-delta-${entry.settlementDeltaDirection}`}
                aria-label={`전월 대비 정산액 증감 ${entry.hasPreviousMonth ? `${trendDirectionLabel(entry.settlementDeltaDirection)} ${formatSignedWon(entry.settlementDelta)} ${formatSignedRate(entry.settlementDeltaRate)}` : '전월 데이터 없음'}`}
              >
                <span aria-hidden="true">
                  {entry.settlementDeltaDirection === 'up' ? '▲' : entry.settlementDeltaDirection === 'down' ? '▼' : '–'}
                </span>
                정산액 {entry.hasPreviousMonth ? `${formatSignedWon(entry.settlementDelta)} (${formatSignedRate(entry.settlementDeltaRate)})` : '전월 비교 데이터 없음'}
              </p>
              <p
                className={`trend-delta trend-delta-${entry.claimCountDeltaDirection}`}
                aria-label={`전월 대비 청구건수 증감 ${entry.hasPreviousMonth ? `${trendDirectionLabel(entry.claimCountDeltaDirection)} ${formatSignedCount(entry.claimCountDelta)} ${formatSignedRate(entry.claimCountDeltaRate)}` : '전월 데이터 없음'}`}
              >
                <span aria-hidden="true">
                  {entry.claimCountDeltaDirection === 'up' ? '▲' : entry.claimCountDeltaDirection === 'down' ? '▼' : '–'}
                </span>
                청구건수 {entry.hasPreviousMonth ? `${formatSignedCount(entry.claimCountDelta)} (${formatSignedRate(entry.claimCountDeltaRate)})` : '전월 비교 데이터 없음'}
              </p>
              <p
                className={`trend-delta trend-delta-${entry.approvalRateDeltaDirection}`}
                aria-label={`전월 대비 승인률 증감 ${entry.hasPreviousMonth ? `${trendDirectionLabel(entry.approvalRateDeltaDirection)} ${formatSignedRatePoint(entry.approvalRateDelta)} ${formatSignedRate(entry.approvalRateDeltaRate)}` : '전월 데이터 없음'}`}
              >
                <span aria-hidden="true">
                  {entry.approvalRateDeltaDirection === 'up' ? '▲' : entry.approvalRateDeltaDirection === 'down' ? '▼' : '–'}
                </span>
                승인률 {entry.hasPreviousMonth ? `${formatSignedRatePoint(entry.approvalRateDelta)} (${formatSignedRate(entry.approvalRateDeltaRate)})` : '전월 비교 데이터 없음'}
              </p>
              <p className="small-note">현재 값: 청구 {entry.claimCount}건 / 승인 {entry.approvedClaimCount}건 · {formatRate(entry.approvalRate)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel glass panel-admin panel-plans">
        <div className="panel-head">
          <span className="panel-chip">3</span>
          <h2>요금제 운영</h2>
          <p className="subtle">월 요금, 연 할인율, 활성 고객 수를 조정해서 MRR을 직접 실험합니다.</p>
        </div>

        <div className="plan-grid">
          {plans.map((plan) => {
            const draft = planDrafts[plan.id] ?? plan;
            const planContribution = draft.monthlyPrice * draft.activeClients;
            const annualContribution = draft.monthlyPrice * 12 * (1 - draft.annualDiscountRate) * draft.activeClients;

            return (
              <article key={plan.id} className="plan-card">
                <div className="plan-head">
                  <input
                    value={draft.name}
                    onChange={(event) => {
                      updatePlanDraft(plan.id, 'name', event.target.value);
                    }}
                    className="plan-title"
                  />
                  <span className="tag">활성 고객 {draft.activeClients}명</span>
                </div>

                <label>
                  월 구독료
                  <input
                    type="number"
                    min={0}
                    value={formatInputNumber(draft.monthlyPrice)}
                    onChange={(event) => updatePlanDraft(plan.id, 'monthlyPrice', event.target.value)}
                  />
                </label>
                <label>
                  연 결제 할인율
                  <input
                    type="number"
                    min={0}
                    max={0.99}
                    step={0.01}
                    value={formatInputNumber(draft.annualDiscountRate)}
                    onChange={(event) => updatePlanDraft(plan.id, 'annualDiscountRate', event.target.value)}
                  />
                </label>
                <label>
                  보유 고객 수
                  <input
                    type="number"
                    min={0}
                    value={formatInputNumber(draft.activeClients)}
                    onChange={(event) => updatePlanDraft(plan.id, 'activeClients', event.target.value)}
                  />
                </label>
                <label>
                  설명
                  <input
                    value={draft.description}
                    onChange={(event) => updatePlanDraft(plan.id, 'description', event.target.value)}
                  />
                </label>

                <div className="plan-feature">
                  {draft.featureFlags.join(' · ')}
                </div>

        <div className="plan-footer">
          <p>
            <span aria-label={`요금제 월 매출 ${formatWon(planContribution)}, 연 매출 ${formatWon(Math.round(annualContribution))}`}>
              월 {formatWon(planContribution)} · 연 {formatWon(Math.round(annualContribution))}
            </span>
          </p>
                  <button type="button" onClick={() => void submitPlan(plan.id)} disabled={savingPlanId === plan.id}>
                    {savingPlanId === plan.id ? '저장 중...' : '요금제 저장'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel glass panel-admin panel-simulator">
        <div className="panel-head">
          <span className="panel-chip">4</span>
          <h2>수익 시뮬레이터</h2>
          <p className="subtle">가격/업셀링 가정을 넣으면 1개월 매출이 즉시 재계산됩니다.</p>
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
              onChange={(event) => setPriceLiftPercent(Number(event.target.value))}
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
              onChange={(event) => setUpgradePushPercent(Number(event.target.value))}
            />
            <strong>+{upgradePushPercent}%</strong>
          </label>
        </div>

        <div className="outcome-grid">
          <article>
            <p>현재 기본 MRR</p>
            <strong aria-label={`현재 기본 MRR ${formatWon(kpiMonthlyRevenue)}`}>{formatWon(kpiMonthlyRevenue)}</strong>
          </article>
          <article>
            <p>시뮬레이션 MRR</p>
            <strong aria-label={`시뮬레이션 MRR ${formatWon(scenarioRevenue.scenarioMRR)}`}>{formatWon(scenarioRevenue.scenarioMRR)}</strong>
            <span className="small-note">
              <span aria-label={`MRR 증감 금액 ${formatWon(scenarioRevenue.upliftFromCurrent)}`}>+{formatWon(scenarioRevenue.upliftFromCurrent)}</span>
            </span>
          </article>
          <article>
            <p>연 매출 환산</p>
            <strong aria-label={`연 환산 매출 ${formatWon(scenarioRevenue.scenarioAnnualMRR)}`}>
              {formatWon(scenarioRevenue.scenarioAnnualMRR)}
            </strong>
          </article>
          <article>
            <p>청구 기반 월 기여</p>
            <strong aria-label={`청구 기반 월 기여 ${formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}`}>
              {formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}
            </strong>
            <span className="small-note">승인율 {formatRate(scenarioRevenue.conversionRate)} 적용치</span>
          </article>
          <article>
            <p>목표 달성률</p>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: `${scenarioRevenue.goalRate}%` }} />
            </div>
            <strong aria-label={`목표 달성률 ${scenarioRevenue.goalRate}%`}>{scenarioRevenue.goalRate}%</strong>
          </article>
          <article>
            <p>목표 차이</p>
            <strong aria-label={`목표 차이 ${formatWon(scenarioRevenue.goalGap)}`}>{formatWon(scenarioRevenue.goalGap)}</strong>
            <span className="small-note">목표값 5,000,000원 기준</span>
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

      <section className="panel glass panel-admin panel-summary">
        <div className="panel-head">
          <span className="panel-chip">5</span>
          <h2>매출 포트폴리오</h2>
        </div>
        <div className="growth-summary">
          <p>
            <span aria-label={`현재 기준 월 매출 ${formatWon(kpiMonthlyRevenue)}, 연 매출 환산 ${formatWon(planPotentialAnnual)}`}>
              현재 기준 월 매출 {formatWon(kpiMonthlyRevenue)}, 연 매출 환산 {formatWon(planPotentialAnnual)}.
            </span>
          </p>
          <p className="subtle">
            가정: 승인 청구액의 2%가 유입 전환에 기여, 업셀링 강화를 통해 연간 실적 개선 여력을 계산했습니다.
          </p>
          <p className="small-note">
            핵심 수익 레버리지: (1) 상위 플랜 비중 상향(Starter → Pro), (2) 전체 단가 조정 4~10%,
            (3) 승인율 추적 자동 알림을 통한 회수 주기 단축
          </p>
        </div>
      </section>
    </div>
  );

  return (
    <main className="page">
      <header className="hero glass">
        <p className="kicker">가족 돌봄 운영 플랫폼</p>
        <h1>운영·정산·보험청구 + 수익화 운영 인텔리전스</h1>
        <p>
          보호자 중심의 가정관리 운영은 기록/정산/보험청구부터 시작해, 수익화 설계와 어드민 수익 엔진까지 한 화면에서 최적화합니다.
        </p>

        <div className="hero-metrics">
          <article>
            <p>총 매출 가정치</p>
            <strong aria-label={`총 매출 가정치 ${formatWon(scenarioRevenue.expectedMonthlyAfterConversion + scenarioRevenue.scenarioAnnualMRR / 12)}`}>
              {formatWon(scenarioRevenue.expectedMonthlyAfterConversion + scenarioRevenue.scenarioAnnualMRR / 12)}
            </strong>
          </article>
          <article>
            <p>가상 업셀링 적용</p>
            <strong aria-label={`가상 업셀링 적용, Starter ${scenarioRevenue.scenarioStarterCount}명, Pro ${scenarioRevenue.scenarioProCount}명, Enterprise ${scenarioRevenue.scenarioEnterpriseCount}명`}>
              Starter {scenarioRevenue.scenarioStarterCount} / Pro {scenarioRevenue.scenarioProCount} / Enterprise {scenarioRevenue.scenarioEnterpriseCount}
            </strong>
          </article>
          <article>
            <p>현재 승인 전환</p>
            <strong aria-label={`현재 승인 전환 ${formatRate(scenarioRevenue.conversionRate)}`}>{formatRate(scenarioRevenue.conversionRate)}</strong>
          </article>
        </div>

        <div className="tab-bar" role="tablist" aria-label="페이지 모드 전환">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'operations'}
            className={`tab ${activeView === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveView('operations')}
          >
            운영 페이지
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'admin'}
            className={`tab ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveView('admin')}
          >
            어드민 페이지
          </button>
        </div>

        <button className="reload" onClick={() => void load()} disabled={loading}>
          {loading ? '새로고침 중...' : '최신 데이터 새로고침'}
        </button>
      </header>

      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      {activeView === 'operations' ? operationsTab() : adminTab()}
    </main>
  );
}

export { App };
