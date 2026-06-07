import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicCommunityPage } from './PublicCommunityPage'

describe('PublicCommunityPage', () => {
  it('커뮤니티 데모 주요 섹션을 보여준다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicCommunityPage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('커뮤니티 데모')
    expect(markup).toContain('실시간 운영형 데모')
    expect(markup).toContain('토론 목록')
    expect(markup).toContain('선택된 글 보기')
    expect(markup).toContain('데모 글 작성')
  })

  it('데모 글 작성과 댓글 입력 폼을 모두 제공한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicCommunityPage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('글 등록 (샘플 저장)')
    expect(markup).toContain('새 댓글 입력')
    expect(markup).toContain('댓글 등록')
  })

  it('소팅 및 카테고리 필터 UI를 노출한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicCommunityPage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('최신순')
    expect(markup).toContain('좋아요/댓글순')
    expect(markup).toContain('댓글 많은 순')
    expect(markup).toContain('카테고리')
    expect(markup).toContain('북마크 글')
    expect(markup).toContain('신고 사유')
  })
})
