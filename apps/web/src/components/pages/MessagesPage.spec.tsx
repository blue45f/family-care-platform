import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../auth/AuthProvider'
import { MessagesPage } from './MessagesPage'

// useLocation을 쓰므로 MemoryRouter로 감싼다. effect 미실행 → 네트워크 없이 초기 구조 검증.
const render = () =>
  renderToStaticMarkup(
    createElement(MemoryRouter, {
      children: createElement(AuthProvider, {
        children: createElement(MessagesPage, { onNavigate: () => undefined }),
      }),
    })
  )

describe('MessagesPage', () => {
  it('쪽지함 헤더와 비실시간 안내 동선을 노출한다', () => {
    const markup = render()
    expect(markup).toContain('쪽지함')
    expect(markup).toContain('1:1로 주고받은 쪽지')
  })

  it('새 쪽지 받는 사람 선택과 대화 목록 영역을 제공한다', () => {
    const markup = render()
    expect(markup).toContain('새 쪽지 받는 사람')
    expect(markup).toContain('받는 사람 선택…')
    expect(markup).toContain('대화 목록')
  })

  it('첫 로드에는 목록 스켈레톤과 대화 빈 상태를 보여준다', () => {
    const markup = render()
    expect(markup).toContain('skeleton')
    expect(markup).toContain('대화를 선택해 주세요')
  })
})
