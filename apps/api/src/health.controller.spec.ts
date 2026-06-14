import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { HealthController } from './health.controller'

type CapturedResponse = {
  statusCode: number
  status(code: number): CapturedResponse
}

function createResponse(): CapturedResponse {
  const res: CapturedResponse = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code
      return this
    },
  }
  return res
}

describe('HealthController', () => {
  const originalDataDir = process.env.FCP_DATA_DIR
  let tempRoot: string

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'fcp-health-'))
  })

  afterEach(() => {
    if (originalDataDir === undefined) {
      delete process.env.FCP_DATA_DIR
    } else {
      process.env.FCP_DATA_DIR = originalDataDir
    }
    rmSync(tempRoot, { recursive: true, force: true })
  })

  it("healthCheck는 liveness 상태 'ok'를 반환한다", () => {
    const controller = new HealthController()
    expect(controller.healthCheck().status).toBe('ok')
  })

  it("readiness는 데이터 디렉터리가 쓰기 가능하면 200 'ready'를 반환한다", () => {
    process.env.FCP_DATA_DIR = join(tempRoot, 'data')
    const controller = new HealthController()
    const res = createResponse()

    const body = controller.readiness(res as never)

    expect(res.statusCode).toBe(200)
    expect(body.status).toBe('ready')
  })

  it("readiness는 데이터 디렉터리에 쓸 수 없으면 503 'not-ready'를 반환한다", () => {
    // 파일을 디렉터리 경로로 지정하면 mkdir/write가 실패한다(ENOTDIR).
    const blocker = join(tempRoot, 'blocker')
    rmSync(blocker, { force: true })
    writeFileSync(blocker, 'not a dir', 'utf8')
    process.env.FCP_DATA_DIR = join(blocker, 'data')

    const controller = new HealthController()
    const res = createResponse()

    const body = controller.readiness(res as never)

    expect(res.statusCode).toBe(503)
    expect(body.status).toBe('not-ready')
  })
})
