import { Injectable } from '@nestjs/common'

import { localYmd } from '../common/date.util'
import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'

import { careLogInputSchema } from './care-log.schema'

import type { CareLog, CareLogInput } from './care-log.model'

@Injectable()
export class CareLogService {
  // 원자적 JSON 파일 스토어로 재시작 후에도 데이터 유지(파일 없으면 빈 seed에서 시작).
  private readonly store = new JsonCollectionStore<CareLog>('care-logs.json', () => ({
    items: [],
    seq: 1,
  }))
  private state = this.store.load()

  findAll(): CareLog[] {
    return [...this.state.items].sort((a, b) => b.id - a.id)
  }

  create(input: CareLogInput) {
    // zod 스키마가 필수 필드 검증 + trim 정제를 함께 처리한다(기존 if-throw 동작과 동일).
    const parsed = parseWithSchema(careLogInputSchema, input)

    const next: CareLog = {
      id: this.state.seq!,
      ...parsed,
      date: parsed.date || localYmd(),
    }

    this.state.items.push(next)
    this.state.seq = this.state.seq! + 1
    this.store.save(this.state)
    return next
  }
}
