import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import { CurrentUser } from '../auth/current-user.decorator'
import { requireAdmin, requireUser } from '../auth/role.util'

import { CommunityService } from './community.service'

import type {
  CommunityComment,
  CommunityCommentInput,
  CommunityPostDetail,
  CommunityPostInput,
  CommunityPostSummary,
} from './community.model'
import type { AuthenticatedUser } from '../auth/auth.model'

// CORS 허용 메서드(GET/POST/PATCH) 컨벤션을 따른다:
// - 상태 변경(숨김/복구)은 PATCH :id/visibility (schedules의 PATCH :id/status와 동일 결).
// - 비가역 삭제는 POST :id/delete (DELETE 메서드는 이 API 표면에서 사용하지 않는다).
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  listPosts(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Query('category') category?: string,
    @Query('q') q?: string,
  ): CommunityPostSummary[] {
    return this.communityService.listPosts(user, { category, q })
  }

  @Get('posts/:id')
  getPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityPostDetail {
    return this.communityService.getPost(Number(id), user)
  }

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  createPost(
    @Body() input: CommunityPostInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityPostDetail {
    return this.communityService.createPost(input, requireUser(user))
  }

  @Post('posts/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id') id: string,
    @Body() input: CommunityCommentInput,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityComment {
    return this.communityService.addComment(Number(id), input, requireUser(user))
  }

  @Post('comments/:id/delete')
  @HttpCode(HttpStatus.OK)
  deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityComment {
    return this.communityService.deleteComment(Number(id), requireUser(user))
  }

  @Post('posts/:id/delete')
  @HttpCode(HttpStatus.OK)
  deletePost(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): { deleted: true } {
    return this.communityService.deletePost(Number(id), requireUser(user))
  }

  @Post('posts/:postId/attachments/:attachmentId/delete')
  @HttpCode(HttpStatus.OK)
  deleteAttachment(
    @Param('postId') postId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityPostDetail {
    return this.communityService.deleteAttachment(
      Number(postId),
      Number(attachmentId),
      requireUser(user),
    )
  }

  @Patch('posts/:id/visibility')
  setVisibility(
    @Param('id') id: string,
    @Body() input: unknown,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): CommunityPostSummary {
    return this.communityService.setVisibility(Number(id), input, requireAdmin(user))
  }
}
