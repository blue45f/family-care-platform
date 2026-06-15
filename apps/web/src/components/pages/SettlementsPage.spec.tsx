import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildPlatformDataFixture } from '../../state/platformDataFixture'

import { SettlementsPage } from './SettlementsPage'

import type { Settlement } from '../../types'

const settlement = (over: Partial<Settlement>): Settlement => ({
  id: 1,
  recipient: '김순자',
  date: '2026-06-01',
  careHours: 2,
  baseRate: 15000,
  totalAmount: 30000,
  note: '',
  ...over,
})

const render = (settlements: Settlement[]) =>
  renderToStaticMarkup(
    createElement(SettlementsPage, {
      data: buildPlatformDataFixture({ settlements }),
      onNavigate: () => undefined,
    })
  )

describe('SettlementsPage 가족별 정산 요약', () => {
  it('정산이 있으면 가족별 요약 카드를 노출한다', () => {
    const markup = render([
      settlement({ id: 1, recipient: '김순자', totalAmount: 30000 }),
      settlement({ id: 2, recipient: '이정호', totalAmount: 45000 }),
    ])
    expect(markup).toContain('가족별 정산 요약')
    expect(markup).toContain('2가구')
    expect(markup).toContain('이정호')
  })

  it('정산이 없으면 요약 카드를 렌더하지 않는다', () => {
    const markup = render([])
    expect(markup).not.toContain('가족별 정산 요약')
    // 기존 빈 상태는 유지된다.
    expect(markup).toContain('정산 내역이 쌓이기 전입니다')
  })
})
