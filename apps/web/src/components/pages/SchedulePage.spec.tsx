import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildPlatformDataFixture } from '../../state/platformDataFixture'

import { SchedulePage } from './SchedulePage'

import type { CareSchedule } from '../../types'

const schedule = (over: Partial<CareSchedule>): CareSchedule => ({
  id: 1,
  recipient: '김순자',
  caregiver: '박지은',
  date: '2026-06-01',
  startTime: '09:00',
  endTime: '11:00',
  status: '예정',
  note: '',
  ...over,
})

const render = (schedules: CareSchedule[]) =>
  renderToStaticMarkup(
    createElement(SchedulePage, {
      data: buildPlatformDataFixture({ schedules }),
      onNavigate: () => undefined,
    })
  )

describe('SchedulePage 담당자별 업무량', () => {
  it('일정이 있으면 담당자별 업무량 카드를 노출한다', () => {
    const markup = render([
      schedule({ id: 1, caregiver: '박지은' }),
      schedule({ id: 2, caregiver: '한미영' }),
    ])
    expect(markup).toContain('담당자별 업무량')
    expect(markup).toContain('박지은')
    expect(markup).toContain('한미영')
    expect(markup).toContain('2명')
  })

  it('일정이 없으면 업무량 카드를 렌더하지 않는다', () => {
    const markup = render([])
    expect(markup).not.toContain('담당자별 업무량')
    expect(markup).toContain('아직 등록된 방문 일정이 없습니다')
  })
})
