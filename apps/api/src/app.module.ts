import { Module } from '@nestjs/common'
import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { CareLogModule } from './care-logs/care-logs.module'
import { SettlementModule } from './settlements/settlement.module'
import { ClaimsModule } from './claims/claims.module'
import { AdminModule } from './admin/admin.module'
import { ScheduleModule } from './schedules/schedule.module'
import { CommunityModule } from './community/community.module'
import { SupportModule } from './support/support.module'
import { MessagesModule } from './messages/messages.module'
import { RateLimitMiddleware } from './common/rate-limit.middleware'
import { StoreBackendLifecycle } from './db/store-backend.lifecycle'
import { HealthController } from './health.controller'

@Module({
  imports: [
    AuthModule,
    ScheduleModule,
    CareLogModule,
    SettlementModule,
    ClaimsModule,
    AdminModule,
    CommunityModule,
    SupportModule,
    MessagesModule,
  ],
  controllers: [HealthController],
  providers: [StoreBackendLifecycle],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware).forRoutes('*')
  }
}
