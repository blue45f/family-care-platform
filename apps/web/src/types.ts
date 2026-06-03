// 도메인 타입은 @family-care/shared가 단일 소스(api .model.ts와 공유).
// web 전용 별칭(*Draft)만 여기서 유지한다.
export type {
  CareLogType,
  CareLog,
  Settlement,
  ClaimStatus,
  Claim,
  RevenuePlanId,
  RevenuePlan,
  AdminMonthlyTrendDataSource,
  AdminMonthlyTrend,
  AdminOverview,
} from '@family-care/shared';

import type { CareLog, Settlement, Claim, RevenuePlan, RevenuePlanId } from '@family-care/shared';

export type CareLogDraft = Omit<CareLog, 'id'>;

export type SettlementDraft = Omit<Settlement, 'id' | 'totalAmount'>;

export type ClaimDraft = Omit<Claim, 'id'>;

export type RevenuePlanDraft = Omit<RevenuePlan, 'id'> & {
  id: RevenuePlanId;
};
