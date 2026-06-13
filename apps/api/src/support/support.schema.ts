import { supportThreadStatuses } from '@family-care/shared'
import { z } from 'zod'

// 1:1 상담 입력 검증. 다른 컬렉션과 동일하게 zod로 trim/필수/길이를 처리하고,
// 실패 시 parseWithSchema가 BadRequestException(첫 메시지)으로 변환한다.

export const SUPPORT_SUBJECT_MAX = 80
export const SUPPORT_MESSAGE_MAX = 2000

const requiredText = (message: string, max: number, maxMessage: string) =>
  z
    .string({ error: message })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message })
    .refine((value) => value.length <= max, { message: maxMessage })

export const supportThreadInputSchema = z.object({
  subject: requiredText(
    '상담 제목을 입력해 주세요.',
    SUPPORT_SUBJECT_MAX,
    '상담 제목은 80자 이내여야 합니다.'
  ),
  message: requiredText(
    '상담 내용을 입력해 주세요.',
    SUPPORT_MESSAGE_MAX,
    '상담 내용은 2000자 이내여야 합니다.'
  ),
})

export const supportMessageInputSchema = z.object({
  body: requiredText(
    '메시지 내용을 입력해 주세요.',
    SUPPORT_MESSAGE_MAX,
    '메시지는 2000자 이내여야 합니다.'
  ),
})

export const supportStatusInputSchema = z.object({
  status: z.enum(supportThreadStatuses, { error: '유효하지 않은 상담 상태입니다.' }),
})

export type SupportThreadInputParsed = z.infer<typeof supportThreadInputSchema>
export type SupportMessageInputParsed = z.infer<typeof supportMessageInputSchema>
export type SupportStatusInputParsed = z.infer<typeof supportStatusInputSchema>
