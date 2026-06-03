import { careLogTypes } from '@family-care/shared'
import { z } from 'zod'

import type { CareLogInput } from './care-log.model'

// 돌봄 활동 유형 목록(careLogTypes)은 @family-care/shared가 단일 소스다.
export { careLogTypes }

// 필수 문자열(trim 후 비어 있지 않아야 함). 빈 값이면 기존 if-throw와 동일한 메시지를 던진다.
const requiredText = (message: string) =>
  z
    .string({ error: message })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message })

const REQUIRED_FIELDS_MESSAGE = 'recipient/caregiver/note는 필수입니다.'

// 기존 서비스 검증과 동일: recipient/caregiver/note 필수(+trim), type는 정해진 목록만 허용.
// date는 컨트롤러/서비스가 기본값(localYmd)을 채우므로 선택값으로 받는다.
export const careLogInputSchema = z.object({
  recipient: requiredText(REQUIRED_FIELDS_MESSAGE),
  caregiver: requiredText(REQUIRED_FIELDS_MESSAGE),
  note: requiredText(REQUIRED_FIELDS_MESSAGE),
  type: z.enum(careLogTypes, { error: '유효하지 않은 돌봄 활동 유형입니다.' }),
  date: z.string().optional(),
}) satisfies z.ZodType<Omit<CareLogInput, 'date'> & { date?: string }>

export type CareLogInputParsed = z.infer<typeof careLogInputSchema>
