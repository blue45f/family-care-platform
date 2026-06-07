// 인증 도메인 타입. 다른 컬렉션과 달리 사용자 정보는 web과 공유할 민감 필드가 있어
// @family-care/shared가 아닌 auth 모듈 내부에서만 정의한다.

export const userRoles = ['operator', 'admin'] as const
export type UserRole = (typeof userRoles)[number]

// JSON 스토어에 저장되는 사용자 레코드. passwordHash는 절대 응답에 포함하지 않는다.
export interface User {
  id: number
  email: string
  name: string
  passwordHash: string
  role: UserRole
  createdAt: string
}

// API 응답으로 노출 가능한 사용자(비밀번호 해시 제외).
export type PublicUser = Omit<User, 'passwordHash'>

export interface RegisterInput {
  email: string
  name: string
  password: string
  // 미지정 시 operator로 생성한다.
  role?: UserRole
}

export interface LoginInput {
  email: string
  password: string
}

// 로그인/회원가입 성공 응답: 토큰 + 공개 사용자 정보.
export interface AuthResult {
  token: string
  user: PublicUser
}

// AuthGuard가 request에 부착하는 인증 사용자(라우트 핸들러에서 참조 가능).
export interface AuthenticatedUser {
  id: number
  email: string
  role: UserRole
}
