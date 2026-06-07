import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PublicPlansPage } from './PublicPlansPage'

describe('PublicPlansPage', () => {
  it('요금제 페이지는 도입 단계와 전환 동선을 같이 제시한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicPlansPage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('요금제와 도입 단계를 한 번에 보여줍니다')
    expect(markup).toContain('Starter')
    expect(markup).toContain('데모 계정으로 바로 시작')
    expect(markup).toContain('센터 계정 개설하기')
  })

  it('무료 시범형 플랜부터 문의형 플랜까지 안내한다', () => {
    const markup = renderToStaticMarkup(
      createElement(PublicPlansPage, { onNavigate: () => undefined }),
    )

    expect(markup).toContain('소규모 센터, 시범 운영에 적합합니다.')
    expect(markup).toContain('연 결제 시 운영 연장 혜택')
  })
})
