/**
 * TanStack Query 키 팩토리. 운영 대시보드(usePlatformData)가 읽는 서버 상태의
 * 단일 키 소스다. 뮤테이션 성공 후 무효화/refetch 대상도 이 키를 재사용한다.
 */
export const platformQueryKeys = {
  schedules: ['schedules'] as const,
  careLogs: ['care-logs'] as const,
  settlements: ['settlements'] as const,
  claims: ['claims'] as const,
  adminOverview: ['admin', 'overview'] as const,
  adminPlans: ['admin', 'plans'] as const,
}

export type PlatformQueryKey = (typeof platformQueryKeys)[keyof typeof platformQueryKeys]
