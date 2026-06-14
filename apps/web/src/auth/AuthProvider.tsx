import { useEffect, type ReactNode } from 'react'

import { useAuthStore } from './authStore'

/* =========================================================================
   AuthProvider: 인증 상태 자체는 zustand 스토어(useAuthStore)가 들고 있다.
   여기서는 마운트 1회 부트스트랩(저장된 토큰으로 /auth/me 복원)만 수행한다.

   상태를 Context로 끌어올리지 않으므로 별도 Provider가 필요 없지만, 앱 트리에서
   "부트스트랩을 실행하는 지점"을 명시적으로 유지하기 위해 컴포넌트 형태를 보존한다
   (기존 트리 구조 및 테스트가 의존하는 마운트 지점과 동일).

   StrictMode 개발 환경에서는 effect가 재실행될 수 있으므로, 각 실행마다 자체
   cancelled 플래그를 두고 스토어 부트스트랩에 신호를 전달한다. 모듈 레벨 가드로
   막으면 두 번째 실행이 건너뛰어 loading에 머문다.
   ========================================================================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    let cancelled = false
    void bootstrap(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [bootstrap])

  return <>{children}</>
}
