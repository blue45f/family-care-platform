import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { deleteMyAccount, patchMyProfile } from '../api'
import { AuthContext, type AuthContextValue, type AuthStatus, type AuthUser } from './authContext'
import { readStoredToken, writeStoredToken } from './authSession'

/* =========================================================================
   Auth context: 토큰(localStorage) + 현재 사용자 + login/register/logout.

   백엔드 계약(auth-backend 팀):
     - POST /api/auth/login    { email, password }        -> { token, user }
     - POST /api/auth/register { email, password, name }   -> { token, user }
     - GET  /api/auth/me       (Authorization: Bearer)     -> user

   토큰은 localStorage에 보관하고, api.ts의 요청 헬퍼가 getAuthToken()으로
   읽어 Authorization 헤더에 실어 보낸다(authSession.ts wiring 참고).
   ========================================================================= */

type AuthResponse = {
  token: string
  user: AuthUser
}

// API 베이스 URL은 api.ts와 동일 규칙을 따른다(상호 의존을 피하려 여기서 독립 계산).
const DEFAULT_API_URL = import.meta.env.DEV ? 'http://127.0.0.1:3001/api' : '/api'
const BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL

const parseError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const text = await response.text()
    if (!text) {
      return fallback
    }
    try {
      const data = JSON.parse(text) as { message?: string | string[] }
      if (Array.isArray(data.message)) {
        return data.message.join(' ') || fallback
      }
      return data.message || text
    } catch {
      return text
    }
  } catch {
    return fallback
  }
}

const requestAuth = async (
  path: string,
  body: Record<string, unknown>,
  fallbackError: string
): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, fallbackError))
  }

  return (await response.json()) as AuthResponse
}

const fetchMe = async (token: string): Promise<AuthUser> => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error('세션이 만료되었습니다.')
  }
  return (await response.json()) as AuthUser
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    readStoredToken() ? 'loading' : 'unauthenticated'
  )

  // 마운트 시 저장된 토큰이 있으면 /auth/me로 사용자를 복원한다.
  // StrictMode 개발 환경에서는 effect가 재실행될 수 있으므로, 각 실행마다 자체 cancelled
  // 플래그를 둔다. 모듈 레벨 가드로 막으면 두 번째 실행이 건너뛰어 loading에 머문다.
  useEffect(() => {
    const token = readStoredToken()
    if (!token) {
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const me = await fetchMe(token)
        if (cancelled) {
          return
        }
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (cancelled) {
          return
        }
        writeStoredToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: nextUser } = await requestAuth(
      '/auth/login',
      { email, password },
      '로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.'
    )
    writeStoredToken(token)
    setUser(nextUser)
    setStatus('authenticated')
    return nextUser
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string, organization?: string) => {
      const { token, user: nextUser } = await requestAuth(
        '/auth/register',
        // 기관명은 입력했을 때만 보낸다(개인 회원 요청 본문은 기존과 동일).
        { email, password, name, ...(organization?.trim() ? { organization } : {}) },
        '회원가입에 실패했습니다. 입력 내용을 확인해 주세요.'
      )
      writeStoredToken(token)
      setUser(nextUser)
      setStatus('authenticated')
      return nextUser
    },
    []
  )

  const updateProfile = useCallback(async (input: Parameters<typeof patchMyProfile>[0]) => {
    const nextUser = await patchMyProfile(input)
    setUser(nextUser)
    setStatus('authenticated')
    return nextUser
  }, [])

  const withdrawAccount = useCallback(async (password: string) => {
    await deleteMyAccount(password)
    writeStoredToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const logout = useCallback(() => {
    writeStoredToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isResolving: status === 'loading',
      login,
      register,
      updateProfile,
      withdrawAccount,
      logout,
    }),
    [user, status, login, register, updateProfile, withdrawAccount, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
