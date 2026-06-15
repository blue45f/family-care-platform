// 운영 페이지(정산/청구/일정)에서 공유하는 순수 집계 헬퍼.
// dashboardViewModel.ts와 동일하게 React에 의존하지 않는 순수 함수로 두어
// 단위 테스트가 쉽고 SSR 렌더에도 안전하다.

import type { Claim, ClaimStatus, CareSchedule, Settlement } from '../../types'

// ── 정산: 대상자(가족)별 집계 ────────────────────────────────────────────────

export type SettlementBreakdownRow = {
  recipient: string
  count: number
  totalHours: number
  totalAmount: number
}

/**
 * 정산 내역을 대상자별로 묶어 건수·돌봄시간·정산액 합계를 만든다.
 * 정렬: 정산액 내림차순 → 동률이면 대상자명 오름차순(결정적 순서).
 */
export const buildSettlementBreakdown = (settlements: Settlement[]): SettlementBreakdownRow[] => {
  const byRecipient = new Map<string, SettlementBreakdownRow>()
  for (const item of settlements) {
    const recipient = item.recipient.trim() || '미지정'
    const row = byRecipient.get(recipient) ?? {
      recipient,
      count: 0,
      totalHours: 0,
      totalAmount: 0,
    }
    row.count += 1
    row.totalHours += Number.isFinite(item.careHours) ? item.careHours : 0
    row.totalAmount += Number.isFinite(item.totalAmount) ? item.totalAmount : 0
    byRecipient.set(recipient, row)
  }
  return [...byRecipient.values()].sort(
    (a, b) => b.totalAmount - a.totalAmount || a.recipient.localeCompare(b.recipient)
  )
}

// ── 청구: 상태별 파이프라인 집계 ─────────────────────────────────────────────

export type ClaimStatusBreakdownRow = {
  status: ClaimStatus
  count: number
  totalAmount: number
  /** 전체 건수 대비 비율(0~100, 소수 1자리). 전체가 0이면 0. */
  share: number
}

const CLAIM_STATUS_ORDER: ClaimStatus[] = ['요청', '검토중', '승인', '거절']

/**
 * 청구를 상태별로 집계한다. 항상 4개 상태를 고정 순서로 반환해(0건 포함)
 * 파이프라인 막대가 비어 보이지 않게 한다.
 */
export const buildClaimStatusBreakdown = (claims: Claim[]): ClaimStatusBreakdownRow[] => {
  const counts = new Map<ClaimStatus, { count: number; totalAmount: number }>()
  for (const status of CLAIM_STATUS_ORDER) {
    counts.set(status, { count: 0, totalAmount: 0 })
  }
  for (const claim of claims) {
    const entry = counts.get(claim.status)
    if (!entry) {
      continue
    }
    entry.count += 1
    entry.totalAmount += Number.isFinite(claim.expectedAmount) ? claim.expectedAmount : 0
  }
  const total = claims.length
  return CLAIM_STATUS_ORDER.map((status) => {
    const entry = counts.get(status) ?? { count: 0, totalAmount: 0 }
    return {
      status,
      count: entry.count,
      totalAmount: entry.totalAmount,
      share: total > 0 ? Number(((entry.count / total) * 100).toFixed(1)) : 0,
    }
  })
}

// ── 일정: 담당자별 업무량 집계 ───────────────────────────────────────────────

export type CaregiverWorkloadRow = {
  caregiver: string
  /** 취소를 제외한 유효 일정 수. */
  visitCount: number
  /** 완료된 일정 수. */
  completedCount: number
  /** 취소를 제외한 일정의 총 예정 시간(시간 단위, 소수 1자리). */
  totalHours: number
}

// "HH:mm" 두 개로 시간(소수)을 계산한다. 종료<시작 같은 비정상 입력은 0으로 눌러
// 합계가 깨지지 않게 한다(폼 검증이 막지만 방어적으로).
const hoursBetween = (start: string, end: string): number => {
  const toMinutes = (value: string): number | null => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
    if (!match) {
      return null
    }
    return Number(match[1]) * 60 + Number(match[2])
  }
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  if (startMin === null || endMin === null || endMin <= startMin) {
    return 0
  }
  return (endMin - startMin) / 60
}

/**
 * 방문 일정을 담당자별로 묶어 업무량을 집계한다. 취소 일정은 시간/건수에서 제외한다.
 * 정렬: 유효 일정 수 내림차순 → 동률이면 담당자명 오름차순.
 */
export const buildCaregiverWorkload = (schedules: CareSchedule[]): CaregiverWorkloadRow[] => {
  const byCaregiver = new Map<string, CaregiverWorkloadRow>()
  for (const schedule of schedules) {
    const caregiver = schedule.caregiver.trim() || '미지정'
    const row = byCaregiver.get(caregiver) ?? {
      caregiver,
      visitCount: 0,
      completedCount: 0,
      totalHours: 0,
    }
    if (schedule.status !== '취소') {
      row.visitCount += 1
      row.totalHours += hoursBetween(schedule.startTime, schedule.endTime)
    }
    if (schedule.status === '완료') {
      row.completedCount += 1
    }
    byCaregiver.set(caregiver, row)
  }
  return [...byCaregiver.values()]
    .map((row) => ({ ...row, totalHours: Number(row.totalHours.toFixed(1)) }))
    .sort((a, b) => b.visitCount - a.visitCount || a.caregiver.localeCompare(b.caregiver))
}
