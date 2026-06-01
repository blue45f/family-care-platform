import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { Claim, ClaimInput, ClaimStatus } from './claim.model';

const claimStatuses: ClaimStatus[] = ['요청', '검토중', '승인', '거절'];

@Injectable()
export class ClaimsService {
  private seq = 1;
  private readonly claims: Claim[] = [];

  findAll() {
    return this.claims.toSorted((a, b) => b.id - a.id);
  }

  create(input: ClaimInput) {
    if (!input.recipient.trim() || !input.hospitalName.trim() || !input.claimType.trim()) {
      throw new BadRequestException('recipient, hospitalName, claimType은(는) 필수입니다.');
    }
    if (!Number.isFinite(input.expectedAmount) || input.expectedAmount <= 0) {
      throw new BadRequestException('expectedAmount는 0보다 큰 숫자여야 합니다.');
    }
    if (!claimStatuses.includes(input.status)) {
      throw new BadRequestException('유효하지 않은 청구 상태입니다.');
    }

    const next: Claim = {
      id: this.seq++,
      recipient: input.recipient.trim(),
      claimType: input.claimType.trim(),
      expectedAmount: input.expectedAmount,
      hospitalName: input.hospitalName.trim(),
      issueDate: input.issueDate,
      status: input.status,
      note: input.note.trim(),
    };

    this.claims.push(next);
    return next;
  }

  updateStatus(id: number, status: ClaimStatus) {
    const target = this.claims.find((claim) => claim.id === id);
    if (!target) {
      throw new NotFoundException('해당 보험청구를 찾을 수 없습니다.');
    }
    if (!claimStatuses.includes(status)) {
      throw new BadRequestException('유효하지 않은 청구 상태입니다.');
    }

    target.status = status;
    return target;
  }
}
