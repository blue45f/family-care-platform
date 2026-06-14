import { useAuthStore } from './authStore'

import type { AuthContextValue } from './authContext'

/**
 * 인증 상태/액션을 읽는 훅. 상태는 zustand 스토어(useAuthStore)에 있고, 여기서는
 * 기존 Context 계약(AuthContextValue)과 동일한 모양으로 노출한다(파생 플래그
 * isAuthenticated/isResolving 포함). 소비부는 변경 없이 그대로 동작한다.
 */
export const useAuth = (): AuthContextValue => {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const withdrawAccount = useAuthStore((state) => state.withdrawAccount)
  const logout = useAuthStore((state) => state.logout)

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    // 부트스트랩(me 확인)이 끝나기 전 true. 라우트 게이트의 깜빡임 방지용.
    isResolving: status === 'loading',
    login,
    register,
    updateProfile,
    withdrawAccount,
    logout,
  }
}
