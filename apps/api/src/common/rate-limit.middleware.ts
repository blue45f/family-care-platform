import { Injectable } from '@nestjs/common'

import type { NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

export interface RateLimiterOptions {
  windowMs: number
  maxRequests: number
}

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
  retryAfterMs: number
  resetAt: number
}

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_MAX_REQUESTS = 120

// 양의 정수만 허용하고, 잘못된 값(NaN/0/음수)은 fallback으로 대체한다.
function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}

// 환경 변수에서 윈도우/최대 요청 수를 읽어 옵션을 만든다.
// RATE_LIMIT_MAX를 우선 사용하고, 호환을 위해 RATE_LIMIT_MAX_REQUESTS도 인정한다.
export function resolveRateLimitOptions(env: NodeJS.ProcessEnv = process.env): RateLimiterOptions {
  return {
    windowMs: toPositiveInt(env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
    maxRequests: toPositiveInt(
      env.RATE_LIMIT_MAX ?? env.RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_MAX_REQUESTS,
    ),
  }
}

// 의존성 없는 인메모리 토큰 버킷 한도기.
// 윈도우 단위로 클라이언트별 요청 수를 세고, 윈도우가 지나면 자동으로 리셋한다.
export class TokenBucketRateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  constructor(private readonly options: RateLimiterOptions) {}

  consume(key: string, now = Date.now()): RateLimitDecision {
    const existing = this.buckets.get(key)
    const bucket =
      !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + this.options.windowMs }
        : existing

    bucket.count += 1
    this.buckets.set(key, bucket)

    return {
      allowed: bucket.count <= this.options.maxRequests,
      remaining: Math.max(0, this.options.maxRequests - bucket.count),
      retryAfterMs: Math.max(0, bucket.resetAt - now),
      resetAt: bucket.resetAt,
    }
  }

  // 만료된 버킷을 제거해 메모리 누수를 막는다.
  cleanup(now = Date.now()): void {
    for (const [clientKey, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(clientKey)
      }
    }
  }
}

// 요청에서 클라이언트 식별 키(IP)를 뽑는다. 프록시 뒤를 고려해 X-Forwarded-For를 우선한다.
export function resolveClientKey(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for']
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0]?.trim() || request.ip || request.socket?.remoteAddress || 'unknown'
  }
  return (
    forwardedFor?.split(',')[0]?.trim() || request.ip || request.socket?.remoteAddress || 'unknown'
  )
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly options = resolveRateLimitOptions()
  private readonly limiter = new TokenBucketRateLimiter(this.options)

  private lastCleanupAt = 0
  private readonly cleanupIntervalMs = 30_000

  use(request: Request, response: Response, next: NextFunction): void {
    const now = Date.now()
    const clientKey = resolveClientKey(request)
    const result = this.limiter.consume(clientKey, now)

    response.setHeader('X-RateLimit-Limit', String(this.options.maxRequests))
    response.setHeader('X-RateLimit-Remaining', String(result.remaining))
    response.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString())

    if (!result.allowed) {
      response.setHeader('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)))
      response.status(429).json({
        error: 'TooManyRequests',
        detail: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        statusCode: 429,
        timestamp: new Date(now).toISOString(),
      })
      return
    }

    if (now >= this.lastCleanupAt + this.cleanupIntervalMs) {
      this.lastCleanupAt = now
      this.limiter.cleanup(now)
    }

    next()
  }
}
