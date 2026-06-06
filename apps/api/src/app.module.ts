import { Module } from '@nestjs/common'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { CareLogModule } from './care-logs/care-logs.module'
import { SettlementModule } from './settlements/settlement.module'
import { ClaimsModule } from './claims/claims.module'
import { AdminModule } from './admin/admin.module'
import { RateLimitMiddleware } from './common/rate-limit.middleware'
import { HealthController } from './health.controller'

@Module({
  imports: [AuthModule, CareLogModule, SettlementModule, ClaimsModule, AdminModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware).forRoutes('*')
  }
}
