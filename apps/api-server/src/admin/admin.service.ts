import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CareLogService } from '../care-logs/care-logs.service';
import { ClaimsService } from '../claims/claims.service';
import { localMonthKey } from '../common/date.util';
import { SettlementService } from '../settlements/settlement.service';

import type {
  AdminMonthlyTrend,
  AdminOverview,
  RevenuePlan,
  RevenuePlanDraft,
} from './admin.model';

const initialPlans: RevenuePlan[] = [
  {
    id: 'starter',
    name: 'Starter Family',
    monthlyPrice: 120000,
    annualDiscountRate: 0.1,
    activeClients: 18,
    description: '돌봄 기록·정산 기본 관리',
    featureFlags: ['돌봄 기록', '일반 정산'],
  },
  {
    id: 'pro',
    name: 'Pro Care Manager',
    monthlyPrice: 240000,
    annualDiscountRate: 0.16,
    activeClients: 72,
    description: '보험청구 자동 추적 + 승인 알림',
    featureFlags: ['돌봄 기록', '정산 자동화', '보험청구', '어드민 대시보드'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Center',
    monthlyPrice: 420000,
    annualDiscountRate: 0.2,
    activeClients: 24,
    description: '센터 운영 대규모 배치 운영',
    featureFlags: ['전담 관리자', '매출 분석', '커스터마이징'],
  },
];

@Injectable()
export class AdminService {
  private readonly plans = initialPlans.map((plan) => ({ ...plan }));

  constructor(
    private readonly careLogService: CareLogService,
    private readonly settlementService: SettlementService,
    private readonly claimsService: ClaimsService,
  ) {}

  private getRecentMonthKeys(monthCount = 3): string[] {
    const now = new Date();
    return Array.from({ length: monthCount }, (_, index) => {
      const cursor = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      return `${cursor.getFullYear()}-${month}`;
    });
  }

  private safeRate(count: number, total: number): number {
    return total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
  }

  getOverview(): AdminOverview {
    const careLogs = this.careLogService.findAll();
    const settlements = this.settlementService.findAll();
    const claims = this.claimsService.findAll();

    const activeHouseholdsByDataSource = new Set([
      ...careLogs.map((entry) => entry.recipient.trim()).filter(Boolean),
      ...settlements.map((entry) => entry.recipient.trim()).filter(Boolean),
    ]);
    const activeHouseholds = activeHouseholdsByDataSource.size;

    const totalClaims = claims.length;
    const approvedClaims = claims.filter((claim) => claim.status === '승인').length;
    const conversionRate = this.safeRate(approvedClaims, totalClaims);

    const monthKey = localMonthKey();
    const thisMonthSettlement = settlements
      .filter((settlement) => settlement.date.startsWith(monthKey))
      .reduce((sum, settlement) => sum + settlement.totalAmount, 0);

    const settlementTotal = settlements.reduce((sum, settlement) => sum + settlement.totalAmount, 0);
    const averageSettlement = settlements.length ? Math.round(settlementTotal / settlements.length) : 0;

    const monthlyTrend: AdminMonthlyTrend[] = this.getRecentMonthKeys(3).map((month) => {
      const claimsByMonth = claims.filter((claim) => claim.issueDate.startsWith(month));
      const settlementsByMonth = settlements.filter((settlement) => settlement.date.startsWith(month));
      const monthApprovedClaims = claimsByMonth.filter((claim) => claim.status === '승인').length;
      return {
        month,
        settlementTotal: settlementsByMonth.reduce((sum, settlement) => sum + settlement.totalAmount, 0),
        claimCount: claimsByMonth.length,
        approvedClaimCount: monthApprovedClaims,
        approvalRate: this.safeRate(monthApprovedClaims, claimsByMonth.length),
      };
    });

    const monthlyRecurringRevenue = this.plans.reduce((sum, plan) => sum + plan.monthlyPrice * plan.activeClients, 0);
    const planTakeRate = Number(((this.plans.reduce((sum, plan) => sum + plan.activeClients, 0) / 500) * 100).toFixed(1));

    return {
      activeHouseholds,
      thisMonthSettlement,
      approvedClaims,
      totalClaims,
      averageSettlement,
      monthlyRecurringRevenue,
      conversionRate,
      planTakeRate,
      monthlyTrend,
      monthlyTrendSource: 'server',
    };
  }

  getPlans(): RevenuePlan[] {
    return [...this.plans].sort((a, b) => b.monthlyPrice - a.monthlyPrice);
  }

  upsertPlan(input: RevenuePlanDraft): RevenuePlan {
    const target: RevenuePlan | undefined = this.plans.find((plan) => plan.id === input.id);
    if (!target) {
      throw new NotFoundException('요금제를 찾을 수 없습니다.');
    }

    if (!input.name.trim()) {
      throw new BadRequestException('요금제 이름은 필수입니다.');
    }
    if (!Number.isFinite(input.monthlyPrice) || input.monthlyPrice <= 0) {
      throw new BadRequestException('월 요금은 0보다 커야 합니다.');
    }
    if (!Number.isFinite(input.annualDiscountRate) || input.annualDiscountRate < 0 || input.annualDiscountRate > 0.95) {
      throw new BadRequestException('연 할인율은 0~0.95 범위여야 합니다.');
    }
    if (!Number.isInteger(input.activeClients) || input.activeClients < 0) {
      throw new BadRequestException('활성 고객 수는 0 이상의 정수여야 합니다.');
    }

    target.monthlyPrice = input.monthlyPrice;
    target.annualDiscountRate = input.annualDiscountRate;
    target.activeClients = input.activeClients;
    target.name = input.name.trim();
    target.description = input.description;
    target.featureFlags = [...input.featureFlags];

    return { ...target };
  }
}
