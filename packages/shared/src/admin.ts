import { z } from 'zod'

// 어드민/요금제 도메인 계약 — web/api가 동일하게 쓰는 타입과 요금제 편집 스키마.
// 요금제 편집 스키마는 양쪽 검증 규칙(필드·메시지·범위)이 완전히 동일하므로 공유한다.

export const revenuePlanIds = ['starter', 'pro', 'enterprise'] as const

export type RevenuePlanId = (typeof revenuePlanIds)[number]

export type RevenuePlan = {
  id: RevenuePlanId
  name: string
  monthlyPrice: number
  annualDiscountRate: number
  activeClients: number
  description: string
  featureFlags: string[]
}

// 요금제 편집 초안(id 포함, featureFlags 배열). web/api 동일.
export type RevenuePlanDraft = Omit<RevenuePlan, 'featureFlags'> & {
  featureFlags: string[]
}

const NAME_MESSAGE = '요금제 이름은 필수입니다.'
const MONTHLY_PRICE_MESSAGE = '월 요금은 0보다 커야 합니다.'
const DISCOUNT_RATE_MESSAGE = '연 할인율은 0~0.95 범위여야 합니다.'
const ACTIVE_CLIENTS_MESSAGE = '활성 고객 수는 0 이상의 정수여야 합니다.'

// 요금제 편집/upsert 검증(양쪽 동일):
// - name: trim 후 비어 있으면 안 됨
// - monthlyPrice: 유한수 & 0 초과
// - annualDiscountRate: 유한수 & 0~0.95
// - activeClients: 0 이상의 정수
// id/description/featureFlags는 검증 없이 통과시킨다.
export const revenuePlanDraftSchema = z.object({
  id: z.enum(revenuePlanIds),
  name: z
    .string({ error: NAME_MESSAGE })
    .refine((value) => value.trim().length > 0, { message: NAME_MESSAGE }),
  monthlyPrice: z
    .number({ error: MONTHLY_PRICE_MESSAGE })
    .finite(MONTHLY_PRICE_MESSAGE)
    .positive({ message: MONTHLY_PRICE_MESSAGE }),
  annualDiscountRate: z
    .number({ error: DISCOUNT_RATE_MESSAGE })
    .finite(DISCOUNT_RATE_MESSAGE)
    .min(0, DISCOUNT_RATE_MESSAGE)
    .max(0.95, DISCOUNT_RATE_MESSAGE),
  activeClients: z
    .number({ error: ACTIVE_CLIENTS_MESSAGE })
    .int(ACTIVE_CLIENTS_MESSAGE)
    .min(0, ACTIVE_CLIENTS_MESSAGE),
  description: z.string(),
  featureFlags: z.array(z.string()),
}) satisfies z.ZodType<RevenuePlanDraft>

export type RevenuePlanFormValues = z.infer<typeof revenuePlanDraftSchema>

export type AdminMonthlyTrendDataSource = 'server' | 'client-fallback'

export type AdminMonthlyTrend = {
  month: string
  settlementTotal: number
  claimCount: number
  approvedClaimCount: number
  approvalRate: number
}

export type AdminOverview = {
  activeHouseholds: number
  thisMonthSettlement: number
  approvedClaims: number
  totalClaims: number
  averageSettlement: number
  monthlyRecurringRevenue: number
  conversionRate: number
  planTakeRate: number
  monthlyTrend: AdminMonthlyTrend[]
  monthlyTrendSource: AdminMonthlyTrendDataSource
}
