// 요금제 upsert 검증 스키마는 web 요금제 편집 폼과 검증 규칙(필드·범위·메시지)이
// 완전히 동일하므로 @family-care/shared의 revenuePlanDraftSchema를 단일 소스로 사용한다.
// (요금제 존재 여부 확인은 서비스에서 먼저 수행)
export { revenuePlanDraftSchema } from '@family-care/shared';
