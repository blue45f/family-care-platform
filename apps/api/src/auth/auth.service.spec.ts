import { beforeEach, describe, expect, it } from 'vitest'

import { AuthService } from './auth.service'

// 테스트 환경(VITEST)에서는 JsonCollectionStore가 인메모리로만 동작하고 save()는 no-op이라
// 매 인스턴스가 빈 seed에서 출발한다. onModuleInit는 Nest 런타임이 호출하므로 직접 부른다.
function createService(): AuthService {
  const service = new AuthService()
  service.onModuleInit()
  return service
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(() => {
    service = createService()
  })

  it('시작 시 데모 계정을 멱등하게 시드한다', () => {
    const result = service.login({ email: 'demo@familycare.app', password: 'demo-1234' })
    expect(result.user.email).toBe('demo@familycare.app')
    expect(result.user.role).toBe('admin')
    // 응답에 passwordHash가 노출되지 않아야 한다.
    expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined()

    // 두 번째 인스턴스도 데모를 중복 생성하지 않는다(멱등).
    const second = createService()
    expect(() =>
      second.login({ email: 'demo@familycare.app', password: 'demo-1234' }),
    ).not.toThrow()
  })

  it('회원가입 후 토큰과 공개 사용자 정보를 반환한다', () => {
    const result = service.register({
      email: 'Operator@Example.com',
      name: '  김운영 ',
      password: 'secret123',
    })

    expect(result.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    expect(result.user.email).toBe('operator@example.com')
    expect(result.user.name).toBe('김운영')
    expect(result.user.role).toBe('operator')
    expect((result.user as Record<string, unknown>).passwordHash).toBeUndefined()
  })

  it('이메일은 대소문자 무관하게 중복을 거부한다', () => {
    service.register({ email: 'dup@example.com', name: '중복', password: 'secret123' })
    expect(() =>
      service.register({ email: 'DUP@example.com', name: '중복2', password: 'secret123' }),
    ).toThrow('이미 등록된 이메일입니다.')
  })

  it('비밀번호가 8자 미만이면 거부한다', () => {
    expect(() =>
      service.register({ email: 'short@example.com', name: '짧음', password: 'short' }),
    ).toThrow('비밀번호는 8자 이상이어야 합니다.')
  })

  it('올바른 자격 증명으로 로그인하면 토큰을 발급한다', () => {
    service.register({ email: 'login@example.com', name: '로그인', password: 'secret123' })
    const result = service.login({ email: 'LOGIN@example.com', password: 'secret123' })
    expect(result.token.length).toBeGreaterThan(0)
    expect(result.user.email).toBe('login@example.com')
  })

  it('잘못된 비밀번호는 일반화된 메시지로 거부한다', () => {
    service.register({ email: 'wrong@example.com', name: '오류', password: 'secret123' })
    expect(() => service.login({ email: 'wrong@example.com', password: 'nope-nope' })).toThrow(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
  })

  it('존재하지 않는 계정 로그인도 동일 메시지로 거부한다(존재 여부 누출 방지)', () => {
    expect(() => service.login({ email: 'ghost@example.com', password: 'whatever1' })).toThrow(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
  })

  it('유효한 토큰을 검증하면 인증 사용자를 반환한다', () => {
    const { token, user } = service.register({
      email: 'verify@example.com',
      name: '검증',
      password: 'secret123',
    })
    const authenticated = service.verifyBearerToken(token)
    expect(authenticated).not.toBeNull()
    expect(authenticated?.id).toBe(user.id)
    expect(authenticated?.email).toBe('verify@example.com')
  })

  it('조작/형식 오류 토큰은 null을 반환한다', () => {
    expect(service.verifyBearerToken('not-a-token')).toBeNull()
    expect(service.verifyBearerToken('a.b.c')).toBeNull()
  })

  it('me 프로필은 passwordHash 없이 사용자를 반환한다', () => {
    const { user } = service.register({
      email: 'me@example.com',
      name: '나',
      password: 'secret123',
    })
    const profile = service.getProfile(user.id)
    expect(profile.email).toBe('me@example.com')
    expect((profile as Record<string, unknown>).passwordHash).toBeUndefined()
  })
})
