import { describe, expect, it } from 'vitest'

import { requireAdmin, requireUser } from './role.util'
import type { AuthenticatedUser } from './auth.model'

const operator: AuthenticatedUser = {
  id: 2,
  email: 'op@example.com',
  name: '김운영',
  role: 'operator',
}
const admin: AuthenticatedUser = {
  id: 1,
  email: 'admin@example.com',
  name: '관리자',
  role: 'admin',
}

describe('role.util', () => {
  it('requireUser는 미인증이면 401을 던지고 인증 사용자는 그대로 반환한다', () => {
    expect(() => requireUser(undefined)).toThrow('이 작업을 수행하려면 로그인이 필요합니다.')
    expect(requireUser(operator)).toBe(operator)
  })

  it('requireAdmin은 미인증 401, 비관리자 403, 관리자는 통과한다', () => {
    expect(() => requireAdmin(undefined)).toThrow('이 작업을 수행하려면 로그인이 필요합니다.')
    expect(() => requireAdmin(operator)).toThrow('관리자 권한이 필요합니다.')
    expect(requireAdmin(admin)).toBe(admin)
  })
})
