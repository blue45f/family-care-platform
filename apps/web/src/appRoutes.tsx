import type { ReactElement } from 'react'

import { AnalyticsPage } from './components/pages/AnalyticsPage'
import { CarePage } from './components/pages/CarePage'
import { ClaimsPage } from './components/pages/ClaimsPage'
import { DashboardPage } from './components/pages/DashboardPage'
import { GuidePage } from './components/pages/GuidePage'
import { LoginPage } from './components/pages/LoginPage'
import { PlansPage } from './components/pages/PlansPage'
import { PublicHomePage } from './components/pages/PublicHomePage'
import { RegisterPage } from './components/pages/RegisterPage'
import { SchedulePage } from './components/pages/SchedulePage'
import { SettlementsPage } from './components/pages/SettlementsPage'
import type { AppRoute } from './routeConfig'
import type { PlatformData } from './state/usePlatformData'

type ProtectedAppRoute = Exclude<AppRoute, '/login' | '/register'>
type AuthAppRoute = Extract<AppRoute, '/login' | '/register'>
type PublicAppRoute = Extract<AppRoute, '/'>

export type UnauthenticatedRouteIntent = 'public' | 'auth' | 'protected'

export type PublicRouteContext = {
  navigate: (path: AppRoute) => void
}

export type ProtectedRouteContext = {
  data: PlatformData
  navigate: (path: AppRoute) => void
}

export type AuthRouteContext = {
  navigate: (path: AppRoute) => void
  redirectTo: AppRoute
}

export type PublicRouteEntry = {
  path: PublicAppRoute
  render: (context: PublicRouteContext) => ReactElement
}

export type ProtectedRouteEntry = {
  path: ProtectedAppRoute
  render: (context: ProtectedRouteContext) => ReactElement
}

export type AuthRouteEntry = {
  path: AuthAppRoute
  render: (context: AuthRouteContext) => ReactElement
}

export const publicRouteEntries: PublicRouteEntry[] = [
  {
    path: '/',
    render: ({ navigate }) => <PublicHomePage onNavigate={navigate} />,
  },
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
    path: '/guide',
    render: ({ navigate }) => <GuidePage onNavigate={navigate} />,
  },
]

export const authRouteEntries: AuthRouteEntry[] = [
  {
    path: '/login',
    render: ({ navigate, redirectTo }) => (
      <LoginPage onNavigate={navigate} redirectTo={redirectTo} />
    ),
  },
  {
    path: '/register',
    render: ({ navigate, redirectTo }) => (
      <RegisterPage onNavigate={navigate} redirectTo={redirectTo} />
    ),
  },
]

export const getUnauthenticatedRouteIntent = (path: AppRoute): UnauthenticatedRouteIntent => {
  if (path === '/') {
    return 'public'
  }
  if (path === '/login' || path === '/register') {
    return 'auth'
  }
  return 'protected'
}

export const findProtectedRouteEntry = (path: AppRoute): ProtectedRouteEntry | undefined =>
  protectedRouteEntries.find((entry) => entry.path === path)
