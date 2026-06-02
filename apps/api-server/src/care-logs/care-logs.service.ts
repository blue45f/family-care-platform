import { Injectable } from '@nestjs/common';

import { localYmd } from '../common/date.util';
import { parseWithSchema } from '../common/zod-validation.pipe';
import type { CareLog, CareLogInput } from './care-log.model';
import { careLogInputSchema } from './care-log.schema';

@Injectable()
export class CareLogService {
  private seq = 1;
  private readonly careLogs: CareLog[] = [];

  findAll(): CareLog[] {
    return [...this.careLogs].sort((a, b) => b.id - a.id);
  }

  create(input: CareLogInput) {
    // zod 스키마가 필수 필드 검증 + trim 정제를 함께 처리한다(기존 if-throw 동작과 동일).
    const parsed = parseWithSchema(careLogInputSchema, input);

    const next: CareLog = {
      id: this.seq++,
      ...parsed,
      date: parsed.date || localYmd(),
    };

    this.careLogs.push(next);
    return next;
  }
}
