import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

import type { AuthenticatedUser } from './auth.model'

// 핸들러 단위 권한 확인 헬퍼.
// 전역 AuthGuard는 GET을 공개로 두고 토큰이 있으면 request.user만 부착하므로,
// 보호가 필요한 조회/어드민 핸들러는 auth/me와 같은 패턴으로 직접 확인한다.

/** 인증 사용자가 없으면 401. 있으면 그대로 반환한다. */
export function requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
  if (!user) {
    throw new UnauthorizedException('이 작업을 수행하려면 로그인이 필요합니다.')
  }
  return user
}

/** 인증 사용자가 없으면 401, admin 역할이 아니면 403. */
export function requireAdmin(user: AuthenticatedUser | undefined): AuthenticatedUser {
  const authenticated = requireUser(user)
  if (authenticated.role !== 'admin') {
    throw new ForbiddenException('관리자 권한이 필요합니다.')
  }
  return authenticated
}
