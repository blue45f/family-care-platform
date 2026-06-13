import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { localYmd } from '../common/date.util'
import { ZodValidationPipe } from '../common/zod-validation.pipe'

import { claimIdParamSchema, claimStatusUpdateSchema } from './claim.schema'
import { ClaimsService } from './claims.service'

import type { Claim, ClaimInput, ClaimStatusUpdate } from './claim.model'

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  getClaims(): Claim[] {
    return this.claimsService.findAll()
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createClaim(@Body() input: ClaimInput): Claim {
    return this.claimsService.create({
      ...input,
      issueDate: input.issueDate ?? localYmd(),
      status: input.status ?? '요청',
    })
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ZodValidationPipe(claimIdParamSchema)) claimId: number,
    @Body(new ZodValidationPipe(claimStatusUpdateSchema)) input: ClaimStatusUpdate,
  ): Claim {
    return this.claimsService.updateStatus(claimId, input.status)
  }
}
