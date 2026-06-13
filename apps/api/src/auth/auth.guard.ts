import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AuthService } from './auth.service'
import { IS_PUBLIC_KEY } from './public.decorator'

import type { AuthenticatedUser } from './auth.model'
import type { Request } from 'express'

// 인증 사용자를 부착한 요청 타입. 라우트 핸들러에서 request.user로 접근할 수 있다.
export interface RequestWithUser extends Request {
  user?: AuthenticatedUser
}

// 변경(쓰기) 메서드만 인증을 강제하는 메서드 집합. 조회(GET)와 프리플라이트(OPTIONS),
// HEAD는 인증 없이 통과시킨다(health GET, 데이터 조회 GET 등은 공개 유지).
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

/**
 * Bearer 토큰 기반 인증 가드.
 *
 * 전역(APP_GUARD)으로 등록되며 다음 순서로 통과 여부를 정한다.
 * 1) @Public()으로 표시된 핸들러/컨트롤러 → 항상 통과(로그인/회원가입 등).
 * 2) 비변경 메서드(GET/OPTIONS/HEAD) → 통과(조회·헬스 체크는 공개).
 * 3) 변경 메서드(POST/PATCH/PUT/DELETE) → 유효한 Bearer 토큰 필수.
 *
 * 토큰이 유효하면 request.user에 인증 사용자를 부착한다(컨트롤러에서 활용 가능).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()

    const method = (request.method ?? 'GET').toUpperCase()
    const requiresAuth = MUTATING_METHODS.has(method)

    const token = this.extractBearerToken(request)
    // 토큰이 있으면 변경/조회 무관하게 사용자 정보를 부착해 둔다(있으면 활용, 없어도 조회는 통과).
    if (token) {
      const user = this.authService.verifyBearerToken(token)
      if (user) {
        request.user = user
        return true
      }
      // 토큰이 제시됐지만 무효한 경우, 변경 요청은 거부한다.
      if (requiresAuth) {
        throw new UnauthorizedException('인증 토큰이 유효하지 않습니다.')
      }
      return true
    }

    if (requiresAuth) {
      throw new UnauthorizedException('이 작업을 수행하려면 로그인이 필요합니다.')
    }

    return true
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization
    if (!header) {
      return null
    }

    const [scheme, value] = header.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !value?.trim()) {
      return null
    }
    return value.trim()
  }
}
