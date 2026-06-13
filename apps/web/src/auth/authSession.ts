const TOKEN_STORAGE_KEY = 'family-care.auth.token'

/** 데모 계정(LoginPage의 원클릭 둘러보기 + 자격 증명 안내에 노출). */
export const DEMO_CREDENTIALS = {
  email: 'demo@familycare.app',
  password: 'demo-1234',
} as const

export const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export const writeStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // localStorage 접근 불가(시크릿 모드 등)는 무시한다. 세션 한정으로 동작.
  }
}

/**
 * 현재 인증 토큰을 동기적으로 반환한다(없으면 null).
 * api.ts의 request()에서 호출해 Authorization: Bearer 헤더를 구성한다.
 */
export const getAuthToken = (): string | null => readStoredToken()

/**
 * 인증 헤더 객체를 만든다(토큰 없으면 빈 객체). 호출부 spread 편의용.
 *   fetch(url, { headers: { ...authHeader() } })
 */
export const authHeader = (): Record<string, string> => {
  const token = readStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
