import 'reflect-metadata'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { Logger as PinoLogger } from 'nestjs-pino'

import { AppModule } from './app.module'
import { isCorsOriginAllowed, resolveAllowedOrigins } from './common/cors-policy'
import { validateEnv } from './config/env'
import { storeBackend } from './db/store-backend'
import { AllExceptionsFilter } from './http-exception.filter'

import type { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'

type OriginCheck = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => void

function createCorsOriginResolver(): OriginCheck {
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    try {
      callback(null, isCorsOriginAllowed(origin, resolveAllowedOrigins()))
    } catch (error) {
      callback(error instanceof Error ? error : new Error('CORS origin check error'))
    }
  }
}

// 의존성 없는 기본 보안 응답 헤더. CORS/JSON 스토어 동작에는 영향을 주지 않는다.
function applySecurityHeaders(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, noimageindex')
  next()
}

async function bootstrap() {
  // 환경 변수 검증(NON-FATAL) — 형식 오류/위험한 기본값을 경고만 한다(부팅은 계속).
  validateEnv()

  // Neon 백엔드 하이드레이트 — 서비스 생성(NestFactory.create) 전에 캐시를 채워
  // JsonCollectionStore.load()(동기)가 DB 데이터를 읽도록 한다. DATABASE_URL 없으면 no-op.
  await storeBackend.hydrate()

  // 기본 body parser(100kb)를 끄고 직접 등록한다 — 커뮤니티 첨부(파일당 2MB, 최대 4개)를
  // base64 data URL JSON으로 받으므로 한도를 12mb로 올린다(2MB×4 ≈ base64 10.7MB + 본문).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  })
  // nestjs-pino를 Nest 기본 로거로 사용한다(구조화 로깅 + 요청 로깅).
  app.useLogger(app.get(PinoLogger))
  app.useBodyParser('json', { limit: '12mb' })
  app.useBodyParser('urlencoded', { extended: true, limit: '12mb' })
  const port = Number(process.env.PORT ?? 3001)
  const logger = new Logger('Bootstrap')
  const allowedOriginPatterns = resolveAllowedOrigins()

  app.getHttpAdapter().getInstance().disable('x-powered-by')
  app.use(applySecurityHeaders)

  app.setGlobalPrefix('api')
  app.enableCors({
    origin: createCorsOriginResolver(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
  app.useGlobalFilters(new AllExceptionsFilter())
  app.enableShutdownHooks()

  logger.log(
    `환경 변수 CORS 허용 목록: ${allowedOriginPatterns.length ? allowedOriginPatterns.join(', ') : '<기본 로컬 허용>'} `
  )
  logger.log(
    `허용 Origin 패턴: ${process.env.NODE_ENV === 'production' ? '명시값 필수' : '로컬 포함'}`
  )

  await app.listen(port, '0.0.0.0')
}

void bootstrap()
