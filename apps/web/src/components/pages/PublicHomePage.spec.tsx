import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicHomePage } from './PublicHomePage'

describe('PublicHomePage', () => {
  it('비로그인 방문자에게 제품 정체성과 시작 동선을 먼저 설명한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicHomePage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('가족 돌봄 운영 플랫폼')
    expect(markup).toContain('방문 일정부터 보험청구까지')
    expect(markup).toContain('데모 계정으로 둘러보기')
    expect(markup).toContain('로그인')
    expect(markup).toContain('회원가입')
    expect(markup).toContain('시작 가이드')
    expect(markup).toContain('요금제')
  })

  it('상세 사용 가이드 페이지로 바로갈 수 있는 요소를 노출한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicHomePage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('FAQ 검색')
    expect(markup).toContain('질문 또는 답변 내용으로 검색')
    expect(markup).toContain('데모 상담 신청')
    expect(markup).toContain('입력 내용 비우기')
  })

  it('상단 네비게이션은 핵심 동선 5개(앵커 3 + 로그인/회원가입)로 제한한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicHomePage, { onNavigate: () => undefined })
    )

    const nav = markup.match(/<nav class="public-nav-actions"[^>]*>([\s\S]*?)<\/nav>/)?.[1]
    if (!nav) throw new Error('마크업에서 public-nav-actions 네비게이션을 찾지 못했습니다')

    expect(nav.match(/<(?:a|button)[\s>]/g)).toHaveLength(5)
    expect(nav).toContain('핵심 기능')
    expect(nav).toContain('요금 안내')
    expect(nav).toContain('자주 묻는 질문')
    expect(nav).toContain('로그인')
    expect(nav).toContain('회원가입')
  })

  it('푸터가 약관·개인정보(내부 페이지)와 지원 채널(외부)·페이지 링크 묶음을 제공한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicHomePage, { onNavigate: () => undefined })
    )

    const footer = markup.match(/<footer[\s\S]*?<\/footer>/)?.[0]
    if (!footer) throw new Error('마크업에서 푸터를 찾지 못했습니다')

    expect(footer).toContain('이용약관')
    expect(footer).toContain('개인정보 처리방침')
    expect(footer).toContain('지원 채널')
    // 약관·개인정보는 내부 라우트 버튼으로 이동한다(외부 termsdesk 문서 링크 아님).
    expect(footer).not.toContain('terms-of-service')
    expect(footer).not.toContain('privacy-policy')
    // 지원 보드는 TermsDesk 중앙 채널을 외부 링크로 유지한다.
    expect(footer).toContain('https://termsdesk.vercel.app/support/family-care-platform')
    expect(footer).toContain('서비스 소개')
    expect(footer).toContain('시작 가이드')
    expect(footer).toContain('튜토리얼')
    expect(footer).toContain('커뮤니티 데모')
    expect(footer).toContain('요금제')
  })
})
