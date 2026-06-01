import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';

import type { Claim, ClaimInput, ClaimStatusUpdate } from './claim.model';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  getClaims(): Claim[] {
    return this.claimsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createClaim(@Body() input: ClaimInput): Claim {
    return this.claimsService.create({
      ...input,
      issueDate: input.issueDate ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? '요청',
    });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() input: ClaimStatusUpdate): Claim {
    const claimId = Number(id);
    if (!Number.isInteger(claimId) || claimId < 1) {
      throw new BadRequestException('유효하지 않은 청구 ID입니다.');
    }
    return this.claimsService.updateStatus(claimId, input.status);
  }
}
