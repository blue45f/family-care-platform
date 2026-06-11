// 도메인 타입은 @family-care/shared가 단일 소스(api .model.ts와 공유).
// web 전용 별칭(*Draft)만 여기서 유지한다.
export type {
  CareLogType,
  CareLog,
  ScheduleStatus,
  CareSchedule,
  Settlement,
  ClaimStatus,
  Claim,
  RevenuePlanId,
  RevenuePlan,
  AdminMonthlyTrendDataSource,
  AdminMonthlyTrend,
  AdminOverview,
  // 커뮤니티 게시판
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
  // 1:1 상담
  SupportThreadStatus,
  SupportSenderRole,
  SupportThread,
  SupportThreadSummary,
  SupportMessage,
  SupportThreadDetail,
  SupportThreadInput,
  SupportMessageInput,
  // 쪽지
  DirectMessage,
  DirectMessageInput,
  ConversationSummary,
  ConversationDetail,
  MessageRecipient,
} from '@family-care/shared'

/** 어드민 회원 관리 화면이 받는 공개 사용자(api PublicUser와 동일 형태). */
export type MemberUser = {
  id: number
  email: string
  name: string
  role: 'operator' | 'admin'
  createdAt: string
  suspended?: boolean
  organization?: string
}

import type {
  CareLog,
  CareSchedule,
  Settlement,
  Claim,
  RevenuePlan,
  RevenuePlanId,
} from '@family-care/shared'

export type CareLogDraft = Omit<CareLog, 'id'>

export type CareScheduleDraft = Omit<CareSchedule, 'id'>

export type SettlementDraft = Omit<Settlement, 'id' | 'totalAmount'>

export type ClaimDraft = Omit<Claim, 'id'>

export type RevenuePlanDraft = Omit<RevenuePlan, 'id'> & {
  id: RevenuePlanId
}
