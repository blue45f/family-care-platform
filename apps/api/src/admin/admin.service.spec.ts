import { describe, expect, it } from 'vitest'

import { AdminService } from './admin.service'
import { CareLogService } from '../care-logs/care-logs.service'
import { ClaimsService } from '../claims/claims.service'
import { SettlementService } from '../settlements/settlement.service'

describe('AdminService', () => {
  it('초기 요약 정보를 계산한다', () => {
    const service = new AdminService(
      new CareLogService(),
      new SettlementService(),
      new ClaimsService(),
    )
    const overview = service.getOverview()

    expect(overview.activeHouseholds).toBe(0)
    expect(overview.totalClaims).toBe(0)
    expect(overview.monthlyTrend).toHaveLength(3)
  })

  it('요금제를 조회하면 월 요금 내림차순 정렬로 반환한다', () => {
    const service = new AdminService(
      new CareLogService(),
      new SettlementService(),
      new ClaimsService(),
    )
    const plans = service.getPlans()

    expect(plans[0].monthlyPrice).toBeGreaterThan(plans[1].monthlyPrice)
    expect(plans[1].monthlyPrice).toBeGreaterThanOrEqual(plans[2].monthlyPrice)
  })
})
