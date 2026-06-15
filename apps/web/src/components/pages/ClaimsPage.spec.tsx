import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildPlatformDataFixture } from '../../state/platformDataFixture'

import { ClaimsPage } from './ClaimsPage'

import type { Claim } from '../../types'

const claim = (over: Partial<Claim>): Claim => ({
  id: 1,
  recipient: '김순자',
  claimType: '요양급여',
  expectedAmount: 100000,
  hospitalName: '서울병원',
  issueDate: '2026-06-01',
  status: '요청',
  note: '',
  ...over,
})

const render = (claims: Claim[]) =>
  renderToStaticMarkup(
    createElement(ClaimsPage, {
      data: buildPlatformDataFixture({ claims }),
      onNavigate: () => undefined,
    })
  )

describe('ClaimsPage 상태 파이프라인', () => {
  it('청구가 있으면 상태 파이프라인 카드를 노출한다(4개 상태 모두)', () => {
    const markup = render([claim({ id: 1, status: '승인' }), claim({ id: 2, status: '요청' })])
    expect(markup).toContain('청구 상태 파이프라인')
    expect(markup).toContain('요청')
    expect(markup).toContain('검토중')
    expect(markup).toContain('승인')
    expect(markup).toContain('거절')
  })

  it('청구가 없으면 파이프라인 카드를 렌더하지 않는다', () => {
    const markup = render([])
    expect(markup).not.toContain('청구 상태 파이프라인')
    expect(markup).toContain('아직 등록된 보험청구가 없어요')
  })
})
