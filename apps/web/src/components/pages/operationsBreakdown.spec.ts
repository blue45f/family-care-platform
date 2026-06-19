import { describe, expect, it } from 'vitest'

import {
  buildCaregiverWorkload,
  buildClaimShareText,
  buildClaimStatusBreakdown,
  buildSettlementBreakdown,
  buildSettlementShareText,
} from './operationsBreakdown'

import type { Claim, CareSchedule, Settlement } from '../../types'

const settlement = (over: Partial<Settlement>): Settlement => ({
  id: 1,
  recipient: '김순자',
  date: '2026-06-01',
  careHours: 2,
  baseRate: 15000,
  totalAmount: 30000,
  note: '',
  ...over,
})

const claim = (over: Partial<Claim>): Claim => ({
  id: 1,
  recipient: '김순자',
  claimType: '요양급여',
  expectedAmount: 100000,
  hospitalName: '서울병원',
  issueDate: '2026-06-01',
  status: '요청',
  note: '',
  ...over,
})

const schedule = (over: Partial<CareSchedule>): CareSchedule => ({
  id: 1,
  recipient: '김순자',
  caregiver: '박지은',
  date: '2026-06-01',
  startTime: '09:00',
  endTime: '11:00',
  status: '예정',
  note: '',
  ...over,
})

describe('buildSettlementBreakdown', () => {
  it('대상자별로 건수·시간·금액을 합산한다', () => {
    const rows = buildSettlementBreakdown([
      settlement({ id: 1, recipient: '김순자', careHours: 2, totalAmount: 30000 }),
      settlement({ id: 2, recipient: '김순자', careHours: 3, totalAmount: 45000 }),
      settlement({ id: 3, recipient: '이정호', careHours: 1, totalAmount: 18000 }),
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ recipient: '김순자', count: 2, totalHours: 5, totalAmount: 75000 })
    expect(rows[1]).toEqual({ recipient: '이정호', count: 1, totalHours: 1, totalAmount: 18000 })
  })

  it('정산액 내림차순으로 정렬한다', () => {
    const rows = buildSettlementBreakdown([
      settlement({ id: 1, recipient: '소액', totalAmount: 10000 }),
      settlement({ id: 2, recipient: '고액', totalAmount: 90000 }),
    ])
    expect(rows.map((r) => r.recipient)).toEqual(['고액', '소액'])
  })

  it('빈 대상자명은 미지정으로 묶고, NaN 금액은 0으로 처리한다', () => {
    const rows = buildSettlementBreakdown([
      settlement({ id: 1, recipient: '  ', totalAmount: Number.NaN, careHours: Number.NaN }),
    ])
    expect(rows[0]).toEqual({ recipient: '미지정', count: 1, totalHours: 0, totalAmount: 0 })
  })

  it('빈 배열은 빈 결과를 반환한다', () => {
    expect(buildSettlementBreakdown([])).toEqual([])
  })
})

describe('buildClaimStatusBreakdown', () => {
  it('4개 상태를 항상 고정 순서로 반환한다(0건 포함)', () => {
    const rows = buildClaimStatusBreakdown([])
    expect(rows.map((r) => r.status)).toEqual(['요청', '검토중', '승인', '거절'])
    expect(rows.every((r) => r.count === 0 && r.totalAmount === 0 && r.share === 0)).toBe(true)
  })

  it('상태별 건수·금액·비율을 계산한다', () => {
    const rows = buildClaimStatusBreakdown([
      claim({ id: 1, status: '승인', expectedAmount: 100000 }),
      claim({ id: 2, status: '승인', expectedAmount: 50000 }),
      claim({ id: 3, status: '요청', expectedAmount: 30000 }),
      claim({ id: 4, status: '거절', expectedAmount: 20000 }),
    ])
    const approved = rows.find((r) => r.status === '승인')
    expect(approved).toEqual({ status: '승인', count: 2, totalAmount: 150000, share: 50 })
    const request = rows.find((r) => r.status === '요청')
    expect(request?.share).toBe(25)
  })
})

describe('buildCaregiverWorkload', () => {
  it('담당자별 유효 일정·완료 수·시간을 집계한다(취소 제외)', () => {
    const rows = buildCaregiverWorkload([
      schedule({
        id: 1,
        caregiver: '박지은',
        startTime: '09:00',
        endTime: '11:00',
        status: '완료',
      }),
      schedule({
        id: 2,
        caregiver: '박지은',
        startTime: '13:00',
        endTime: '14:30',
        status: '예정',
      }),
      schedule({
        id: 3,
        caregiver: '박지은',
        startTime: '15:00',
        endTime: '16:00',
        status: '취소',
      }),
      schedule({
        id: 4,
        caregiver: '한미영',
        startTime: '10:00',
        endTime: '12:00',
        status: '진행중',
      }),
    ])
    const jieun = rows.find((r) => r.caregiver === '박지은')
    expect(jieun).toEqual({
      caregiver: '박지은',
      visitCount: 2,
      completedCount: 1,
      totalHours: 3.5,
    })
    const miyoung = rows.find((r) => r.caregiver === '한미영')
    expect(miyoung).toEqual({
      caregiver: '한미영',
      visitCount: 1,
      completedCount: 0,
      totalHours: 2,
    })
  })

  it('유효 일정 수 내림차순으로 정렬한다', () => {
    const rows = buildCaregiverWorkload([
      schedule({ id: 1, caregiver: '소수' }),
      schedule({ id: 2, caregiver: '다수' }),
      schedule({ id: 3, caregiver: '다수' }),
    ])
    expect(rows.map((r) => r.caregiver)).toEqual(['다수', '소수'])
  })

  it('잘못된 시간 형식은 0시간으로 처리한다', () => {
    const rows = buildCaregiverWorkload([
      schedule({ id: 1, caregiver: '박지은', startTime: '11:00', endTime: '09:00' }),
    ])
    expect(rows[0].totalHours).toBe(0)
    expect(rows[0].visitCount).toBe(1)
  })
})

describe('buildSettlementShareText', () => {
  it('가족별 합계와 총합을 평문 요약으로 만든다', () => {
    const text = buildSettlementShareText([
      settlement({ id: 1, recipient: '김순자', totalAmount: 30000 }),
      settlement({ id: 2, recipient: '김순자', totalAmount: 60000 }),
      settlement({ id: 3, recipient: '이정호', totalAmount: 45000 }),
    ])
    expect(text).toContain('가족별 정산 요약 (2가구)')
    expect(text).toContain('- 김순자: 2건 · 90,000원')
    expect(text).toContain('- 이정호: 1건 · 45,000원')
    expect(text).toContain('합계 135,000원')
  })

  it('내역이 없으면 안내 문구를 반환한다', () => {
    expect(buildSettlementShareText([])).toBe('아직 정산 내역이 없습니다.')
  })
})

describe('buildClaimShareText', () => {
  it('상태별 건수와 승인률을 평문 요약으로 만든다', () => {
    const text = buildClaimShareText([
      claim({ id: 1, status: '승인', expectedAmount: 100000 }),
      claim({ id: 2, status: '요청', expectedAmount: 50000 }),
    ])
    expect(text).toContain('보험청구 현황 (전체 2건)')
    expect(text).toContain('- 승인: 1건 · 100,000원')
    expect(text).toContain('- 요청: 1건 · 50,000원')
    expect(text).toContain('승인률 50%')
  })

  it('내역이 없으면 안내 문구를 반환한다', () => {
    expect(buildClaimShareText([])).toBe('아직 보험청구 내역이 없습니다.')
  })
})
