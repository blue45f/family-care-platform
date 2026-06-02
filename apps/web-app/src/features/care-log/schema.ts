import { z } from "zod";

// 프론트엔드 돌봄 기록 폼 스키마.
// API의 care-log.schema.ts와 동일한 검증 규칙을 옮겨온 것:
// - recipient/caregiver/note: 필수(+trim, 빈 값 금지)
// - type: 정해진 돌봄 활동 유형만 허용
// - date: 컨트롤러가 기본값(localYmd)을 채우므로 폼에서도 단순 문자열로 둔다.
export const careLogTypes = [
  "방문",
  "원격상담",
  "투약",
  "식사관리",
  "기타",
] as const;

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
