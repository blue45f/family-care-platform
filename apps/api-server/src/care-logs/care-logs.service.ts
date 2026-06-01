import { BadRequestException, Injectable } from '@nestjs/common';

import type { CareLog, CareLogInput, CareLogType } from './care-log.model';

const careLogTypes: CareLogType[] = ['방문', '원격상담', '투약', '식사관리', '기타'];

@Injectable()
export class CareLogService {
  private seq = 1;
  private readonly careLogs: CareLog[] = [];

  findAll() {
    return this.careLogs.toSorted((a, b) => b.id - a.id);
  }

  create(input: CareLogInput) {
    if (!input.recipient.trim() || !input.caregiver.trim() || !input.note.trim()) {
      throw new BadRequestException('recipient/caregiver/note는 필수입니다.');
    }
    if (!careLogTypes.includes(input.type)) {
      throw new BadRequestException('유효하지 않은 돌봄 활동 유형입니다.');
    }

    const next: CareLog = {
      id: this.seq++,
      ...input,
      recipient: input.recipient.trim(),
      caregiver: input.caregiver.trim(),
      note: input.note.trim(),
      date: input.date ?? new Date().toISOString().slice(0, 10),
    };

    this.careLogs.push(next);
    return next;
  }
}
