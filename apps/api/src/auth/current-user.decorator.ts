import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { RequestWithUser } from './auth.guard'
import type { AuthenticatedUser } from './auth.model'

// AuthGuard가 부착한 request.user를 핸들러 인자로 주입하는 파라미터 데코레이터.
// 토큰이 없거나 무효하면 undefined가 주입되므로, 인증 필수 핸들러는 값 존재를 직접 확인한다.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    return request.user
  }
)
