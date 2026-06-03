import { Injectable, NotFoundException } from '@nestjs/common';
import { CareLogService } from '../care-logs/care-logs.service';
import { ClaimsService } from '../claims/claims.service';
import { localMonthKey } from '../common/date.util';
import { JsonCollectionStore } from '../common/json-store';
import { parseWithSchema } from '../common/zod-validation.pipe';
import { SettlementService } from '../settlements/settlement.service';

import { revenuePlanDraftSchema } from './admin.schema';
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
  // 요금제는 고정 id(starter/pro/enterprise)라 seq 없이 items만 사용한다.
  // 파일이 없으면 initialPlans를 seed로 깔아 기존 dev 동작을 그대로 유지한다.
  private readonly store = new JsonCollectionStore<RevenuePlan>('admin-plans.json', () => ({
    items: initialPlans.map((plan) => ({ ...plan, featureFlags: [...plan.featureFlags] })),
  }));
  private readonly state = this.store.load();

  private get plans(): RevenuePlan[] {
    return this.state.items;
  }

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
    // 요금제 존재 여부는 기존과 동일하게 필드 검증보다 먼저 확인한다.
    const target: RevenuePlan | undefined = this.plans.find((plan) => plan.id === input.id);
    if (!target) {
      throw new NotFoundException('요금제를 찾을 수 없습니다.');
    }

    // zod 스키마가 name 필수 / monthlyPrice·annualDiscountRate·activeClients 범위 검증을 처리한다.
    const parsed = parseWithSchema(revenuePlanDraftSchema, input);

    target.monthlyPrice = parsed.monthlyPrice;
    target.annualDiscountRate = parsed.annualDiscountRate;
    target.activeClients = parsed.activeClients;
    target.name = parsed.name.trim();
    target.description = parsed.description;
    target.featureFlags = [...parsed.featureFlags];

    this.store.save(this.state);
    return { ...target };
  }
}
