import { z } from "zod";

// 프론트엔드 요금제 편집 폼 스키마.
// API의 admin.schema.ts(revenuePlanDraftSchema)와 동일한 검증 규칙을 옮겨온 것:
// - name: trim 후 비어 있으면 안 됨
// - monthlyPrice: 유한수 & 0 초과
// - annualDiscountRate: 유한수 & 0~0.95
// - activeClients: 0 이상의 정수
// id/description/featureFlags는 기존과 동일하게 검증 없이 통과시킨다.
const NAME_MESSAGE = "요금제 이름은 필수입니다.";
const MONTHLY_PRICE_MESSAGE = "월 요금은 0보다 커야 합니다.";
const DISCOUNT_RATE_MESSAGE = "연 할인율은 0~0.95 범위여야 합니다.";
const ACTIVE_CLIENTS_MESSAGE = "활성 고객 수는 0 이상의 정수여야 합니다.";

export const revenuePlanFormSchema = z.object({
  id: z.enum(["starter", "pro", "enterprise"]),
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
});

export type RevenuePlanFormValues = z.infer<typeof revenuePlanFormSchema>;
