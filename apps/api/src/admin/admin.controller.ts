import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { CurrentUser } from '../auth/current-user.decorator'
import { requireAdmin } from '../auth/role.util'
import type {
  AdminUserUpdateInput,
  AuthenticatedUser,
  PublicUser,
  SuspensionInput,
} from '../auth/auth.model'
import { CommunityService } from '../community/community.service'
import type {
  CommunityForbiddenWord,
  CommunityForbiddenWordInput,
} from '../community/community.model'
import type { AdminOverview, RevenuePlan, RevenuePlanDraft } from './admin.model'
import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly communityService: CommunityService,
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

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() input: AdminUserUpdateInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): PublicUser {
    return this.authService.updateUserByAdmin(Number(id), input, requireAdmin(user))
  }

  @Get('community/forbidden-words')
  listForbiddenWords(@CurrentUser() user: AuthenticatedUser | undefined): CommunityForbiddenWord[] {
    requireAdmin(user)
    return this.communityService.listForbiddenWords()
  }

  @Post('community/forbidden-words')
  @HttpCode(HttpStatus.CREATED)
  createForbiddenWord(
    @Body() input: CommunityForbiddenWordInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityForbiddenWord {
    requireAdmin(user)
    return this.communityService.createForbiddenWord(input)
  }

  @Patch('community/forbidden-words/:id')
  updateForbiddenWord(
    @Param('id') id: string,
    @Body() input: CommunityForbiddenWordInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityForbiddenWord {
    requireAdmin(user)
    return this.communityService.updateForbiddenWord(Number(id), input)
  }

  @Post('community/forbidden-words/:id/delete')
  @HttpCode(HttpStatus.OK)
  deleteForbiddenWord(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): { deleted: true } {
    requireAdmin(user)
    return this.communityService.deleteForbiddenWord(Number(id))
  }
}
