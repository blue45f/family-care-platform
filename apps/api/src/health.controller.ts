import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { db, dbEnabled } from './db/client'

import type { Response } from 'express'

@Controller('health')
export class HealthController {
  /**
   * Liveness: 프로세스가 살아 응답하는지만 확인한다. 의존성을 건드리지 않는다.
   * 라우트: GET /api/health
   */
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      service: 'family-care-operations-api',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Readiness: 트래픽을 받을 준비가 됐는지 확인한다.
   * DB에 `SELECT 1` 쿼리를 보내 실제 데이터베이스 연결이 정상인지 검증한다.
   * 라우트: GET /api/health/ready → 200 {status:'ready'} | 503 {status:'not-ready'}
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(@Res({ passthrough: true }) res: Response) {
    if (!dbEnabled || !db) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
      return {
        status: 'not-ready',
        reason: 'database is not enabled or pool is null',
        timestamp: new Date().toISOString(),
      }
    }

    try {
      await db.execute(sql`SELECT 1`)
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
      return {
        status: 'not-ready',
        reason: error instanceof Error ? error.message : 'database query failed',
        timestamp: new Date().toISOString(),
      }
    }

    return {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }
  }
}
