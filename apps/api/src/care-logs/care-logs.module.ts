import { Module } from '@nestjs/common'

import { CareLogController } from './care-logs.controller'
import { CareLogService } from './care-logs.service'

@Module({
  providers: [CareLogService],
  controllers: [CareLogController],
  exports: [CareLogService],
})
export class CareLogModule {}
