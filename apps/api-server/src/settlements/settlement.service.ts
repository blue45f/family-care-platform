import { BadRequestException, Injectable } from '@nestjs/common';

import type { Settlement, SettlementInput } from './settlement.model';

@Injectable()
export class SettlementService {
  private seq = 1;
  private readonly settlements: Settlement[] = [];

  findAll(): Settlement[] {
    return [...this.settlements].sort((a, b) => b.id - a.id);
  }

  create(input: SettlementInput) {
    if (!input.recipient.trim()) {
      throw new BadRequestException('recipient는 필수입니다.');
    }
    if (input.careHours <= 0 || input.baseRate <= 0) {
      throw new BadRequestException('careHours와 baseRate는 0보다 커야 합니다.');
    }

    const next: Settlement = {
      id: this.seq++,
      recipient: input.recipient.trim(),
      date: input.date,
      careHours: input.careHours,
      baseRate: input.baseRate,
      totalAmount: input.careHours * input.baseRate,
      note: input.note.trim(),
    };
    this.settlements.push(next);
    return next;
  }
}
