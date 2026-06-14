import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client. The core operations dashboard (usePlatformData:
 * schedules/care-logs/settlements/claims/admin overview/plans) now reads through
 * query hooks; remaining page-local server reads (community/support/messages/
 * members) still use manual ky calls and can move onto this client incrementally.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // 기존 수동 fetch 루프는 네트워크 오류만 재시도(2회)했다. ky 인스턴스가 네트워크
      // 재시도를 담당하므로 react-query 레이어는 추가 재시도하지 않는다(중복 방지).
      retry: false,
      // 기존 동작 보존: 마운트 1회 + 수동 새로고침만. 포커스/재연결 자동 refetch는
      // 끈다(백그라운드 refetch로 인한 stale 깜빡임/예기치 않은 재요청 방지).
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})
