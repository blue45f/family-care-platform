import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { localYmd } from '../common/date.util';
import type { Settlement, SettlementInput } from './settlement.model';
import { SettlementService } from './settlement.service';

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  getSettlements(): Settlement[] {
    return this.settlementService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSettlement(@Body() input: SettlementInput): Settlement {
    return this.settlementService.create({
      ...input,
      date: input.date ?? localYmd(),
    });
  }
}
