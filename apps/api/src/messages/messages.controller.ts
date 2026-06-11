import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { requireUser } from '../auth/role.util'
import type { AuthenticatedUser } from '../auth/auth.model'
import { MessagesService } from './messages.service'
import type {
  ConversationDetail,
  ConversationSummary,
  DirectMessage,
  DirectMessageInput,
  MessageRecipient,
} from './messages.model'

// 쪽지는 개인 데이터이므로 전역 가드가 공개로 두는 GET도 requireUser로 직접 보호한다.
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('recipients')
  listRecipients(@CurrentUser() user: AuthenticatedUser | undefined): MessageRecipient[] {
    return this.messagesService.listRecipients(requireUser(user))
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser | undefined): ConversationSummary[] {
    return this.messagesService.listConversations(requireUser(user))
  }

  @Get('conversations/:partnerId')
  getConversation(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): ConversationDetail {
    return this.messagesService.getConversation(Number(partnerId), requireUser(user))
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  send(
    @Body() input: DirectMessageInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): DirectMessage {
    return this.messagesService.send(input, requireUser(user))
  }

  // 읽음 처리는 상태 변경이라 POST(쓰기 메서드)로 둔다 — 조회 GET은 부수효과가 없다.
  @Post('conversations/:partnerId/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): { updated: number } {
    return this.messagesService.markRead(Number(partnerId), requireUser(user))
  }
}
