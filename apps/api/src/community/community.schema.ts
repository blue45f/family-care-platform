import {
  COMMUNITY_ATTACHMENT_MAX_BYTES,
  COMMUNITY_ATTACHMENT_MAX_COUNT,
  communityAttachmentMimeTypes,
  communityCategories,
  dataUrlByteSize,
} from '@family-care/shared'
import { z } from 'zod'

export { communityCategories }

// 커뮤니티 입력 검증. 다른 컬렉션과 동일하게 zod로 trim/필수/형식을 처리하고,
// 실패 시 parseWithSchema가 BadRequestException(첫 메시지)으로 변환한다.

export const COMMUNITY_TITLE_MAX = 80
export const COMMUNITY_BODY_MAX = 4000
export const COMMUNITY_COMMENT_MAX = 1000

const TITLE_REQUIRED_MESSAGE = '제목을 입력해 주세요.'
const BODY_REQUIRED_MESSAGE = '내용을 입력해 주세요.'
const COMMENT_REQUIRED_MESSAGE = '댓글 내용을 입력해 주세요.'

const requiredText = (message: string, max: number, maxMessage: string) =>
  z
    .string({ error: message })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message })
    .refine((value) => value.length <= max, { message: maxMessage })

// 첨부 하나: 허용 형식 + data URL 프리픽스 일치 + 디코딩 크기 2MB 이하.
const attachmentInputSchema = z
  .object({
    name: requiredText('파일 이름이 필요합니다.', 120, '파일 이름은 120자 이내여야 합니다.'),
    mimeType: z.enum(communityAttachmentMimeTypes, {
      error: '허용되지 않는 파일 형식입니다. (이미지 jpeg/png/webp 또는 PDF)',
    }),
    dataUrl: z.string({ error: '파일 데이터가 올바르지 않습니다.' }),
  })
  .refine((value) => value.dataUrl.startsWith(`data:${value.mimeType};base64,`), {
    message: '파일 데이터가 올바르지 않습니다.',
  })
  .refine((value) => dataUrlByteSize(value.dataUrl) > 0, {
    message: '파일 데이터가 올바르지 않습니다.',
  })
  .refine((value) => dataUrlByteSize(value.dataUrl) <= COMMUNITY_ATTACHMENT_MAX_BYTES, {
    message: '파일은 2MB 이하만 첨부할 수 있습니다.',
  })

export const communityPostInputSchema = z.object({
  category: z.enum(communityCategories, { error: '유효하지 않은 카테고리입니다.' }),
  title: requiredText(TITLE_REQUIRED_MESSAGE, COMMUNITY_TITLE_MAX, '제목은 80자 이내여야 합니다.'),
  body: requiredText(BODY_REQUIRED_MESSAGE, COMMUNITY_BODY_MAX, '내용은 4000자 이내여야 합니다.'),
  attachments: z
    .array(attachmentInputSchema)
    .max(COMMUNITY_ATTACHMENT_MAX_COUNT, '첨부는 최대 4개까지 가능합니다.')
    .optional()
    .default([]),
})

export const communityCommentInputSchema = z.object({
  body: requiredText(
    COMMENT_REQUIRED_MESSAGE,
    COMMUNITY_COMMENT_MAX,
    '댓글은 1000자 이내여야 합니다.'
  ),
  parentId: z
    .number({ error: '답글 대상이 올바르지 않습니다.' })
    .int('답글 대상이 올바르지 않습니다.')
    .positive('답글 대상이 올바르지 않습니다.')
    .nullable()
    .optional(),
})

export const communityVisibilityInputSchema = z.object({
  hidden: z.boolean({ error: 'hidden은 true/false여야 합니다.' }),
})

export const communityForbiddenWordInputSchema = z.object({
  term: z
    .string({ error: '금칙어를 입력해 주세요.' })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: '금칙어를 입력해 주세요.' })
    .refine((value) => value.length <= 60, { message: '금칙어는 60자 이내여야 합니다.' }),
})

export type CommunityPostInputParsed = z.infer<typeof communityPostInputSchema>
export type CommunityCommentInputParsed = z.infer<typeof communityCommentInputSchema>
export type CommunityVisibilityInputParsed = z.infer<typeof communityVisibilityInputSchema>
export type CommunityForbiddenWordInputParsed = z.infer<typeof communityForbiddenWordInputSchema>
