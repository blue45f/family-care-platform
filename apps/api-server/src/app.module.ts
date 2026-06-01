import { Module } from '@nestjs/common';

import { CareLogModule } from './care-logs/care-logs.module';
import { SettlementModule } from './settlements/settlement.module';
import { ClaimsModule } from './claims/claims.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [CareLogModule, SettlementModule, ClaimsModule, AdminModule],
})
export class AppModule {}
