// 커뮤니티 게시판 도메인 계약 — web/api가 공유하는 enum 리터럴·타입·첨부 한도.
// 입력 검증 object 스키마는 양쪽 동작이 다르므로 각 앱에 로컬로 둔다(care-log 등과 동일).

// 보호자/간병인 대상 게시판 카테고리(양쪽 schema가 동일하게 사용).
export const communityCategories = ['정보공유', '질문', '간병후기'] as const

export type CommunityCategory = (typeof communityCategories)[number]

// 첨부 정책: 이미지(jpeg/png/webp) + PDF, 파일당 2MB, 게시글당 최대 4개.
// 이미지는 클라이언트에서 긴 변 1600px 이하로 리사이즈한 뒤 업로드한다.
export const communityAttachmentMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export type CommunityAttachmentMimeType = (typeof communityAttachmentMimeTypes)[number]

export type CommunityAttachmentKind = 'image' | 'pdf'

export const COMMUNITY_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
export const COMMUNITY_ATTACHMENT_MAX_COUNT = 4
export const COMMUNITY_IMAGE_MAX_DIMENSION = 1600

/** mime 타입이 허용 목록에 있으면 첨부 종류(image/pdf)를, 아니면 null을 반환한다. */
export const communityAttachmentKind = (mimeType: string): CommunityAttachmentKind | null => {
  if (mimeType === 'application/pdf') {
    return 'pdf'
  }
  if ((communityAttachmentMimeTypes as readonly string[]).includes(mimeType)) {
    return 'image'
  }
  return null
}

/**
 * base64 data URL의 디코딩 후 바이트 수를 추정한다(2MB 캡 검증의 단일 소스).
 * data: 프리픽스가 아니거나 base64 본문이 없으면 0을 반환한다.
 */
export const dataUrlByteSize = (dataUrl: string): number => {
  const commaIndex = dataUrl.indexOf(',')
  if (!dataUrl.startsWith('data:') || commaIndex < 0) {
    return 0
  }
  const base64 = dataUrl.slice(commaIndex + 1)
  if (!base64) {
    return 0
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

/** 업로드 입력 형태(서버가 size/kind를 재계산·검증한다). */
export type CommunityAttachmentInput = {
  name: string
  mimeType: CommunityAttachmentMimeType
  dataUrl: string
}

export type CommunityAttachment = CommunityAttachmentInput & {
  id: number
  kind: CommunityAttachmentKind
  size: number
}

export type CommunityPost = {
  id: number
  category: CommunityCategory
  title: string
  body: string
  authorId: number
  authorName: string
  createdAt: string
  /** 어드민 숨김 처리 여부. 숨김 글은 일반 사용자에게 노출되지 않는다. */
  hidden: boolean
  attachments: CommunityAttachment[]
}

/** 목록 응답: 본문/첨부 데이터(data URL)를 제외해 목록 페이로드를 가볍게 유지한다. */
export type CommunityPostSummary = Omit<CommunityPost, 'body' | 'attachments'> & {
  excerpt: string
  attachmentCount: number
  commentCount: number
}

export type CommunityComment = {
  id: number
  postId: number
  /** 1단 답글: 최상위 댓글이면 null, 답글이면 부모 댓글 id. */
  parentId: number | null
  authorId: number
  authorName: string
  body: string
  createdAt: string
  /** 삭제된 댓글은 본문을 비우고 placeholder로 스레드를 보존한다. */
  deleted: boolean
}

export type CommunityPostDetail = CommunityPost & {
  comments: CommunityComment[]
}

export type CommunityPostInput = {
  category: CommunityCategory
  title: string
  body: string
  attachments?: CommunityAttachmentInput[]
}

export type CommunityCommentInput = {
  body: string
  parentId?: number | null
}
