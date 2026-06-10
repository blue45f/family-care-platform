import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchTermsdeskPolicy,
  formatPolicyDate,
  parsePolicyBody,
  policyDocumentUrl,
  shortContentHash,
} from './termsdeskPolicy'

const policyPayload = {
  orgName: 'Family Care Platform',
  policySlug: 'terms-of-service',
  name: '이용약관',
  type: 'terms',
  locale: 'ko',
  versionLabel: 'v1',
  contentHash: '357b719cb05f8abcd385a3a74166a1b2d55b636bb163269eaa4b79f648320ff9',
  body: '제1조 (목적)\n이 이용약관은 서비스 이용 조건을 정합니다.',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

const jsonResponse = (payload: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => payload }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchTermsdeskPolicy', () => {
  it('TermsDesk 공개 JSON 엔드포인트를 호출해 게시본을 돌려준다', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(policyPayload))
    vi.stubGlobal('fetch', fetchMock)

    const policy = await fetchTermsdeskPolicy('terms-of-service')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://termsdesk.vercel.app/api/public/family-care-platform/policies/terms-of-service',
      { headers: { Accept: 'application/json' } },
    )
    expect(policy.name).toBe('이용약관')
    expect(policy.versionLabel).toBe('v1')
    expect(policy.contentHash).toBe(policyPayload.contentHash)
    expect(policy.effectiveAt).toBe('2026-06-08T00:00:00.000Z')
    expect(policy.changeSummary).toBe('TermsDesk 중앙 게시본으로 이전')
  })

  it('HTTP 오류 응답이면 상태 코드를 담아 던진다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false, 503)),
    )

    await expect(fetchTermsdeskPolicy('privacy-policy')).rejects.toThrow('503')
  })

  it('필수 필드가 빠진 응답(스키마 드리프트)이면 던져서 폴백으로 보낸다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ name: '이용약관', body: '' })),
    )

    await expect(fetchTermsdeskPolicy('terms-of-service')).rejects.toThrow(
      '정책 문서 응답 형식이 올바르지 않습니다.',
    )
  })

  it('선택 필드(effectiveAt·changeSummary)가 없어도 null로 정규화한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          name: '개인정보처리방침',
          versionLabel: 'v1',
          contentHash: 'd386314b8d51',
          body: '제1조 (처리 목적)\n개인정보를 처리합니다.',
        }),
      ),
    )

    const policy = await fetchTermsdeskPolicy('privacy-policy')

    expect(policy.policySlug).toBe('privacy-policy')
    expect(policy.effectiveAt).toBeNull()
    expect(policy.publishedAt).toBeNull()
    expect(policy.changeSummary).toBeNull()
  })
})

describe('parsePolicyBody', () => {
  it('한국 법령식 본문(제N조 + 문단)을 헤딩/문단 블록으로 나눈다', () => {
    const blocks = parsePolicyBody(
      '제1조 (목적)\n이 약관은 이용 조건을 정합니다.\n\n제2조 (서비스 범위)\n돌봄 일정 기능을 제공합니다.\n추가 설명 줄.',
    )

    expect(blocks).toEqual([
      { kind: 'heading', level: 2, text: '제1조 (목적)' },
      { kind: 'paragraph', text: '이 약관은 이용 조건을 정합니다.' },
      { kind: 'heading', level: 2, text: '제2조 (서비스 범위)' },
      { kind: 'paragraph', text: '돌봄 일정 기능을 제공합니다.\n추가 설명 줄.' },
    ])
  })

  it('마크다운 헤딩과 리스트도 같은 블록 구조로 파싱한다', () => {
    const blocks = parsePolicyBody(
      '# 제목\n## 소제목\n- 항목 하나\n- 항목 둘\n\n1. 첫째\n2. 둘째\n\n본문 문단.',
    )

    expect(blocks).toEqual([
      { kind: 'heading', level: 2, text: '제목' },
      { kind: 'heading', level: 3, text: '소제목' },
      { kind: 'list', ordered: false, items: ['항목 하나', '항목 둘'] },
      { kind: 'list', ordered: true, items: ['첫째', '둘째'] },
      { kind: 'paragraph', text: '본문 문단.' },
    ])
  })

  it('구분선은 건너뛰고 CRLF 줄바꿈을 정규화한다', () => {
    const blocks = parsePolicyBody('문단 하나\r\n\r\n---\r\n\r\n문단 둘')

    expect(blocks).toEqual([
      { kind: 'paragraph', text: '문단 하나' },
      { kind: 'paragraph', text: '문단 둘' },
    ])
  })

  it('문단 중간에 등장하는 조항 인용은 헤딩으로 승격하지 않는다', () => {
    const blocks = parsePolicyBody('제3조에 따라 처리합니다.')

    expect(blocks).toEqual([{ kind: 'paragraph', text: '제3조에 따라 처리합니다.' }])
  })
})

describe('신뢰 표면 헬퍼', () => {
  it('contentHash는 앞 12자로 축약한다', () => {
    expect(shortContentHash(policyPayload.contentHash)).toBe('357b719cb05f')
  })

  it('시행일은 타임존과 무관하게 달력 날짜로 표기한다', () => {
    expect(formatPolicyDate('2026-06-08T00:00:00.000Z')).toBe('2026년 6월 8일')
    expect(formatPolicyDate(null)).toBeNull()
    expect(formatPolicyDate('잘못된 값')).toBeNull()
  })

  it('원문 링크는 TermsDesk 공개 문서 페이지를 가리킨다', () => {
    expect(policyDocumentUrl('terms-of-service')).toBe(
      'https://termsdesk.vercel.app/p/family-care-platform/terms-of-service',
    )
    expect(policyDocumentUrl('privacy-policy')).toBe(
      'https://termsdesk.vercel.app/p/family-care-platform/privacy-policy',
    )
  })
})
