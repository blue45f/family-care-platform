import { describe, expect, it } from 'vitest'

import { CareLogService } from './care-logs.service'
import type { CareLogType } from './care-log.model'

describe('CareLogService', () => {
  it('입력 값을 정제해서 돌봄 기록을 생성한다', () => {
    const service = new CareLogService()
    const created = service.create({
      recipient: '  김보호자 ',
      caregiver: '  박돌봄 ',
      type: '방문',
      date: '2025-01-01',
      note: '  투약 확인  ',
    })

    expect(created.recipient).toBe('김보호자')
    expect(created.caregiver).toBe('박돌봄')
    expect(created.note).toBe('투약 확인')
  })

  it('필수 필드가 비어 있으면 예외를 던진다', () => {
    const service = new CareLogService()

    expect(() =>
      service.create({
        recipient: '',
        caregiver: '   ',
        type: '방문',
        date: '2025-01-01',
        note: 'note',
      })
    ).toThrow('recipient/caregiver/note는 필수입니다.')
  })

  it('지원하지 않는 활동 유형이면 예외를 던진다', () => {
    const service = new CareLogService()

    expect(() =>
      service.create({
        recipient: '김보호자',
        caregiver: '박돌봄',
        type: '식단' as unknown as CareLogType,
        date: '2025-01-01',
        note: '메모',
      })
    ).toThrow('유효하지 않은 돌봄 활동 유형입니다.')
  })
})
