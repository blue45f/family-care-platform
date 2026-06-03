import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

import {
  RateLimitMiddleware,
  TokenBucketRateLimiter,
  resolveClientKey,
  resolveRateLimitOptions,
} from './rate-limit.middleware';

// Express의 NextFunction은 오버로드 타입이라 vi.fn<NextFunction>()이 직접 대입되지 않는다.
// 호출 횟수 검증용 스파이를 NextFunction으로 안전하게 캐스팅해 반환한다.
function createNextSpy(): NextFunction & Mock {
  return vi.fn() as unknown as NextFunction & Mock;
}

function createMockResponse(): Response & { headers: Record<string, string>; statusCode: number; body: unknown } {
  const headers: Record<string, string> = {};
  const res = {
    headers,
    statusCode: 200,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res as unknown as Response & { headers: Record<string, string>; statusCode: number; body: unknown };
}

function createMockRequest(headers: Record<string, string | string[]> = {}, ip = '10.0.0.1'): Request {
  return {
    headers,
    ip,
    socket: { remoteAddress: ip },
  } as unknown as Request;
}

describe('TokenBucketRateLimiter', () => {
  it('윈도우 내 최대치까지 허용하고 그 이후엔 차단한다', () => {
    const limiter = new TokenBucketRateLimiter({ windowMs: 1000, maxRequests: 2 });
    const now = 1_000;

    const first = limiter.consume('a', now);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);

    const second = limiter.consume('a', now);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);

    const third = limiter.consume('a', now);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterMs).toBe(1000);
    expect(third.resetAt).toBe(now + 1000);
  });

  it('윈도우가 지나면 카운트를 리셋한다', () => {
    const limiter = new TokenBucketRateLimiter({ windowMs: 1000, maxRequests: 1 });

    expect(limiter.consume('a', 0).allowed).toBe(true);
    expect(limiter.consume('a', 500).allowed).toBe(false);
    // 윈도우(resetAt=1000) 경과 후 다시 허용된다.
    expect(limiter.consume('a', 1000).allowed).toBe(true);
  });

  it('클라이언트 키별로 카운트를 독립적으로 관리한다', () => {
    const limiter = new TokenBucketRateLimiter({ windowMs: 1000, maxRequests: 1 });
    expect(limiter.consume('a', 0).allowed).toBe(true);
    expect(limiter.consume('b', 0).allowed).toBe(true);
    expect(limiter.consume('a', 0).allowed).toBe(false);
  });

  it('cleanup은 만료된 버킷만 제거한다', () => {
    const limiter = new TokenBucketRateLimiter({ windowMs: 1000, maxRequests: 1 });
    limiter.consume('expired', 0); // resetAt = 1000
    limiter.consume('fresh', 5000); // resetAt = 6000

    limiter.cleanup(2000);

    // 만료된 'expired'는 새 윈도우로 리셋되어 다시 허용된다.
    expect(limiter.consume('expired', 2000).allowed).toBe(true);
    // 'fresh'는 아직 살아있어 한도 초과로 차단된다.
    expect(limiter.consume('fresh', 5500).allowed).toBe(false);
  });
});

describe('resolveRateLimitOptions', () => {
  it('환경 변수가 없으면 기본값(60초/120회)을 사용한다', () => {
    expect(resolveRateLimitOptions({})).toEqual({ windowMs: 60_000, maxRequests: 120 });
  });

  it('RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX를 반영한다', () => {
    expect(resolveRateLimitOptions({ RATE_LIMIT_WINDOW_MS: '5000', RATE_LIMIT_MAX: '10' })).toEqual({
      windowMs: 5000,
      maxRequests: 10,
    });
  });

  it('RATE_LIMIT_MAX_REQUESTS도 호환 변수로 인정한다', () => {
    expect(resolveRateLimitOptions({ RATE_LIMIT_MAX_REQUESTS: '7' }).maxRequests).toBe(7);
  });

  it('RATE_LIMIT_MAX가 RATE_LIMIT_MAX_REQUESTS보다 우선한다', () => {
    expect(resolveRateLimitOptions({ RATE_LIMIT_MAX: '3', RATE_LIMIT_MAX_REQUESTS: '99' }).maxRequests).toBe(3);
  });

  it('잘못된 값(0/음수/NaN)은 기본값으로 대체한다', () => {
    expect(resolveRateLimitOptions({ RATE_LIMIT_WINDOW_MS: '0', RATE_LIMIT_MAX: '-5' })).toEqual({
      windowMs: 60_000,
      maxRequests: 120,
    });
    expect(resolveRateLimitOptions({ RATE_LIMIT_MAX: 'abc' }).maxRequests).toBe(120);
  });
});

describe('resolveClientKey', () => {
  it('X-Forwarded-For 첫 IP를 우선 사용한다', () => {
    expect(resolveClientKey(createMockRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
  });

  it('배열 형태의 X-Forwarded-For도 처리한다', () => {
    expect(resolveClientKey(createMockRequest({ 'x-forwarded-for': ['9.9.9.9'] }))).toBe('9.9.9.9');
  });

  it('헤더가 없으면 request.ip로 대체한다', () => {
    expect(resolveClientKey(createMockRequest({}, '127.0.0.1'))).toBe('127.0.0.1');
  });
});

describe('RateLimitMiddleware', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    vi.restoreAllMocks();
  });

  it('한도 내에서는 next()를 호출하고 X-RateLimit-* 헤더를 붙인다', () => {
    process.env.RATE_LIMIT_MAX = '2';
    const middleware = new RateLimitMiddleware();
    const res = createMockResponse();
    const next = createNextSpy();

    middleware.use(createMockRequest({ 'x-forwarded-for': '1.1.1.1' }), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.headers['X-RateLimit-Limit']).toBe('2');
    expect(res.headers['X-RateLimit-Remaining']).toBe('1');
    expect(res.headers['X-RateLimit-Reset']).toBeDefined();
    expect(res.statusCode).toBe(200);
  });

  it('한도 초과 시 429와 Retry-After를 반환하고 next()를 호출하지 않는다', () => {
    process.env.RATE_LIMIT_MAX = '1';
    const middleware = new RateLimitMiddleware();
    const next = createNextSpy();
    const req = createMockRequest({ 'x-forwarded-for': '2.2.2.2' });

    middleware.use(req, createMockResponse(), next); // 1회차: 허용
    const res = createMockResponse();
    middleware.use(req, res, next); // 2회차: 초과

    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBeDefined();
    expect(res.body).toMatchObject({ statusCode: 429, error: 'TooManyRequests' });
    expect(next).toHaveBeenCalledTimes(1); // 첫 요청만 통과
  });

  it('서로 다른 클라이언트는 독립적으로 한도가 적용된다', () => {
    process.env.RATE_LIMIT_MAX = '1';
    const middleware = new RateLimitMiddleware();
    const next = createNextSpy();

    middleware.use(createMockRequest({ 'x-forwarded-for': '3.3.3.3' }), createMockResponse(), next);
    middleware.use(createMockRequest({ 'x-forwarded-for': '4.4.4.4' }), createMockResponse(), next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
