// 쪽지(1:1 비실시간 메시지) 도메인 계약 — web/api 공유 타입.
// 실시간 소켓 없이 폴링으로 갱신하는 append-only 메시지 컬렉션이며,
// 대화는 별도 엔티티 없이 (작은 id, 큰 id) 사용자 쌍으로 파생한다.

export const MESSAGE_BODY_MAX = 1000

export type DirectMessage = {
  id: number
  senderId: number
  senderName: string
  recipientId: number
  recipientName: string
  body: string
  createdAt: string
  /** 수신자가 읽은 시각(ISO). 읽지 않았으면 null. */
  readAt: string | null
}

export type DirectMessageInput = {
  recipientId: number
  body: string
}

/** 쪽지함 목록 한 줄: 상대 + 마지막 메시지 미리보기 + 안 읽은 수. */
export type ConversationSummary = {
  partnerId: number
  partnerName: string
  lastMessageAt: string
  lastMessagePreview: string
  /** 내가 아직 읽지 않은(상대가 보낸) 메시지 수. */
  unreadCount: number
  messageCount: number
}

export type ConversationDetail = {
  partnerId: number
  partnerName: string
  messages: DirectMessage[]
}

/** 받는 사람 선택 목록(이름 외 개인 정보는 노출하지 않는다). */
export type MessageRecipient = {
  id: number
  name: string
}

/**
 * 두 사용자 id로 대화 키를 만든다(순서 무관 — 항상 "작은:큰").
 * 목록 묶기/필터의 단일 소스라 web/api가 같은 규칙을 쓴다.
 */
export const conversationKey = (a: number, b: number): string =>
  a <= b ? `${a}:${b}` : `${b}:${a}`
