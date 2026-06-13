import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { localYmd } from '../common/date.util'

import { CareLogService } from './care-logs.service'

import type { CareLog, CareLogInput } from './care-log.model'

@Controller('care-logs')
export class CareLogController {
  constructor(private readonly careLogService: CareLogService) {}

  @Get()
  getCareLogs(): CareLog[] {
    return this.careLogService.findAll()
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCareLog(@Body() input: CareLogInput): CareLog {
    return this.careLogService.create({
      ...input,
      date: input.date ?? localYmd(),
    })
  }
}
