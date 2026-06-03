import { describe, expect, it } from 'vitest'

import {
  TREND_SOURCE_SERVER,
  calculateTrendDelta,
  claimStatusClass,
  formatWon,
  roundMoney,
  trendDirectionLabel,
} from './utils'

describe('web utils', () => {
  it('원화 포맷은 천 단위 구분자를 포함한다', () => {
    expect(formatWon(10500)).toBe('10,500원')
    expect(roundMoney(10500.4)).toBe(10500)
  })

  it('트렌드 계산은 증가율을 정수 기반 퍼센트로 계산한다', () => {
    expect(calculateTrendDelta(120, 100)).toMatchObject({
      delta: 20,
      deltaRate: 20,
      direction: 'up',
    })
  })

  it('청구 상태는 UI 클래스명으로 매핑된다', () => {
    expect(claimStatusClass('승인')).toBe('status-approved')
  })

  it('트렌드 소스 상수는 유효한 값이어야 한다', () => {
    expect(TREND_SOURCE_SERVER).toBe('server')
  })

  it('방향 라벨은 방향 값에 따라 변환된다', () => {
    expect(trendDirectionLabel('down')).toBe('하락')
  })
})
