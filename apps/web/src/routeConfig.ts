import type { IconName } from './components/ui/Icon'

/* =========================================================================
   Route configuration — separated-page IA (Phase 1 redesign).

   Moves away from the old "3 pages with nested tabs" model into distinct
   top-level routes, each its own page. Keeps the route metadata contract used
   by React Router / routeNavigation:
     - AppRoute tagged paths
     - resolveRouteResult / resolveRoute (canonicalize + fallback)
     - isAppRoute type guard, DEFAULT_ROUTE, routeMap
   ========================================================================= */

export type AppRoute =
  | '/'
  | '/schedule'
  | '/care'
  | '/settlements'
  | '/claims'
  | '/analytics'
  | '/plans'
  | '/tutorial'
  | '/guide'
  | '/overview'
  | '/community'
  | '/messages'
  | '/support'
  | '/inquiry'
  | '/members'
  | '/terms'
  | '/privacy'
  | '/account'
  | '/login'
  | '/register'

export type NonHomeRoutePath = Exclude<AppRoute, '/'>

/** 사이드바 그룹 구분(접근성 라벨 + 시각적 묶음). */
export type NavSection = 'main' | 'community' | 'manage' | 'account'

export type RouteDef = {
  path: AppRoute
  /** 사이드바 라벨 + 문서 타이틀 베이스. */
  title: string
  /** 페이지 헤더 eyebrow(짧은 분류 라벨). */
  eyebrow: string
  /** 페이지 헤더/메타 설명. */
  description: string
  icon: IconName
  section: NavSection
  /** 사이드바에 노출할지 여부(login/register는 숨김). */
  inNav: boolean
  /** Phase 2에서 본 콘텐츠를 채울 라우트(현재는 placeholder). */
  placeholder: boolean
  /** 관리자(admin) 전용 라우트. 사이드바에서 일반 회원에게는 숨긴다. */
  adminOnly?: boolean
}

export type NavigationSource = 'lead_form' | 'pricing_button' | 'hero'

export type PublicNavigateState = {
  source?: NavigationSource
  plan?: string
  fromLanding?: boolean
}

export type AuthRoute = Extract<AppRoute, '/login' | '/register'>
export type PublicLandingRoute =
  | '/'
  | '/guide'
  | '/plans'
  | '/overview'
  | '/tutorial'
  | '/community'
  | '/terms'
  | '/privacy'

export const SITE_NAME = '가족 돌봄 운영 플랫폼'

