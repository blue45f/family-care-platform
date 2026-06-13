import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { conversationKey } from '@family-care/shared'

import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'
import { AuthService } from '../auth/auth.service'
import type { AuthenticatedUser } from '../auth/auth.model'
import { directMessageInputSchema } from './messages.schema'
import type {
  ConversationDetail,
  ConversationSummary,
  DirectMessage,
  DirectMessageInput,
  MessageRecipient,
} from './messages.model'

const PREVIEW_LENGTH = 60

const daysAgoIso = (days: number, hours = 0): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000).toISOString()

/** 데모/첫 실행용 시드. 데모 관리자(1) ↔ 김보호(2)의 쪽지 대화. */
const seedMessages = (): DirectMessage[] => [
  {
    id: 1,
    senderId: 2,
    senderName: '김보호',
    recipientId: 1,
    recipientName: '데모 관리자',
    body: '안녕하세요, 커뮤니티에 올려 주신 방문 요양 신청 절차 글 잘 읽었습니다. 등급 판정 서류 관련해 쪽지로 여쭤봐도 될까요?',
    createdAt: daysAgoIso(1, 6),
    readAt: daysAgoIso(1, 5),
  },
  {
    id: 2,
    senderId: 1,
    senderName: '데모 관리자',
    recipientId: 2,
    recipientName: '김보호',
    body: '네, 편하게 물어보세요. 의사소견서는 발급일 기준 6개월 이내 서류만 인정되는 점만 미리 확인해 주세요.',
    createdAt: daysAgoIso(1, 4),
    readAt: null,
  },
]

/**
 * 쪽지(1:1 비실시간 메시지). 대화 엔티티 없이 메시지 컬렉션에서
 * conversationKey(작은 id:큰 id)로 대화를 파생한다. 폴링 기반 갱신.
 */
@Injectable()
export class MessagesService {
  private readonly store = new JsonCollectionStore<DirectMessage>('direct-messages.json', () => ({
    items: seedMessages(),
    seq: seedMessages().length + 1,
  }))
  private state = this.store.load()

  constructor(private readonly authService: AuthService) {}

  private messagesWith(actorId: number, partnerId: number): DirectMessage[] {
    const key = conversationKey(actorId, partnerId)
    return this.state.items
      .filter((message) => conversationKey(message.senderId, message.recipientId) === key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  }

  /** GET /api/messages/recipients — 받는 사람 후보(본인·정지 계정 제외, 이름만 노출). */
  listRecipients(actor: AuthenticatedUser): MessageRecipient[] {
    return this.authService
      .listUsers()
      .filter((user) => user.id !== actor.id && !user.suspended)
      .map((user) => ({ id: user.id, name: user.name }))
  }

  /** GET /api/messages/conversations — 내 대화 목록(최근 메시지순) + 안 읽은 수. */
  listConversations(actor: AuthenticatedUser): ConversationSummary[] {
    const byPartner = new Map<number, DirectMessage[]>()
    for (const message of this.state.items) {
      if (message.senderId !== actor.id && message.recipientId !== actor.id) {
        continue
      }
      const partnerId = message.senderId === actor.id ? message.recipientId : message.senderId
      const bucket = byPartner.get(partnerId) ?? []
      bucket.push(message)
      byPartner.set(partnerId, bucket)
    }

    return [...byPartner.entries()]
      .map(([partnerId, messages]) => {
        const sorted = [...messages].sort(
          (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id
        )
        const last = sorted[sorted.length - 1]
        const preview = last.body.replace(/\s+/g, ' ').trim()
        return {
          partnerId,
          partnerName: last.senderId === actor.id ? last.recipientName : last.senderName,
          lastMessageAt: last.createdAt,
          lastMessagePreview:
            preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview,
          unreadCount: sorted.filter(
            (message) => message.recipientId === actor.id && message.readAt === null
          ).length,
          messageCount: sorted.length,
        }
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt) || b.partnerId - a.partnerId)
  }

  /** GET /api/messages/conversations/:partnerId — 상대와의 전체 메시지(오래된순). */
  getConversation(partnerId: number, actor: AuthenticatedUser): ConversationDetail {
    const partnerName = this.resolvePartnerName(partnerId, actor)
    return {
      partnerId,
      partnerName,
      messages: this.messagesWith(actor.id, partnerId),
    }
  }

  /** POST /api/messages — 쪽지 전송. 받는 사람 실재/정지/본인 여부를 검증한다. */
  send(input: DirectMessageInput, actor: AuthenticatedUser): DirectMessage {
    const parsed = parseWithSchema(directMessageInputSchema, input)

    if (parsed.recipientId === actor.id) {
      throw new BadRequestException('본인에게는 쪽지를 보낼 수 없습니다.')
    }
    const recipient = this.authService
      .listUsers()
      .find((user) => user.id === parsed.recipientId && !user.suspended)
    if (!recipient) {
      throw new NotFoundException('받는 사람을 찾을 수 없습니다.')
    }

    const next: DirectMessage = {
      id: this.state.seq!,
      senderId: actor.id,
      senderName: actor.name.trim() || actor.email.split('@')[0] || '이용자',
      recipientId: recipient.id,
      recipientName: recipient.name,
      body: parsed.body,
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    this.state.items.push(next)
    this.state.seq = this.state.seq! + 1
    this.store.save(this.state)
    return next
  }

  /** POST /api/messages/conversations/:partnerId/read — 상대가 보낸 안 읽은 쪽지를 읽음 처리. */
  markRead(partnerId: number, actor: AuthenticatedUser): { updated: number } {
    const now = new Date().toISOString()
    let updated = 0
    for (const message of this.messagesWith(actor.id, partnerId)) {
      if (message.recipientId === actor.id && message.readAt === null) {
        message.readAt = now
        updated += 1
      }
    }
    if (updated > 0) {
      this.store.save(this.state)
    }
    return { updated }
  }

  // 대화 기록이 있으면 기록의 이름을, 없으면 사용자 디렉터리에서 찾는다(둘 다 없으면 404).
  private resolvePartnerName(partnerId: number, actor: AuthenticatedUser): string {
    const messages = this.messagesWith(actor.id, partnerId)
    const last = messages[messages.length - 1]
    if (last) {
      return last.senderId === partnerId ? last.senderName : last.recipientName
    }

    const user = this.authService.listUsers().find((candidate) => candidate.id === partnerId)
    if (!user) {
      throw new NotFoundException('대화 상대를 찾을 수 없습니다.')
    }
    return user.name
  }
}
