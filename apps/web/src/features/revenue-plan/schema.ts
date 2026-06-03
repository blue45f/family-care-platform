// 프론트엔드 요금제 편집 폼 스키마.
// 검증 규칙(필드·범위·메시지)이 API admin.schema.ts와 완전히 동일하므로
// @family-care/shared의 revenuePlanDraftSchema를 단일 소스로 사용한다.
import {
  revenuePlanDraftSchema,
  type RevenuePlanFormValues,
} from "@family-care/shared";

export const revenuePlanFormSchema = revenuePlanDraftSchema;

export type { RevenuePlanFormValues };
