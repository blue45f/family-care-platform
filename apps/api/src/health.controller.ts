import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common'

import { resolveDataDir } from './common/json-store'

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
   * Readiness: 트래픽을 받을 준비가 됐는지 확인한다. 이 API의 유일한 영속성은
   * JSON 파일 스토어이므로, DB의 `SELECT 1`에 해당하는 검사로 데이터 디렉터리에
   * 실제로 쓰기가 가능한지(write + unlink 프로브)를 검증한다.
   * 라우트: GET /api/health/ready → 200 {status:'ready'} | 503 {status:'not-ready'}
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  readiness(@Res({ passthrough: true }) res: Response) {
    const dataDir = resolveDataDir()
    const probePath = join(dataDir, `.readiness-probe.${process.pid}.${Date.now()}.tmp`)

    try {
      // 스토어가 첫 save() 전까지 디렉터리를 만들지 않으므로 여기서 보장한다.
      mkdirSync(dataDir, { recursive: true })
      writeFileSync(probePath, 'ok', 'utf8')
      rmSync(probePath, { force: true })
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE)
      return {
        status: 'not-ready',
        dataDir,
        reason: error instanceof Error ? error.message : 'data directory is not writable',
        timestamp: new Date().toISOString(),
      }
    }

    return {
      status: 'ready',
      dataDir,
      timestamp: new Date().toISOString(),
    }
  }
}
