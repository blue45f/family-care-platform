import { z } from "zod";

// 프론트엔드 정산 폼 스키마.
// API의 settlement.schema.ts와 동일한 검증 규칙을 옮겨온 것:
// - recipient: 필수(+trim, 빈 값 금지)
// - careHours / baseRate: 0보다 커야 함(빈 입력은 NaN → positive 실패로 비활성 게이트 유지)
// - note: 선택 / date: 컨트롤러가 기본값을 채움
const positiveNumberMessage = "돌봄 시간과 시간당 금액은 0보다 커야 합니다.";

export const settlementFormSchema = z.object({
  recipient: z
    .string({ error: "대상자명은 필수입니다." })
    .refine((value) => value.trim().length > 0, {
      message: "대상자명은 필수입니다.",
    }),
  date: z.string(),
  careHours: z
    .number({ error: positiveNumberMessage })
    .positive({ message: positiveNumberMessage }),
  baseRate: z
    .number({ error: positiveNumberMessage })
    .positive({ message: positiveNumberMessage }),
  note: z.string(),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
