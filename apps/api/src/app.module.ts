import { Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'

import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'
import { CareLogModule } from './care-logs/care-logs.module'
import { ClaimsModule } from './claims/claims.module'
import { RateLimitMiddleware } from './common/rate-limit.middleware'
import { CommunityModule } from './community/community.module'
import { StoreBackendLifecycle } from './db/store-backend.lifecycle'
import { HealthController } from './health.controller'
import { MessagesModule } from './messages/messages.module'
import { ScheduleModule } from './schedules/schedule.module'
import { SettlementModule } from './settlements/settlement.module'
import { SupportModule } from './support/support.module'

import type { MiddlewareConsumer, NestModule } from '@nestjs/common'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
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
