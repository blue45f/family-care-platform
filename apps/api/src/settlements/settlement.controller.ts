import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { localYmd } from '../common/date.util'

import { SettlementService } from './settlement.service'

import type { Settlement, SettlementInput } from './settlement.model'

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  getSettlements(): Settlement[] {
    return this.settlementService.findAll()
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSettlement(@Body() input: SettlementInput): Settlement {
    return this.settlementService.create({
      ...input,
      date: input.date ?? localYmd(),
    })
  }
}
