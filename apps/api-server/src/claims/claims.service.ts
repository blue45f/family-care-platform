import { Injectable, NotFoundException } from '@nestjs/common';

import { localYmd } from '../common/date.util';
import { parseWithSchema } from '../common/zod-validation.pipe';
import type { Claim, ClaimInput, ClaimStatus } from './claim.model';
import { claimInputSchema, claimStatusSchema } from './claim.schema';

@Injectable()
export class ClaimsService {
  private seq = 1;
  private readonly claims: Claim[] = [];

  findAll(): Claim[] {
    return [...this.claims].sort((a, b) => b.id - a.id);
  }

  create(input: ClaimInput) {
    // zod 스키마가 필수 필드(+trim) / expectedAmount 양수 / status 검증을 처리한다.
    const parsed = parseWithSchema(claimInputSchema, input);

    const next: Claim = {
      id: this.seq++,
      recipient: parsed.recipient,
      claimType: parsed.claimType,
      expectedAmount: parsed.expectedAmount,
      hospitalName: parsed.hospitalName,
      issueDate: parsed.issueDate || localYmd(),
      status: parsed.status,
      note: parsed.note,
    };

    this.claims.push(next);
    return next;
  }

  updateStatus(id: number, status: ClaimStatus) {
    const target = this.claims.find((claim) => claim.id === id);
    if (!target) {
      throw new NotFoundException('해당 보험청구를 찾을 수 없습니다.');
    }
    // 상태 값은 동일 목록으로 검증(기존 if-throw와 동일 메시지).
    target.status = parseWithSchema(claimStatusSchema, status);
    return target;
  }
}
