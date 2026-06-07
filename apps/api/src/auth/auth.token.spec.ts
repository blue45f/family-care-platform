import { describe, expect, it } from 'vitest'

import { signAuthToken, verifyAuthToken } from './auth.token'
import { hashPassword, verifyPassword } from './password.util'

const SECRET = 'test-secret-key'

describe('auth token (HMAC JWT)', () => {
  it('서명한 토큰을 같은 시크릿으로 검증하면 클레임을 복원한다', () => {
    const token = signAuthToken({ sub: '7', email: 'a@b.com', role: 'admin' }, SECRET, 1000)
    const payload = verifyAuthToken(token, SECRET, 1000)
    expect(payload?.sub).toBe('7')
    expect(payload?.email).toBe('a@b.com')
    expect(payload?.role).toBe('admin')
    expect(payload?.exp).toBeGreaterThan(1000)
  })

  it('다른 시크릿으로 검증하면 null을 반환한다', () => {
    const token = signAuthToken({ sub: '1', email: 'a@b.com', role: 'operator' }, SECRET, 1000)
    expect(verifyAuthToken(token, 'other-secret', 1000)).toBeNull()
  })

  it('만료된 토큰은 null을 반환한다', () => {
    const token = signAuthToken({ sub: '1', email: 'a@b.com', role: 'operator' }, SECRET, 1000)
    // exp는 1000 + TTL. TTL을 한참 넘긴 시각으로 검증한다.
    expect(verifyAuthToken(token, SECRET, 1000 + 60 * 60 * 24 * 365)).toBeNull()
  })

  it('서명을 조작하면 null을 반환한다', () => {
    const token = signAuthToken({ sub: '1', email: 'a@b.com', role: 'operator' }, SECRET, 1000)
    const tampered = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`
    expect(verifyAuthToken(tampered, SECRET, 1000)).toBeNull()
  })

  it('형식이 잘못된 토큰은 null을 반환한다', () => {
    expect(verifyAuthToken('only.two', SECRET, 1000)).toBeNull()
    expect(verifyAuthToken('', SECRET, 1000)).toBeNull()
  })
})

describe('password hashing (scrypt salt:hash)', () => {
  it('해시는 salt:hash(hex) 형식이고 원문을 포함하지 않는다', () => {
    const hash = hashPassword('demo-1234')
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    expect(hash).not.toContain('demo-1234')
  })

  it('같은 비밀번호도 salt 때문에 매번 다른 해시를 만든다', () => {
    expect(hashPassword('same-pass')).not.toBe(hashPassword('same-pass'))
  })

  it('올바른 비밀번호는 검증을 통과하고 틀린 비밀번호는 실패한다', () => {
    const hash = hashPassword('correct-horse')
    expect(verifyPassword('correct-horse', hash)).toBe(true)
    expect(verifyPassword('wrong-horse', hash)).toBe(false)
  })

  it('형식이 깨진 저장값은 throw 없이 false를 반환한다', () => {
    expect(verifyPassword('whatever', 'not-a-valid-stored-hash')).toBe(false)
    expect(verifyPassword('whatever', '')).toBe(false)
  })
})
