import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { careLogTypes, claimStatuses } from '@family-care/shared'

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
} from '../api'
import type {
  AdminOverview,
  CareLog,
  CareLogDraft,
  Claim,
  ClaimDraft,
  ClaimStatus,
  AdminMonthlyTrend,
  RevenuePlan,
  RevenuePlanDraft,
  Settlement,
  SettlementDraft,
} from '../types'
import {
  TREND_SOURCE_FALLBACK,
  TREND_SOURCE_SERVER,
  calculateTrendDelta,
  formatWon,
  formatRate,
  localYmd,
  trendDirectionLabel,
  type TrendDeltaDirection,
} from '../utils'

const PLAN_TARGET_MONTHLY = 5_000_000

// 도메인 enum 리터럴(careLogTypes/claimStatuses)은 @family-care/shared가 단일 소스다.
// 인라인 청구 상태 변경(목록 행)에서 쓰는 옵션. 폼 enum도 동일 소스를 재사용한다.
export const claimStatusOptions = claimStatuses

export type AdminMonthlyTrendWithDelta = AdminMonthlyTrend & {
  settlementDelta: number
  settlementDeltaRate: number
  settlementDeltaDirection: TrendDeltaDirection
  claimCountDelta: number
  claimCountDeltaRate: number
  claimCountDeltaDirection: TrendDeltaDirection
  approvalRateDelta: number
  approvalRateDeltaRate: number
  approvalRateDeltaDirection: TrendDeltaDirection
  hasPreviousMonth: boolean
}

export type ScenarioRevenue = {
  scenarioMRR: number
  scenarioAnnualMRR: number
  scenarioStarterCount: number
  scenarioProCount: number
  scenarioEnterpriseCount: number
  conversionRate: number
  claimImpact: number
  expectedMonthlyAfterConversion: number
  goalGap: number
  goalRate: number
  upliftFromCurrent: number
}

type UsePlatformDataResult = {
  loading: boolean
  errorMessage: string
  clearError: () => void

  careLogs: CareLog[]
  settlements: Settlement[]
  claims: Claim[]
  adminOverview: AdminOverview
  plans: RevenuePlan[]
  savingPlanId: string | null
  updatingClaimId: number | null
  isSubmittingCareLog: boolean
  isSubmittingSettlement: boolean
  isSubmittingClaim: boolean

  activeHouseholds: number
  totalSettlement: number
  approvedClaims: number
  pendingClaims: number
  approvalRate: number
  totalClaimExpected: number

  kpiMonthlyRevenue: number
  kpiAnnualRevenue: number
  planPotentialAnnual: number

  monthlyTrendWithDelta: AdminMonthlyTrendWithDelta[]
  trendSourceMeta: {
    sourceLabel: string
    sourceClass: string
    sourceText: string
  }
  isUsingServerTrend: boolean

  priceLiftPercent: number
  upgradePushPercent: number

  scenarioRevenue: ScenarioRevenue
  growthRecommendations: string[]

  submitCareLog: (values: CareLogDraft) => Promise<void>
  submitSettlement: (values: SettlementDraft) => Promise<void>
  submitClaim: (values: ClaimDraft) => Promise<void>

  defaultCareLogValues: CareLogDraft
  defaultSettlementValues: SettlementDraft
  defaultClaimValues: ClaimDraft

  updateClaimStatus: (claimId: number, nextStatus: ClaimStatus) => Promise<void>

  submitPlan: (draft: RevenuePlanDraft) => Promise<void>

  onPriceLiftInput: (event: ChangeEvent<HTMLInputElement>) => void
  onUpgradePushInput: (event: ChangeEvent<HTMLInputElement>) => void

  load: () => Promise<void>
}

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
}

const formatInputDateNow = () => localYmd()

const normalizeErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) {
    return fallback
  }

  if (error.message.includes('401') || error.message.includes('403')) {
    return '권한이 없어 해당 데이터를 열람할 수 없습니다. 관리자 계정인지 확인해 주세요.'
  }

  if (error.message.includes('400')) {
    return '입력 값이 유효하지 않습니다. 입력 내용을 다시 확인해 주세요.'
  }

  if (error.message.includes('409')) {
    return '동시 수정 충돌이 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return 'API 서버와 연결하지 못했습니다. 서버 실행 상태를 확인한 뒤 데이터 동기화를 다시 시도해 주세요.'
  }

  return error.message || fallback
}

const buildMonthKeys = (monthCount = 3): string[] => {
  const now = new Date()
  return Array.from({ length: monthCount }, (_, index) => {
    const cursor = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    return `${cursor.getFullYear()}-${month}`
  })
}

