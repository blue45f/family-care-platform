import { describe, expect, it } from 'vitest'

import { ScheduleService } from './schedule.service'

import type { ScheduleStatus } from './schedule.model'

describe('ScheduleService', () => {
  it('입력 값을 정제해서 방문 일정을 생성한다', () => {
    const service = new ScheduleService()

    const created = service.create({
      recipient: '  김영희 ',
      caregiver: '  박돌봄 ',
      date: '2026-06-08',
      startTime: '09:00',
      endTime: '11:00',
      status: '예정',
      note: '  오전 방문  ',
    })

    expect(created).toMatchObject({
      id: 1,
      recipient: '김영희',
      caregiver: '박돌봄',
      date: '2026-06-08',
      startTime: '09:00',
      endTime: '11:00',
      status: '예정',
      note: '오전 방문',
    })
  })

  it('필수 필드가 비어 있으면 예외를 던진다', () => {
    const service = new ScheduleService()

    expect(() =>
      service.create({
        recipient: '',
        caregiver: '박돌봄',
        date: '2026-06-08',
        startTime: '09:00',
        endTime: '11:00',
        status: '예정',
        note: '',
      }),
    ).toThrow('recipient/caregiver/date/startTime/endTime는 필수입니다.')
  })

  it('종료 시간이 시작 시간보다 빠르면 예외를 던진다', () => {
    const service = new ScheduleService()

    expect(() =>
      service.create({
        recipient: '김영희',
        caregiver: '박돌봄',
        date: '2026-06-08',
        startTime: '14:00',
        endTime: '13:00',
        status: '예정',
        note: '',
      }),
    ).toThrow('종료 시간은 시작 시간보다 늦어야 합니다.')
  })

  it('상태를 변경하고 변경된 일정을 반환한다', () => {
    const service = new ScheduleService()
    const created = service.create({
      recipient: '김영희',
      caregiver: '박돌봄',
      date: '2026-06-08',
      startTime: '09:00',
      endTime: '11:00',
      status: '예정',
      note: '',
    })

    const updated = service.updateStatus(created.id, '완료')

    expect(updated.status).toBe('완료')
    expect(service.findAll()[0]?.status).toBe('완료')
  })

  it('지원하지 않는 상태이면 예외를 던진다', () => {
    const service = new ScheduleService()

    expect(() =>
      service.create({
        recipient: '김영희',
        caregiver: '박돌봄',
        date: '2026-06-08',
        startTime: '09:00',
        endTime: '11:00',
        status: '대기' as unknown as ScheduleStatus,
        note: '',
      }),
    ).toThrow('유효하지 않은 일정 상태입니다.')
  })
})
