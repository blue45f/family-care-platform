import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client. Server state migrates here incrementally from
 * the manual fetch + useState in usePlatformData; existing flows keep working
 * until each domain is moved onto a query hook.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
