import { Body, Controller, Get, Patch } from '@nestjs/common'

import type { AdminOverview, RevenuePlan, RevenuePlanDraft } from './admin.model'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview(): AdminOverview {
    return this.adminService.getOverview()
  }

  @Get('plans')
  getPlans(): RevenuePlan[] {
    return this.adminService.getPlans()
  }

  @Patch('plans')
  updatePlan(@Body() body: RevenuePlanDraft): RevenuePlan {
    return this.adminService.upsertPlan(body)
  }
}
