import type { ReactElement } from 'react'

import { lazyRetry } from './lazyRetry'
import type { AppRoute, AuthRoute, PublicLandingRoute, PublicNavigateState } from './routeConfig'
import { publicLandingRoutes } from './routeConfig'
import type { PlatformData } from './state/usePlatformData'

// 페이지는 라우트 단위 청크로 분리한다(초기 번들 축소). lazyRetry가 배포 직후
// stale 청크 로드 실패를 1회 새로고침으로 복구하고, 재실패는 ErrorBoundary로 보낸다.
const AnalyticsPage = lazyRetry(() =>
  import('./components/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const CarePage = lazyRetry(() =>
  import('./components/pages/CarePage').then((m) => ({ default: m.CarePage })),
)
const ClaimsPage = lazyRetry(() =>
  import('./components/pages/ClaimsPage').then((m) => ({ default: m.ClaimsPage })),
)
const CommunityPage = lazyRetry(() =>
  import('./components/pages/CommunityPage').then((m) => ({ default: m.CommunityPage })),
)
const DashboardPage = lazyRetry(() =>
  import('./components/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const GuidePage = lazyRetry(() =>
  import('./components/pages/GuidePage').then((m) => ({ default: m.GuidePage })),
)
const MembersPage = lazyRetry(() =>
  import('./components/pages/MembersPage').then((m) => ({ default: m.MembersPage })),
)
const MessagesPage = lazyRetry(() =>
  import('./components/pages/MessagesPage').then((m) => ({ default: m.MessagesPage })),
)
const PublicOverviewPage = lazyRetry(() =>
  import('./components/pages/PublicOverviewPage').then((m) => ({ default: m.PublicOverviewPage })),
)
const PublicCommunityPage = lazyRetry(() =>
  import('./components/pages/PublicCommunityPage').then((m) => ({
    default: m.PublicCommunityPage,
  })),
)
const PublicTutorialPage = lazyRetry(() =>
  import('./components/pages/PublicTutorialPage').then((m) => ({ default: m.PublicTutorialPage })),
)
const LoginPage = lazyRetry(() =>
  import('./components/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const PlansPage = lazyRetry(() =>
  import('./components/pages/PlansPage').then((m) => ({ default: m.PlansPage })),
)
const PolicyPage = lazyRetry(() =>
  import('./components/pages/PolicyPage').then((m) => ({ default: m.PolicyPage })),
)
const PublicHomePage = lazyRetry(() =>
  import('./components/pages/PublicHomePage').then((m) => ({ default: m.PublicHomePage })),
)
const PublicPlansPage = lazyRetry(() =>
  import('./components/pages/PublicPlansPage').then((m) => ({ default: m.PublicPlansPage })),
)
const RegisterPage = lazyRetry(() =>
  import('./components/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const SchedulePage = lazyRetry(() =>
  import('./components/pages/SchedulePage').then((m) => ({ default: m.SchedulePage })),
)
const SettlementsPage = lazyRetry(() =>
  import('./components/pages/SettlementsPage').then((m) => ({ default: m.SettlementsPage })),
)
const SupportPage = lazyRetry(() =>
  import('./components/pages/SupportPage').then((m) => ({ default: m.SupportPage })),
)

type AuthAppRoute = AuthRoute
type PublicAppRoute = PublicLandingRoute
type ProtectedAppRoute = Exclude<AppRoute, AuthAppRoute>

export type UnauthenticatedRouteIntent = 'public' | 'auth' | 'protected'

const AUTH_ROUTES: readonly AuthAppRoute[] = ['/login', '/register']
export type AuthRouteNavigateState = PublicNavigateState

const ROUTE_RENDERERS = {
  public: {
    '/': ({ navigate }: PublicRouteContext) => <PublicHomePage onNavigate={navigate} />,
    '/guide': ({ navigate }: PublicRouteContext) => <GuidePage onNavigate={navigate} />,
    '/community': ({ navigate }: PublicRouteContext) => (
      <PublicCommunityPage onNavigate={navigate} />
    ),
    '/tutorial': ({ navigate }: PublicRouteContext) => <PublicTutorialPage onNavigate={navigate} />,
    '/plans': ({ navigate }: PublicRouteContext) => <PublicPlansPage onNavigate={navigate} />,
    '/overview': ({ navigate }: PublicRouteContext) => <PublicOverviewPage onNavigate={navigate} />,
    '/terms': ({ navigate }: PublicRouteContext) => (
      <PolicyPage route="/terms" onNavigate={navigate} />
    ),
    '/privacy': ({ navigate }: PublicRouteContext) => (
      <PolicyPage route="/privacy" onNavigate={navigate} />
    ),
  },
  auth: {
    '/login': ({ navigate, redirectTo }: AuthRouteContext) => (
      <LoginPage onNavigate={navigate} redirectTo={redirectTo} />
    ),
    '/register': ({ navigate, redirectTo }: AuthRouteContext) => (
      <RegisterPage onNavigate={navigate} redirectTo={redirectTo} />
    ),
  },
} as const

export type PublicRouteNavigateState = PublicNavigateState

export type PublicRouteContext = {
  navigate: (path: AppRoute, state?: PublicRouteNavigateState) => void
}
/** 보호 라우트 간 이동 시 전달하는 상태(쪽지 프리필 등). */
export type ProtectedNavigateState = {
  source?: string
  /** 쪽지함으로 이동할 때 미리 선택할 상대(커뮤니티 "작성자에게 쪽지" 동선). */
  recipientId?: number
  recipientName?: string
}
export type ProtectedRouteContext = {
  data: PlatformData
  navigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}
export type AuthRouteContext = {
  navigate: (path: AppRoute, state?: AuthRouteNavigateState) => void
  redirectTo: AppRoute
}

type RouteEntry<TPath extends AppRoute, TContext> = {
  path: TPath
  render: (context: TContext) => ReactElement
}

export type PublicRouteEntry = RouteEntry<PublicAppRoute, PublicRouteContext>
export type ProtectedRouteEntry = RouteEntry<ProtectedAppRoute, ProtectedRouteContext>
export type AuthRouteEntry = RouteEntry<AuthAppRoute, AuthRouteContext>

export const publicRouteEntries: PublicRouteEntry[] = [
  ...publicLandingRoutes.map((path) => ({
    path,
    render: ROUTE_RENDERERS.public[path],
  })),
]

export const protectedRouteEntries: ProtectedRouteEntry[] = [
  {
    path: '/',
    render: ({ data, navigate }) => <DashboardPage data={data} onNavigate={navigate} />,
  },
  {
    path: '/schedule',
    render: ({ data, navigate }) => <SchedulePage data={data} onNavigate={navigate} />,
  },
  {
    path: '/care',
    render: ({ data, navigate }) => <CarePage data={data} onNavigate={navigate} />,
  },
  {
    path: '/settlements',
    render: ({ data, navigate }) => <SettlementsPage data={data} onNavigate={navigate} />,
  },
  {
    path: '/claims',
    render: ({ data, navigate }) => <ClaimsPage data={data} onNavigate={navigate} />,
  },
  {
    path: '/community',
    render: ({ navigate }) => <CommunityPage onNavigate={navigate} />,
  },
  {
    path: '/messages',
    render: ({ navigate }) => <MessagesPage onNavigate={navigate} />,
  },
  {
    path: '/support',
    render: ({ navigate }) => <SupportPage onNavigate={navigate} />,
  },
  {
    path: '/analytics',
    render: ({ data, navigate }) => <AnalyticsPage data={data} onNavigate={navigate} />,
  },
  {
    path: '/plans',
    render: ({ data }) => <PlansPage data={data} />,
  },
  {
    path: '/tutorial',
    render: ({ navigate }) => <PublicTutorialPage onNavigate={navigate} />,
  },
  {
    path: '/guide',
    render: ({ navigate }) => <GuidePage onNavigate={navigate} />,
  },
  {
    path: '/members',
    render: ({ navigate }) => <MembersPage onNavigate={navigate} />,
  },
  {
    path: '/overview',
    render: ({ navigate }) => <PublicOverviewPage onNavigate={navigate} />,
  },
  {
    path: '/terms',
    render: ({ navigate }) => <PolicyPage route="/terms" onNavigate={navigate} />,
  },
  {
    path: '/privacy',
    render: ({ navigate }) => <PolicyPage route="/privacy" onNavigate={navigate} />,
  },
]

export const authRouteEntries: AuthRouteEntry[] = [
  {
    path: '/login',
    render: ROUTE_RENDERERS.auth['/login'],
  },
  {
    path: '/register',
    render: ROUTE_RENDERERS.auth['/register'],
  },
]

const publicRouteSet = new Set<AppRoute>([...publicLandingRoutes])
const authRouteSet = new Set<AppRoute>([...AUTH_ROUTES])

export const getUnauthenticatedRouteIntent = (path: AppRoute): UnauthenticatedRouteIntent => {
  if (publicRouteSet.has(path)) {
    return 'public'
  }
  if (authRouteSet.has(path)) {
    return 'auth'
  }
  return 'protected'
}

export const findProtectedRouteEntry = (path: AppRoute): ProtectedRouteEntry | undefined =>
  protectedRouteEntries.find((entry) => entry.path === path)
