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
  all: "운영 전체",
  care: "돌봄 우선",
  settlement: "정산 우선",
  claims: "보험청구 우선",
};

export const adminFocusLabel: Record<AdminFocus, string> = {
  all: "경영 전체",
  overview: "KPI 우선",
  trends: "추세 우선",
  plans: "요금제 우선",
  simulator: "시뮬레이션 우선",
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
    title: "운영 개요",
    chip: "개요",
    note: "가구·정산·승인 수치 상태를 한 번에 점검합니다.",
    emoji: "📈",
    panelChip: "운영 대시보드",
    panelTitle: "실행 우선 순위형 운영 스위트",
    panelDescription:
      "보호자와 돌봄 현장을 기준으로 기록·정산·보험청구를 즉시 처리합니다.",
    panelClass: "panel-overview",
    panelKicker: "운영 대시보드",
  },
  care: {
    title: "돌봄 기록",
    chip: "돌봄",
    note: "보호자 일정/응답/비고를 빠르게 관리합니다.",
    emoji: "🩺",
    panelChip: "A",
    panelTitle: "돌봄 기록",
    panelDescription: "매일 접수되는 상태를 타임라인처럼 등록합니다.",
    panelClass: "panel-workflow",
  },
  settlement: {
    title: "가족 정산",
    chip: "정산",
    note: "시간·단가·합산을 즉시 반영해 운영 속도를 높입니다.",
    emoji: "🧮",
    panelChip: "B",
    panelTitle: "가족 운영 정산",
    panelDescription:
      "정산 단가/시간 기록을 누적하고 합산 수익을 즉시 확인합니다.",
    panelClass: "panel-workflow panel-alt",
  },
  claims: {
    title: "보험청구",
    chip: "청구",
    note: "요청·검토·승인 상태로 SLA를 줄입니다.",
    emoji: "📄",
    panelChip: "C",
    panelTitle: "보험청구",
    panelDescription:
      "청구 상태를 운영자가 즉시 바꿔 승인 프로세스를 단축합니다.",
    panelClass: "panel-workflow",
  },
};

export const adminModuleMeta: Record<AdminRouteModule, RouteModuleMeta> = {
  kpi: {
    title: "KPI 센터",
    chip: "KPI",
    note: "핵심 운영 성과를 한 번에 확인합니다.",
    emoji: "📊",
    panelChip: "1",
    panelTitle: "수익성 센터",
    panelDescription:
      "어드민에서 요금/전환/승인율을 함께 관리해 매출 엔진을 정교화합니다.",
    panelClass: "panel-overview",
  },
  trends: {
    title: "월별 추세",
    chip: "추세",
    note: "정산/건수/승인률 변화를 함께 추적합니다.",
    emoji: "📈",
    panelChip: "2",
    panelTitle: "월별 운영 추세 (최근 3개월)",
    panelDescription:
      "정산 합계/청구 건수/승인률을 월 단위로 확인해 수익 변동 포인트를 식별합니다.",
    panelClass: "panel-trend",
  },
  plans: {
    title: "요금제 전략",
    chip: "요금제",
    note: "가격·할인율·고객 수를 전환 관점으로 운영합니다.",
    emoji: "💡",
    panelChip: "3",
    panelTitle: "요금제 운영",
    panelDescription:
      "월 요금, 연 할인율, 활성 고객 수를 조정해서 MRR을 직접 실험합니다.",
    panelClass: "panel-plans",
  },
  simulator: {
    title: "시뮬레이터",
    chip: "시뮬",
    note: "가격 인상과 업셀링 변화가 MRR에 미치는 영향을 계산합니다.",
    emoji: "🧪",
    panelChip: "4",
    panelTitle: "수익 시뮬레이터",
    panelDescription:
      "가격/업셀링 가정을 넣으면 1개월 매출이 즉시 재계산됩니다.",
    panelClass: "panel-simulator",
  },
  summary: {
    title: "포트폴리오 요약",
    chip: "요약",
    note: "수익 레버리지 시나리오를 한 장에서 정리합니다.",
    emoji: "🧩",
    panelChip: "5",
    panelTitle: "매출 포트폴리오",
    panelDescription: "목표 달성 경로를 재정렬하고 운영 우선순위를 확정합니다.",
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
    compositionChip: "운영 구성도",
    compositionTitle: "이 페이지에서 운영 중점은 다음 모듈입니다",
    compositionDescription:
      "현재 경로 기준 모듈 배치를 우선순위 순서대로 노출합니다.",
    compositionPanelClass: "panel-ops-composition",
  },
  admin: {
    compositionChip: "어드민 구성도",
    compositionTitle: "이 페이지에서 경영 실행은 다음 축으로 이어집니다",
    compositionDescription:
      "모듈 우선순위를 페이지 기준으로 정렬해 의사결정 흐름을 확인하세요.",
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
  home: ["총 매출 가정치", "가상 업셀링 적용", "현재 승인 전환"],
  operations: ["활성 가구", "월 정산", "미승인 청구"],
  admin: ["현재 MRR", "월별 추세 포인트", "목표 달성률"],
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
  section: "어드민";
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

export type RouteSection = "홈" | "운영" | "어드민";

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
    title: "운영과 수익화가 한곳에서 이어지는 홈 허브",
    description:
      "보호자 가정관리, 돌봄 기록, 정산, 보험청구, 요금제 운영을 상황별로 분기해 빠르게 이동하세요.",
  },
  operations: {
    kicker: "운영 모듈",
    title: "가족 가정 케어를 실행 중심으로 운영",
    description:
      "돌봄 기록과 정산, 보험청구를 통합해 운영자의 판단 속도를 높이는 화면입니다.",
  },
  admin: {
    kicker: "어드민 모듈",
    title: "수익 전략을 한 화면에서 수립하고 시뮬레이션",
    description:
      "KPI, 월별 추세, 요금제, 업셀링 가이드를 한 번에 점검해 의사결정을 단축합니다.",
  },
};

