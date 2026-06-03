import { z } from "zod";

import { careLogTypes } from "@family-care/shared";

// 프론트엔드 돌봄 기록 폼 스키마.
// 돌봄 활동 유형 목록(careLogTypes)은 @family-care/shared가 단일 소스다.
// 폼 검증 규칙은 web 전용:
// - recipient/caregiver/note: 필수(빈 값 금지, transform 없이 원본 폼 값 검증)
// - type: 정해진 돌봄 활동 유형만 허용
// - date: 컨트롤러가 기본값(localYmd)을 채우므로 폼에서도 단순 문자열로 둔다.
export { careLogTypes };

const requiredText = (message: string) =>
  z
    .string({ error: message })
    .refine((value) => value.trim().length > 0, { message });

const REQUIRED_FIELDS_MESSAGE =
  "대상자, 담당자, 내용은 필수 입력입니다.";

export const careLogFormSchema = z.object({
  recipient: requiredText(REQUIRED_FIELDS_MESSAGE),
  caregiver: requiredText(REQUIRED_FIELDS_MESSAGE),
  type: z.enum(careLogTypes, {
    error: "유효하지 않은 돌봄 활동 유형입니다.",
  }),
  date: z.string(),
  note: requiredText(REQUIRED_FIELDS_MESSAGE),
});

export type CareLogFormValues = z.infer<typeof careLogFormSchema>;
