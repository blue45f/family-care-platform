import { describe, expect, it } from 'vitest'

import { isCorsOriginAllowed, resolveAllowedOrigins } from './cors-policy'

describe('resolveAllowedOrigins', () => {
  it('CORS_ALLOWED_ORIGINS를 콤마로 분리하고 trim/빈값 제거한다', () => {
    expect(
      resolveAllowedOrigins({
        CORS_ALLOWED_ORIGINS: ' https://a.com , , https://b.com ',
      } as NodeJS.ProcessEnv)
    ).toEqual(['https://a.com', 'https://b.com'])
  })

  it('CORS_ALLOWED_ORIGINS가 없으면 단일 CORS_ALLOWED_ORIGIN을 사용한다', () => {
    expect(
      resolveAllowedOrigins({ CORS_ALLOWED_ORIGIN: 'https://only.com' } as NodeJS.ProcessEnv)
    ).toEqual(['https://only.com'])
  })

  it('둘 다 없으면 빈 배열을 반환한다', () => {
    expect(resolveAllowedOrigins({} as NodeJS.ProcessEnv)).toEqual([])
  })
})

describe('isCorsOriginAllowed', () => {
  it('Origin이 없으면 허용한다(서버-서버/동일 출처)', () => {
    expect(isCorsOriginAllowed(undefined, [], 'production')).toBe(true)
  })

  it('명시 목록에 포함되면 환경과 무관하게 허용한다', () => {
    expect(
      isCorsOriginAllowed('https://app.example.com', ['https://app.example.com'], 'production')
    ).toBe(true)
  })

  it('개발 환경에서는 로컬 Origin을 허용한다', () => {
    expect(isCorsOriginAllowed('http://localhost:5173', [], 'development')).toBe(true)
    expect(isCorsOriginAllowed('http://127.0.0.1:3000', [], 'development')).toBe(true)
  })

  it('프로덕션에서는 로컬 Origin을 허용하지 않는다', () => {
    expect(isCorsOriginAllowed('http://localhost:5173', [], 'production')).toBe(false)
  })

  it('명시 목록에 없는 외부 Origin은 거절한다', () => {
    expect(isCorsOriginAllowed('https://evil.com', ['https://app.example.com'], 'production')).toBe(
      false
    )
    expect(
      isCorsOriginAllowed('https://evil.com', ['https://app.example.com'], 'development')
    ).toBe(false)
  })
})
