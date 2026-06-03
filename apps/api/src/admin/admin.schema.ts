import { z } from 'zod';

import type { RevenuePlanDraft } from './admin.model';

const NAME_MESSAGE = '요금제 이름은 필수입니다.';
const MONTHLY_PRICE_MESSAGE = '월 요금은 0보다 커야 합니다.';
const DISCOUNT_RATE_MESSAGE = '연 할인율은 0~0.95 범위여야 합니다.';
const ACTIVE_CLIENTS_MESSAGE = '활성 고객 수는 0 이상의 정수여야 합니다.';

// 기존 upsertPlan 검증과 동일(요금제 존재 여부 확인은 서비스에서 먼저 수행):
// - name: trim 후 비어 있으면 안 됨
// - monthlyPrice: 유한수 & 0 초과
// - annualDiscountRate: 유한수 & 0~0.95
// - activeClients: 0 이상의 정수
// id/description/featureFlags는 기존과 동일하게 검증 없이 통과시킨다.
export const revenuePlanDraftSchema = z.object({
  id: z.enum(['starter', 'pro', 'enterprise']),
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
}) satisfies z.ZodType<RevenuePlanDraft>;
