import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { TermsdeskPolicy } from '../../termsdeskPolicy'
import { PolicyArticle, PolicyFallbackCard, PolicyPage } from './PolicyPage'

const policyFixture: TermsdeskPolicy = {
  policySlug: 'terms-of-service',
  name: '이용약관',
  versionLabel: 'v1',
  contentHash: '357b719cb05f8abcd385a3a74166a1b2d55b636bb163269eaa4b79f648320ff9',
  body: '제1조 (목적)\n이 이용약관은 서비스 이용 조건을 정합니다.\n\n제2조 (서비스 범위)\n- 돌봄 일정\n- 정산과 보험청구',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

describe('PolicyPage', () => {
  it('첫 렌더에서 페이지 헤더와 로딩 스켈레톤을 보여준다', () => {
    const markup = renderToStaticMarkup(
      createElement(PolicyPage, { route: '/terms', onNavigate: () => undefined }),
    )

    expect(markup).toContain('법적 고지')
    expect(markup).toContain('이용약관')
    expect(markup).toContain('정책 문서를 불러오는 중입니다.')
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain('홈으로')
  })

  it('개인정보 라우트는 routeConfig의 제목·설명을 그대로 쓴다', () => {
    const markup = renderToStaticMarkup(
      createElement(PolicyPage, { route: '/privacy', onNavigate: () => undefined }),
    )

    expect(markup).toContain('개인정보 처리방침')
    expect(markup).toContain('수집·보관·파기 정책')
  })
})

describe('PolicyArticle', () => {
  it('게시본 본문을 조항 헤딩·문단·리스트로 렌더링한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PolicyArticle, { slug: 'terms-of-service', policy: policyFixture }),
    )

    expect(markup).toContain('<h2>제1조 (목적)</h2>')
    expect(markup).toContain('이 이용약관은 서비스 이용 조건을 정합니다.')
    expect(markup).toContain('<li>돌봄 일정</li>')
    expect(markup).toContain('<li>정산과 보험청구</li>')
  })

  it('하단 신뢰 표면에 버전·시행일·해시 축약·원문 링크를 표기한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PolicyArticle, { slug: 'terms-of-service', policy: policyFixture }),
    )

    expect(markup).toContain('v1')
    expect(markup).toContain('2026년 6월 8일')
    expect(markup).toContain('>357b719cb05f</code>')
    expect(markup).not.toContain(`>${policyFixture.contentHash}</code>`)
    expect(markup).toContain('https://termsdesk.vercel.app/p/family-care-platform/terms-of-service')
    expect(markup).toContain('TermsDesk 원문에서 확인')
  })
})

describe('PolicyFallbackCard', () => {
  it('재시도 버튼과 TermsDesk 외부 폴백 링크를 함께 제공한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PolicyFallbackCard, { slug: 'privacy-policy', onRetry: () => undefined }),
    )

    expect(markup).toContain('정책 문서를 불러오지 못했습니다')
    expect(markup).toContain('다시 시도')
    expect(markup).toContain('TermsDesk 원문 열기')
    expect(markup).toContain('https://termsdesk.vercel.app/p/family-care-platform/privacy-policy')
  })
})
