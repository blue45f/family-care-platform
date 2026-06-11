import { communityCategories } from '@family-care/shared'
import { z } from 'zod'

// 커뮤니티 글 작성 폼 검증. API(community.schema.ts)와 동일한 규칙을 프론트로 옮긴 것.
export const communityPostFormSchema = z.object({
  category: z.enum(communityCategories, { error: '카테고리를 선택해 주세요.' }),
  title: z
    .string({ error: '제목을 입력해 주세요.' })
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(80, '제목은 80자 이내여야 합니다.'),
  body: z
    .string({ error: '내용을 입력해 주세요.' })
    .trim()
    .min(1, '내용을 입력해 주세요.')
    .max(4000, '내용은 4000자 이내여야 합니다.'),
})

export type CommunityPostFormValues = z.infer<typeof communityPostFormSchema>

export { communityCategories }
