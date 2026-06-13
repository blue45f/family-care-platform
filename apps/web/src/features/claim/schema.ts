import { claimStatusSchema, claimStatuses } from '@family-care/shared'
import { z } from 'zod'

// 프론트엔드 보험청구 폼 스키마.
// 청구 상태 enum(claimStatuses/claimStatusSchema)은 @family-care/shared가 단일 소스다.
// 폼 검증 규칙은 web 전용:
// - recipient/hospitalName/claimType: 필수(transform 없이 원본 폼 값 검증) — claimType은 UI 미노출이나 기본값으로 유지
// - expectedAmount: 유한수 & 0 초과(빈 입력은 NaN → finite 실패로 비활성 게이트 유지)
// - status: 정해진 청구 상태만 허용 / issueDate: 컨트롤러가 기본값을 채움
// - note: 선택
export { claimStatuses, claimStatusSchema }

const requiredText = (message: string) =>
  z.string({ error: message }).refine((value) => value.trim().length > 0, { message })

const EXPECTED_AMOUNT_MESSAGE = '청구 예상 금액은 0보다 커야 합니다.'

export const claimFormSchema = z.object({
  recipient: requiredText('대상자명은 필수입니다.'),
  hospitalName: requiredText('병원명은 필수입니다.'),
  claimType: requiredText('청구 유형은 필수입니다.'),
  expectedAmount: z
    .number({ error: EXPECTED_AMOUNT_MESSAGE })
    .finite(EXPECTED_AMOUNT_MESSAGE)
    .positive({ message: EXPECTED_AMOUNT_MESSAGE }),
  issueDate: z.string(),
  status: claimStatusSchema,
  note: z.string(),
})

export type ClaimFormValues = z.infer<typeof claimFormSchema>
