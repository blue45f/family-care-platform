import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  type OnModuleInit,
} from '@nestjs/common'

import { JsonCollectionStore } from '../common/json-store'
import { localYmd } from '../common/date.util'
import { parseWithSchema } from '../common/zod-validation.pipe'
import { hashPassword, verifyPassword } from './password.util'
import { signAuthToken, verifyAuthToken } from './auth.token'
import { loginInputSchema, registerInputSchema } from './auth.schema'
import type {
  AuthResult,
  AuthenticatedUser,
  LoginInput,
  PublicUser,
  RegisterInput,
  User,
  UserRole,
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

  // 공통 삽입 경로. 검증된 입력을 해싱/정규화해 저장하고 저장된 레코드를 반환한다.
  private insertUser(input: RegisterInput): User {
    const next: User = {
      id: this.state.seq!,
      email: this.normalizeEmail(input.email),
      name: input.name.trim(),
      passwordHash: hashPassword(input.password),
      role: input.role ?? 'operator',
      createdAt: localYmd(),
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

    const created = this.insertUser(parsed)
    return this.buildAuthResult(created)
  }

  /** POST /api/auth/login — 자격 증명 검증 후 토큰 발급. 실패 시 401. */
  login(input: LoginInput): AuthResult {
    const parsed = parseWithSchema(loginInputSchema, input)

    const user = this.findRecordByEmail(parsed.email)
    // 사용자 부재/비밀번호 불일치 모두 동일 메시지로 응답해 계정 존재 여부 누출을 막는다.
    if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.')
    }

    return this.buildAuthResult(user)
  }

  /** GET /api/auth/me — Bearer 토큰의 사용자 공개 정보. */
  getProfile(userId: number): PublicUser {
    const user = this.state.items.find((candidate) => candidate.id === userId)
    if (!user) {
      throw new UnauthorizedException('인증 정보가 유효하지 않습니다.')
    }
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

    const user = this.state.items.find((candidate) => candidate.id === userId)
    if (!user) {
      return null
    }

    return { id: user.id, email: user.email, role: user.role }
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
