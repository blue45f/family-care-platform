import { Injectable, NotFoundException } from '@nestjs/common'

import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'

import { scheduleInputSchema, scheduleStatusSchema } from './schedule.schema'

import type { CareSchedule, CareScheduleInput, ScheduleStatus } from './schedule.model'

@Injectable()
export class ScheduleService {
  private readonly store = new JsonCollectionStore<CareSchedule>('schedules.json', () => ({
    items: [],
    seq: 1,
  }))
  private state = this.store.load()

  findAll(): CareSchedule[] {
    return [...this.state.items].sort(
      (a, b) =>
        b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime) || b.id - a.id
    )
  }

  create(input: CareScheduleInput): CareSchedule {
    const parsed = parseWithSchema(scheduleInputSchema, input)

    const next: CareSchedule = {
      id: this.state.seq!,
      ...parsed,
    }

    this.state.items.push(next)
    this.state.seq = this.state.seq! + 1
    this.store.save(this.state)
    return next
  }

  updateStatus(scheduleId: number, status: ScheduleStatus): CareSchedule {
    const parsed = parseWithSchema(scheduleStatusSchema, { status })
    const target = this.state.items.find((item) => item.id === scheduleId)

    if (!target) {
      throw new NotFoundException('방문 일정을 찾을 수 없습니다.')
    }

    target.status = parsed.status
    this.store.save(this.state)
    return target
  }
}
