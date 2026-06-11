import { Module } from '@nestjs/common'

import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'

@Module({
  providers: [CommunityService],
  controllers: [CommunityController],
  exports: [CommunityService],
})
export class CommunityModule {}
