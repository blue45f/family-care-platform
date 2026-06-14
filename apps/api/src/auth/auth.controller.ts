import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthService } from './auth.service'
import { CurrentUser } from './current-user.decorator'
import { Public } from './public.decorator'

import type {
  AuthResult,
  AuthenticatedUser,
  LoginInput,
  PublicUser,
  RegisterInput,
  UpdateProfileInput,
  WithdrawAccountInput,
} from './auth.model'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 토큰 발급 전 호출되므로 @Public()으로 전역 가드를 통과시킨다(둘 다 변경 메서드).
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() input: RegisterInput): AuthResult {
    return this.authService.register(input)
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() input: LoginInput): AuthResult {
    return this.authService.login(input)
  }

  // GET이라 전역 가드는 통과시키지만, 본 핸들러는 유효한 Bearer 사용자를 요구한다.
  // 토큰이 없거나 무효하면 request.user가 비어 있으므로 401을 던진다.
  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser | undefined): PublicUser {
    if (!user) {
      throw new UnauthorizedException('인증이 필요합니다.')
    }
    return this.authService.getProfile(user.id)
  }

  @Patch('me')
  updateProfile(
    @Body() input: UpdateProfileInput,
    @CurrentUser() user: AuthenticatedUser | undefined
  ): PublicUser {
    if (!user) {
      throw new UnauthorizedException('인증이 필요합니다.')
    }
    return this.authService.updateProfile(user.id, input)
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  withdrawAccount(
    @Body() input: WithdrawAccountInput,
    @CurrentUser() user: AuthenticatedUser | undefined
  ): PublicUser {
    if (!user) {
      throw new UnauthorizedException('인증이 필요합니다.')
    }
    return this.authService.withdrawAccount(user.id, input)
  }

  @Post('me/withdraw')
  @HttpCode(HttpStatus.OK)
  withdrawAccountForBrowser(
    @Body() input: WithdrawAccountInput,
    @CurrentUser() user: AuthenticatedUser | undefined
  ): PublicUser {
    if (!user) {
      throw new UnauthorizedException('인증이 필요합니다.')
    }
    return this.authService.withdrawAccount(user.id, input)
  }
}
