import { z } from 'zod'

import type { SettlementInput } from './settlement.model'

const positiveNumberMessage = 'careHours와 baseRate는 0보다 커야 합니다.'

// 기존 서비스 검증과 동일:
// - recipient: trim 후 비어 있으면 안 됨 ('recipient는 필수입니다.')
// - careHours / baseRate: 0보다 커야 함 (둘 중 하나라도 0 이하면 동일 메시지)
// - note: 필수 아님(서비스가 trim만 수행) / date: 컨트롤러가 기본값 채움
export const settlementInputSchema = z.object({
  recipient: z
    .string({ error: 'recipient는 필수입니다.' })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: 'recipient는 필수입니다.' }),
  date: z.string().optional(),
  careHours: z
    .number({ error: positiveNumberMessage })
    .positive({ message: positiveNumberMessage }),
  baseRate: z.number({ error: positiveNumberMessage }).positive({ message: positiveNumberMessage }),
  note: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim()),
}) satisfies z.ZodType<Omit<SettlementInput, 'date' | 'note'> & { date?: string; note?: string }>
