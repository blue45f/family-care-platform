import { careLogTypes, claimStatuses, scheduleStatuses } from '@family-care/shared'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { type ChangeEvent, useCallback, useMemo, useState } from 'react'

import { platformQueryKeys } from '../app/queryKeys'
import {
  fetchAdminOverview,
  fetchAdminPlans,
  fetchCareLogs,
  fetchClaims,
  fetchSchedules,
  fetchSettlements,
  patchClaimStatus,
  patchScheduleStatus,
  postCareLog,
  postClaim,
  postSchedule,
  postSettlement,
  updateAdminPlan,
} from '../infrastructure/api'
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

import type {
  AdminOverview,
  CareLog,
  CareLogDraft,
  CareSchedule,
  CareScheduleDraft,
  Claim,
  ClaimDraft,
  ClaimStatus,
  AdminMonthlyTrend,
  RevenuePlan,
  RevenuePlanDraft,
  ScheduleStatus,
  Settlement,
  SettlementDraft,
} from '../types'

const PLAN_TARGET_MONTHLY = 5_000_000

// 도메인 enum 리터럴(careLogTypes/claimStatuses)은 @family-care/shared가 단일 소스다.
// 인라인 청구 상태 변경(목록 행)에서 쓰는 옵션. 폼 enum도 동일 소스를 재사용한다.
export const claimStatusOptions = claimStatuses
export const scheduleStatusOptions = scheduleStatuses

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
  schedules: CareSchedule[]
  settlements: Settlement[]
  claims: Claim[]
  adminOverview: AdminOverview
  plans: RevenuePlan[]
  savingPlanId: string | null
  updatingScheduleId: number | null
  updatingClaimId: number | null
  isSubmittingSchedule: boolean
  isSubmittingCareLog: boolean
  isSubmittingSettlement: boolean
  isSubmittingClaim: boolean

  activeHouseholds: number
  todaySchedules: number
  pendingSchedules: number
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

  submitSchedule: (values: CareScheduleDraft) => Promise<void>
  submitCareLog: (values: CareLogDraft) => Promise<void>
  submitSettlement: (values: SettlementDraft) => Promise<void>
  submitClaim: (values: ClaimDraft) => Promise<void>

  defaultScheduleValues: CareScheduleDraft
  defaultCareLogValues: CareLogDraft
  defaultSettlementValues: SettlementDraft
  defaultClaimValues: ClaimDraft

  updateScheduleStatus: (scheduleId: number, nextStatus: ScheduleStatus) => Promise<void>
  updateClaimStatus: (claimId: number, nextStatus: ClaimStatus) => Promise<void>

  submitPlan: (draft: RevenuePlanDraft) => Promise<void>

  onPriceLiftInput: (event: ChangeEvent<HTMLInputElement>) => void
  onUpgradePushInput: (event: ChangeEvent<HTMLInputElement>) => void

  load: () => Promise<void>
}

// usePlatformData가 구독하는 6개 운영 리드 키. 수동 새로고침/제출 후 재동기화에서
// 이 키들만 정확히 무효화한다(community/support 등 다른 도메인 캐시는 건드리지 않음).
const PLATFORM_READ_KEYS = [
  platformQueryKeys.schedules,
  platformQueryKeys.careLogs,
  platformQueryKeys.settlements,
  platformQueryKeys.claims,
  platformQueryKeys.adminOverview,
  platformQueryKeys.adminPlans,
]

// 안정적인 빈 배열 참조(기존 useState([])의 참조 안정성 보존 — 다운스트림 useMemo가
// 매 렌더 새 배열로 churn 하지 않도록 한다).
const EMPTY_SCHEDULES: CareSchedule[] = []
const EMPTY_CARE_LOGS: CareLog[] = []
const EMPTY_SETTLEMENTS: Settlement[] = []
const EMPTY_CLAIMS: Claim[] = []
const EMPTY_PLANS: RevenuePlan[] = []

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

