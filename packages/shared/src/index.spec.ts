import { describe, expect, it } from 'vitest'

import {
  careLogTypes,
  claimStatusSchema,
  claimStatuses,
  revenuePlanDraftSchema,
  revenuePlanIds,
} from './index'

describe('@family-care/shared 도메인 계약', () => {
  it('careLogTypes/claimStatuses/revenuePlanIds 리터럴이 고정되어 있다', () => {
    expect(careLogTypes).toEqual(['방문', '원격상담', '투약', '식사관리', '기타'])
    expect(claimStatuses).toEqual(['요청', '검토중', '승인', '거절'])
    expect(revenuePlanIds).toEqual(['starter', 'pro', 'enterprise'])
  })

  it('claimStatusSchema는 잘못된 상태를 동일 메시지로 거절한다', () => {
    expect(claimStatusSchema.parse('승인')).toBe('승인')
    const result = claimStatusSchema.safeParse('보류')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('유효하지 않은 청구 상태입니다.')
  })

  it('revenuePlanDraftSchema는 기존 검증 규칙(범위·메시지)을 유지한다', () => {
    const valid = revenuePlanDraftSchema.safeParse({
      id: 'pro',
      name: '프로',
      monthlyPrice: 50000,
      annualDiscountRate: 0.1,
      activeClients: 12,
      description: '설명',
      featureFlags: ['a'],
    })
    expect(valid.success).toBe(true)

    expect(
      revenuePlanDraftSchema.safeParse({
        id: 'pro',
        name: '  ',
        monthlyPrice: 50000,
        annualDiscountRate: 0.1,
        activeClients: 12,
        description: '',
        featureFlags: [],
      }).error?.issues[0]?.message,
    ).toBe('요금제 이름은 필수입니다.')

    expect(
      revenuePlanDraftSchema.safeParse({
        id: 'pro',
        name: '프로',
        monthlyPrice: 0,
        annualDiscountRate: 0.1,
        activeClients: 12,
        description: '',
        featureFlags: [],
      }).error?.issues[0]?.message,
    ).toBe('월 요금은 0보다 커야 합니다.')

    expect(
      revenuePlanDraftSchema.safeParse({
        id: 'pro',
        name: '프로',
        monthlyPrice: 50000,
        annualDiscountRate: 1.2,
        activeClients: 12,
        description: '',
        featureFlags: [],
      }).error?.issues[0]?.message,
    ).toBe('연 할인율은 0~0.95 범위여야 합니다.')

    expect(
      revenuePlanDraftSchema.safeParse({
        id: 'pro',
        name: '프로',
        monthlyPrice: 50000,
        annualDiscountRate: 0.1,
        activeClients: 1.5,
        description: '',
        featureFlags: [],
      }).error?.issues[0]?.message,
    ).toBe('활성 고객 수는 0 이상의 정수여야 합니다.')
  })
})
