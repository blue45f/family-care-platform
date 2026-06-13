import { beforeEach, describe, expect, it } from 'vitest'

import { AuthService } from './auth.service'

import type { AuthenticatedUser } from './auth.model'

const adminActor: AuthenticatedUser = {
  id: 1,
  email: 'demo@familycare.app',
  name: '데모 관리자',
  role: 'admin',
}

// 테스트 환경(VITEST)에서는 JsonCollectionStore가 인메모리로만 동작하고 save()는 no-op이라
// 매 인스턴스가 빈 seed에서 출발한다. onModuleInit는 Nest 런타임이 호출하므로 직접 부른다.
function createService(): AuthService {
  const service = new AuthService()
  service.onModuleInit()
  return service
}

function forceRole(service: AuthService, userId: number, role: 'operator' | 'admin'): void {
  const items = (service as unknown as { state: { items: Array<{ id: number; role: string }> } })
    .state.items
  items.find((user) => user.id === userId)!.role = role
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

  it('내 프로필은 이름/기관을 수정하고 현재 비밀번호 확인 후 비밀번호를 바꾼다', () => {
    const { token, user } = service.register({
      email: 'profile@example.com',
      name: '수정 전',
      password: 'secret123',
      organization: '기존 기관',
    })

    const renamed = service.updateProfile(user.id, {
      name: '  수정 후  ',
      organization: '  새 기관  ',
    })
    expect(renamed.name).toBe('수정 후')
    expect(renamed.organization).toBe('새 기관')
    expect(service.verifyBearerToken(token)?.name).toBe('수정 후')

    const cleared = service.updateProfile(user.id, { organization: null })
    expect(cleared.organization).toBeUndefined()

    expect(() => service.updateProfile(user.id, { newPassword: 'newpass123' })).toThrow(
      '비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.',
    )
    expect(() =>
      service.updateProfile(user.id, {
        currentPassword: 'wrong',
        newPassword: 'newpass123',
      }),
    ).toThrow('현재 비밀번호가 올바르지 않습니다.')

    service.updateProfile(user.id, {
      currentPassword: 'secret123',
      newPassword: 'newpass123',
    })
    expect(() => service.login({ email: 'profile@example.com', password: 'secret123' })).toThrow(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
    expect(service.login({ email: 'profile@example.com', password: 'newpass123' }).user.id).toBe(
      user.id,
    )
  })

  it('기업/기관 회원은 소속 기관명을 남길 수 있고, 빈 값은 미지정으로 정규화된다', () => {
    const corp = service.register({
      email: 'org@example.com',
      name: '기관 담당자',
      password: 'secret123',
      organization: '  행복요양센터  ',
    })
    expect(corp.user.organization).toBe('행복요양센터')

    const personal = service.register({
      email: 'personal@example.com',
      name: '개인',
      password: 'secret123',
      organization: '   ',
    })
    expect(personal.user.organization).toBeUndefined()

    expect(() =>
      service.register({
        email: 'long@example.com',
        name: '김김',
        password: 'secret123',
        organization: 'x'.repeat(81),
      }),
    ).toThrow('기관명은 80자 이내여야 합니다.')
  })

  it('회원 목록은 가입 순으로 passwordHash 없이 반환한다', () => {
    service.register({ email: 'u1@example.com', name: '일번', password: 'secret123' })
    service.register({ email: 'u2@example.com', name: '이번', password: 'secret123' })

    const users = service.listUsers()
    expect(users.map((user) => user.id)).toEqual([1, 2, 3])
    for (const user of users) {
      expect((user as Record<string, unknown>).passwordHash).toBeUndefined()
    }
  })

  it('이용 정지된 계정은 로그인과 기존 토큰 검증이 모두 막힌다', () => {
    const { token, user } = service.register({
      email: 'suspend@example.com',
      name: '정지 대상',
      password: 'secret123',
    })

    const suspended = service.setSuspension(user.id, { suspended: true }, adminActor)
    expect(suspended.suspended).toBe(true)

    expect(() => service.login({ email: 'suspend@example.com', password: 'secret123' })).toThrow(
      '이용이 정지된 계정입니다. 운영팀에 문의해 주세요.',
    )
    expect(service.verifyBearerToken(token)).toBeNull()
    expect(() => service.getProfile(user.id)).toThrow('인증 정보가 유효하지 않습니다.')

    // 해제하면 즉시 복구된다(같은 토큰도 다시 유효).
    service.setSuspension(user.id, { suspended: false }, adminActor)
    expect(service.verifyBearerToken(token)?.id).toBe(user.id)
    expect(() =>
      service.login({ email: 'suspend@example.com', password: 'secret123' }),
    ).not.toThrow()
  })

  it('회원 탈퇴는 계정을 익명화하고 로그인/기존 토큰을 무효화한다', () => {
    const { token, user } = service.register({
      email: 'withdraw@example.com',
      name: '탈퇴 대상',
      password: 'secret123',
      organization: '행복요양센터',
    })

    const withdrawn = service.withdrawAccount(user.id, { password: 'secret123' })
    expect(withdrawn.withdrawnAt).toBeTruthy()
    expect(withdrawn.email).toBe(`withdrawn-${user.id}@withdrawn.family-care.local`)
    expect(withdrawn.name).toBe('탈퇴 회원')
    expect(withdrawn.organization).toBeUndefined()
    expect(service.verifyBearerToken(token)).toBeNull()
    expect(() => service.getProfile(user.id)).toThrow('인증 정보가 유효하지 않습니다.')
    expect(() => service.login({ email: 'withdraw@example.com', password: 'secret123' })).toThrow(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )

    const rejoined = service.register({
      email: 'withdraw@example.com',
      name: '재가입',
      password: 'secret123',
    })
    expect(rejoined.user.email).toBe('withdraw@example.com')
  })

  it('탈퇴 비밀번호가 틀리거나 마지막 관리자이면 거부한다', () => {
    const { user } = service.register({
      email: 'withdraw-wrong@example.com',
      name: '탈퇴 실패',
      password: 'secret123',
    })
    expect(() => service.withdrawAccount(user.id, { password: 'wrong' })).toThrow(
      '비밀번호가 올바르지 않습니다.',
    )

    expect(() => service.withdrawAccount(adminActor.id, { password: 'demo-1234' })).toThrow(
      '마지막 관리자 계정은 탈퇴할 수 없습니다.',
    )
  })

  it('관리자 회원 변경은 통합 메서드에서 역할/상태와 보호 규칙을 처리한다', () => {
    expect(() => service.setSuspension(adminActor.id, { suspended: true }, adminActor)).toThrow(
      '본인 계정은 정지할 수 없습니다.',
    )

    expect(() =>
      service.updateUserByAdmin(adminActor.id, { role: 'operator' }, adminActor),
    ).toThrow('본인 관리자 권한은 직접 하향할 수 없습니다.')

    const operator = service.register({
      email: 'operator-update@example.com',
      name: '상태 변경',
      password: 'secret123',
    })
    expect(service.updateUserByAdmin(operator.user.id, { role: 'admin' }, adminActor).role).toBe(
      'admin',
    )
    expect(
      service.updateUserByAdmin(operator.user.id, { status: 'suspended' }, adminActor).suspended,
    ).toBe(true)
    expect(
      service.updateUserByAdmin(operator.user.id, { status: 'active' }, adminActor).suspended,
    ).toBe(false)
    expect(service.updateUserByAdmin(operator.user.id, { role: 'operator' }, adminActor).role).toBe(
      'operator',
    )

    const withdrawn = service.updateUserByAdmin(
      operator.user.id,
      { status: 'withdrawn' },
      adminActor,
    )
    expect(withdrawn.withdrawnAt).toBeTruthy()
    expect(withdrawn.name).toBe('탈퇴 회원')
    expect(() =>
      service.updateUserByAdmin(operator.user.id, { status: 'active' }, adminActor),
    ).toThrow('탈퇴한 회원은 변경할 수 없습니다.')

    expect(() => service.setSuspension(999, { suspended: true }, adminActor)).toThrow(
      '회원을 찾을 수 없습니다.',
    )
    const normal = service.register({ email: 'n@example.com', name: '회원', password: 'secret123' })
    expect(() =>
      service.setSuspension(normal.user.id, { suspended: 'yes' } as never, adminActor),
    ).toThrow('suspended는 true/false여야 합니다.')
  })

  it('마지막 관리자 권한 하향/정지/탈퇴 처리를 막고, 보조 관리자는 변경할 수 있다', () => {
    const second = service.register({
      email: 'admin2@example.com',
      name: '부관리자',
      password: 'secret123',
    })
    // 공개 가입의 role 지정은 무시되므로 관리자 전용 변경 경로로 승격한다.
    expect(second.user.role).toBe('operator')
    expect(service.updateUserByAdmin(second.user.id, { role: 'admin' }, adminActor).role).toBe(
      'admin',
    )

    expect(
      service.updateUserByAdmin(second.user.id, { status: 'suspended' }, adminActor).suspended,
    ).toBe(true)
    expect(
      service.updateUserByAdmin(second.user.id, { status: 'active' }, adminActor).suspended,
    ).toBe(false)
    expect(service.updateUserByAdmin(second.user.id, { role: 'operator' }, adminActor).role).toBe(
      'operator',
    )

    const secondActor: AuthenticatedUser = {
      id: second.user.id,
      email: second.user.email,
      name: second.user.name,
      role: 'admin',
    }

    expect(() =>
      service.updateUserByAdmin(adminActor.id, { status: 'suspended' }, secondActor),
    ).toThrow('마지막 활성 관리자 계정은 정지할 수 없습니다.')

    forceRole(service, second.user.id, 'admin')
    expect(
      service.updateUserByAdmin(second.user.id, { status: 'withdrawn' }, adminActor).name,
    ).toBe('탈퇴 회원')
    expect(() =>
      service.updateUserByAdmin(adminActor.id, { role: 'operator' }, secondActor),
    ).toThrow('마지막 관리자 계정은 권한 하향 또는 탈퇴 처리할 수 없습니다.')
  })
})
