import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  type OnModuleInit,
} from '@nestjs/common'

import { localYmd } from '../common/date.util'
import { JsonCollectionStore } from '../common/json-store'
import { parseWithSchema } from '../common/zod-validation.pipe'

import {
  loginInputSchema,
  adminUserUpdateInputSchema,
  registerInputSchema,
  suspensionInputSchema,
  updateProfileInputSchema,
  withdrawAccountInputSchema,
} from './auth.schema'
import { signAuthToken, verifyAuthToken } from './auth.token'
import { hashPassword, verifyPassword } from './password.util'

import type {
  AdminUserUpdateInput,
  AuthResult,
  AuthenticatedUser,
  LoginInput,
  PublicUser,
  RegisterInput,
  SuspensionInput,
  UpdateProfileInput,
  User,
  UserRole,
  WithdrawAccountInput,
} from './auth.model'

// 시작 시 멱등하게 생성하는 데모 계정. 이미 존재하면(이메일 기준) 건드리지 않는다.
const DEMO_EMAIL = 'demo@familycare.app'
const DEMO_PASSWORD = 'demo-1234'
const DEMO_NAME = '데모 관리자'
const DEMO_ROLE: UserRole = 'admin'

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name)

  // 다른 컬렉션과 동일한 원자적 JSON 파일 스토어(users.json). seq로 자동 증가 id 사용.
  private readonly store = new JsonCollectionStore<User>('users.json', () => ({
    items: [],
    seq: 1,
  }))
  private state = this.store.load()

  // 부팅 시 데모 계정을 멱등하게 시드한다. 테스트 환경에서는 save()가 no-op이라
  // 파일을 만들지 않지만, 인메모리 시드는 동일하게 적용된다.
  onModuleInit(): void {
    this.seedDemoUser()
  }

  private seedDemoUser(): void {
    if (this.findRecordByEmail(DEMO_EMAIL)) {
      return
    }

    this.insertUser({
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      password: DEMO_PASSWORD,
      role: DEMO_ROLE,
    })
    // 테스트 환경에서는 매 인스턴스가 시드를 반복하므로 로그 소음을 피한다.
    if (process.env.VITEST === undefined && process.env.NODE_ENV !== 'test') {
      this.logger.log(`데모 계정을 생성했습니다: ${DEMO_EMAIL}`)
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private findRecordByEmail(email: string): User | undefined {
    const normalized = this.normalizeEmail(email)
    return this.state.items.find((user) => user.email === normalized)
  }

  private toPublicUser(user: User): PublicUser {
    // passwordHash를 의도적으로 제거해 응답에 절대 노출되지 않게 한다.
    const { passwordHash: _passwordHash, ...rest } = user
    return rest
  }

  private isWithdrawn(user: User): boolean {
    return Boolean(user.withdrawnAt)
  }

  private findRecordById(userId: number): User | undefined {
    return this.state.items.find((candidate) => candidate.id === userId)
  }

  private adminCount(): number {
    return this.state.items.filter(
      (candidate) => candidate.role === 'admin' && !candidate.withdrawnAt
    ).length
  }

  private activeAdminCount(): number {
    return this.state.items.filter(
      (candidate) =>
        candidate.role === 'admin' && !candidate.withdrawnAt && candidate.suspended !== true
    ).length
  }

  // 공통 삽입 경로. 검증된 입력을 해싱/정규화해 저장하고 저장된 레코드를 반환한다.
  private insertUser(input: RegisterInput): User {
    const organization = input.organization?.trim()
    const next: User = {
      id: this.state.seq!,
      email: this.normalizeEmail(input.email),
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      role: input.role ?? 'operator',
      createdAt: localYmd(),
      // 기업/기관 회원만 organization 키를 가진다(개인 회원 레코드는 기존 모양 유지).
      ...(organization ? { organization } : {}),
    }

    this.state.items.push(next)
    this.state.seq = this.state.seq! + 1
    this.store.save(this.state)
    return next
  }

  /** POST /api/auth/register — 신규 계정 생성. 이메일 중복 시 409. */
  register(input: RegisterInput): AuthResult {
    const parsed = parseWithSchema(registerInputSchema, input)

    if (this.findRecordByEmail(parsed.email)) {
      throw new ConflictException('이미 등록된 이메일입니다.')
    }

    // 공개 가입은 절대 권한을 자기 지정할 수 없다 — 클라이언트가 보낸 role 은 버리고
    // 항상 최소 권한(operator)으로 생성한다. 승격은 관리자 전용 경로로만.
    const created = this.insertUser({ ...parsed, role: 'operator' })
    return this.buildAuthResult(created)
  }

  /** POST /api/auth/login — 자격 증명 검증 후 토큰 발급. 실패 시 401. */
  login(input: LoginInput): AuthResult {
    const parsed = parseWithSchema(loginInputSchema, input)

    const user = this.findRecordByEmail(parsed.email)
    // 사용자 부재/비밀번호 불일치 모두 동일 메시지로 응답해 계정 존재 여부 누출을 막는다.
    if (!user || this.isWithdrawn(user) || !verifyPassword(parsed.password, user.passwordHash)) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    // 정지 계정은 자격 증명이 맞아도 로그인하지 못한다(안내 메시지는 명시적으로 노출).
    if (user.suspended) {
      throw new ForbiddenException('이용이 정지된 계정입니다. 운영팀에 문의해 주세요.')
    }

    return this.buildAuthResult(user)
  }

  /** GET /api/auth/me — Bearer 토큰의 사용자 공개 정보. */
  getProfile(userId: number): PublicUser {
    const user = this.findRecordById(userId)
    if (!user || this.isWithdrawn(user) || user.suspended) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.')
    }
    return this.toPublicUser(user)
  }

  /** PATCH /api/auth/me — 이름/기관/비밀번호 수정. 비밀번호 변경에는 현재 비밀번호가 필요하다. */
  updateProfile(userId: number, input: UpdateProfileInput): PublicUser {
    const parsed = parseWithSchema(updateProfileInputSchema, input)
    const user = this.findRecordById(userId)
    if (!user || this.isWithdrawn(user) || user.suspended) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.')
    }

    if (parsed.newPassword) {
      if (!parsed.currentPassword || !verifyPassword(parsed.currentPassword, user.passwordHash)) {
        throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.')
      }
      user.passwordHash = hashPassword(parsed.newPassword)
    }

    if (parsed.name !== undefined) {
      user.name = parsed.name
    }
    if (Object.hasOwn(parsed, 'organization')) {
      if (parsed.organization) {
        user.organization = parsed.organization
      } else {
        delete user.organization
      }
    }

    this.store.save(this.state)
    return this.toPublicUser(user)
  }

  /**
   * AuthGuard용 토큰 검증. 서명/만료가 유효하고 사용자가 실재하면 인증 사용자를 반환한다.
   * (토큰이 가리키는 계정이 삭제됐을 수 있으므로 스토어에서 재확인한다.)
   */
  verifyBearerToken(token: string): AuthenticatedUser | null {
    const payload = verifyAuthToken(token)
    if (!payload) {
      return null
    }

    const userId = Number(payload.sub)
    if (!Number.isInteger(userId)) {
      return null
    }

    const user = this.findRecordById(userId)
    if (!user || this.isWithdrawn(user)) {
      return null
    }

    // 정지 계정의 기존 토큰은 즉시 무효 취급한다(쓰기 401, /auth/me 401 → 클라이언트 로그아웃).
    if (user.suspended) {
      return null
    }

    return { id: user.id, email: user.email, name: user.name, role: user.role }
  }

  /** DELETE /api/auth/me — 본인 계정 탈퇴. 개인정보를 익명화하고 기존 토큰을 무효화한다. */
  withdrawAccount(userId: number, input: WithdrawAccountInput): PublicUser {
    const parsed = parseWithSchema(withdrawAccountInputSchema, input)
    const user = this.findRecordById(userId)
    if (!user || this.isWithdrawn(user)) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.')
    }
    if (!verifyPassword(parsed.password, user.passwordHash)) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.')
    }
    if (user.role === 'admin' && this.adminCount() <= 1) {
      throw new ForbiddenException('마지막 관리자 계정은 탈퇴할 수 없습니다.')
    }

    this.withdrawUserRecord(user)
    this.store.save(this.state)
    return this.toPublicUser(user)
  }

  private withdrawUserRecord(user: User): void {
    user.withdrawnAt = new Date().toISOString()
    user.email = `withdrawn-${user.id}@withdrawn.family-care.local`
    user.name = '탈퇴 회원'
    user.passwordHash = hashPassword(`withdrawn-${user.id}-${user.withdrawnAt}`)
    user.suspended = false
    delete user.organization
  }

  /** GET /api/admin/users — 어드민 회원 목록(가입 순). 비밀번호 해시는 제외한다. */
  listUsers(): PublicUser[] {
    return [...this.state.items].sort((a, b) => a.id - b.id).map((user) => this.toPublicUser(user))
  }

  /**
   * PATCH /api/admin/users/:id/suspension — 이용 정지/해제.
   * 호환용 endpoint이며 실제 정책은 updateUserByAdmin에 모은다.
   */
  setSuspension(targetId: number, input: SuspensionInput, actor: AuthenticatedUser): PublicUser {
    const parsed = parseWithSchema(suspensionInputSchema, input)
    return this.updateUserByAdmin(
      targetId,
      { status: parsed.suspended ? 'suspended' : 'active' },
      actor
    )
  }

  /**
   * PATCH /api/admin/users/:id — 역할/상태 통합 변경.
   * 기존 suspension endpoint도 이 경로를 내부적으로 사용해 권한 보호 규칙을 한 곳에 둔다.
   */
  updateUserByAdmin(
    targetId: number,
    input: AdminUserUpdateInput,
    actor: AuthenticatedUser
  ): PublicUser {
    const parsed = parseWithSchema(adminUserUpdateInputSchema, input)
    const target = this.findRecordById(targetId)
    if (!target) {
      throw new NotFoundException('회원을 찾을 수 없습니다.')
    }
    if (this.isWithdrawn(target)) {
      throw new ForbiddenException('탈퇴한 회원은 변경할 수 없습니다.')
    }

    const nextRole = parsed.role ?? target.role
    const nextStatus = parsed.status
    const willWithdraw = nextStatus === 'withdrawn'
    const willSuspend = nextStatus === 'suspended'

    this.assertAdminUserChangeAllowed(target, actor, {
      nextRole,
      willSuspend,
      willWithdraw,
    })

    if (willWithdraw) {
      this.withdrawUserRecord(target)
    } else {
      target.role = nextRole
      if (nextStatus === 'active') {
        target.suspended = false
      }
      if (nextStatus === 'suspended') {
        target.suspended = true
      }
    }

    this.store.save(this.state)
    return this.toPublicUser(target)
  }

  private assertAdminUserChangeAllowed(
    target: User,
    actor: AuthenticatedUser,
    change: { nextRole: UserRole; willSuspend: boolean; willWithdraw: boolean }
  ): void {
    if (target.id === actor.id) {
      if (change.willWithdraw) {
        throw new ForbiddenException('본인 계정은 탈퇴 처리할 수 없습니다.')
      }
      if (change.willSuspend) {
        throw new ForbiddenException('본인 계정은 정지할 수 없습니다.')
      }
      if (target.role === 'admin' && change.nextRole !== 'admin') {
        throw new ForbiddenException('본인 관리자 권한은 직접 하향할 수 없습니다.')
      }
    }

    if (target.role !== 'admin') {
      return
    }

    const willLoseAdminRole = change.nextRole !== 'admin' || change.willWithdraw
    if (willLoseAdminRole && this.adminCount() <= 1) {
      throw new ForbiddenException('마지막 관리자 계정은 권한 하향 또는 탈퇴 처리할 수 없습니다.')
    }

    if (change.willSuspend && target.suspended !== true && this.activeAdminCount() <= 1) {
      throw new ForbiddenException('마지막 활성 관리자 계정은 정지할 수 없습니다.')
    }
  }

  private buildAuthResult(user: User): AuthResult {
    const token = signAuthToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    })
    return { token, user: this.toPublicUser(user) }
  }
}
