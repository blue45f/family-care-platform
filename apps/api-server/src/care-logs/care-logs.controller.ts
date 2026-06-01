import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import type { CareLog, CareLogInput } from './care-log.model';
import { CareLogService } from './care-logs.service';

@Controller('care-logs')
export class CareLogController {
  constructor(private readonly careLogService: CareLogService) {}

  @Get()
  getCareLogs(): CareLog[] {
    return this.careLogService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createCareLog(@Body() input: CareLogInput): CareLog {
    return this.careLogService.create({
      ...input,
      date: input.date ?? new Date().toISOString().slice(0, 10),
    });
  }
}
