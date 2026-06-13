import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicOverviewPage } from './PublicOverviewPage'

describe('PublicOverviewPage', () => {
  it('서비스 개요와 도입 단계 가이드를 모두 제시한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicOverviewPage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('돌봄 운영을 반복 가능한 루틴으로 바꾸는 구조')
    expect(markup).toContain('확장형 도입')
    expect(markup).toContain('센터 규모에 맞춰 단계적으로 확장합니다')
    expect(markup).toContain('사용 가이드 보기')
  })

  it('기대 고객 역할별 필요 기능을 설명한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicOverviewPage, { onNavigate: () => undefined })
    )

    expect(markup).toContain('센터 운영자')
    expect(markup).toContain('행정·회계 담당자')
    expect(markup).toContain('센터장')
  })
})
