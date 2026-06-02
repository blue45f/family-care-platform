export type AppRoute =
  | "/"
  | "/operations"
  | "/operations/care"
  | "/operations/settlement"
  | "/operations/claims"
  | "/admin"
  | "/admin/overview"
  | "/admin/trends"
  | "/admin/plans"
  | "/admin/simulator";

export type NonHomeRoutePath = Exclude<AppRoute, "/">;

export type TopRoutePath = "/" | "/operations" | "/admin";

export type RouteMode = "home" | "operations" | "admin";
export type RouteStackMode = Exclude<RouteMode, "home">;
export type RouteSectionId = "operations" | "admin";
export type OperationsRouteModule =
  | "overview"
  | "care"
  | "settlement"
  | "claims";
export type AdminRouteModule =
  | "kpi"
  | "trends"
  | "plans"
  | "simulator"
  | "summary";

export const operationsModuleSequence: OperationsRouteModule[] = [
  "overview",
  "care",
  "settlement",
  "claims",
];
export const adminModuleSequence: AdminRouteModule[] = [
  "kpi",
  "trends",
  "plans",
  "simulator",
  "summary",
];

export type OperationsFocus = "all" | "care" | "settlement" | "claims";
export type AdminFocus = "all" | "overview" | "trends" | "plans" | "simulator";

export const operationsFocusLabel: Record<OperationsFocus, string> = {
  all: "돌봄 전체",
  care: "기록 우선",
  settlement: "정산 우선",
  claims: "보험청구 우선",
};

export const adminFocusLabel: Record<AdminFocus, string> = {
  all: "관리 전체",
  overview: "현황 우선",
  trends: "월별 변화 우선",
  plans: "요금 관리 우선",
  simulator: "예상 계산 우선",
};

export type RouteModuleMeta = {
  title: string;
  chip: string;
  note: string;
  emoji: string;
  panelChip: string;
  panelTitle: string;
  panelDescription: string;
  panelClass: string;
  panelKicker?: string;
};

export const operationsModuleMeta: Record<
  OperationsRouteModule,
  RouteModuleMeta
> = {
  overview: {
    title: "전체 현황",
    chip: "현황",
    note: "돌봄·정산·보험청구 상태를 한눈에 확인합니다.",
    emoji: "📈",
    panelChip: "오늘의 할 일",
    panelTitle: "오늘 확인할 돌봄 업무",
    panelDescription: "기록, 정산, 보험청구 중 먼저 볼 일을 쉽게 확인합니다.",
    panelClass: "panel-overview",
    panelKicker: "오늘의 할 일",
  },
  care: {
    title: "돌봄 기록",
    chip: "돌봄",
    note: "누가, 언제, 어떤 돌봄을 받았는지 기록합니다.",
    emoji: "🩺",
    panelChip: "기록",
    panelTitle: "돌봄 기록",
    panelDescription: "방문, 상담, 투약, 식사 같은 돌봄 내용을 남깁니다.",
    panelClass: "panel-workflow",
  },
  settlement: {
    title: "돌봄비 정산",
    chip: "정산",
    note: "시간과 금액을 입력해 가족별 정산액을 확인합니다.",
    emoji: "🧮",
    panelChip: "정산",
    panelTitle: "돌봄비 정산",
    panelDescription:
      "돌봄 시간과 기준 금액을 입력하면 합계가 바로 계산됩니다.",
    panelClass: "panel-workflow panel-alt",
  },
  claims: {
    title: "보험청구",
    chip: "청구",
    note: "청구 요청, 검토, 승인 상태를 놓치지 않게 관리합니다.",
    emoji: "📄",
    panelChip: "청구",
    panelTitle: "보험청구",
    panelDescription: "병원/기관과 청구 금액을 기록하고 진행 상태를 바꿉니다.",
    panelClass: "panel-workflow",
  },
};

export const adminModuleMeta: Record<AdminRouteModule, RouteModuleMeta> = {
  kpi: {
    title: "한눈에 보기",
    chip: "현황",
    note: "가구 수, 정산액, 승인률을 쉽게 확인합니다.",
    emoji: "📊",
    panelChip: "현황",
    panelTitle: "서비스 현황",
    panelDescription: "서비스가 잘 운영되는지 필요한 숫자만 모아 보여줍니다.",
    panelClass: "panel-overview",
  },
  trends: {
    title: "월별 변화",
    chip: "변화",
    note: "이번 달과 지난달 흐름을 비교합니다.",
    emoji: "📈",
    panelChip: "월별",
    panelTitle: "월별 변화 (최근 3개월)",
    panelDescription:
      "정산 합계, 청구 건수, 승인률이 어떻게 달라졌는지 확인합니다.",
    panelClass: "panel-trend",
  },
  plans: {
    title: "요금 관리",
    chip: "요금",
    note: "요금, 할인율, 이용 가구 수를 수정합니다.",
    emoji: "💡",
    panelChip: "요금",
    panelTitle: "요금 관리",
    panelDescription: "월 요금, 연 할인율, 이용 가구 수를 조정합니다.",
    panelClass: "panel-plans",
  },
  simulator: {
    title: "예상 계산",
    chip: "예상",
    note: "요금 변화가 월 관리 금액에 미치는 영향을 계산합니다.",
    emoji: "🧪",
    panelChip: "예상",
    panelTitle: "월 금액 예상 계산",
    panelDescription:
      "요금과 상위 요금제 변경 폭을 조정해 예상 월 금액을 확인합니다.",
    panelClass: "panel-simulator",
  },
  summary: {
    title: "관리 요약",
    chip: "요약",
    note: "현재 관리 기준을 한 장으로 정리합니다.",
    emoji: "🧩",
    panelChip: "요약",
    panelTitle: "관리 요약",
    panelDescription: "이번 달 관리 기준과 다음 확인 지점을 정리합니다.",
    panelClass: "panel-summary",
  },
};

