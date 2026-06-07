import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

/**
 * 인증 모듈.
 *
 * - AuthService(JSON users 스토어 + scrypt 해싱 + HMAC JWT)와 /api/auth 컨트롤러를 제공한다.
 * - APP_GUARD로 AuthGuard를 전역 등록한다 → 모든 변경(POST/PATCH/PUT/DELETE) 요청에
 *   Bearer 토큰을 강제하고, 조회(GET)/헬스 체크는 공개로 둔다. 따라서 오케스트레이터는
 *   app.module.ts의 imports에 AuthModule만 추가하면 care-logs/settlements/claims/admin의
 *   변경 엔드포인트가 자동으로 보호된다(개별 컨트롤러 수정 불필요).
 * - @Global()로 두어 AuthService/가드 의존성을 어디서나 주입할 수 있게 한다.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
