import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildPlatformDataFixture } from '../../state/platformDataFixture'

import { CarePage } from './CarePage'

import type { CareLog } from '../../types'

const careLog = (over: Partial<CareLog>): CareLog => ({
  id: 1,
  recipient: '김순자',
  caregiver: '박지은',
  type: '방문',
  date: '2026-06-01',
  note: '점심 식사 도움',
  ...over,
})

const render = (careLogs: CareLog[]) =>
  renderToStaticMarkup(
    createElement(CarePage, {
      data: buildPlatformDataFixture({ careLogs }),
      onNavigate: () => undefined,
    })
  )

describe('CarePage 목록 도구막대', () => {
  it('기록이 있으면 검색·유형 필터·정렬 도구막대를 렌더한다', () => {
    const markup = render([careLog({ id: 1 })])
    expect(markup).toContain('대상자·담당자·내용으로 검색')
    expect(markup).toContain('활동 유형 필터')
    expect(markup).toContain('최근 기록순')
    expect(markup).toContain('오래된 기록순')
  })

  it('기록이 있으면 목록과 항목을 렌더한다', () => {
    const markup = render([careLog({ id: 1, recipient: '김순자' })])
    expect(markup).toContain('김순자')
    expect(markup).toContain('점심 식사 도움')
    expect(markup).not.toContain('아직 돌봄 기록이 없습니다')
  })

  it('기록이 없으면 도구막대 없이 빈 상태만 렌더한다', () => {
    const markup = render([])
    expect(markup).not.toContain('대상자·담당자·내용으로 검색')
    expect(markup).toContain('아직 돌봄 기록이 없습니다')
  })
})
