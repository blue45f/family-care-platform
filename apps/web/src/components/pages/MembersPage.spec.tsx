import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../auth/AuthProvider'
import { MembersPage } from './MembersPage'

const render = () =>
  renderToStaticMarkup(
    createElement(AuthProvider, {
      children: createElement(MembersPage, { onNavigate: () => undefined }),
    }),
  )

describe('MembersPage', () => {
  it('회원 관리 헤더를 노출한다', () => {
    const markup = render()
    expect(markup).toContain('회원 관리')
    expect(markup).toContain('이용을 정지하거나 해제')
  })

  it('비관리자에게는 데이터 대신 권한 안내 빈 상태를 보여준다', () => {
    // AuthProvider 초기 상태(user 없음)는 비관리자와 동일한 화면 분기를 탄다.
    const markup = render()
    expect(markup).toContain('관리자 권한이 필요합니다')
    expect(markup).toContain('대시보드로 돌아가기')
    // 회원 통계/표는 렌더되지 않는다(헤더 설명문만 노출).
    expect(markup).not.toContain('전체 회원')
    expect(markup).not.toContain('새로고침')
  })
})
