import { Module } from '@nestjs/common';

import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

@Module({
  providers: [ClaimsService],
  controllers: [ClaimsController],
  exports: [ClaimsService],
})
export class ClaimsModule {}