export type RouteCompositionMeta = {
  compositionChip: string;
  compositionTitle: string;
  compositionDescription: string;
  compositionPanelClass: string;
};

export const routeModeCompositionMeta: Record<
  "operations" | "admin",
  RouteCompositionMeta
> = {
  operations: {
    compositionChip: "돌봄 업무",
    compositionTitle: "이 화면에서 할 수 있는 일",
    compositionDescription: "필요한 업무를 눌러 바로 이동하세요.",
    compositionPanelClass: "panel-ops-composition",
  },
  admin: {
    compositionChip: "관리 메뉴",
    compositionTitle: "관리자가 확인할 수 있는 일",
    compositionDescription:
      "현황, 월별 변화, 요금, 예상 계산을 쉽게 확인하세요.",
    compositionPanelClass: "panel-admin panel-ops-composition",
  },
};

export const operationsModuleRoute: Record<
  OperationsRouteModule,
  NonHomeRoutePath
> = {
  overview: "/operations",
  care: "/operations/care",
  settlement: "/operations/settlement",
  claims: "/operations/claims",
};

export const adminModuleRoute: Record<AdminRouteModule, NonHomeRoutePath> = {
  kpi: "/admin/overview",
  trends: "/admin/trends",
  plans: "/admin/plans",
  simulator: "/admin/simulator",
  summary: "/admin/simulator",
};

type RouteModeModuleConfig<M extends OperationsRouteModule | AdminRouteModule> =
  {
    compositionMeta: RouteCompositionMeta;
    moduleSequence: readonly M[];
    moduleMeta: Record<M, RouteModuleMeta>;
  };

type RouteModeDefinition = {
  operations: RouteModeModuleConfig<OperationsRouteModule>;
  admin: RouteModeModuleConfig<AdminRouteModule>;
};

export const routeModeDefinitions: RouteModeDefinition = {
  operations: {
    compositionMeta: routeModeCompositionMeta.operations,
    moduleSequence: operationsModuleSequence,
    moduleMeta: operationsModuleMeta,
  },
  admin: {
    compositionMeta: routeModeCompositionMeta.admin,
    moduleSequence: adminModuleSequence,
    moduleMeta: adminModuleMeta,
  },
};

export type RouteQuickAction = {
  path: NonHomeRoutePath;
  label: string;
  emoji: string;
};

export type RouteHeroMetricProfile = "home" | "operations" | "admin";

type RouteHeroText = {
  kicker: string;
  title: string;
  description: string;
};

export type RouteTopNavItem = {
  path: AppRoute;
  label: string;
  emoji: string;
  summary?: string;
};

export type RouteCompositionBlueprint = {
  routePath: AppRoute;
  pageKind: "home" | "stack";
  metricsProfile: RouteHeroMetricProfile;
  stackMode: RouteStackMode | null;
  modules: readonly (OperationsRouteModule | AdminRouteModule)[];
  compositionMeta: RouteCompositionMeta | null;
  heroText: RouteHeroText;
  metricLabels: readonly string[];
  topTabs: readonly RouteTopNavItem[];
  sectionTabs: readonly RouteTopNavItem[];
  sectionQuickActions: readonly RouteQuickAction[];
};

export type HomeLandingCard = {
  path: NonHomeRoutePath;
  title: string;
  summary: string;
  emoji: string;
};

export type RouteProgressState = "entry" | "done" | "active" | "upcoming";

export type RouteCompositionSectionProgressState =
  | "complete"
  | "active"
  | "upcoming";

export type HomeLandingSectionBlueprint = {
  section: string;
  icon: string;
  routes: readonly HomeLandingCard[];
};

export type RouteCompositionRoute = {
  path: AppRoute;
  title: string;
  emoji: string;
  summary: string;
  step: number;
  isActive: boolean;
  isEntryPoint: boolean;
  progressState: RouteProgressState;
};

export type RouteCompositionSectionSummary = {
  sectionId: RouteSectionId;
  section: RouteSection;
  title: string;
  icon: string;
  basePath: "/operations" | "/admin";
  state: RouteCompositionSectionProgressState;
  routesCount: number;
  completedRoutes: number;
  upcomingRoutes: number;
  progressRate: number;
};

export type RouteCompositionSectionNeighbor = {
  direction: "prev" | "next";
  path: AppRoute;
  sectionTitle: string;
  ariaLabel: string;
};

export type RouteCompositionState = {
  atlas: RouteCompositionAtlas;
  activeLane: RouteCompositionLane | null;
  activeLaneIndex: number;
  completedInActiveLane: number;
  upcomingInActiveLane: number;
  neighbors: readonly RouteCompositionSectionNeighbor[];
  sectionSummaries: readonly RouteCompositionSectionSummary[];
  globalRouteCompleted: number;
  globalRouteTotal: number;
  globalRouteProgress: number;
};