export const routeDefs: Record<AppRoute, RouteDef> = {
  '/': {
    path: '/',
    title: '대시보드',
    eyebrow: '오늘의 돌봄',
    description: '오늘 처리할 돌봄 업무와 정산·청구 현황을 한눈에 확인하세요.',
    icon: 'home',
    section: 'main',
    inNav: true,
    placeholder: false,
  },
  '/schedule': {
    path: '/schedule',
    title: '방문 일정',
    eyebrow: '돌봄 운영',
    description: '방문 예정 시간, 담당자, 진행 상태를 확인하고 새 일정을 등록합니다.',
    icon: 'schedule',
    section: 'main',
    inNav: true,
    placeholder: false,
  },
  '/care': {
    path: '/care',
    title: '돌봄 기록',
    eyebrow: '돌봄 운영',
    description: '방문·상담·투약·식사 같은 돌봄 내용을 담당자와 함께 기록합니다.',
    icon: 'care',
    section: 'main',
    inNav: true,
    placeholder: false,
  },
  '/settlements': {
    path: '/settlements',
    title: '돌봄비 정산',
    eyebrow: '돌봄 운영',
    description: '돌봄 시간과 기준 금액을 입력해 가족별 정산액을 바로 계산합니다.',
    icon: 'settlement',
    section: 'main',
    inNav: true,
    placeholder: false,
  },
  '/claims': {
    path: '/claims',
    title: '보험청구',
    eyebrow: '돌봄 운영',
    description: '요청·검토·승인·거절 상태를 기록해 보험청구 진행을 놓치지 않게 관리합니다.',
    icon: 'claims',
    section: 'main',
    inNav: true,
    placeholder: false,
  },
  '/analytics': {
    path: '/analytics',
    title: '운영 분석',
    eyebrow: '서비스 관리',
    description: '월별 정산·청구 추이와 핵심 지표로 서비스 운영 상태를 점검합니다.',
    icon: 'analytics',
    section: 'manage',
    inNav: true,
    placeholder: false,
  },
  '/plans': {
    path: '/plans',
    title: '요금제 관리',
    eyebrow: '서비스 관리',
    description: '요금제별 단가와 이용 가구를 관리하고 매출 변화를 점검합니다.',
    icon: 'plans',
    section: 'manage',
    inNav: true,
    placeholder: false,
  },
  '/tutorial': {
    path: '/tutorial',
    title: '튜토리얼',
    eyebrow: '도입 가이드',
    description: '실제 업무 화면에서 단계별로 연습하는 10분 시작 가이드입니다.',
    icon: 'book-open',
    section: 'manage',
    inNav: true,
    placeholder: false,
  },
  '/guide': {
    path: '/guide',
    title: '사용 가이드',
    eyebrow: '서비스 관리',
    description: '처음 사용하는 담당자를 위한 업무 순서, 입력 예시, 자주 묻는 질문입니다.',
    icon: 'guide',
    section: 'manage',
    inNav: true,
    placeholder: false,
  },
  '/overview': {
    path: '/overview',
    title: '서비스 소개',
    eyebrow: '서비스 소개',
    description:
      '돌봄 일정, 기록, 정산, 보험청구를 이어주는 운영 설계가 어떤 문제를 덜어주는지 한 번에 확인합니다.',
    icon: 'guide',
    section: 'manage',
    inNav: false,
    placeholder: false,
  },
  '/community': {
    path: '/community',
    title: '커뮤니티',
    eyebrow: '커뮤니티',
    description:
      '보호자와 간병인이 정보공유·질문·간병후기를 나누는 게시판입니다. 검색과 카테고리로 원하는 글을 찾아보세요.',
    icon: 'users',
    section: 'community',
    inNav: true,
    placeholder: false,
  },
  '/messages': {
    path: '/messages',
    title: '쪽지함',
    eyebrow: '커뮤니티',
    description: '다른 회원과 1:1로 주고받은 쪽지를 확인하고 새 쪽지를 보냅니다.',
    icon: 'inbox',
    section: 'community',
    inNav: true,
    placeholder: false,
  },
  '/support': {
    path: '/support',
    title: '1:1 상담',
    eyebrow: '커뮤니티',
    description: '운영팀과 1:1 상담을 시작하고 답변을 확인합니다. 새 메시지는 자동으로 갱신됩니다.',
    icon: 'chat',
    section: 'community',
    inNav: true,
    placeholder: false,
  },
  '/inquiry': {
    path: '/inquiry',
    title: '문의',
    eyebrow: '커뮤니티',
    description:
      '제휴·버그·의견·이용 문의를 남기면 공개 게시판에 표시되고 운영자가 확인 후 상태를 업데이트합니다.',
    icon: 'inbox',
    section: 'community',
    inNav: true,
    placeholder: false,
  },
  '/members': {
    path: '/members',
    title: '회원 관리',
    eyebrow: '서비스 관리',
    description: '회원 목록을 확인하고 커뮤니티 규칙을 위반한 계정의 이용을 정지하거나 해제합니다.',
    icon: 'shield',
    section: 'manage',
    inNav: true,
    placeholder: false,
    adminOnly: true,
  },
  '/terms': {
    path: '/terms',
    title: '이용약관',
    eyebrow: '법적 고지',
    description:
      '서비스 이용 조건과 운영 책임 범위를 명확하게 공개해 서비스 기대치와 제약을 확인할 수 있습니다.',
    icon: 'guide',
    section: 'manage',
    inNav: false,
    placeholder: false,
  },
  '/privacy': {
    path: '/privacy',
    title: '개인정보 처리방침',
    eyebrow: '법적 고지',
    description:
      '수집·보관·파기 정책, 보관 기간, 제3자 제공 범위까지 운영자 관점으로 정리한 정책 안내입니다.',
    icon: 'guide',
    section: 'manage',
    inNav: false,
    placeholder: false,
  },
  '/account': {
    path: '/account',
    title: '계정 설정',
    eyebrow: '계정',
    description: '담당자 이름, 소속 기관, 비밀번호와 계정 탈퇴를 관리합니다.',
    icon: 'shield',
    section: 'account',
    inNav: true,
    placeholder: false,
  },
  '/login': {
    path: '/login',
    title: '로그인',
    eyebrow: '계정',
    description: '담당자 계정으로 로그인합니다.',
    icon: 'home',
    section: 'account',
    inNav: false,
    placeholder: false,
  },
  '/register': {
    path: '/register',
    title: '회원가입',
    eyebrow: '계정',
    description: '새 돌봄 센터 계정을 등록합니다.',
    icon: 'home',
    section: 'account',
    inNav: false,
    placeholder: false,
  },
}

