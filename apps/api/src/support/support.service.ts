import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'
import type { AuthenticatedUser } from '../auth/auth.model'
import {
  supportMessageInputSchema,
  supportStatusInputSchema,
  supportThreadInputSchema,
} from './support.schema'
import type {
  SupportMessage,
  SupportMessageInput,
  SupportThread,
  SupportThreadDetail,
  SupportThreadInput,
  SupportThreadSummary,
} from './support.model'

const THREAD_NOT_FOUND_MESSAGE = '상담을 찾을 수 없습니다.'
const PREVIEW_LENGTH = 80

const daysAgoIso = (days: number, hours = 0): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000).toISOString()

/** 데모/첫 실행용 시드. 보호자 문의 → 운영팀 답변 흐름을 바로 보여 준다. */
const seedThreads = (): SupportThread[] => [
  {
    id: 1,
    userId: 2,
    userName: '김보호',
    subject: '간병인 교체 절차가 궁금합니다',
    status: 'open',
    createdAt: daysAgoIso(2, 4),
    lastMessageAt: daysAgoIso(2, 1),
  },
]

const seedMessages = (): SupportMessage[] => [
  {
    id: 1,
    threadId: 1,
    senderId: 2,
    senderName: '김보호',
    senderRole: 'user',
    body: '현재 배정된 간병인과 일정이 맞지 않아 교체를 요청드리고 싶습니다. 절차와 소요 기간을 알려 주세요.',
    createdAt: daysAgoIso(2, 4),
  },
  {
    id: 2,
    threadId: 1,
    senderId: 1,
    senderName: '데모 관리자',
    senderRole: 'staff',
    body: '안녕하세요, 운영팀입니다. 교체 요청은 접수 후 영업일 기준 2일 안에 신규 배정안을 안내드립니다. 선호하시는 방문 시간대를 알려 주시면 더 빠르게 도와드릴 수 있어요.',
    createdAt: daysAgoIso(2, 1),
  },
]

/**
 * 1:1 운영 상담(이용자 ↔ 운영팀). 소켓 없이 폴링으로 갱신하는 append-only 메시지 스레드.
 * - 이용자: 본인이 연 스레드만 조회/작성할 수 있다.
 * - 운영팀(admin): 모든 스레드를 조회하고 staff로 답한다.
 */
@Injectable()
export class SupportService {
  private readonly threadStore = new JsonCollectionStore<SupportThread>(
    'support-threads.json',
    () => ({ items: seedThreads(), seq: seedThreads().length + 1 })
  )
  private readonly messageStore = new JsonCollectionStore<SupportMessage>(
    'support-messages.json',
    () => ({ items: seedMessages(), seq: seedMessages().length + 1 })
  )
  private threadState = this.threadStore.load()
  private messageState = this.messageStore.load()

  private isStaff(actor: AuthenticatedUser): boolean {
    return actor.role === 'admin'
  }

  private findThread(threadId: number): SupportThread {
    const thread = this.threadState.items.find((candidate) => candidate.id === threadId)
    if (!thread) {
      throw new NotFoundException(THREAD_NOT_FOUND_MESSAGE)
    }
    return thread
  }

  /** 소유자 또는 운영팀만 접근 가능. 그 외에는 존재 여부를 숨기려 404로 응답한다. */
  private findAccessibleThread(threadId: number, actor: AuthenticatedUser): SupportThread {
    const thread = this.findThread(threadId)
    if (thread.userId !== actor.id && !this.isStaff(actor)) {
      throw new NotFoundException(THREAD_NOT_FOUND_MESSAGE)
    }
    return thread
  }

  private messagesOf(threadId: number): SupportMessage[] {
    return this.messageState.items
      .filter((message) => message.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
  }

  private toSummary(thread: SupportThread): SupportThreadSummary {
    const messages = this.messagesOf(thread.id)
    const last = messages[messages.length - 1]
    const preview = last?.body.replace(/\s+/g, ' ').trim() ?? ''
    return {
      ...thread,
      lastMessagePreview:
        preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview,
      messageCount: messages.length,
    }
  }

  /** GET /api/support/threads — 이용자는 본인 스레드만, 운영팀은 전체(최근 메시지순). */
  listThreads(actor: AuthenticatedUser): SupportThreadSummary[] {
    return this.threadState.items
      .filter((thread) => this.isStaff(actor) || thread.userId === actor.id)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt) || b.id - a.id)
      .map((thread) => this.toSummary(thread))
  }

  /** GET /api/support/threads/:id — 메시지 포함 상세(오래된순). */
  getThread(threadId: number, actor: AuthenticatedUser): SupportThreadDetail {
    const thread = this.findAccessibleThread(threadId, actor)
    return { ...thread, messages: this.messagesOf(thread.id) }
  }

  /** POST /api/support/threads — 새 상담 시작(첫 메시지 포함). */
  createThread(input: SupportThreadInput, actor: AuthenticatedUser): SupportThreadDetail {
    const parsed = parseWithSchema(supportThreadInputSchema, input)
    const now = new Date().toISOString()

    const thread: SupportThread = {
      id: this.threadState.seq!,
      userId: actor.id,
      userName: actor.name.trim() || actor.email.split('@')[0] || '이용자',
      subject: parsed.subject,
      status: 'open',
      createdAt: now,
      lastMessageAt: now,
    }
    this.threadState.items.push(thread)
    this.threadState.seq = this.threadState.seq! + 1
    this.threadStore.save(this.threadState)

    const message = this.appendMessage(thread, parsed.message, actor)
    return { ...thread, messages: [message] }
  }

  /** POST /api/support/threads/:id/messages — 메시지 추가(닫힌 스레드는 거부). */
  addMessage(
    threadId: number,
    input: SupportMessageInput,
    actor: AuthenticatedUser
  ): SupportMessage {
    const parsed = parseWithSchema(supportMessageInputSchema, input)
    const thread = this.findAccessibleThread(threadId, actor)
    if (thread.status === 'closed') {
      throw new ForbiddenException('종료된 상담에는 메시지를 보낼 수 없습니다.')
    }

    const message = this.appendMessage(thread, parsed.body, actor)
    thread.lastMessageAt = message.createdAt
    this.threadStore.save(this.threadState)
    return message
  }

  /** PATCH /api/support/threads/:id/status — 종료/재개(소유자 또는 운영팀). */
  setStatus(threadId: number, input: unknown, actor: AuthenticatedUser): SupportThreadSummary {
    const parsed = parseWithSchema(supportStatusInputSchema, input)
    const thread = this.findAccessibleThread(threadId, actor)

    if (thread.status !== parsed.status) {
      thread.status = parsed.status
      this.threadStore.save(this.threadState)
    }
    return this.toSummary(thread)
  }

  private appendMessage(
    thread: SupportThread,
    body: string,
    actor: AuthenticatedUser
  ): SupportMessage {
    const next: SupportMessage = {
      id: this.messageState.seq!,
      threadId: thread.id,
      senderId: actor.id,
      senderName: actor.name.trim() || actor.email.split('@')[0] || '이용자',
      // 운영팀(admin)이 보내면 staff, 그 외에는 스레드를 연 이용자 측이다.
      senderRole: this.isStaff(actor) && thread.userId !== actor.id ? 'staff' : 'user',
      body,
      createdAt: new Date().toISOString(),
    }
    this.messageState.items.push(next)
    this.messageState.seq = this.messageState.seq! + 1
    this.messageStore.save(this.messageState)
    return next
  }
}
