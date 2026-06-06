import { SetMetadata } from '@nestjs/common'

// AuthGuard가 전역으로 적용될 때, 인증 없이 통과시킬 라우트를 표시하는 데코레이터.
// 예: POST /api/auth/register, POST /api/auth/login 처럼 토큰 발급 전 호출되는 변경 엔드포인트.
export const IS_PUBLIC_KEY = 'fcp:isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
