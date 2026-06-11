import { MESSAGE_BODY_MAX } from '@family-care/shared'
import { z } from 'zod'

// 쪽지 입력 검증. 실패 시 parseWithSchema가 BadRequestException(첫 메시지)으로 변환한다.

const BODY_REQUIRED_MESSAGE = '쪽지 내용을 입력해 주세요.'

export const directMessageInputSchema = z.object({
  recipientId: z
    .number({ error: '받는 사람이 올바르지 않습니다.' })
    .int('받는 사람이 올바르지 않습니다.')
    .positive('받는 사람이 올바르지 않습니다.'),
  body: z
    .string({ error: BODY_REQUIRED_MESSAGE })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: BODY_REQUIRED_MESSAGE })
    .refine((value) => value.length <= MESSAGE_BODY_MAX, {
      message: `쪽지는 ${MESSAGE_BODY_MAX}자 이내여야 합니다.`,
    }),
})

export type DirectMessageInputParsed = z.infer<typeof directMessageInputSchema>
