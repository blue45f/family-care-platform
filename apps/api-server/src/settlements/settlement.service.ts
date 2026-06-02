import { Injectable } from '@nestjs/common';

import { localYmd } from '../common/date.util';
import { JsonCollectionStore } from '../common/json-store';
import { parseWithSchema } from '../common/zod-validation.pipe';
import type { Settlement, SettlementInput } from './settlement.model';
import { settlementInputSchema } from './settlement.schema';

@Injectable()
export class SettlementService {
  // 원자적 JSON 파일 스토어로 재시작 후에도 데이터 유지(파일 없으면 빈 seed에서 시작).
  private readonly store = new JsonCollectionStore<Settlement>('settlements.json', () => ({ items: [], seq: 1 }));
  private state = this.store.load();

  findAll(): Settlement[] {
    return [...this.state.items].sort((a, b) => b.id - a.id);
  }

  create(input: SettlementInput) {
    // zod 스키마가 recipient 필수/trim + careHours·baseRate 양수 검증을 처리한다.
    const parsed = parseWithSchema(settlementInputSchema, input);

    const next: Settlement = {
      id: this.state.seq!,
      recipient: parsed.recipient,
      date: parsed.date || localYmd(),
      careHours: parsed.careHours,
      baseRate: parsed.baseRate,
      totalAmount: parsed.careHours * parsed.baseRate,
      note: parsed.note,
    };
    this.state.items.push(next);
    this.state.seq = this.state.seq! + 1;
    this.store.save(this.state);
    return next;
  }
}
