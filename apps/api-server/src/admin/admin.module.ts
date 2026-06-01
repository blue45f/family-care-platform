import { Module } from '@nestjs/common';

import { CareLogModule } from '../care-logs/care-logs.module';
import { ClaimsModule } from '../claims/claims.module';
import { SettlementModule } from '../settlements/settlement.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CareLogModule, SettlementModule, ClaimsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
