import { Body, Controller, Get, Param, Patch } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { requireAdmin } from '../auth/role.util'
import type { AuthenticatedUser, PublicUser, SuspensionInput } from '../auth/auth.model'
import type { AdminOverview, RevenuePlan, RevenuePlanDraft } from './admin.model'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

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

  // 회원 관리 — 전역 가드는 GET을 공개로 두므로 핸들러에서 requireAdmin으로 직접 보호한다.
  @Get('users')
  listUsers(@CurrentUser() user: AuthenticatedUser | undefined): PublicUser[] {
    requireAdmin(user)
    return this.authService.listUsers()
  }

  @Patch('users/:id/suspension')
  setSuspension(
    @Param('id') id: string,
    @Body() input: SuspensionInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): PublicUser {
    return this.authService.setSuspension(Number(id), input, requireAdmin(user))
  }
}