export const routeNavGroups: RouteNavGroup[] = [
  {
    id: "operations",
    section: "운영",
    title: "운영",
    icon: "🗂️",
    basePath: "/operations",
    routes: [
      {
        path: "/operations",
        title: "운영 전체",
        section: "운영",
        modules: [...operationsModuleSequence],
        quickActions: [
          {
            path: "/operations/care",
            label: "돌봄 기록 바로가기",
            emoji: "🩺",
          },
          { path: "/operations/settlement", label: "정산 처리", emoji: "🧮" },
          { path: "/operations/claims", label: "보험청구 검토", emoji: "📄" },
        ],
        hero: {
          kicker: "운영 허브",
          title: "운영 전체를 한 번에 조정하고 승인 흐름까지 한꺼번에",
          description:
            "케어·정산·보험청구를 한 화면에서 묶어 운영 속도와 일관성을 함께 끌어올립니다.",
        },
        emoji: "🗂️",
        summary: "가구/정산/청구를 한 번에 조회하고 조치",
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
          { path: "/operations", label: "운영 전체 뷰", emoji: "🗂️" },
          { path: "/operations/settlement", label: "정산 기록", emoji: "🧮" },
          { path: "/operations/claims", label: "보험청구 처리", emoji: "📄" },
        ],
        hero: {
          kicker: "돌봄 실행",
          title: "돌봄 기록을 기준으로 운영 판단을 가속화",
          description:
            "기록 입력에서 승인/정산으로 이어지는 실무 흐름을 단일 화면에서 처리하세요.",
        },
        emoji: "🩺",
        summary: "보호자별 돌봄 내용과 일정 상태 등록",
        mode: "operations",
        stackMode: "operations",
        focus: "care",
      },
      {
        path: "/operations/settlement",
        title: "가족 정산",
        section: "운영",
        modules: ["overview", "settlement"],
        quickActions: [
          { path: "/operations", label: "운영 전체 뷰", emoji: "🗂️" },
          { path: "/operations/care", label: "돌봄 기록", emoji: "🩺" },
          { path: "/operations/claims", label: "보험청구 처리", emoji: "📄" },
        ],
        hero: {
          kicker: "수익 운영",
          title: "정산 단가와 합산 구조를 실무형으로 정비",
          description:
            "가족별 정산이 체계화되면 회수 속도와 관리 가시성이 동시에 올라갑니다.",
        },
        emoji: "🧮",
        summary: "정산 입력과 건별 합계 계산을 빠르게 처리",
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
          { path: "/operations", label: "운영 전체 뷰", emoji: "🗂️" },
          { path: "/operations/care", label: "돌봄 기록", emoji: "🩺" },
          { path: "/operations/settlement", label: "정산 처리", emoji: "🧮" },
        ],
        hero: {
          kicker: "클레임 운영",
          title: "요청→검토→승인 흐름을 표준 운영으로 통합",
          description:
            "상태 변경을 단일 패턴으로 관리하면 승인 지연과 미처리 누락을 줄일 수 있습니다.",
        },
        emoji: "📄",
        summary: "요청/검토/승인 상태를 운영 표준으로 처리",
        mode: "operations",
        stackMode: "operations",
        focus: "claims",
      },
    ],
  },
  {
    id: "admin",
    section: "어드민",
    title: "어드민",
    icon: "⚙️",
    basePath: "/admin",
    routes: [
      {
        path: "/admin",
        title: "어드민 전체",
        section: "어드민",
        modules: [...adminModuleSequence],
        quickActions: [
          { path: "/admin/overview", label: "KPI 핵심", emoji: "📊" },
          { path: "/admin/trends", label: "월별 추세", emoji: "📈" },
          { path: "/admin/plans", label: "요금제 관리", emoji: "💡" },
          { path: "/admin/simulator", label: "시뮬레이터", emoji: "🧪" },
        ],
        hero: {
          kicker: "경영 의사결정",
          title: "운영 데이터로 수익 전략의 다음 액션을 정렬",
          description:
            "KPI 진단 → 트렌드 진화 → 요금제 실험 → 포트폴리오 합산의 흐름으로 계획하세요.",
        },
        emoji: "⚙️",
        summary: "KPI부터 수익 시뮬레이션까지 전략 지표 통합",
        mode: "admin",
        stackMode: "admin",
        focus: "all",
      },
      {
        path: "/admin/overview",
        title: "어드민 KPI",
        section: "어드민",
        modules: ["kpi"],
        quickActions: [
          { path: "/admin", label: "어드민 전체 뷰", emoji: "⚙️" },
          { path: "/admin/trends", label: "월별 추세", emoji: "📈" },
          { path: "/admin/plans", label: "요금제 관리", emoji: "💡" },
        ],
        hero: {
          kicker: "핵심 수치",
          title: "운영성과를 한 번에 진단해 실행 우선순위를 재설정",
          description:
            "활성 가구, 정산, 승인률 상태를 먼저 보고 리스크를 선제적으로 탐지하세요.",
        },
        emoji: "📊",
        summary: "핵심 지표/승인률/정산 성과를 즉시 점검",
        mode: "admin",
        stackMode: "admin",
        focus: "overview",
      },
      {
        path: "/admin/trends",
        title: "월별 추세",
        section: "어드민",
        modules: ["trends"],
        quickActions: [
          { path: "/admin", label: "어드민 전체 뷰", emoji: "⚙️" },
          { path: "/admin/overview", label: "KPI 핵심", emoji: "📊" },
          { path: "/admin/plans", label: "요금제 관리", emoji: "💡" },
        ],
        hero: {
          kicker: "월간 추세",
          title: "트렌드 변화로 다음 달 운영 포인트를 확정",
          description:
            "정산·건수·승인률 추이를 병렬로 비교해 기회를 선별합니다.",
        },
        emoji: "📈",
        summary: "정산/건수/승인률 트렌드로 의사결정 근거 확보",
        mode: "admin",
        stackMode: "admin",
        focus: "trends",
      },
      {
        path: "/admin/plans",
        title: "요금제",
        section: "어드민",
        modules: ["plans"],
        quickActions: [
          { path: "/admin", label: "어드민 전체 뷰", emoji: "⚙️" },
          { path: "/admin/trends", label: "월별 추세", emoji: "📈" },
          { path: "/admin/simulator", label: "시뮬레이터", emoji: "🧪" },
        ],
        hero: {
          kicker: "요금 설계",
          title: "요금 정책을 실험해 MRR을 직접 운영",
          description:
            "단가·할인율·고객 수를 조정해 월 단위 수익 구조를 재구성하세요.",
        },
        emoji: "💡",
        summary: "요금 정책을 바탕으로 MRR 및 유입 기회를 설계",
        mode: "admin",
        stackMode: "admin",
        focus: "plans",
      },
      {
        path: "/admin/simulator",
        title: "수익 시뮬레이터",
        section: "어드민",
        modules: ["simulator", "summary"],
        quickActions: [
          { path: "/admin", label: "어드민 전체 뷰", emoji: "⚙️" },
          { path: "/admin/overview", label: "KPI 핵심", emoji: "📊" },
          { path: "/admin/trends", label: "월별 추세", emoji: "📈" },
          { path: "/admin/plans", label: "요금제 관리", emoji: "💡" },
        ],
        hero: {
          kicker: "시뮬레이션",
          title: "시나리오를 조정해 목표 달성 지점을 실험",
          description:
            "업셀링 비중과 가격 인상율을 조정해 월 매출 민감도를 즉시 확인하세요.",
        },
        emoji: "🧪",
        summary: "단가/업셀링 가정으로 1개월 수익 변화를 재계산",
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
  summary: "운영과 수익 현황을 한 화면에서 확인",
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
      "운영·정산·보험청구·수익화를 한 화면에서 빠르게 이동해 실행할 수 있는 구조입니다.",
    sectionLabelSuffix: "모듈",
    actionSectionTitle: "홈 액션",
    summaryPanelChip: "📈",
    summaryPanelTitle: "현재 기준 하이라이트",
    summaryPanelDescription:
      "운영과 수익 지표를 병렬로 확인해 다음 액션을 선택합니다.",
    summaryRows: [
      { label: "현재 가구 수" },
      { label: "월 정산 가용성" },
      { label: "청구건수" },
      { label: "예상 승인 전환" },
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
