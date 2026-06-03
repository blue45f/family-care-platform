import { claimStatusSchema, claimStatuses } from '@family-care/shared';
import { z } from 'zod';

import type { ClaimInput, ClaimStatus } from './claim.model';

// 청구 상태 enum(claimStatuses/claimStatusSchema)은 @family-care/shared가 단일 소스다.
export { claimStatuses, claimStatusSchema };

const REQUIRED_FIELDS_MESSAGE = 'recipient, hospitalName, claimType은(는) 필수입니다.';
const EXPECTED_AMOUNT_MESSAGE = 'expectedAmount는 0보다 큰 숫자여야 합니다.';

const requiredText = z
  .string({ error: REQUIRED_FIELDS_MESSAGE })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: REQUIRED_FIELDS_MESSAGE });

// 기존 서비스 검증과 동일:
// - recipient/hospitalName/claimType 필수(+trim, 동일 메시지)
// - expectedAmount: 유한수 & 0 초과 ('expectedAmount는 0보다 큰 숫자여야 합니다.')
// - status: 정해진 목록만 허용 / issueDate: 컨트롤러가 기본값 채움
// - note: 필수 아님(서비스가 trim만 수행)
export const claimInputSchema = z.object({
  recipient: requiredText,
  hospitalName: requiredText,
  claimType: requiredText,
  expectedAmount: z
    .number({ error: EXPECTED_AMOUNT_MESSAGE })
    .finite(EXPECTED_AMOUNT_MESSAGE)
    .positive({ message: EXPECTED_AMOUNT_MESSAGE }),
  issueDate: z.string().optional(),
  status: claimStatusSchema,
  note: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim()),
}) satisfies z.ZodType<
  Omit<ClaimInput, 'issueDate' | 'note'> & { issueDate?: string; note?: string }
>;

// 청구 상태 변경(@Body) 검증 스키마.
export const claimStatusUpdateSchema = z.object({
  status: claimStatusSchema,
}) satisfies z.ZodType<{ status: ClaimStatus }>;

// PATCH /:id/status 경로 파라미터 검증(양의 정수). 기존 컨트롤러 if-throw와 동일 메시지.
export const claimIdParamSchema = z
  .coerce.number({ error: '유효하지 않은 청구 ID입니다.' })
  .int('유효하지 않은 청구 ID입니다.')
  .min(1, '유효하지 않은 청구 ID입니다.');
