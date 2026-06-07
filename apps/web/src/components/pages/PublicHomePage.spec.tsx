import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicHomePage } from './PublicHomePage'

describe('PublicHomePage', () => {
  it('비로그인 방문자에게 제품 정체성과 시작 동선을 먼저 설명한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicHomePage, { onNavigate: () => undefined }),
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
      createElement(PublicHomePage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('FAQ 검색')
    expect(markup).toContain('질문 또는 답변 내용으로 검색')
    expect(markup).toContain('데모 상담 신청')
    expect(markup).toContain('입력 내용 비우기')
  })
})
