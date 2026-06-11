import { beforeEach, describe, expect, it } from 'vitest'

import { SupportService } from './support.service'
import type { AuthenticatedUser } from '../auth/auth.model'

const guardian: AuthenticatedUser = {
  id: 20,
  email: 'guardian@example.com',
  name: '박보호',
  role: 'operator',
}
const stranger: AuthenticatedUser = {
  id: 21,
  email: 'stranger@example.com',
  name: '남남',
  role: 'operator',
}
const staff: AuthenticatedUser = {
  id: 1,
  email: 'admin@example.com',
  name: '데모 관리자',
  role: 'admin',
}

describe('SupportService', () => {
  let service: SupportService

  beforeEach(() => {
    service = new SupportService()
  })

  it('이용자는 본인 스레드만, 운영팀은 전체 스레드를 본다', () => {
    const created = service.createThread({ subject: '문의', message: '안녕하세요' }, guardian)

    const mine = service.listThreads(guardian)
    expect(mine.map((t) => t.id)).toEqual([created.id])
    expect(mine[0].messageCount).toBe(1)
    expect(mine[0].lastMessagePreview).toBe('안녕하세요')

    // 시드 스레드(다른 이용자) + 방금 만든 스레드 둘 다 보인다.
    expect(service.listThreads(staff).length).toBeGreaterThanOrEqual(2)
    expect(service.listThreads(stranger)).toHaveLength(0)
  })

  it('스레드 상세는 소유자/운영팀만 보고, 남의 스레드는 404로 숨긴다', () => {
    const created = service.createThread({ subject: '제목', message: '본문' }, guardian)
    expect(service.getThread(created.id, guardian).messages).toHaveLength(1)
    expect(service.getThread(created.id, staff).subject).toBe('제목')
    expect(() => service.getThread(created.id, stranger)).toThrow('상담을 찾을 수 없습니다.')
  })

  it('운영팀 답장은 staff 발신으로 기록되고 lastMessageAt이 갱신된다', () => {
    const created = service.createThread(
      { subject: '교체 문의', message: '요청드립니다' },
      guardian,
    )
    const before = service.getThread(created.id, guardian).lastMessageAt

    const reply = service.addMessage(created.id, { body: '확인 후 안내드릴게요' }, staff)
    expect(reply.senderRole).toBe('staff')

    const detail = service.getThread(created.id, guardian)
    expect(detail.messages.map((m) => m.senderRole)).toEqual(['user', 'staff'])
    expect(detail.lastMessageAt >= before).toBe(true)
  })

  it('종료된 스레드에는 메시지를 보낼 수 없고, 재개하면 다시 보낼 수 있다', () => {
    const created = service.createThread({ subject: '종료 테스트', message: '시작' }, guardian)

    const closed = service.setStatus(created.id, { status: 'closed' }, guardian)
    expect(closed.status).toBe('closed')
    expect(() => service.addMessage(created.id, { body: '추가' }, guardian)).toThrow(
      '종료된 상담에는 메시지를 보낼 수 없습니다.',
    )

    service.setStatus(created.id, { status: 'open' }, staff)
    expect(service.addMessage(created.id, { body: '재개 후' }, guardian).senderRole).toBe('user')
    expect(() => service.setStatus(created.id, { status: 'paused' }, staff)).toThrow(
      '유효하지 않은 상담 상태입니다.',
    )
  })

  it('입력 검증: 제목/내용 필수와 길이 한도를 강제한다', () => {
    expect(() => service.createThread({ subject: ' ', message: '내용' }, guardian)).toThrow(
      '상담 제목을 입력해 주세요.',
    )
    expect(() =>
      service.createThread({ subject: '제목', message: 'a'.repeat(2001) }, guardian),
    ).toThrow('상담 내용은 2000자 이내여야 합니다.')
    const created = service.createThread({ subject: '제목', message: '내용' }, guardian)
    expect(() => service.addMessage(created.id, { body: '  ' }, guardian)).toThrow(
      '메시지 내용을 입력해 주세요.',
    )
  })
})
