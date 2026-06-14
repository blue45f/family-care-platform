import ky, { HTTPError, type Options } from 'ky'

import { getAuthToken } from '../auth/authSession'

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

// 공유 ky 인스턴스. prefix 로 BASE_URL 을 붙이고(호출부는 `/care-logs` 처럼 경로만),
// Bearer 토큰은 beforeRequest 훅에서 localStorage 토큰으로 매 요청 주입한다.
// 인증 store 에 refresh 토큰/엔드포인트가 없으므로(401 → AuthProvider 가 /auth/me 복원
// 실패 시 로그아웃) 401-refresh afterResponse 훅은 의도적으로 두지 않는다.
// retry 는 기존 fetch 루프와 동일하게 네트워크 오류만 재시도(상태 코드 재시도 없음).
const client = ky.create({
  prefix: BASE_URL,
  timeout: false,
  retry: {
    limit: NETWORK_RETRY_COUNT,
    methods: ['get', 'post', 'put', 'patch', 'delete', 'head'],
    statusCodes: [],
    backoffLimit: NETWORK_RETRY_DELAY_MS * (NETWORK_RETRY_COUNT + 1),
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = getAuthToken()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
  },
})

/**
 * ky HTTPError 의 본문(자동 소비되어 error.data 로 보관됨)을 기존 fetch 시절과 동일한
 * 메시지 계약으로 되살린다. UI(usePlatformData / community view / AuthProvider)는
 * error.message 가 "원본 응답 본문 문자열"(JSON.parse 가능)이거나 상태 코드를 담은
 * 폴백 문자열이라고 가정한다. 네트워크 오류는 ky 가 원본 TypeError("Failed to fetch")로
 * 던지므로 그대로 통과시킨다.
 */
function toLegacyError(error: HTTPError): Error {
  const data = error.response ? (error as { data?: unknown }).data : undefined
  const status = error.response?.status
  if (typeof data === 'string' && data.length > 0) {
    return new Error(data)
  }
  if (data !== undefined && data !== null) {
    return new Error(JSON.stringify(data))
  }
  return new Error(`요청이 실패했습니다. 상태: ${status ?? '알 수 없음'}`)
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const options: Options = {
    ...(init as Options),
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  }

  try {
    const response = await client(input, options)
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof HTTPError) {
      throw toLegacyError(error)
    }
    throw error
  }
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
