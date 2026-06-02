import { Injectable } from '@nestjs/common';

import { localYmd } from '../common/date.util';
import { parseWithSchema } from '../common/zod-validation.pipe';
import type { Settlement, SettlementInput } from './settlement.model';
import { settlementInputSchema } from './settlement.schema';

@Injectable()
export class SettlementService {
  private seq = 1;
  private readonly settlements: Settlement[] = [];

  findAll(): Settlement[] {
    return [...this.settlements].sort((a, b) => b.id - a.id);
  }

  create(input: SettlementInput) {
    // zod 스키마가 recipient 필수/trim + careHours·baseRate 양수 검증을 처리한다.
    const parsed = parseWithSchema(settlementInputSchema, input);

    const next: Settlement = {
      id: this.seq++,
      recipient: parsed.recipient,
      date: parsed.date || localYmd(),
      careHours: parsed.careHours,
      baseRate: parsed.baseRate,
      totalAmount: parsed.careHours * parsed.baseRate,
      note: parsed.note,
    };
    this.settlements.push(next);
    return next;
  }
}
