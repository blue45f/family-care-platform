import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../auth/AuthProvider'

import { CommunityPage } from './CommunityPage'

// 초기(데이터 로드 전) 렌더 검증 — effect는 실행되지 않으므로 네트워크 없이 구조만 확인한다.
const render = () =>
  renderToStaticMarkup(
    createElement(AuthProvider, {
      children: createElement(CommunityPage, { onNavigate: () => undefined }),
    })
  )

describe('CommunityPage', () => {
  it('게시판 헤더와 새 글 쓰기 동선을 노출한다', () => {
    const markup = render()
    expect(markup).toContain('커뮤니티')
    expect(markup).toContain('보호자와 간병인이')
    expect(markup).toContain('새 글 쓰기')
  })

  it('검색·카테고리 필터(정보공유/질문/간병후기)를 제공한다', () => {
    const markup = render()
    expect(markup).toContain('게시글 검색')
    expect(markup).toContain('전체')
    expect(markup).toContain('정보공유')
    expect(markup).toContain('질문')
    expect(markup).toContain('간병후기')
    expect(markup).toContain('aria-pressed')
  })

  it('첫 로드에는 목록 스켈레톤과 상세 빈 상태를 보여준다', () => {
    const markup = render()
    expect(markup).toContain('skeleton')
    expect(markup).toContain('글을 선택해 주세요')
  })
})