export const routeProgressStateLabel: Record<RouteProgressState, string> = {
  entry: "진입",
  done: "완료",
  active: "현재",
  upcoming: "예정",
};

export const routeCompositionSectionStateLabel: Record<
  RouteCompositionSectionProgressState,
  string
> = {
  complete: "완료",
  active: "현재",
  upcoming: "예정",
};

export type RouteCompositionLane = {
  sectionId: RouteSectionId;
  section: RouteSection;
  title: string;
  icon: string;
  basePath: "/operations" | "/admin";
  isActive: boolean;
  routes: readonly RouteCompositionRoute[];
};

export type RouteCompositionAtlas = readonly RouteCompositionLane[];

export type HomePageCompositionCopy = {
  heroCardChip: string;
  heroCardTitle: string;
  heroCardDescription: string;
  sectionLabelSuffix: string;
  actionSectionTitle: string;
  summaryPanelChip: string;
  summaryPanelTitle: string;
  summaryPanelDescription: string;
  summaryRows: readonly { label: string }[];
};

export const routeHeroMetricLabels: Record<
  RouteHeroMetricProfile,
  readonly string[]
> = {
  home: ["돌봄 가구", "이번 달 정산", "청구 승인률"],
  operations: ["돌봄 가구", "이번 달 정산", "확인할 청구"],
  admin: ["월 관리 금액", "청구 승인률", "목표 진행률"],
};

export type HomeRoutePageBlueprint = RouteCompositionBlueprint & {
  pageKind: "home";
  metricsProfile: "home";
  stackMode: null;
  modules: readonly [];
  sections: readonly HomeLandingSectionBlueprint[];
  copy: HomePageCompositionCopy;
};

export type OperationsRoutePageBlueprint = RouteCompositionBlueprint & {
  pageKind: "stack";
  metricsProfile: "operations";
  stackMode: "operations";
  modules: readonly OperationsRouteModule[];
  compositionMeta: RouteCompositionMeta;
};

export type AdminRoutePageBlueprint = RouteCompositionBlueprint & {
  pageKind: "stack";
  metricsProfile: "admin";
  stackMode: "admin";
  modules: readonly AdminRouteModule[];
  compositionMeta: RouteCompositionMeta;
};

export type RoutePageBlueprint =
  | HomeRoutePageBlueprint
  | OperationsRoutePageBlueprint
  | AdminRoutePageBlueprint;

type RouteLayoutHints = {
  quickActions?: readonly RouteQuickAction[];
};

export type HomeRoute = {
  path: "/";
  section: "홈";
  mode: "home";
  focus: "all";
  title: string;
  emoji: string;
  summary: string;
} & RouteLayoutHints;

export type OperationsRoute = {
  path: Exclude<
    NonHomeRoutePath,
    | "/admin"
    | "/admin/overview"
    | "/admin/trends"
    | "/admin/plans"
    | "/admin/simulator"
  >;
  section: "운영";
  mode: "operations";
  stackMode: "operations";
  focus: OperationsFocus;
  modules: OperationsRouteModule[];
  hero?: RouteHeroText;
  title: string;
  emoji: string;
  summary: string;
} & RouteLayoutHints;

export type AdminRoute = {
  path: Exclude<
    NonHomeRoutePath,
    | "/operations"
    | "/operations/care"
    | "/operations/settlement"
    | "/operations/claims"
  >;
  section: "관리";
  mode: "admin";
  stackMode: "admin";
  focus: AdminFocus;
  modules: AdminRouteModule[];
  hero?: RouteHeroText;
  title: string;
  emoji: string;
  summary: string;
} & RouteLayoutHints;

export type SectionNavRoute = OperationsRoute | AdminRoute;
export type RouteNavItem = HomeRoute | SectionNavRoute;

export type RouteSection = "홈" | "운영" | "관리";

export type RouteNavGroup = {
  section: RouteSection;
  title: string;
  id: RouteSectionId;
  icon: string;
  basePath: "/operations" | "/admin";
  routes: SectionNavRoute[];
};

