import { createContext } from 'react'

export type AuthUser = {
  id: string | number
  email: string
  name: string
  /** 서버 역할(operator/admin). 어드민 메뉴/관리 동작 노출 판단에 사용한다. */
  role?: 'operator' | 'admin'
  /** 기업/기관 회원의 소속 기관명(선택). */
  organization?: string
  /** 회원 탈퇴 처리된 계정은 일반 세션에서 복원되지 않는다. */
  withdrawnAt?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type UpdateProfileInput = {
  name?: string
  organization?: string | null
  currentPassword?: string
  newPassword?: string
}

export type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  /** 부트스트랩(me 확인)이 끝나기 전 true. 라우트 게이트의 깜빡임 방지용. */
  isResolving: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (
    email: string,
    password: string,
    name: string,
    organization?: string
  ) => Promise<AuthUser>
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>
  withdrawAccount: (password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
