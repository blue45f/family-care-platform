import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.doUnmock('./db/client')
    vi.restoreAllMocks()
  })

  it("healthCheck는 liveness 상태 'ok'를 반환한다", async () => {
    const { HealthController } = await import('./health.controller')
    const controller = new HealthController()
    expect(controller.healthCheck().status).toBe('ok')
  })

  it("readiness는 데이터베이스 쿼리가 성공하면 200 'ready'를 반환한다", async () => {
    const execute = vi.fn(() => Promise.resolve())
    vi.doMock('./db/client', () => ({
      db: { execute },
      dbEnabled: true,
    }))

    const { HealthController: TargetController } = await import('./health.controller')
    const controller = new TargetController()
    const res = createResponse()

    const body = await controller.readiness(res as never)

    expect(res.statusCode).toBe(200)
    expect(body.status).toBe('ready')
    expect(body.database).toBe('connected')
    expect(execute).toHaveBeenCalled()
  })

  it("readiness는 데이터베이스가 비활성화 상태면 503 'not-ready'를 반환한다", async () => {
    vi.doMock('./db/client', () => ({
      db: null,
      dbEnabled: false,
    }))

    const { HealthController: TargetController } = await import('./health.controller')
    const controller = new TargetController()
    const res = createResponse()

    const body = await controller.readiness(res as never)

    expect(res.statusCode).toBe(503)
    expect(body.status).toBe('not-ready')
    expect(body.reason).toContain('database is not enabled')
  })

  it("readiness는 데이터베이스 쿼리가 실패하면 503 'not-ready'를 반환한다", async () => {
    const execute = vi.fn(() => Promise.reject(new Error('connection timeout')))
    vi.doMock('./db/client', () => ({
      db: { execute },
      dbEnabled: true,
    }))

    const { HealthController: TargetController } = await import('./health.controller')
    const controller = new TargetController()
    const res = createResponse()

    const body = await controller.readiness(res as never)

    expect(res.statusCode).toBe(503)
    expect(body.status).toBe('not-ready')
    expect(body.reason).toBe('connection timeout')
  })
})
