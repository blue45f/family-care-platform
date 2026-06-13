import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { requireUser } from '../auth/role.util'

import { SupportService } from './support.service'

import type {
  SupportMessage,
  SupportMessageInput,
  SupportThreadDetail,
  SupportThreadInput,
  SupportThreadSummary,
} from './support.model'
import type { AuthenticatedUser } from '../auth/auth.model'

// 개인 상담 내역이므로 전역 가드가 공개로 두는 GET도 핸들러에서 requireUser로 보호한다.
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('threads')
  listThreads(@CurrentUser() user: AuthenticatedUser | undefined): SupportThreadSummary[] {
    return this.supportService.listThreads(requireUser(user))
  }

  @Get('threads/:id')
  getThread(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): SupportThreadDetail {
    return this.supportService.getThread(Number(id), requireUser(user))
  }

  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  createThread(
    @Body() input: SupportThreadInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): SupportThreadDetail {
    return this.supportService.createThread(input, requireUser(user))
  }

  @Post('threads/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Param('id') id: string,
    @Body() input: SupportMessageInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): SupportMessage {
    return this.supportService.addMessage(Number(id), input, requireUser(user))
  }

  @Patch('threads/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() input: unknown,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): SupportThreadSummary {
    return this.supportService.setStatus(Number(id), input, requireUser(user))
  }
}
