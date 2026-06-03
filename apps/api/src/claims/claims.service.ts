import { Injectable, NotFoundException } from '@nestjs/common'

import { localYmd } from '../common/date.util'
import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'
import type { Claim, ClaimInput, ClaimStatus } from './claim.model'
import { claimInputSchema, claimStatusSchema } from './claim.schema'

@Injectable()
export class ClaimsService {
  // 원자적 JSON 파일 스토어로 재시작 후에도 데이터 유지(파일 없으면 빈 seed에서 시작).
  private readonly store = new JsonCollectionStore<Claim>('claims.json', () => ({
    items: [],
    seq: 1,
  }))
  private state = this.store.load()

  findAll(): Claim[] {
    return [...this.state.items].sort((a, b) => b.id - a.id)
  }

  create(input: ClaimInput) {
    // zod 스키마가 필수 필드(+trim) / expectedAmount 양수 / status 검증을 처리한다.
    const parsed = parseWithSchema(claimInputSchema, input)

    const next: Claim = {
      id: this.state.seq!,
      recipient: parsed.recipient,
      claimType: parsed.claimType,
      expectedAmount: parsed.expectedAmount,
      hospitalName: parsed.hospitalName,
      issueDate: parsed.issueDate || localYmd(),
      status: parsed.status,
      note: parsed.note,
    }

    this.state.items.push(next)
    this.state.seq = this.state.seq! + 1
    this.store.save(this.state)
    return next
  }

  updateStatus(id: number, status: ClaimStatus) {
    const target = this.state.items.find((claim) => claim.id === id)
    if (!target) {
      throw new NotFoundException('해당 보험청구를 찾을 수 없습니다.')
    }
    // 상태 값은 동일 목록으로 검증(기존 if-throw와 동일 메시지).
    target.status = parseWithSchema(claimStatusSchema, status)
    this.store.save(this.state)
    return target
  }
}
