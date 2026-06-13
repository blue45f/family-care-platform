import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { ScheduleService } from './schedule.service'

import type { CareSchedule, CareScheduleInput, ScheduleStatus } from './schedule.model'

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  getSchedules(): CareSchedule[] {
    return this.scheduleService.findAll()
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSchedule(@Body() input: CareScheduleInput): CareSchedule {
    return this.scheduleService.create(input)
  }

  @Patch(':id/status')
  updateScheduleStatus(
    @Param('id') id: string,
    @Body('status') status: ScheduleStatus,
  ): CareSchedule {
    return this.scheduleService.updateStatus(Number(id), status)
  }
}
