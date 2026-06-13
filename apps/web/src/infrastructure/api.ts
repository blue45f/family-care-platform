import { authHeader } from '../auth/authSession'

import type { AuthUser, UpdateProfileInput } from '../auth/authContext'
import type {
  AdminUserUpdateInput,
  AdminOverview,
  CareLog,
  CareLogDraft,
  CareSchedule,
  CareScheduleDraft,
  Claim,
  ClaimDraft,
  ClaimStatus,
  CommunityComment,
  CommunityForbiddenWord,
  CommunityForbiddenWordInput,
  CommunityCommentInput,
  CommunityPostDetail,
  CommunityPostInput,
  CommunityPostSummary,
  ConversationDetail,
  ConversationSummary,
  DirectMessage,
  DirectMessageInput,
  MemberUser,
  MessageRecipient,
  ScheduleStatus,
  RevenuePlan,
  RevenuePlanDraft,
  Settlement,
  SettlementDraft,
  SupportMessage,
  SupportMessageInput,
  SupportThreadDetail,
  SupportThreadInput,
  SupportThreadStatus,
  SupportThreadSummary,
} from '../types'

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : '/api'
const BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
const NETWORK_RETRY_COUNT = 2
const NETWORK_RETRY_DELAY_MS = 240

const wait = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs))

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response | null = null

  for (let attempt = 0; attempt <= NETWORK_RETRY_COUNT; attempt += 1) {
    try {
      response = await fetch(`${BASE_URL}${input}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
          ...init?.headers,
        },
      })
      break
    } catch (error) {
      if (attempt >= NETWORK_RETRY_COUNT) {
        throw error
      }
      await wait(NETWORK_RETRY_DELAY_MS * (attempt + 1))
    }
  }

  if (!response) {
    throw new Error('API 요청 응답을 받지 못했습니다.')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `요청이 실패했습니다. 상태: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const fetchCareLogs = () => request<CareLog[]>('/care-logs')
export const postCareLog = (body: CareLogDraft) =>
  request<CareLog>('/care-logs', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const fetchSchedules = () => request<CareSchedule[]>('/schedules')
export const postSchedule = (body: CareScheduleDraft) =>
  request<CareSchedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const patchScheduleStatus = (scheduleId: number, status: ScheduleStatus) =>
  request<CareSchedule>(`/schedules/${scheduleId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const fetchSettlements = () => request<Settlement[]>('/settlements')
export const postSettlement = (body: SettlementDraft) =>
  request<Settlement>('/settlements', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const fetchClaims = () => request<Claim[]>('/claims')
export const postClaim = (body: ClaimDraft) =>
  request<Claim>('/claims', { method: 'POST', body: JSON.stringify(body) })
export const patchClaimStatus = (claimId: number, status: ClaimStatus) =>
  request<Claim>(`/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

export const fetchAdminOverview = () => request<AdminOverview>('/admin/overview')
export const fetchAdminPlans = () => request<RevenuePlan[]>('/admin/plans')
export const updateAdminPlan = (body: RevenuePlanDraft) =>
  request<RevenuePlan>('/admin/plans', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

/* ---- 내 계정 ---- */

export const patchMyProfile = (body: UpdateProfileInput) =>
  request<AuthUser>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
export const deleteMyAccount = (password: string) =>
  request<AuthUser>('/auth/me/withdraw', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })

/* ---- 커뮤니티 게시판 ---- */

export const fetchCommunityPosts = (filter: { category?: string; q?: string } = {}) => {
  const params = new URLSearchParams()
  if (filter.category) {
    params.set('category', filter.category)
  }
  if (filter.q) {
    params.set('q', filter.q)
  }
  const query = params.toString()
  return request<CommunityPostSummary[]>(`/community/posts${query ? `?${query}` : ''}`)
}
export const fetchCommunityPost = (postId: number) =>
  request<CommunityPostDetail>(`/community/posts/${postId}`)
export const postCommunityPost = (body: CommunityPostInput) =>
  request<CommunityPostDetail>('/community/posts', { method: 'POST', body: JSON.stringify(body) })
export const postCommunityComment = (postId: number, body: CommunityCommentInput) =>
  request<CommunityComment>(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
// 비가역 삭제는 POST :id/delete 컨벤션(DELETE 메서드는 이 API 표면에서 쓰지 않는다).
export const deleteCommunityComment = (commentId: number) =>
  request<CommunityComment>(`/community/comments/${commentId}/delete`, { method: 'POST' })
export const deleteCommunityPost = (postId: number) =>
  request<{ deleted: true }>(`/community/posts/${postId}/delete`, { method: 'POST' })
export const deleteCommunityAttachment = (postId: number, attachmentId: number) =>
  request<CommunityPostDetail>(`/community/posts/${postId}/attachments/${attachmentId}/delete`, {
    method: 'POST',
  })
export const patchCommunityVisibility = (postId: number, hidden: boolean) =>
  request<CommunityPostSummary>(`/community/posts/${postId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ hidden }),
  })

/* ---- 1:1 상담(폴링) ---- */

export const fetchSupportThreads = () => request<SupportThreadSummary[]>('/support/threads')
export const fetchSupportThread = (threadId: number) =>
  request<SupportThreadDetail>(`/support/threads/${threadId}`)
export const postSupportThread = (body: SupportThreadInput) =>
  request<SupportThreadDetail>('/support/threads', { method: 'POST', body: JSON.stringify(body) })
export const postSupportMessage = (threadId: number, body: SupportMessageInput) =>
  request<SupportMessage>(`/support/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const patchSupportStatus = (threadId: number, status: SupportThreadStatus) =>
  request<SupportThreadSummary>(`/support/threads/${threadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

/* ---- 쪽지(1:1 비실시간 메시지) ---- */

export const fetchMessageRecipients = () => request<MessageRecipient[]>('/messages/recipients')
export const fetchConversations = () => request<ConversationSummary[]>('/messages/conversations')
export const fetchConversation = (partnerId: number) =>
  request<ConversationDetail>(`/messages/conversations/${partnerId}`)
export const postDirectMessage = (body: DirectMessageInput) =>
  request<DirectMessage>('/messages', { method: 'POST', body: JSON.stringify(body) })
export const postConversationRead = (partnerId: number) =>
  request<{ updated: number }>(`/messages/conversations/${partnerId}/read`, { method: 'POST' })

/* ---- 어드민 회원 관리 ---- */

export const fetchAdminUsers = () => request<MemberUser[]>('/admin/users')
export const patchAdminUser = (userId: number, body: AdminUserUpdateInput) =>
  request<MemberUser>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
export const patchUserSuspension = (userId: number, suspended: boolean) =>
  request<MemberUser>(`/admin/users/${userId}/suspension`, {
    method: 'PATCH',
    body: JSON.stringify({ suspended }),
  })

export const fetchCommunityForbiddenWords = () =>
  request<CommunityForbiddenWord[]>('/admin/community/forbidden-words')
export const postCommunityForbiddenWord = (body: CommunityForbiddenWordInput) =>
  request<CommunityForbiddenWord>('/admin/community/forbidden-words', {
    method: 'POST',
    body: JSON.stringify(body),
  })
export const patchCommunityForbiddenWord = (wordId: number, body: CommunityForbiddenWordInput) =>
  request<CommunityForbiddenWord>(`/admin/community/forbidden-words/${wordId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
export const deleteCommunityForbiddenWord = (wordId: number) =>
  request<{ deleted: true }>(`/admin/community/forbidden-words/${wordId}/delete`, {
    method: 'POST',
  })