/** 등록된 모든 라우트(스펙·가드의 단일 소스). */
export const routeMap: RouteDef[] = Object.values(routeDefs)

/** Today-first 업무 순서: 방문 일정 → 돌봄 기록 → 돌봄비 정산 → 보험청구. */
export const operationalWorkflowRoutes = [
  '/schedule',
  '/care',
  '/settlements',
  '/claims',
] as const satisfies readonly AppRoute[]

/** 대시보드에서 우선 안내할 업무 흐름. */
export const todayFirstRoutes = operationalWorkflowRoutes

/** 서비스 운영자가 주기적으로 점검하는 관리 화면. */
export const managementRoutes = [
  '/analytics',
  '/plans',
  '/tutorial',
  '/guide',
  '/members',
] as const satisfies readonly AppRoute[]

/** 커뮤니티(게시판·쪽지·상담·문의) 소통 화면. */
export const communityRoutes = [
  '/community',
  '/messages',
  '/support',
  '/inquiry',
] as const satisfies readonly AppRoute[]

export const publicLandingRoutes = [
  '/',
  '/overview',
  '/tutorial',
  '/guide',
  '/community',
  '/plans',
  '/terms',
  '/privacy',
] as const satisfies readonly PublicLandingRoute[]

/** 사이드바 네비게이션 그룹(섹션별로 묶어 노출). */
export type NavGroup = {
  section: NavSection
  label: string
  items: RouteDef[]
}

export const navGroups: NavGroup[] = [
  {
    section: 'main',
    label: '돌봄 운영',
    items: routeMap.filter((r) => r.section === 'main' && r.inNav),
  },
  {
    section: 'community',
    label: '커뮤니티',
    items: routeMap.filter((r) => r.section === 'community' && r.inNav),
  },
  {
    section: 'manage',
    label: '서비스 관리',
    items: routeMap.filter((r) => r.section === 'manage' && r.inNav),
  },
  {
    section: 'account',
    label: '계정',
    items: routeMap.filter((r) => r.section === 'account' && r.inNav),
  },
]

/**
 * 알 수 없는 경로일 때 떨어질 기본 라우트.
 * resolveRoute / resolveRouteResult 의 폴백 대상이며, 타입상으로도 AppRoute다.
 */
export const DEFAULT_ROUTE: AppRoute = '/'

const knownRoutePaths = new Set<AppRoute>(routeMap.map((route) => route.path))

/** 임의 문자열이 등록된 정규 AppRoute인지 좁히는 타입 가드. */
export const isAppRoute = (value: string): value is AppRoute =>
  knownRoutePaths.has(value as AppRoute)

export type ResolveRouteResult = {
  /** 실제로 렌더링할 정규 라우트. 항상 등록된 AppRoute임이 보장된다. */
  route: AppRoute
  /** 입력이 정규 라우트와 정확히 일치하지 않아 폴백/보정되었는지 여부. */
  isFallback: boolean
  /** 입력이 등록된 라우트와 한 글자도 다르지 않은(정규) 경로였는지 여부. */
  isCanonical: boolean
}

/**
 * 원시 경로 문자열(주로 location.pathname)을 정규 라우트로 해석하면서,
 * 폴백 여부와 정규 여부까지 함께 보고한다. URL 정규화(replaceState)와
 * not-found UX 판단의 단일 소스다.
 *
 * 매핑 규칙:
 *  - 정확히 일치하는 등록 라우트 → 그대로(정규).
 *  - 트레일링 슬래시/쿼리/해시만 다른 경우 → 보정(폴백 아님, isCanonical=false).
 *  - 그 외 미등록 경로 → DEFAULT_ROUTE(폴백).
 */
export const resolveRouteResult = (path: string): ResolveRouteResult => {
  const basePath = path.split('#')[0]?.split('?')[0] ?? '/'
  const normalized = basePath.replace(/\/+$/, '') || '/'

  if (isAppRoute(normalized)) {
    const isCanonical = normalized === path
    return { route: normalized, isFallback: false, isCanonical }
  }

  return { route: DEFAULT_ROUTE, isFallback: true, isCanonical: false }
}

/** 원시 경로를 정규 라우트로 해석한다(라우트만 반환). */
export const resolveRoute = (path: string): AppRoute => resolveRouteResult(path).route

/** 경로 → RouteDef 조회(미등록이면 폴백 라우트의 정의). */
export const getRouteDef = (path: AppRoute): RouteDef => routeDefs[path] ?? routeDefs[DEFAULT_ROUTE]
