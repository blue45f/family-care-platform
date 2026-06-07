import type { ReactElement } from 'react'

import { AnalyticsPage } from './components/pages/AnalyticsPage'
import { CarePage } from './components/pages/CarePage'
import { ClaimsPage } from './components/pages/ClaimsPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { GuidePage } from './components/pages/GuidePage'
import { PublicOverviewPage } from './components/pages/PublicOverviewPage'
import { PublicCommunityPage } from './components/pages/PublicCommunityPage'
import { PublicTutorialPage } from './components/pages/PublicTutorialPage'
import { LoginPage } from './components/pages/LoginPage'
import { PlansPage } from './components/pages/PlansPage'
import { PrivacyPage } from './components/pages/PrivacyPage'
import { PublicHomePage } from './components/pages/PublicHomePage'
import { TermsPage } from './components/pages/TermsPage'
import { PublicPlansPage } from './components/pages/PublicPlansPage'
import { RegisterPage } from './components/pages/RegisterPage'
import { SchedulePage } from './components/pages/SchedulePage'
import { SettlementsPage } from './components/pages/SettlementsPage'
import type { AppRoute, AuthRoute, PublicLandingRoute, PublicNavigateState } from './routeConfig'
import { publicLandingRoutes } from './routeConfig'
import type { PlatformData } from './state/usePlatformData'

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
    '/terms': ({ navigate }: PublicRouteContext) => <TermsPage onNavigate={navigate} />,
    '/privacy': ({ navigate }: PublicRouteContext) => <PrivacyPage onNavigate={navigate} />,
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
export type ProtectedRouteContext = {
  data: PlatformData
  navigate: (path: AppRoute, state?: { source?: string }) => void
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
    path: '/overview',
    render: ({ navigate }) => <PublicOverviewPage onNavigate={navigate} />,
  },
  {
    path: '/community',
    render: ({ navigate }) => <PublicCommunityPage onNavigate={navigate} />,
  },
  {
    path: '/terms',
    render: ({ navigate }) => <TermsPage onNavigate={navigate} />,
  },
  {
    path: '/privacy',
    render: ({ navigate }) => <PrivacyPage onNavigate={navigate} />,
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
