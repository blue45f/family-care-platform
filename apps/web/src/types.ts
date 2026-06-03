export type CareLogType = '방문' | '원격상담' | '투약' | '식사관리' | '기타';

export type CareLog = {
  id: number;
  recipient: string;
  caregiver: string;
  type: CareLogType;
  date: string;
  note: string;
};

export type CareLogDraft = Omit<CareLog, 'id'>;

export type Settlement = {
  id: number;
  recipient: string;
  date: string;
  careHours: number;
  baseRate: number;
  totalAmount: number;
  note: string;
};

export type SettlementDraft = Omit<Settlement, 'id' | 'totalAmount'>;

export type ClaimStatus = '요청' | '검토중' | '승인' | '거절';

export type Claim = {
  id: number;
  recipient: string;
  claimType: string;
  expectedAmount: number;
  hospitalName: string;
  issueDate: string;
  status: ClaimStatus;
  note: string;
};

export type ClaimDraft = Omit<Claim, 'id'>;

export type RevenuePlanId = 'starter' | 'pro' | 'enterprise';

export type RevenuePlan = {
  id: RevenuePlanId;
  name: string;
  monthlyPrice: number;
  annualDiscountRate: number;
  activeClients: number;
  description: string;
  featureFlags: string[];
};

export type RevenuePlanDraft = Omit<RevenuePlan, 'id'> & {
  id: RevenuePlanId;
};

export type AdminMonthlyTrendDataSource = 'server' | 'client-fallback';

export type AdminMonthlyTrend = {
  month: string;
  settlementTotal: number;
  claimCount: number;
  approvedClaimCount: number;
  approvalRate: number;
};

export type AdminOverview = {
  activeHouseholds: number;
  thisMonthSettlement: number;
  approvedClaims: number;
  totalClaims: number;
  averageSettlement: number;
  monthlyRecurringRevenue: number;
  conversionRate: number;
  planTakeRate: number;
  monthlyTrend: AdminMonthlyTrend[];
  monthlyTrendSource: AdminMonthlyTrendDataSource;
};
