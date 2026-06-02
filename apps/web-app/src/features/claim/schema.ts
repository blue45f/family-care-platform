import { z } from "zod";

// 프론트엔드 보험청구 폼 스키마.
// API의 claim.schema.ts와 동일한 검증 규칙을 옮겨온 것:
// - recipient/hospitalName/claimType: 필수(+trim) — claimType은 UI 미노출이나 기본값으로 유지
// - expectedAmount: 유한수 & 0 초과(빈 입력은 NaN → finite 실패로 비활성 게이트 유지)
// - status: 정해진 청구 상태만 허용 / issueDate: 컨트롤러가 기본값을 채움
// - note: 선택
export const claimStatuses = ["요청", "검토중", "승인", "거절"] as const;

const requiredText = (message: string) =>
  z
    .string({ error: message })
    .refine((value) => value.trim().length > 0, { message });

const EXPECTED_AMOUNT_MESSAGE = "청구 예상 금액은 0보다 커야 합니다.";

export const claimStatusSchema = z.enum(claimStatuses, {
  error: "유효하지 않은 청구 상태입니다.",
});

export const claimFormSchema = z.object({
  recipient: requiredText("대상자명은 필수입니다."),
  hospitalName: requiredText("병원명은 필수입니다."),
  claimType: requiredText("청구 유형은 필수입니다."),
  expectedAmount: z
    .number({ error: EXPECTED_AMOUNT_MESSAGE })
    .finite(EXPECTED_AMOUNT_MESSAGE)
    .positive({ message: EXPECTED_AMOUNT_MESSAGE }),
  issueDate: z.string(),
  status: claimStatusSchema,
  note: z.string(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;