export const createInitialScheduleDraft = (): CareScheduleDraft => ({
  recipient: '',
  caregiver: '',
  date: formatInputDateNow(),
  startTime: '09:00',
  endTime: '10:00',
  status: '예정',
  note: '',
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
  const client = useQueryClient()

  // 6개 서버 리드를 react-query로 병렬 구독한다. 기존 동작 보존:
  // - 마운트 시 1회 병렬 fetch(staleTime/refetchOnWindowFocus 기본값은 queryClient에서
  //   기존 "1회 fetch + 수동 새로고침" 의미에 맞게 설정되어 있다).
  // - loading: 초기 fetch + 수동 load() + 제출 후 재동기화 동안 모두 true(기존 setLoading 의미).
  // - errorMessage: 어느 쿼리든 첫 실패를 기존 메시지 계약으로 정규화. 성공 refetch 시 자동 해소.
  const reads = useQueries({
    queries: [
      { queryKey: platformQueryKeys.schedules, queryFn: fetchSchedules },
      { queryKey: platformQueryKeys.careLogs, queryFn: fetchCareLogs },
      { queryKey: platformQueryKeys.settlements, queryFn: fetchSettlements },
      { queryKey: platformQueryKeys.claims, queryFn: fetchClaims },
      { queryKey: platformQueryKeys.adminOverview, queryFn: fetchAdminOverview },
      { queryKey: platformQueryKeys.adminPlans, queryFn: fetchAdminPlans },
    ],
    combine: (results) => {
      const [
        schedulesResult,
        careLogsResult,
        settlementsResult,
        claimsResult,
        overviewResult,
        plansResult,
      ] = results
      return {
        schedules: schedulesResult.data ?? EMPTY_SCHEDULES,
        careLogs: careLogsResult.data ?? EMPTY_CARE_LOGS,
        settlements: settlementsResult.data ?? EMPTY_SETTLEMENTS,
        claims: claimsResult.data ?? EMPTY_CLAIMS,
        adminOverview: overviewResult.data ?? initialAdminOverview,
        plans: plansResult.data ?? EMPTY_PLANS,
        // 초기 fetch + 수동 refetch 모두 포함(기존 load()의 setLoading(true) 의미와 동일).
        isFetching: results.some((result) => result.isFetching),
        // 첫 실패 쿼리의 에러(없으면 null). 성공 refetch 시 react-query가 자동으로 비운다.
        queryError: results.find((result) => result.error)?.error ?? null,
      }
    },
  })

  const { schedules, careLogs, settlements, claims, adminOverview, plans } = reads
  const loading = reads.isFetching

  // 뮤테이션(제출/상태변경/요금제)에서 표시할 에러. 읽기 쿼리 에러와 합쳐 노출하며,
  // clearError로 닫을 수 있다(기존 setErrorMessage('') 의미 보존). 닫은 뒤 다음 fetch
  // 사이클에서 쿼리 에러가 재발하면 다시 표시된다.
  const [mutationError, setMutationError] = useState('')
  // 사용자가 닫은(clearError) 쿼리 에러 메시지를 기억한다. 동일 메시지면 배너를 숨기고,
  // 다른/새 쿼리 에러가 발생하면(문자열이 달라지므로) 다시 표시된다. effect 없이 렌더에서
  // 파생 — react-hooks/set-state-in-effect 규칙(effect 내 setState 금지)을 피한다.
  const [dismissedQueryError, setDismissedQueryError] = useState('')

  const normalizedQueryError = useMemo(
    () =>
      reads.queryError
        ? normalizeErrorMessage(
            reads.queryError,
            '데이터를 불러오지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.'
          )
        : '',
    [reads.queryError]
  )

  const visibleQueryError =
    normalizedQueryError && normalizedQueryError !== dismissedQueryError ? normalizedQueryError : ''
  const errorMessage = mutationError || visibleQueryError

  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)
  const [updatingScheduleId, setUpdatingScheduleId] = useState<number | null>(null)
  const [updatingClaimId, setUpdatingClaimId] = useState<number | null>(null)

  const [priceLiftPercent, setPriceLiftPercent] = useState(4)
  const [upgradePushPercent, setUpgradePushPercent] = useState(8)

  // 폼 기본값은 마운트 시 한 번 계산한다(초기 날짜를 안정적으로 고정 — 기존 draft 초기화와 동일).
  const [defaultScheduleValues] = useState<CareScheduleDraft>(createInitialScheduleDraft)
  const [defaultCareLogValues] = useState<CareLogDraft>(createInitialCareLogDraft)
  const [defaultSettlementValues] = useState<SettlementDraft>(createInitialSettlementDraft)
  const [defaultClaimValues] = useState<ClaimDraft>(createInitialClaimDraft)

  const activeHouseholds = useMemo(() => {
    const recipients = new Set([
      ...schedules.map((schedule) => schedule.recipient),
      ...careLogs.map((log) => log.recipient),
      ...settlements.map((settlement) => settlement.recipient),
    ])
    return recipients.size
  }, [careLogs, schedules, settlements])

  const todaySchedules = useMemo(() => {
    const today = localYmd()
    return schedules.filter((schedule) => schedule.date === today && schedule.status !== '취소')
      .length
  }, [schedules])

  const pendingSchedules = useMemo(
    () =>
      schedules.filter((schedule) => schedule.status === '예정' || schedule.status === '진행중')
        .length,
    [schedules]
  )

  const totalSettlement = useMemo(() => {
    return settlements.reduce((sum, settlement) => sum + settlement.totalAmount, 0)
  }, [settlements])

  const approvedClaims = useMemo(
    () => claims.filter((item) => item.status === '승인').length,
    [claims]
  )
  const pendingClaims = useMemo(
    () => claims.filter((item) => item.status !== '승인').length,
    [claims]
  )
  const approvalRate = useMemo(
    () => (claims.length > 0 ? (approvedClaims / claims.length) * 100 : 0),
    [approvedClaims, claims]
  )

  const totalClaimExpected = useMemo(
    () => claims.reduce((sum, claim) => sum + claim.expectedAmount, 0),
    [claims]
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
        settlement.date.startsWith(month)
      )
      const approvedClaimsByMonth = claimsByMonth.filter((claim) => claim.status === '승인').length
      const claimCount = claimsByMonth.length

      return {
        month,
        settlementTotal: settlementsByMonth.reduce(
          (sum, settlement) => sum + settlement.totalAmount,
          0
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
    [adminOverview.monthlyTrend, adminOverview.monthlyTrendSource, monthlyTrendFallback]
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
    [adminOverview.monthlyTrendSource]
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
    [isUsingServerTrend]
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
      newStarterCount * starterPrice + newProCount * proPrice + newEnterpriseCount * enterprisePrice
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
        'Starter 이용 가구에 Pro 안내를 추가해 상위 요금제 변경 기회를 만드세요.'
      )
    }
    if (scenarioRevenue.conversionRate < 70) {
      recommendations.push('요청 또는 검토 중인 청구는 48시간 안에 상태를 확인하세요.')
    }
    if (scenarioRevenue.goalRate < 80) {
      recommendations.push(
        '월 목표보다 낮습니다. 이용 가구를 늘리거나 상위 요금제 안내를 강화하세요.'
      )
    }
    if (recommendations.length === 0) {
      recommendations.push(
        '현재 상태는 양호합니다. 할인 정책/프로모션 운영을 병행해 개선 여지를 넓혀 보세요.'
      )
    }

    return recommendations
  }, [
    priceLiftPercent,
    upgradePushPercent,
    scenarioRevenue.conversionRate,
    scenarioRevenue.goalRate,
  ])

  // 6개 운영 데이터 쿼리 전체를 무효화해 재요청한다(기존 refreshData/Promise.all 재페치 대체).
  const refetchAll = useCallback(
    () =>
      client.invalidateQueries({
        predicate: (query) =>
          PLATFORM_READ_KEYS.some((key) => JSON.stringify(query.queryKey) === JSON.stringify(key)),
      }),
    [client]
  )

  // 수동 새로고침. 제출 뮤테이션도 성공 후 이 경로로 재동기화한다(기존 await load()와 동일).
  const load = useCallback(async () => {
    setMutationError('')
    await refetchAll()
  }, [refetchAll])

  // 제출 뮤테이션. 검증은 폼(zodResolver)에서 끝난 뒤 검증된 값을 받는다.
  // 기존 동작 보존: 성공 시 캐시에 낙관적으로 prepend → load()로 서버 재동기화.
  // 실패 시 정규화된 에러 메시지. 재진입 가드는 isPending으로 대체한다.
  const submitScheduleMutation = useMutation({
    mutationFn: postSchedule,
    onSuccess: (next) => {
      client.setQueryData<CareSchedule[]>(platformQueryKeys.schedules, (prev) => [
        next,
        ...(prev ?? []),
      ])
    },
  })
  const submitCareLogMutation = useMutation({
    mutationFn: postCareLog,
    onSuccess: (next) => {
      client.setQueryData<CareLog[]>(platformQueryKeys.careLogs, (prev) => [next, ...(prev ?? [])])
    },
  })
  const submitSettlementMutation = useMutation({
    mutationFn: postSettlement,
    onSuccess: (next) => {
      client.setQueryData<Settlement[]>(platformQueryKeys.settlements, (prev) => [
        next,
        ...(prev ?? []),
      ])
    },
  })
  const submitClaimMutation = useMutation({
    mutationFn: postClaim,
    onSuccess: (next) => {
      client.setQueryData<Claim[]>(platformQueryKeys.claims, (prev) => [next, ...(prev ?? [])])
    },
  })

  const isSubmittingSchedule = submitScheduleMutation.isPending
  const isSubmittingCareLog = submitCareLogMutation.isPending
  const isSubmittingSettlement = submitSettlementMutation.isPending
  const isSubmittingClaim = submitClaimMutation.isPending

  const submitSchedule = useCallback(
    async (values: CareScheduleDraft) => {
      if (submitScheduleMutation.isPending) {
        return
      }
      setMutationError('')
      try {
        await submitScheduleMutation.mutateAsync(values)
        await load()
      } catch (error) {
        setMutationError(
          normalizeErrorMessage(error, '방문 일정 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        )
      }
    },
    [submitScheduleMutation, load]
  )

  const submitCareLog = useCallback(
    async (values: CareLogDraft) => {
      if (submitCareLogMutation.isPending) {
        return
      }
      setMutationError('')
      try {
        await submitCareLogMutation.mutateAsync(values)
        await load()
      } catch (error) {
        setMutationError(
          normalizeErrorMessage(error, '돌봄 기록 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        )
      }
    },
    [submitCareLogMutation, load]
  )

  const submitSettlement = useCallback(
    async (values: SettlementDraft) => {
      if (submitSettlementMutation.isPending) {
        return
      }
      setMutationError('')
      try {
        await submitSettlementMutation.mutateAsync(values)
        await load()
      } catch (error) {
        setMutationError(
          normalizeErrorMessage(error, '정산 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        )
      }
    },
    [submitSettlementMutation, load]
  )

  const submitClaim = useCallback(
    async (values: ClaimDraft) => {
      if (submitClaimMutation.isPending) {
        return
      }
      setMutationError('')
      try {
        await submitClaimMutation.mutateAsync(values)
        await load()
      } catch (error) {
        setMutationError(
          normalizeErrorMessage(error, '보험청구 등록 실패. 잠시 후 다시 시도해 주세요.')
        )
      }
    },
    [submitClaimMutation, load]
  )

  // 요금제 저장: 성공 시 캐시 내 해당 plan 교체(기존 setPlans map과 동일).
  const submitPlanMutation = useMutation({
    mutationFn: updateAdminPlan,
    onSuccess: (next) => {
      client.setQueryData<RevenuePlan[]>(platformQueryKeys.adminPlans, (prev) =>
        (prev ?? []).map((plan) => (plan.id === next.id ? next : plan))
      )
    },
  })

  const submitPlan = useCallback(
    async (draft: RevenuePlanDraft) => {
      setSavingPlanId(draft.id)
      try {
        await submitPlanMutation.mutateAsync(draft)
      } catch (error) {
        setMutationError(
          normalizeErrorMessage(error, '요금제 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        )
      } finally {
        setSavingPlanId(null)
      }
    },
    [submitPlanMutation]
  )

  // 상태 변경: 낙관적 캐시 업데이트 + 실패 롤백 + 성공 시 서버 확정 엔티티로 교체.
  // 기존 setSchedules/setClaims 패턴을 setQueryData로 1:1 이식한다.
  const updateScheduleStatus = useCallback(
    async (scheduleId: number, nextStatus: ScheduleStatus) => {
      const current = client.getQueryData<CareSchedule[]>(platformQueryKeys.schedules) ?? []
      const snapshot = current.find((item) => item.id === scheduleId)
      if (!snapshot || snapshot.status === nextStatus) {
        return
      }

      setUpdatingScheduleId(scheduleId)
      setMutationError('')
      client.setQueryData<CareSchedule[]>(platformQueryKeys.schedules, (prev) =>
        (prev ?? []).map((schedule) =>
          schedule.id === scheduleId ? { ...schedule, status: nextStatus } : schedule
        )
      )

      try {
        const updated = await patchScheduleStatus(scheduleId, nextStatus)
        client.setQueryData<CareSchedule[]>(platformQueryKeys.schedules, (prev) =>
          (prev ?? []).map((schedule) => (schedule.id === updated.id ? updated : schedule))
        )
      } catch (error) {
        // 실패 롤백: 스냅샷한 이전 행으로 복원한다.
        client.setQueryData<CareSchedule[]>(platformQueryKeys.schedules, (prev) =>
          (prev ?? []).map((schedule) => (schedule.id === scheduleId ? snapshot : schedule))
        )
        setMutationError(
          normalizeErrorMessage(error, '방문 일정 상태 변경 실패. 잠시 후 다시 시도해 주세요.')
        )
      } finally {
        setUpdatingScheduleId(null)
      }
    },
    [client]
  )

  const updateClaimStatus = useCallback(
    async (claimId: number, nextStatus: ClaimStatus) => {
      const current = client.getQueryData<Claim[]>(platformQueryKeys.claims) ?? []
      const snapshot = current.find((item) => item.id === claimId)
      if (!snapshot || snapshot.status === nextStatus) {
        return
      }

      setUpdatingClaimId(claimId)
      setMutationError('')
      client.setQueryData<Claim[]>(platformQueryKeys.claims, (prev) =>
        (prev ?? []).map((claim) =>
          claim.id === claimId ? { ...claim, status: nextStatus } : claim
        )
      )

      try {
        const updated = await patchClaimStatus(claimId, nextStatus)
        client.setQueryData<Claim[]>(platformQueryKeys.claims, (prev) =>
          (prev ?? []).map((claim) => (claim.id === updated.id ? updated : claim))
        )
      } catch (error) {
        // 실패 롤백: 스냅샷한 이전 행으로 복원한다.
        client.setQueryData<Claim[]>(platformQueryKeys.claims, (prev) =>
          (prev ?? []).map((claim) => (claim.id === claimId ? snapshot : claim))
        )
        setMutationError(
          normalizeErrorMessage(error, '보험청구 상태 변경 실패. 잠시 후 다시 시도해 주세요.')
        )
      } finally {
        setUpdatingClaimId(null)
      }
    },
    [client]
  )

  const onPriceLiftInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPriceLiftPercent(Number(event.target.value))
  }, [])

  const onUpgradePushInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUpgradePushPercent(Number(event.target.value))
  }, [])

  const clearError = useCallback(() => {
    // 뮤테이션 에러를 비우고, 현재 표시 중인 쿼리 에러를 닫음으로 기록한다(기존
    // setErrorMessage('') 의미). 같은 에러는 숨겨지고, 새 에러가 나면 다시 표시된다.
    setMutationError('')
    setDismissedQueryError(normalizedQueryError)
  }, [normalizedQueryError])

  return {
    loading,
    errorMessage,
    clearError,

    careLogs,
    schedules,
    settlements,
    claims,
    adminOverview,
    plans,
    savingPlanId,
    updatingScheduleId,
    updatingClaimId,
    isSubmittingSchedule,
    isSubmittingCareLog,
    isSubmittingSettlement,
    isSubmittingClaim,

    activeHouseholds,
    todaySchedules,
    pendingSchedules,
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

    submitSchedule,
    submitCareLog,
    submitSettlement,
    submitClaim,

    defaultScheduleValues,
    defaultCareLogValues,
    defaultSettlementValues,
    defaultClaimValues,

    updateScheduleStatus,
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
