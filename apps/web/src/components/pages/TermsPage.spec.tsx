import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TermsPage } from './TermsPage'

describe('TermsPage', () => {
  it('이용약관 핵심 섹션을 보여준다', () => {
    const markup = renderToStaticMarkup(createElement(TermsPage, { onNavigate: () => undefined }))

    expect(markup).toContain('이용약관')
    expect(markup).toContain('서비스 공개 범위')
    expect(markup).toContain('요약 한 줄')
    expect(markup).toContain('관련 페이지')
    expect(markup).toContain('개인정보 처리방침')
  })

  it('조항별 동의 섹션이 문자열로 렌더된다', () => {
    const markup = renderToStaticMarkup(createElement(TermsPage, { onNavigate: () => undefined }))

    expect(markup).toContain('약관 조항')
    expect(markup).toContain('서비스 공개 범위')
    expect(markup).toContain('필수 동의 항목이 남아 있습니다')
  })
})
