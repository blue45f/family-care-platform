import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { InquiryPage } from './InquiryPage'

const render = () =>
  renderToStaticMarkup(createElement(InquiryPage, { onNavigate: () => undefined }))

describe('InquiryPage', () => {
  it('문의 헤더와 네 가지 카테고리 셀렉터를 노출한다', () => {
    const markup = render()
    expect(markup).toContain('문의 남기기')
    expect(markup).toContain('제휴 문의')
    expect(markup).toContain('버그 신고')
    expect(markup).toContain('사이트 의견')
    expect(markup).toContain('이용 문의')
  })

  it('제목·내용 입력과 문의 접수 버튼을 제공한다', () => {
    const markup = render()
    expect(markup).toContain('문의 접수')
    expect(markup).toContain('이메일은 비공개로 운영자만 확인합니다.')
  })

  it('첫 로드에는 공개 게시판 영역과 로딩 스켈레톤을 보여준다', () => {
    const markup = render()
    expect(markup).toContain('최근 문의')
    expect(markup).toContain('skeleton')
  })

  it('허니팟 필드를 시각적으로 숨긴 채 포함한다', () => {
    const markup = render()
    expect(markup).toContain('name="website"')
    expect(markup).toContain('입력하지 마세요')
  })
})
