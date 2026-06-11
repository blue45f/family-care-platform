import { beforeEach, describe, expect, it } from 'vitest'

import { MessagesService } from './messages.service'
import { AuthService } from '../auth/auth.service'
import type { AuthenticatedUser } from '../auth/auth.model'

// 실제 AuthService를 같이 띄워 수신자 실재/정지 검증까지 통합적으로 확인한다.
// (테스트 환경에서는 두 스토어 모두 인메모리 seed에서 출발한다.)
function setup() {
  const auth = new AuthService()
  auth.onModuleInit() // 데모 관리자(id=1) 시드
  const userA = auth.register({ email: 'a@example.com', name: '가입자A', password: 'secret123' })
  const userB = auth.register({ email: 'b@example.com', name: '가입자B', password: 'secret123' })
  const service = new MessagesService(auth)

  const toActor = (user: { id: number; email: string; name: string }): AuthenticatedUser => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'operator',
  })

  return {
    auth,
    service,
    admin: { id: 1, email: 'demo@familycare.app', name: '데모 관리자', role: 'admin' } as const,
    a: toActor(userA.user),
    b: toActor(userB.user),
  }
}

describe('MessagesService', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('받는 사람 후보에서 본인과 정지 계정을 제외하고 이름만 노출한다', () => {
    const recipients = ctx.service.listRecipients(ctx.a)
    expect(recipients.find((r) => r.id === ctx.a.id)).toBeUndefined()
    expect(
      recipients
        .map((r) => Object.keys(r))
        .flat()
        .every((k) => k === 'id' || k === 'name'),
    ).toBe(true)

    ctx.auth.setSuspension(ctx.b.id, { suspended: true }, ctx.admin)
    expect(ctx.service.listRecipients(ctx.a).find((r) => r.id === ctx.b.id)).toBeUndefined()
  })

  it('쪽지를 보내면 양쪽 대화 목록에 나타나고 안 읽은 수가 집계된다', () => {
    ctx.service.send({ recipientId: ctx.b.id, body: '안녕하세요 B님' }, ctx.a)
    ctx.service.send({ recipientId: ctx.b.id, body: '두 번째 쪽지' }, ctx.a)

    const inboxB = ctx.service.listConversations(ctx.b)
    const convo = inboxB.find((c) => c.partnerId === ctx.a.id)
    expect(convo).toMatchObject({
      partnerName: '가입자A',
      unreadCount: 2,
      messageCount: 2,
      lastMessagePreview: '두 번째 쪽지',
    })

    // 보낸 쪽에서는 안 읽은 수가 0이다(상대가 보낸 게 없으므로).
    const inboxA = ctx.service.listConversations(ctx.a)
    expect(inboxA.find((c) => c.partnerId === ctx.b.id)?.unreadCount).toBe(0)
  })

  it('대화 상세는 오래된순으로 정렬되고 읽음 처리는 수신분만 갱신한다', () => {
    ctx.service.send({ recipientId: ctx.b.id, body: '1' }, ctx.a)
    ctx.service.send({ recipientId: ctx.a.id, body: '2' }, ctx.b)
    ctx.service.send({ recipientId: ctx.b.id, body: '3' }, ctx.a)

    const detail = ctx.service.getConversation(ctx.a.id, ctx.b)
    expect(detail.partnerName).toBe('가입자A')
    expect(detail.messages.map((m) => m.body)).toEqual(['1', '2', '3'])

    expect(ctx.service.markRead(ctx.a.id, ctx.b)).toEqual({ updated: 2 })
    expect(ctx.service.markRead(ctx.a.id, ctx.b)).toEqual({ updated: 0 })
    expect(
      ctx.service.listConversations(ctx.b).find((c) => c.partnerId === ctx.a.id)?.unreadCount,
    ).toBe(0)

    // 상대가 보낸 분만 읽음 처리됐는지 확인(본인 발신분 readAt은 그대로 null).
    const after = ctx.service.getConversation(ctx.a.id, ctx.b)
    expect(
      after.messages.filter((m) => m.senderId === ctx.b.id).every((m) => m.readAt === null),
    ).toBe(true)
  })

  it('본인/없는 사람/정지 계정에게는 보낼 수 없다', () => {
    expect(() => ctx.service.send({ recipientId: ctx.a.id, body: 'x' }, ctx.a)).toThrow(
      '본인에게는 쪽지를 보낼 수 없습니다.',
    )
    expect(() => ctx.service.send({ recipientId: 999, body: 'x' }, ctx.a)).toThrow(
      '받는 사람을 찾을 수 없습니다.',
    )
    ctx.auth.setSuspension(ctx.b.id, { suspended: true }, ctx.admin)
    expect(() => ctx.service.send({ recipientId: ctx.b.id, body: 'x' }, ctx.a)).toThrow(
      '받는 사람을 찾을 수 없습니다.',
    )
  })

  it('입력 검증: 본문 필수·1000자 한도, 대화 없는 상대 상세는 404', () => {
    expect(() => ctx.service.send({ recipientId: ctx.b.id, body: '  ' }, ctx.a)).toThrow(
      '쪽지 내용을 입력해 주세요.',
    )
    expect(() =>
      ctx.service.send({ recipientId: ctx.b.id, body: 'a'.repeat(1001) }, ctx.a),
    ).toThrow('쪽지는 1000자 이내여야 합니다.')

    // 대화가 없어도 실재 사용자는 이름을 해석해 빈 대화를 연다(쪽지 보내기 진입 동선).
    expect(ctx.service.getConversation(ctx.b.id, ctx.a)).toMatchObject({
      partnerName: '가입자B',
      messages: [],
    })
    expect(() => ctx.service.getConversation(12345, ctx.a)).toThrow('대화 상대를 찾을 수 없습니다.')
  })
})
