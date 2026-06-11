// 1:1 운영 상담(보호자/이용자 ↔ 운영팀) 도메인 계약 — web/api 공유 타입.
// 소켓 인프라 없이 폴링으로 동작하므로, 메시지는 단순 append-only 컬렉션이다.

export const supportThreadStatuses = ['open', 'closed'] as const

export type SupportThreadStatus = (typeof supportThreadStatuses)[number]

/** 메시지 발신 측: 스레드를 연 이용자(user) 또는 운영팀(staff). */
export const supportSenderRoles = ['user', 'staff'] as const

export type SupportSenderRole = (typeof supportSenderRoles)[number]

export type SupportThread = {
  id: number
  userId: number
  userName: string
  subject: string
  status: SupportThreadStatus
  createdAt: string
  lastMessageAt: string
}

export type SupportThreadSummary = SupportThread & {
  lastMessagePreview: string
  messageCount: number
}

export type SupportMessage = {
  id: number
  threadId: number
  senderId: number
  senderName: string
  senderRole: SupportSenderRole
  body: string
  createdAt: string
}

export type SupportThreadDetail = SupportThread & {
  messages: SupportMessage[]
}

export type SupportThreadInput = {
  subject: string
  message: string
}

export type SupportMessageInput = {
  body: string
}
