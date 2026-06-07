import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('개인정보 처리방침 핵심 섹션을 보여준다', () => {
    const markup = renderToStaticMarkup(createElement(PrivacyPage, { onNavigate: () => undefined }))

    expect(markup).toContain('개인정보를 어디에, 어떻게 쓰는지 정리했습니다')
    expect(markup).toContain('적용 범위')
    expect(markup).toContain('개인정보 보호 기본 원칙')
    expect(markup).toContain('이용자 권리')
    expect(markup).toContain('관련 정책 바로가기')
  })

  it('권리 요청 데모 섹션과 요청 현황이 노출된다', () => {
    const markup = renderToStaticMarkup(createElement(PrivacyPage, { onNavigate: () => undefined }))

    expect(markup).toContain('권리 요구 처리 데모')
    expect(markup).toContain('요청 유형')
    expect(markup).toContain('요청자명')
    expect(markup).toContain('요청 현황')
    expect(markup).toContain('요청 내용')
  })
})
