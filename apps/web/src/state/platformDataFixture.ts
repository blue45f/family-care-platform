// 테스트용 PlatformData 픽스처 빌더. usePlatformData를 실제로 실행하지 않고
// 페이지 컴포넌트를 SSR 렌더(renderToStaticMarkup)할 때 쓸 최소 형태를 제공한다.
// 프로덕션 번들에는 포함되지 않는다(spec에서만 import).

import {
  createInitialCareLogDraft,
  createInitialClaimDraft,
  createInitialScheduleDraft,
  createInitialSettlementDraft,
  type PlatformData,
} from './usePlatformData'

import type { AdminOverview } from '../types'

const noop = () => undefined
const asyncNoop = async () => undefined

const adminOverview: AdminOverview = {
  activeHouseholds: 0,
  thisMonthSettlement: 0,
  approvedClaims: 0,
  totalClaims: 0,
  averageSettlement: 0,
  monthlyRecurringRevenue: 0,
  conversionRate: 0,
  planTakeRate: 0,
  monthlyTrend: [],
  monthlyTrendSource: 'client-fallback',
}

/** 기본값은 빈/0 상태. overrides로 필요한 필드만 덮어쓴다. */
export const buildPlatformDataFixture = (overrides: Partial<PlatformData> = {}): PlatformData => ({
  loading: false,
  errorMessage: '',
  clearError: noop,

  careLogs: [],
  schedules: [],
  settlements: [],
  claims: [],
  adminOverview,
  plans: [],
  savingPlanId: null,
  updatingScheduleId: null,
  updatingClaimId: null,
  isSubmittingSchedule: false,
  isSubmittingCareLog: false,
  isSubmittingSettlement: false,
  isSubmittingClaim: false,

  activeHouseholds: 0,
  todaySchedules: 0,
  pendingSchedules: 0,
  totalSettlement: 0,
  approvedClaims: 0,
  pendingClaims: 0,
  approvalRate: 0,
  totalClaimExpected: 0,

  kpiMonthlyRevenue: 0,
  kpiAnnualRevenue: 0,
  planPotentialAnnual: 0,

  monthlyTrendWithDelta: [],
  trendSourceMeta: { sourceLabel: '', sourceClass: '', sourceText: '' },
  isUsingServerTrend: false,

  priceLiftPercent: 0,
  upgradePushPercent: 0,

  scenarioRevenue: {
    scenarioMRR: 0,
    scenarioAnnualMRR: 0,
    scenarioStarterCount: 0,
    scenarioProCount: 0,
    scenarioEnterpriseCount: 0,
    conversionRate: 0,
    claimImpact: 0,
    expectedMonthlyAfterConversion: 0,
    goalGap: 0,
    goalRate: 0,
    upliftFromCurrent: 0,
  },
  growthRecommendations: [],

  submitSchedule: asyncNoop,
  submitCareLog: asyncNoop,
  submitSettlement: asyncNoop,
  submitClaim: asyncNoop,

  defaultScheduleValues: createInitialScheduleDraft(),
  defaultCareLogValues: createInitialCareLogDraft(),
  defaultSettlementValues: createInitialSettlementDraft(),
  defaultClaimValues: createInitialClaimDraft(),

  updateScheduleStatus: asyncNoop,
  updateClaimStatus: asyncNoop,

  submitPlan: asyncNoop,

  onPriceLiftInput: noop,
  onUpgradePushInput: noop,

  load: asyncNoop,
  ...overrides,
})
