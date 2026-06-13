// 도메인 타입은 @family-care/shared가 단일 소스(web types.ts와 공유).
export type {
  CommunityCategory,
  CommunityAttachmentMimeType,
  CommunityAttachmentKind,
  CommunityAttachmentInput,
  CommunityAttachment,
  CommunityPost,
  CommunityPostSummary,
  CommunityComment,
  CommunityPostDetail,
  CommunityPostInput,
  CommunityCommentInput,
} from '@family-care/shared'

export interface CommunityForbiddenWord {
  id: number
  term: string
  createdAt: string
  updatedAt: string
}

export interface CommunityForbiddenWordInput {
  term: string
}