export type RouteSectionProgress = {
  route: AppRoute;
  sequence: readonly AppRoute[];
  activeIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export type RouteGlobalFlow = {
  previous: AppRoute | null;
  next: AppRoute | null;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  total: number;
};

export type RouteSectionFlow = {
  previous: AppRoute | null;
  next: AppRoute | null;
  isFirst: boolean;
  isLast: boolean;
};

type BaseRouteContext<
  R extends RouteNavItem,
  StackMode extends RouteStackMode | null,
  Modules extends ReadonlyArray<OperationsRouteModule | AdminRouteModule> =
    ReadonlyArray<OperationsRouteModule | AdminRouteModule>,
  Blueprint extends RoutePageBlueprint = RoutePageBlueprint,
> = {
  route: R;
  section: RouteNavGroup | null;
  trail: RouteNavItem[];
  sectionProgress: RouteSectionProgress | null;
  globalFlow: RouteGlobalFlow;
  sectionFlow: RouteSectionFlow;
  focusText: string | null;
  modules: Modules;
  stackMode: StackMode;
  activeTopRoutePath: TopRoutePath;
  hasSectionTabs: boolean;
  hasQuickActions: boolean;
  pageBlueprint: Blueprint;
};

export type RouteContext =
  | BaseRouteContext<HomeRoute, null, readonly [], HomeRoutePageBlueprint>
  | BaseRouteContext<
      OperationsRoute,
      "operations",
      readonly OperationsRouteModule[],
      OperationsRoutePageBlueprint
    >
  | BaseRouteContext<
      AdminRoute,
      "admin",
      readonly AdminRouteModule[],
      AdminRoutePageBlueprint
    >;

type HeroTextByMode = Record<RouteMode, RouteHeroText>;

export const heroTextByMode: HeroTextByMode = {
  home: {
    kicker: "가족 돌봄 운영 플랫폼",
    title: "돌봄 기록·정산·청구를 한 번에 시작하세요",
    description:
      "가장 먼저 할 일만 보여주고, 바로 다음 동작으로 이어드릴게요.",
  },
  operations: {
    kicker: "돌봄 관리",
    title: "오늘의 돌봄 업무를 빠르게 처리하세요",
    description:
      "기록-정산-청구 흐름으로 놓치는 단계 없이 진행하세요.",
  },
  admin: {
    kicker: "서비스 관리",
    title: "서비스 운영 상태를 빠르게 확인하고 조치하세요",
    description:
      "현황·변화·요금을 핵심만 모아 보고 오늘 필요한 조치로 연결하세요.",
  },
};

export const routeNavGroups: RouteNavGroup[] = [
  {
    id: "operations",
    section: "운영",
    title: "돌봄 관리",
    icon: "🗂️",
    basePath: "/operations",
    routes: [
      {
        path: "/operations",
        title: "돌봄 전체",
        section: "운영",
        modules: [...operationsModuleSequence],
        quickActions: [
          {
            path: "/operations/care",
            label: "기록 시작",
            emoji: "🩺",
          },
          { path: "/operations/settlement", label: "정산 계산", emoji: "🧮" },
          { path: "/operations/claims", label: "청구 점검", emoji: "📄" },
        ],
        hero: {
          kicker: "돌봄 관리",
          title: "기록·정산·청구를 한 번에 이어서 처리하세요",
          description:
            "오늘 할 일만 보여주고, 놓치기 쉬운 단계를 줄였습니다.",
        },
        emoji: "🗂️",
        summary: "기록·정산·청구 전체 흐름 한눈에",
        mode: "operations",
        stackMode: "operations",
        focus: "all",
      },
      {
        path: "/operations/care",
        title: "돌봄 기록",
        section: "운영",
        modules: ["overview", "care"],
        quickActions: [
          { path: "/operations", label: "전체 보기", emoji: "🗂️" },
          { path: "/operations/settlement", label: "정산으로 이동", emoji: "🧮" },
          { path: "/operations/claims", label: "청구 점검", emoji: "📄" },
        ],
        hero: {
          kicker: "돌봄 기록",
          title: "돌봄 기록을 먼저 남기면 다음 단계가 정확해집니다",
          description:
            "방문, 상담, 투약, 식사 같은 내용을 짧게 기록하면 나중에 가족이 함께 확인하기 쉽습니다.",
        },
        emoji: "🩺",
          summary: "돌봄 내용과 담당자 정보를 등록",
        mode: "operations",
        stackMode: "operations",
        focus: "care",
      },
      {
        path: "/operations/settlement",
        title: "돌봄비 정산",
        section: "운영",
        modules: ["overview", "settlement"],
        quickActions: [
          { path: "/operations", label: "전체 보기", emoji: "🗂️" },
          { path: "/operations/care", label: "기록 보기", emoji: "🩺" },
          { path: "/operations/claims", label: "청구 점검", emoji: "📄" },
        ],
        hero: {
          kicker: "돌봄비 정산",
          title: "시간과 금액으로 오늘 정산액을 바로 계산",
          description:
            "날짜, 시간, 기준 금액만 입력하면 가족별 정산 내용을 쉽게 남길 수 있습니다.",
        },
        emoji: "🧮",
        summary: "시간·금액으로 정산 합계 계산",
        mode: "operations",
        stackMode: "operations",
        focus: "settlement",
      },
      {
        path: "/operations/claims",
        title: "보험청구",
        section: "운영",
        modules: ["overview", "claims"],
        quickActions: [
          { path: "/operations", label: "전체 보기", emoji: "🗂️" },
          { path: "/operations/care", label: "기록 보기", emoji: "🩺" },
          { path: "/operations/settlement", label: "정산 이동", emoji: "🧮" },
        ],
        hero: {
          kicker: "보험청구",
          title: "보험청구 상태를 한 화면에서 점검하세요",
          description:
            "요청, 검토, 승인, 거절 상태를 기록해 놓치지 않게 관리합니다.",
        },
        emoji: "📄",
        summary: "요청·검토·승인 상태를 바로 점검",
        mode: "operations",
        stackMode: "operations",
        focus: "claims",
      },
    ],
  },
  {
    id: "admin",
    section: "관리",
    title: "서비스 관리",
    icon: "⚙️",
    basePath: "/admin",
    routes: [
      {
        path: "/admin",
        title: "관리 홈",
        section: "관리",
        modules: [...adminModuleSequence],
        quickActions: [
          { path: "/admin/overview", label: "전체 현황", emoji: "📊" },
          { path: "/admin/trends", label: "월별 추이", emoji: "📈" },
          { path: "/admin/plans", label: "요금 설정", emoji: "💡" },
        ],
        hero: {
          kicker: "서비스 관리",
          title: "서비스 운영 상태를 빠르게 점검하고 다음 조치로 연결",
          description:
            "이번 달 꼭 봐야 할 지표를 핵심만 보여주고, 바로바로 확인할 수 있게 정리했습니다.",
        },
        emoji: "⚙️",
        summary: "현황·추이·요금 조정을 한 곳에서 확인",
        mode: "admin",
        stackMode: "admin",
        focus: "all",
      },
      {
        path: "/admin/overview",
        title: "전체 현황",
        section: "관리",
        modules: ["kpi"],
        quickActions: [
          { path: "/admin", label: "관리 홈", emoji: "⚙️" },
          { path: "/admin/trends", label: "월별 변화", emoji: "📈" },
          { path: "/admin/plans", label: "요금 관리", emoji: "💡" },
        ],
        hero: {
          kicker: "전체 현황",
          title: "서비스 상태를 오늘 바로 점검하세요",
          description:
            "가족 수, 정산액, 승인률처럼 바로 판단 가능한 항목만 보여줍니다.",
        },
        emoji: "📊",
        summary: "활성 가구·정산·승인 지표를 확인",
        mode: "admin",
        stackMode: "admin",
        focus: "overview",
      },
      {
        path: "/admin/trends",
        title: "월별 변화",
        section: "관리",
        modules: ["trends"],
        quickActions: [
          { path: "/admin", label: "관리 홈", emoji: "⚙️" },
          { path: "/admin/overview", label: "전체 현황", emoji: "📊" },
          { path: "/admin/plans", label: "요금 관리", emoji: "💡" },
        ],
        hero: {
          kicker: "월별 변화",
          title: "지난달 대비 월별 흐름을 바로 비교하세요",
          description:
            "정산액, 청구 건수, 승인률의 증감 방향을 즉시 파악할 수 있습니다.",
        },
        emoji: "📈",
        summary: "정산액·건수·승인률 변동 점검",
        mode: "admin",
        stackMode: "admin",
        focus: "trends",
      },
      {
        path: "/admin/plans",
        title: "요금 관리",
        section: "관리",
        modules: ["plans"],
        quickActions: [
          { path: "/admin", label: "관리 홈", emoji: "⚙️" },
          { path: "/admin/trends", label: "월별 변화", emoji: "📈" },
          { path: "/admin/simulator", label: "예상 계산", emoji: "🧪" },
        ],
        hero: {
          kicker: "요금 관리",
          title: "요금제 운영값을 빠르게 조정하세요",
          description:
            "월 요금, 할인율, 가구 수를 바꾸면 예상 결과가 바로 반영됩니다.",
        },
        emoji: "💡",
        summary: "요금·할인율·이용 가구 수 조정",
        mode: "admin",
        stackMode: "admin",
        focus: "plans",
      },
      {
        path: "/admin/simulator",
        title: "예상 계산",
        section: "관리",
        modules: ["simulator", "summary"],
        quickActions: [
          { path: "/admin", label: "관리 홈", emoji: "⚙️" },
          { path: "/admin/overview", label: "전체 현황", emoji: "📊" },
          { path: "/admin/trends", label: "월별 변화", emoji: "📈" },
        ],
        hero: {
          kicker: "예상 계산",
          title: "요금 변동 시 월 매출 변화를 즉시 확인하세요",
          description:
            "가격 변화와 상위 요금제 변경 가능성을 조정해 예상 결과를 바로 봅니다.",
        },
        emoji: "🧪",
        summary: "요금 변화별 월 매출 시나리오 계산",
        mode: "admin",
        stackMode: "admin",
        focus: "simulator",
      },
    ],
  },
];

export const routeTraversalSequence: readonly AppRoute[] = [
  "/",
  ...routeNavGroups.flatMap((group) => group.routes.map((route) => route.path)),
];
const routeTraversalIndex = new Map(
  routeTraversalSequence.map((path, index) => [path, index]),
);

export const homeRoute: RouteNavItem = {
  path: "/",
  title: "홈",
  section: "홈",
  emoji: "🏠",
  summary: "돌봄 기록, 정산, 보험청구를 쉽게 시작",
  mode: "home",
  focus: "all",
};

export const routeMap: RouteNavItem[] = [
  homeRoute,
  ...routeNavGroups.flatMap((group) => group.routes),
];

const routeIndex = new Map<RouteNavItem["path"], RouteNavItem>(
  routeMap.map((route) => [route.path, route]),
);

export const routeByPath = (path: AppRoute) => {
  const found = routeIndex.get(path);
  if (!found) {
    throw new Error(`Unknown route path: ${path}`);
  }
  return found;
};

export const resolveActiveTopRoutePath = (route: RouteNavItem): TopRoutePath =>
  route.mode === "admin"
    ? "/admin"
    : route.mode === "operations"
      ? "/operations"
      : "/";

export const shellRoutes: RouteNavItem[] = [
  homeRoute,
  ...routeNavGroups.map((group) => routeByPath(group.basePath)),
];
const homeTopTabs: readonly RouteTopNavItem[] = shellRoutes.map((route) => ({
  path: route.path,
  label: route.title,
  emoji: route.emoji,
  summary: route.summary,
}));

const homeLandingSections: readonly HomeLandingSectionBlueprint[] =
  routeNavGroups.map((group) => ({
    section: group.title,
    icon: group.icon,
    routes: group.routes.map((route) => ({
      path: route.path,
      title: route.title,
      summary: route.summary,
      emoji: route.emoji,
    })),
  }));

export const getRouteCompositionAtlas = (
  activePath: AppRoute,
  prioritizeActiveSection = true,
): RouteCompositionAtlas => {
  const activeSection = findActiveRouteSection(activePath);
  const activeSectionNavigation = activeSection
    ? resolveSectionNavigation(activePath)
    : null;
  const activeIndex = activeSectionNavigation?.index ?? -1;
  const lanes = routeNavGroups.map((group) => {
    const isActiveSection = group.basePath === activeSection?.basePath;
    const sectionRoutes = group.routes.map((route) => route.path);
    return {
      sectionId: group.id,
      section: group.section,
      title: group.title,
      icon: group.icon,
      basePath: group.basePath,
      isActive: isActiveSection,
      routes: group.routes.map((route, index) => {
        const progressState: RouteProgressState = isActiveSection
          ? route.path === activePath
            ? "active"
            : activeIndex >= 0
              ? sectionRoutes.indexOf(route.path) < activeIndex
                ? "done"
                : route.path === group.basePath
                  ? "entry"
                  : "upcoming"
              : route.path === group.basePath
                ? "entry"
                : "upcoming"
          : route.path === group.basePath
            ? "entry"
            : "upcoming";

        return {
          path: route.path,
          title: route.title,
          emoji: route.emoji,
          summary: route.summary,
          step: index + 1,
          isActive: route.path === activePath,
          isEntryPoint: route.path === group.basePath,
          progressState,
        };
      }),
    };
  });

  if (!prioritizeActiveSection) {
    return lanes;
  }

  const activeLaneIndex = lanes.findIndex((lane) => lane.isActive);
  if (activeLaneIndex <= 0) {
    return lanes;
  }

  return [
    lanes[activeLaneIndex],
    ...lanes.slice(0, activeLaneIndex),
    ...lanes.slice(activeLaneIndex + 1),
  ];
};

export const getRouteCompositionState = (
  activePath: AppRoute,
): RouteCompositionState => {
  const atlas = getRouteCompositionAtlas(activePath, true);
  const orderedAtlas = getRouteCompositionAtlas(activePath, false);
  const activeLane = atlas.find((lane) => lane.isActive) ?? null;
  const activeLaneIndex = orderedAtlas.findIndex((lane) => lane.isActive);
  const globalRouteTotal = routeTraversalSequence.length;
  const globalRouteCompleted = routeTraversalIndex.get(activePath) ?? 0;
  const globalRouteProgress = Math.round(
    ((globalRouteCompleted + 1) / globalRouteTotal) * 100,
  );
  const completedInActiveLane = activeLane
    ? activeLane.routes.filter((route) => route.progressState === "done").length
    : 0;
  const upcomingInActiveLane = activeLane
    ? activeLane.routes.filter((route) => route.progressState === "upcoming")
        .length
    : 0;
  const sectionSummaries: RouteCompositionSectionSummary[] = orderedAtlas.map(
    (lane, laneIndex) => {
      const isBeforeActive = laneIndex < activeLaneIndex;
      const state: RouteCompositionSectionProgressState = isBeforeActive
        ? "complete"
        : lane.isActive
          ? "active"
          : "upcoming";

      const activeRouteIndex = lane.routes.findIndex((route) => route.isActive);
      const progressRate =
        state === "active" && activeRouteIndex >= 0
          ? Math.max(
              0,
              Math.round(((activeRouteIndex + 1) / lane.routes.length) * 100),
            )
          : state === "complete"
            ? 100
            : 0;

      return {
        sectionId: lane.sectionId,
        section: lane.section,
        title: lane.title,
        icon: lane.icon,
        basePath: lane.basePath,
        state,
        routesCount: lane.routes.length,
        completedRoutes: lane.routes.filter(
          (route) => route.progressState === "done",
        ).length,
        upcomingRoutes: lane.routes.filter(
          (route) => route.progressState === "upcoming",
        ).length,
        progressRate,
      };
    },
  );
  const neighbors: RouteCompositionSectionNeighbor[] = [];

  if (activeLaneIndex >= 0) {
    const previousLane = orderedAtlas[activeLaneIndex - 1];
    if (previousLane) {
      neighbors.push({
        direction: "prev",
        path:
          (
            previousLane.routes.find((route) => route.isEntryPoint) ??
            previousLane.routes[0]
          )?.path ?? "/operations",
        sectionTitle: previousLane.title,
        ariaLabel: `${previousLane.title} 이전 섹션 시작점으로 이동`,
      });
    }

    const nextLane = orderedAtlas[activeLaneIndex + 1];
    if (nextLane) {
      neighbors.push({
        direction: "next",
        path:
          (
            nextLane.routes.find((route) => route.isEntryPoint) ??
            nextLane.routes[0]
          )?.path ?? "/admin",
        sectionTitle: nextLane.title,
        ariaLabel: `${nextLane.title} 다음 섹션으로 이동`,
      });
    }
  }

  return {
    atlas,
    activeLane,
    activeLaneIndex,
    completedInActiveLane,
    upcomingInActiveLane,
    neighbors,
    sectionSummaries,
    globalRouteCompleted,
    globalRouteTotal,
    globalRouteProgress,
  };
};

export const getSectionRouteSequence = (
  path: AppRoute,
): readonly AppRoute[] | null => {
  const section = findActiveRouteSection(path);
  if (!section) {
    return null;
  }
  return section.routes.map((route) => route.path);
};

const getSectionTabsByPath = (path: AppRoute): readonly RouteTopNavItem[] => {
  const activeSection = findActiveRouteSection(path);
  if (!activeSection) {
    return [];
  }
  return activeSection.routes.map((route) => ({
    path: route.path,
    label: route.title,
    emoji: route.emoji,
    summary: route.summary,
  }));
};

export const getHomeLandingPageBlueprint = (): HomeRoutePageBlueprint => ({
  routePath: "/",
  pageKind: "home",
  metricsProfile: "home",
  stackMode: null,
  modules: [],
  compositionMeta: null,
  heroText: heroTextByMode.home,
  metricLabels: routeHeroMetricLabels.home,
  topTabs: homeTopTabs,
  sectionTabs: [],
  sectionQuickActions: [],
  sections: homeLandingSections,
  copy: {
    heroCardChip: "🧭",
    heroCardTitle: "플랫폼 한눈에 보기",
    heroCardDescription:
      "돌봄 기록, 정산, 보험청구, 서비스 관리를 필요한 순서대로 시작할 수 있습니다.",
    sectionLabelSuffix: "메뉴",
    actionSectionTitle: "빠른 시작",
    summaryPanelChip: "📈",
    summaryPanelTitle: "현재 기준 하이라이트",
    summaryPanelDescription:
      "가족 돌봄 관리에 필요한 현재 상태를 쉽게 확인합니다.",
    summaryRows: [
      { label: "현재 가구 수" },
      { label: "월 정산 가용성" },
      { label: "청구건수" },
      { label: "청구 승인률" },
    ],
  },
});

export const homeLandingPageBlueprint = getHomeLandingPageBlueprint();

export const isHomeRoute = (route: RouteNavItem): route is HomeRoute =>
  route.mode === "home";
export const isStackModeRoute = (
  route: RouteNavItem,
): route is OperationsRoute | AdminRoute => route.mode !== "home";

export const getRoutePageBlueprint = (path: AppRoute): RoutePageBlueprint => {
  const route = routeByPath(path);

  if (route.mode === "home") {
    return homeLandingPageBlueprint;
  }

  if (route.mode === "operations") {
    return {
      routePath: path,
      pageKind: "stack",
      metricsProfile: "operations",
      stackMode: "operations",
      modules: getOrderedModules(route),
      compositionMeta: routeModeDefinitions.operations.compositionMeta,
      heroText: route.hero ?? heroTextByMode.operations,
      metricLabels: routeHeroMetricLabels.operations,
      topTabs: homeTopTabs,
      sectionTabs: getSectionTabsByPath(path),
      sectionQuickActions: getRouteQuickActions(route),
    };
  }

  return {
    routePath: path,
    pageKind: "stack",
    metricsProfile: "admin",
    stackMode: "admin",
    modules: getOrderedModules(route),
    compositionMeta: routeModeDefinitions.admin.compositionMeta,
    heroText: route.hero ?? heroTextByMode.admin,
    metricLabels: routeHeroMetricLabels.admin,
    topTabs: homeTopTabs,
    sectionTabs: getSectionTabsByPath(path),
    sectionQuickActions: getRouteQuickActions(route),
  };
};

const getOrderedModulesByMode = (
  mode: RouteStackMode | null,
  modules: readonly (OperationsRouteModule | AdminRouteModule)[],
): readonly (OperationsRouteModule | AdminRouteModule)[] => {
  if (mode === "operations") {
    return operationsModuleSequence.filter((moduleName) =>
      modules.includes(moduleName),
    );
  }

  if (mode === "admin") {
    return adminModuleSequence.filter((moduleName) =>
      modules.includes(moduleName),
    );
  }

  return [];
};

export function getOrderedModules(route: HomeRoute): readonly [];
export function getOrderedModules(
  route: OperationsRoute,
): readonly OperationsRouteModule[];
export function getOrderedModules(
  route: AdminRoute,
): readonly AdminRouteModule[];
export function getOrderedModules(
  route: RouteNavItem,
): readonly (OperationsRouteModule | AdminRouteModule)[] {
  if (route.mode === "home") {
    return [];
  }
  if (route.mode === "operations") {
    return getOrderedModulesByMode("operations", route.modules);
  }

  return getOrderedModulesByMode("admin", route.modules);
}

export const getRouteQuickActions = (
  route: RouteNavItem,
): readonly RouteQuickAction[] => route.quickActions ?? [];

export const resolveRoute = (path: string): AppRoute => {
  const basePath = path.split("#")[0]?.split("?")[0] ?? "/";
  const normalized = basePath.replace(/\/+$/, "") || "/";

  const directRoute = routeIndex.get(normalized as AppRoute);
  if (directRoute) {
    return directRoute.path;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments[0] === "operations") {
    return "/operations";
  }

  if (segments[0] === "admin") {
    return "/admin";
  }

  return "/";
};

export const getRouteSectionFlow = (path: AppRoute): RouteSectionFlow => {
  if (path === "/") {
    return {
      previous: null,
      next: null,
      isFirst: true,
      isLast: true,
    };
  }

  const sectionNavigation = resolveSectionNavigation(path);
  if (!sectionNavigation) {
    return {
      previous: null,
      next: null,
      isFirst: true,
      isLast: true,
    };
  }

  const { sequence: sectionPaths, index } = sectionNavigation;
  return {
    previous: index > 0 ? sectionPaths[index - 1] : null,
    next: index < sectionPaths.length - 1 ? sectionPaths[index + 1] : null,
    isFirst: index === 0,
    isLast: index === sectionPaths.length - 1,
  };
};

export const getRouteSectionProgress = (
  path: AppRoute,
): RouteSectionProgress | null => {
  const sectionNavigation = resolveSectionNavigation(path);
  if (!sectionNavigation) {
    return null;
  }

  const { sequence, index: activeIndex } = sectionNavigation;

  return {
    route: path,
    sequence,
    activeIndex,
    hasPrev: activeIndex > 0,
    hasNext: activeIndex < sequence.length - 1,
  };
};

type RouteSectionNavigation = {
  sequence: readonly AppRoute[];
  index: number;
};

const resolveSectionNavigation = (
  path: AppRoute,
): RouteSectionNavigation | null => {
  const sectionSequence = getSectionRouteSequence(path);
  if (!sectionSequence) {
    return null;
  }

  const index = sectionSequence.indexOf(path);
  if (index < 0) {
    return null;
  }

  return {
    sequence: sectionSequence,
    index,
  };
};

export const getGlobalRouteFlow = (path: AppRoute): RouteGlobalFlow => {
  const index = routeTraversalIndex.get(path) ?? -1;
  if (index < 0) {
    return {
      previous: null,
      next: null,
      isFirst: true,
      isLast: true,
      index: 0,
      total: routeTraversalSequence.length,
    };
  }

  return {
    previous: index > 0 ? routeTraversalSequence[index - 1] : null,
    next:
      index < routeTraversalSequence.length - 1
        ? routeTraversalSequence[index + 1]
        : null,
    isFirst: index === 0,
    isLast: index === routeTraversalSequence.length - 1,
    index,
    total: routeTraversalSequence.length,
  };
};

export function findActiveRouteSection(path: AppRoute): RouteNavGroup | null {
  return (
    routeNavGroups.find((group) =>
      group.routes.some((route) => route.path === path),
    ) ?? null
  );
}

export const buildRouteTrail = (route: RouteNavItem): RouteNavItem[] => {
  if (isHomeRoute(route)) {
    return [route];
  }

  const activeSection = findActiveRouteSection(route.path);
  const sectionRoot = activeSection
    ? routeByPath(activeSection.basePath)
    : null;
  return [
    homeRoute,
    ...(sectionRoot && sectionRoot.path !== route.path ? [sectionRoot] : []),
    route,
  ].filter(
    (item, index, list) => index === 0 || item.path !== list[index - 1]?.path,
  );
};

export const routeTrailForPath = (path: AppRoute): RouteNavItem[] =>
  buildRouteTrail(routeByPath(path));

export const getRouteContext = (path: AppRoute): RouteContext => {
  const route = routeByPath(path);
  const section = findActiveRouteSection(route.path);
  const trail = buildRouteTrail(route);
  const sectionProgress = getRouteSectionProgress(route.path);
  const globalFlow = getGlobalRouteFlow(route.path);
  const sectionFlow = getRouteSectionFlow(route.path);
  const pageBlueprint = getRoutePageBlueprint(route.path);
  const sectionTabs = getSectionTabsByPath(path);
  const activeTopRoutePath = resolveActiveTopRoutePath(route);
  const hasQuickActions = getRouteQuickActions(route).length > 0;

  const focusText =
    route.mode === "operations"
      ? operationsFocusLabel[route.focus]
      : route.mode === "admin"
        ? adminFocusLabel[route.focus]
        : null;

  if (route.mode === "home") {
    return {
      route,
      section,
      trail,
      sectionProgress,
      globalFlow,
      sectionFlow,
      focusText,
      modules: homeLandingPageBlueprint.modules,
      stackMode: null,
      activeTopRoutePath,
      hasSectionTabs: false,
      hasQuickActions,
      pageBlueprint: pageBlueprint as HomeRoutePageBlueprint,
    };
  }

  if (route.mode === "operations") {
    const modules = getOrderedModules(route);
    return {
      route,
      section,
      trail,
      sectionProgress,
      globalFlow,
      sectionFlow,
      focusText,
      modules,
      stackMode: "operations",
      activeTopRoutePath,
      hasSectionTabs: sectionTabs.length > 0,
      hasQuickActions,
      pageBlueprint: pageBlueprint as OperationsRoutePageBlueprint,
    };
  }

  const modules = getOrderedModules(route);
  return {
    route,
    section,
    trail,
    sectionProgress,
    globalFlow,
    sectionFlow,
    focusText,
    modules,
    stackMode: "admin",
    activeTopRoutePath,
    hasSectionTabs: sectionTabs.length > 0,
    hasQuickActions,
    pageBlueprint: pageBlueprint as AdminRoutePageBlueprint,
  };
};
