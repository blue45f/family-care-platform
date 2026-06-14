import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../auth/AuthProvider'

import { SupportPage } from './SupportPage'

const render = () =>
  renderToStaticMarkup(
    createElement(AuthProvider, {
      children: createElement(SupportPage, { onNavigate: () => undefined }),
    })
  )

describe('SupportPage', () => {
  it('상담 헤더와 새 상담 시작 동선을 노출한다', () => {
    const markup = render()
    expect(markup).toContain('1:1 상담')
    expect(markup).toContain('새 상담 시작')
    expect(markup).toContain('운영팀')
  })

  it('첫 로드에는 목록 스켈레톤과 상담 선택 빈 상태를 보여준다', () => {
    const markup = render()
    expect(markup).toContain('skeleton')
    expect(markup).toContain('상담을 선택해 주세요')
  })

  it('커뮤니티 게시판으로 이어지는 교차 동선을 제공한다', () => {
    const markup = render()
    expect(markup).toContain('커뮤니티 게시판')
  })
})