export const createInitialCareLogDraft = (): CareLogDraft => ({
  recipient: '',
  caregiver: '',
  type: careLogTypes[0],
  note: '',
  date: formatInputDateNow(),
})

export const createInitialSettlementDraft = (): SettlementDraft => ({
  recipient: '',
  date: formatInputDateNow(),
  careHours: 1,
  baseRate: 42000,
  note: '',
})

export const createInitialClaimDraft = (): ClaimDraft => ({
  recipient: '',
  claimType: '장기요양보험',
  expectedAmount: 0,
  hospitalName: '',
  issueDate: formatInputDateNow(),
  status: '요청',
  note: '',
})

export const usePlatformData = (): UsePlatformDataResult => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [careLogs, setCareLogs] = useState<CareLog[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [claims, setClaims] = useState<Claim[]>([])

  const [adminOverview, setAdminOverview] = useState<AdminOverview>(initialAdminOverview)
  const [plans, setPlans] = useState<RevenuePlan[]>([])
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)
  const [updatingClaimId, setUpdatingClaimId] = useState<number | null>(null)
  const [isSubmittingCareLog, setIsSubmittingCareLog] = useState(false)
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false)
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false)

  const [priceLiftPercent, setPriceLiftPercent] = useState(4)
  const [upgradePushPercent, setUpgradePushPercent] = useState(8)

  // 폼 기본값은 마운트 시 한 번 계산한다(초기 날짜를 안정적으로 고정 — 기존 draft 초기화와 동일).
  const [defaultCareLogValues] = useState<CareLogDraft>(createInitialCareLogDraft)
  const [defaultSettlementValues] = useState<SettlementDraft>(createInitialSettlementDraft)
  const [defaultClaimValues] = useState<ClaimDraft>(createInitialClaimDraft)

  const activeHouseholds = useMemo(() => {
    const recipients = new Set([
      ...careLogs.map((log) => log.recipient),
      ...settlements.map((settlement) => settlement.recipient),
    ])
    return recipients.size
  }, [careLogs, settlements])

  const totalSettlement = useMemo(() => {
    return settlements.reduce((sum, settlement) => sum + settlement.totalAmount, 0)
  }, [settlements])

  const approvedClaims = useMemo(
    () => claims.filter((item) => item.status === '승인').length,
    [claims],
  )
  const pendingClaims = useMemo(
    () => claims.filter((item) => item.status !== '승인').length,
    [claims],
  )
  const approvalRate = useMemo(
    () => (claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0),
    [approvedClaims, claims],
  )

  const totalClaimExpected = useMemo(
    () => claims.reduce((sum, claim) => sum + claim.expectedAmount, 0),
    [claims],
  )

  const kpiMonthlyRevenue = useMemo(() => {
    return plans.reduce((sum, plan) => sum + plan.monthlyPrice * plan.activeClients, 0)
  }, [plans])
  const kpiAnnualRevenue = kpiMonthlyRevenue * 12

  const planPotentialAnnual = useMemo(() => {
    return plans.reduce((sum, plan) => {
      const annualPrice = plan.monthlyPrice * 12 * (1 - plan.annualDiscountRate)
      return sum + annualPrice * plan.activeClients
    }, 0)
  }, [plans])

  const monthlyTrendFallback: AdminMonthlyTrend[] = useMemo(() => {
    return buildMonthKeys(3).map((month) => {
      const claimsByMonth = claims.filter((claim) => claim.issueDate.startsWith(month))
      const settlementsByMonth = settlements.filter((settlement) =>
        settlement.date.startsWith(month),
      )
      const approvedClaimsByMonth = claimsByMonth.filter((claim) => claim.status === '승인').length
      const claimCount = claimsByMonth.length

      return {
        month,
        settlementTotal: settlementsByMonth.reduce(
          (sum, settlement) => sum + settlement.totalAmount,
          0,
        ),
        claimCount,
        approvedClaimCount: approvedClaimsByMonth,
        approvalRate:
          claimCount > 0 ? Number(((approvedClaimsByMonth / claimCount) * 100).toFixed(1)) : 0,
      }
    })
  }, [claims, settlements])

  const monthlyTrend = useMemo(
    () =>
      adminOverview.monthlyTrendSource === TREND_SOURCE_SERVER &&
      adminOverview.monthlyTrend.length > 0
        ? adminOverview.monthlyTrend
        : monthlyTrendFallback,
    [adminOverview.monthlyTrend, adminOverview.monthlyTrendSource, monthlyTrendFallback],
  )

  const monthlyTrendWithDelta = useMemo<AdminMonthlyTrendWithDelta[]>(() => {
    return monthlyTrend.map((entry, index) => {
      const previous = monthlyTrend[index + 1]
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
        }
      }

      const settlementTrend = calculateTrendDelta(entry.settlementTotal, previous.settlementTotal)
      const claimCountTrend = calculateTrendDelta(entry.claimCount, previous.claimCount)
      const approvalRateTrend = calculateTrendDelta(entry.approvalRate, previous.approvalRate)

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
      }
    })
  }, [monthlyTrend])

  const isUsingServerTrend = useMemo(
    () => adminOverview.monthlyTrendSource === TREND_SOURCE_SERVER,
    [adminOverview.monthlyTrendSource],
  )

  const trendSourceMeta = useMemo(
    () =>
      isUsingServerTrend
        ? {
            sourceLabel: '데이터 출처: 백엔드 월별 집계',
            sourceClass: 'trend-source-server',
            sourceText: '서버 집계 기반',
          }
        : {
            sourceLabel: '데이터 출처: 클라이언트 계산(폴백)',
            sourceClass: 'trend-source-fallback',
            sourceText: '클라이언트 폴백',
          },
    [isUsingServerTrend],
  )

  const scenarioRevenue = useMemo<ScenarioRevenue>(() => {
    const starter = plans.find((plan) => plan.id === 'starter')
    const pro = plans.find((plan) => plan.id === 'pro')
    const enterprise = plans.find((plan) => plan.id === 'enterprise')

    const starterCount = starter?.activeClients ?? 0
    const proCount = pro?.activeClients ?? 0
    const enterpriseCount = enterprise?.activeClients ?? 0

    const starterPrice = (starter?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100)
    const proPrice = (pro?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100)
    const enterprisePrice = (enterprise?.monthlyPrice ?? 0) * (1 + priceLiftPercent / 100)

    const starterToPro = Math.floor(starterCount * (upgradePushPercent / 100))
    const proToEnterprise = Math.floor(proCount * (upgradePushPercent / 200))

    const newStarterCount = Math.max(starterCount - starterToPro, 0)
    const newProCount = Math.max(proCount + starterToPro - proToEnterprise, 0)
    const newEnterpriseCount = enterpriseCount + proToEnterprise

    const scenarioMRR = Math.round(
      newStarterCount * starterPrice +
        newProCount * proPrice +
        newEnterpriseCount * enterprisePrice,
    )
    const scenarioAnnualMRR = scenarioMRR * 12
    const conversionEffect = claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0
    const claimImpact = (totalClaimExpected * conversionEffect) / 100

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
    }
  }, [
    plans,
    priceLiftPercent,
    upgradePushPercent,
    approvedClaims,
    claims.length,
    totalClaimExpected,
    kpiMonthlyRevenue,
  ])

  const growthRecommendations = useMemo(() => {
    const recommendations: string[] = []

    if (priceLiftPercent < 10) {
      recommendations.push('요금 변경은 +4~8%처럼 작은 폭부터 적용해 반응을 확인하세요.')
    }
    if (upgradePushPercent < 12) {
      recommendations.push(
        'Starter 이용 가구에 Pro 안내를 추가해 상위 요금제 변경 기회를 만드세요.',
      )
    }
    if (scenarioRevenue.conversionRate < 70) {
      recommendations.push('요청 또는 검토 중인 청구는 48시간 안에 상태를 확인하세요.')
    }
    if (scenarioRevenue.goalRate < 80) {
      recommendations.push(
        '월 목표보다 낮습니다. 이용 가구를 늘리거나 상위 요금제 안내를 강화하세요.',
      )
    }
    if (recommendations.length === 0) {
      recommendations.push(
        '현재 상태는 양호합니다. 할인 정책/프로모션 운영을 병행해 개선 여지를 넓혀 보세요.',
      )
    }

    return recommendations
  }, [
    priceLiftPercent,
    upgradePushPercent,
    scenarioRevenue.conversionRate,
    scenarioRevenue.goalRate,
  ])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setErrorMessage('')
      const [logsResult, settlementsResult, claimsResult, overviewResult, plansResult] =
        await Promise.all([
          fetchCareLogs(),
          fetchSettlements(),
          fetchClaims(),
          fetchAdminOverview(),
          fetchAdminPlans(),
        ])

      setCareLogs(logsResult)
      setSettlements(settlementsResult)
      setClaims(claimsResult)
      setAdminOverview(overviewResult)
      setPlans(plansResult)
    } catch (error) {
      const message = normalizeErrorMessage(
        error,
        '데이터를 불러오지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.',
      )
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // 검증은 폼(zodResolver)에서 끝난 뒤 검증된 값을 받는다. 여기서는 제출 부수효과만 처리한다.
  const submitCareLog = useCallback(
    async (values: CareLogDraft) => {
      if (isSubmittingCareLog) {
        return
      }

      try {
        setIsSubmittingCareLog(true)
        setErrorMessage('')
        const next = await postCareLog(values)
        setCareLogs((prev) => [next, ...prev])
        await load()
      } catch (error) {
        setErrorMessage(
          normalizeErrorMessage(
            error,
            '돌봄 기록 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          ),
        )
      } finally {
        setIsSubmittingCareLog(false)
      }
    },
    [load, isSubmittingCareLog],
  )

  const submitSettlement = useCallback(
    async (values: SettlementDraft) => {
      if (isSubmittingSettlement) {
        return
      }

      try {
        setIsSubmittingSettlement(true)
        setErrorMessage('')
        const next = await postSettlement(values)
        setSettlements((prev) => [next, ...prev])
        await load()
      } catch (error) {
        setErrorMessage(
          normalizeErrorMessage(error, '정산 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
        )
      } finally {
        setIsSubmittingSettlement(false)
      }
    },
    [load, isSubmittingSettlement],
  )

  const submitClaim = useCallback(
    async (values: ClaimDraft) => {
      if (isSubmittingClaim) {
        return
      }

      try {
        setIsSubmittingClaim(true)
        setErrorMessage('')
        const next = await postClaim(values)
        setClaims((prev) => [next, ...prev])
        await load()
      } catch (error) {
        setErrorMessage(
          normalizeErrorMessage(error, '보험청구 등록 실패. 잠시 후 다시 시도해 주세요.'),
        )
      } finally {
        setIsSubmittingClaim(false)
      }
    },
    [load, isSubmittingClaim],
  )

  const submitPlan = useCallback(async (draft: RevenuePlanDraft) => {
    try {
      setSavingPlanId(draft.id)
      const next = await updateAdminPlan(draft)
      setPlans((prev) => prev.map((plan) => (plan.id === next.id ? next : plan)))
    } catch (error) {
      setErrorMessage(
        normalizeErrorMessage(error, '요금제 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      )
    } finally {
      setSavingPlanId(null)
    }
  }, [])

  const updateClaimStatus = useCallback(
    async (claimId: number, nextStatus: ClaimStatus) => {
      const current = claims.find((item) => item.id === claimId)?.status
      if (!current || current === nextStatus) {
        return
      }

      try {
        setUpdatingClaimId(claimId)
        const updated = await patchClaimStatus(claimId, nextStatus)
        setClaims((prev) => prev.map((claim) => (claim.id === updated.id ? updated : claim)))
      } catch (error) {
        setErrorMessage(
          normalizeErrorMessage(error, '보험청구 상태 변경 실패. 잠시 후 다시 시도해 주세요.'),
        )
      } finally {
        setUpdatingClaimId(null)
      }
    },
    [claims],
  )

  const onPriceLiftInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPriceLiftPercent(Number(event.target.value))
  }, [])

  const onUpgradePushInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUpgradePushPercent(Number(event.target.value))
  }, [])

  const clearError = useCallback(() => {
    setErrorMessage('')
  }, [])

  return {
    loading,
    errorMessage,
    clearError,

    careLogs,
    settlements,
    claims,
    adminOverview,
    plans,
    savingPlanId,
    updatingClaimId,
    isSubmittingCareLog,
    isSubmittingSettlement,
    isSubmittingClaim,

    activeHouseholds,
    totalSettlement,
    approvedClaims,
    pendingClaims,
    approvalRate,
    totalClaimExpected,

    kpiMonthlyRevenue,
    kpiAnnualRevenue,
    planPotentialAnnual,
    monthlyTrendWithDelta,
    trendSourceMeta,
    isUsingServerTrend,

    priceLiftPercent,
    upgradePushPercent,

    scenarioRevenue,
    growthRecommendations,

    submitCareLog,
    submitSettlement,
    submitClaim,

    defaultCareLogValues,
    defaultSettlementValues,
    defaultClaimValues,

    updateClaimStatus,

    submitPlan,

    onPriceLiftInput,
    onUpgradePushInput,

    load,
  }
}

export type PlatformData = UsePlatformDataResult
export type UsePlatformData = UsePlatformDataResult

export const dataForUiDisplay = {
  labels: {
    claimStatusLabel: (status: ClaimStatus) => status,
  },
  formatWon,
  formatRate,
  trendDirectionLabel,
}
