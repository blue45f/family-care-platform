import { describe, expect, it } from 'vitest'

import {
  COMMUNITY_ATTACHMENT_MAX_BYTES,
  COMMUNITY_ATTACHMENT_MAX_COUNT,
  COMMUNITY_IMAGE_MAX_DIMENSION,
  careLogTypes,
  claimStatusSchema,
  claimStatuses,
  communityAttachmentKind,
  communityAttachmentMimeTypes,
  communityCategories,
  conversationKey,
  dataUrlByteSize,
  MESSAGE_BODY_MAX,
  revenuePlanDraftSchema,
  revenuePlanIds,
  scheduleStatuses,
  supportSenderRoles,
  supportThreadStatuses,
} from './index'

describe('@family-care/shared 도메인 계약', () => {
  it('careLogTypes/claimStatuses/revenuePlanIds 리터럴이 고정되어 있다', () => {
    expect(careLogTypes).toEqual(['방문', '원격상담', '투약', '식사관리', '기타'])
    expect(claimStatuses).toEqual(['요청', '검토중', '승인', '거절'])
    expect(scheduleStatuses).toEqual(['예정', '진행중', '완료', '취소'])
    expect(revenuePlanIds).toEqual(['starter', 'pro', 'enterprise'])
  })

  it('커뮤니티/상담 리터럴과 첨부 한도가 고정되어 있다', () => {
    expect(communityCategories).toEqual(['정보공유', '질문', '간병후기'])
    expect(communityAttachmentMimeTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ])
    expect(COMMUNITY_ATTACHMENT_MAX_BYTES).toBe(2 * 1024 * 1024)
    expect(COMMUNITY_ATTACHMENT_MAX_COUNT).toBe(4)
    expect(COMMUNITY_IMAGE_MAX_DIMENSION).toBe(1600)
    expect(supportThreadStatuses).toEqual(['open', 'closed'])
    expect(supportSenderRoles).toEqual(['user', 'staff'])
  })

  it('communityAttachmentKind는 허용 형식만 분류한다', () => {
    expect(communityAttachmentKind('image/jpeg')).toBe('image')
    expect(communityAttachmentKind('image/png')).toBe('image')
    expect(communityAttachmentKind('image/webp')).toBe('image')
    expect(communityAttachmentKind('application/pdf')).toBe('pdf')
    expect(communityAttachmentKind('image/gif')).toBeNull()
    expect(communityAttachmentKind('text/html')).toBeNull()
  })

  it('dataUrlByteSize는 base64 본문 크기를 추정한다', () => {
    // 'hi' → aGk= (패딩 1) = 2바이트
    expect(dataUrlByteSize('data:image/png;base64,aGk=')).toBe(2)
    // 'hello' → aGVsbG8= = 5바이트
    expect(dataUrlByteSize('data:application/pdf;base64,aGVsbG8=')).toBe(5)
    expect(dataUrlByteSize('not-a-data-url')).toBe(0)
    expect(dataUrlByteSize('data:image/png;base64,')).toBe(0)
  })

  it('쪽지 본문 한도와 대화 키 규칙이 고정되어 있다', () => {
    expect(MESSAGE_BODY_MAX).toBe(1000)
    // 대화 키는 참여자 순서와 무관하게 동일하다(목록 묶기의 단일 소스).
    expect(conversationKey(3, 7)).toBe('3:7')
    expect(conversationKey(7, 3)).toBe('3:7')
    expect(conversationKey(5, 5)).toBe('5:5')
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
      }).error?.issues[0]?.message
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
      }).error?.issues[0]?.message
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
      }).error?.issues[0]?.message
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
      }).error?.issues[0]?.message
    ).toBe('활성 고객 수는 0 이상의 정수여야 합니다.')
  })
})
