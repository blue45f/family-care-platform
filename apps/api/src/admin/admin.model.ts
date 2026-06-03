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

export type RevenuePlanDraft = Omit<RevenuePlan, 'featureFlags'> & {
  featureFlags: string[];
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
