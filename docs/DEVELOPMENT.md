# 가족 돌봄 운영 플랫폼 Development Guide

## 필수 실행 명령

- `pnpm install`
- `pnpm run dev`            # 웹/API 동시 개발 실행
- `pnpm run lint`            # 각 워크스페이스 정적 타입 검사를 수행
- `pnpm run typecheck`       # 각 워크스페이스 타입 체커
- `pnpm run test`            # 각 워크스페이스 유닛 테스트
- `pnpm run build`           # 각 워크스페이스 빌드
- `pnpm run verify`          # lint -> typecheck -> test -> build 순차 실행
- `pnpm run ci`              # verify와 동일한 CI 게이트
- `pnpm run smoke:web`       # 샘플 시나리오 기반 브라우저/API 스모크 실행

## 라이브러리 (용도별)

이 저장소는 **의존성을 최소화**하는 것을 기본으로 합니다(toss-assignment 기준선). 날짜/라우터/유틸리티 라이브러리(date-fns, react-router, lodash 등)는 추가하지 않으며, 필요한 동작은 작은 네이티브 헬퍼로 직접 구현합니다(예: 로컬 타임존 날짜 키를 만드는 `localYmd`/`localMonthKey`).

예외적으로, **API 입력 검증에는 유지보수자 결정에 따라 `zod`를 도입**했습니다(sibling 저장소와 동일한 zod 4.x). API 서버의 요청 입력(돌봄 기록·정산·보험청구 생성, 청구 상태 변경, 어드민 요금제 수정)은 손으로 작성한 `if (!x) throw ...` 검증 대신 모듈별 `*.schema.ts`의 zod 스키마로 검증합니다. 검증 실패는 작은 재사용 헬퍼/파이프(`common/zod-validation.pipe.ts`)가 `BadRequestException`으로 변환해, `AllExceptionsFilter`의 `ApiErrorBody`(`error: 'BadRequest'`, `statusCode: 400`, `detail: 메시지`) 형태를 그대로 유지합니다.

또한 **웹 폼에는 `react-hook-form` + `@hookform/resolvers`(zodResolver)를 도입**했습니다. 운영(`OperationsPage`)의 돌봄 기록·정산·보험청구 폼과 어드민(`AdminPage`)의 요금제 편집 폼은 각각 `useForm({ resolver: zodResolver(schema), mode: 'onChange' })`로 동작하며, 검증 스키마는 API의 `*.schema.ts`를 프론트엔드로 옮긴 `apps/web-app/src/features/<도메인>/schema.ts`에 둡니다(recipient/caregiver/note 필수+trim, type/status enum, careHours/baseRate 양수, expectedAmount 유한·양수, monthlyPrice 양수, annualDiscountRate 0~0.95). 이로써 **폼 검증이 zod 스키마 기반으로 프론트–API 간 일관**되며, 저장 버튼의 "유효해질 때까지 비활성" 게이트는 수동 `canSubmit` 대신 `formState.isValid`로, 숫자 입력은 `register(..., { valueAsNumber: true })`로 처리합니다. 폼 상태가 라이브러리로 이동하면서 기존 `usePlatformData`의 수동 draft 상태·필드별 업데이트 콜백·중복 검증은 제거하고, 훅은 데이터 로딩과 제출 부수효과(POST/PATCH 후 목록 갱신)만 담당합니다.

| 용도 | 라이브러리 | 비고 |
| --- | --- | --- |
| 웹 UI | `react`, `react-dom` (v19) | 프론트엔드 전부. 별도 UI 컴포넌트/전역 상태관리 라이브러리는 없음 |
| 웹 폼/검증 | `react-hook-form`, `@hookform/resolvers` + `zod` | 운영·어드민 폼을 `useForm` + `zodResolver`로 관리. 검증 스키마는 API 스키마를 옮긴 `src/features/*/schema.ts` |
| 웹 빌드/개발 서버 | `vite` | React Compiler(`reactCompilerPreset`) 활성화 |
| API 서버 | NestJS 코어(`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | DB/ORM 없음. 데이터는 원자적 JSON 파일 스토어로 영속화(아래 참고) |
| API 입력 검증 | `zod` (4.x) | 요청 입력 스키마 검증(모듈별 `*.schema.ts` + `ZodValidationPipe`) |
| 테스트 | `vitest` | 웹·API 공통 유닛 테스트 |
| 타입 | `typescript` | 모노레포 전역 + 워크스페이스별 typecheck |

위 외 추가 라이브러리가 정말 필요해지기 전까지는 표준 라이브러리/네이티브 API로 해결하는 것을 우선합니다.

## 라우터 (직접 구현, react-router 없음)

이 앱은 **react-router를 도입하지 않고** 표준 History API만으로 클라이언트 라우팅을 직접 구현합니다(의존성 최소화 원칙). 라우터는 세 모듈로 나뉩니다.

- **`src/routeConfig.ts` — 타입 레지스트리 / 순수 해석기.** 모든 화면 경로는 `AppRoute` 유니온(`"/" | "/operations" | ... | "/admin/simulator"`)으로 고정되어, 등록되지 않은 경로는 컴파일 에러가 됩니다. 네비게이션 그룹·블루프린트·브레드크럼·섹션/전역 플로우 등 라우트 파생 데이터를 한곳에서 만듭니다.
  - `resolveRouteResult(path)`: 원시 경로 문자열(주로 `location.pathname`)을 정규 `AppRoute`로 해석하고 `{ route, isFallback, isCanonical }`을 반환합니다. URL 정규화와 not-found 판단의 **단일 소스**입니다.
  - 폴백 규칙: 정확 일치 → 그대로 / `/operations/<미등록>` → `/operations` / `/admin/<미등록>` → `/admin` / 그 외 전부 → `DEFAULT_ROUTE`(`"/"`). 트레일링 슬래시·쿼리·해시는 경로 해석에서 무시하되 URL에는 보존합니다.
  - `resolveRoute(path)`(라우트만 반환, 기존 시그니처 유지), `isAppRoute(value)`(타입 가드), `DEFAULT_ROUTE`(타입상 `AppRoute`인 폴백)도 제공합니다.
- **`src/routeNavigation.ts` — 부수효과(History·스크롤·포커스) 순수 헬퍼.** DOM 전역에 직접 의존하지 않고 주입 가능한 어댑터(`HistoryLike`, `window`, 메인 엘리먼트)를 받으므로 jsdom 없이 node 환경에서 단위 테스트됩니다.
  - `canonicalizeLocation(location)`: 주소창과 정규형이 다른지 계산(`shouldReplace`, 쿼리/해시 보존한 `nextUrl`).
  - `reconcileLocationToRoute(history, location)`: 미등록/비정규 URL을 `replaceState`로 보정(잘못된 URL이 뒤로가기 히스토리에 남지 않도록 `pushState`가 아닌 `replaceState` 사용).
  - `applyRouteEntrySideEffects(mainEl, win)`: 라우트 변경 시 스크롤을 맨 위로 되돌리고 메인 영역으로 포커스를 이동(a11y).
- **`src/useRouteState.ts` — React 훅(상태·History 연동).** `location.pathname` 기준으로 초기화하고 `popstate`(뒤로/앞으로)를 구독하며, `navigate(path: AppRoute)`는 `pushState`로 URL을 바꿉니다. 마운트 시 1회 + popstate마다 `reconcileLocationToRoute`로 주소창을 정규화하므로 **딥링크/북마크/공유 URL이 동작**합니다. 반환하는 `mainRef`를 본문 영역에 붙이면 라우트 변경 시 스크롤·포커스가 자동 처리되고, `isFallback`으로 not-found 안내를 띄울 수 있습니다.

`src/App.tsx`는 `useRouteState`의 `routeContext.route.mode`(`home`/`operations`/`admin`)에 따라 페이지를 렌더링하고, 스킵 링크(`본문 바로가기`)와 `tabIndex=-1` 본문 영역(`#route-main-content`, `mainRef` 부착)으로 키보드/스크린리더 동선을 제공합니다.

### 라우트 추가 방법

1. **`src/routeConfig.ts`의 `AppRoute` 유니온에 경로 리터럴을 추가**합니다(예: `"/operations/visits"`). 이 순간부터 해당 경로는 타입상 유효해지고, 누락 시 아래 단계에서 컴파일 에러로 안내됩니다.
2. 해당 섹션(`routeNavGroups`의 `operations` 또는 `admin`) `routes` 배열에 **라우트 객체**를 추가합니다(`path`, `title`, `section`, `modules`, `quickActions`, `hero`, `emoji`, `summary`, `mode`, `stackMode`, `focus`). 모듈 메타가 필요하면 `operationsModuleMeta`/`adminModuleMeta`와 시퀀스(`*ModuleSequence`)에 키를 추가합니다.
3. 새 화면 콘텐츠는 기존 `OperationsPage`/`AdminPage`의 모듈 렌더링에 포함되거나, 완전히 새로운 모드라면 `RouteContext`/`renderPage()` 분기를 확장합니다.
4. 네비게이션은 어디서든 `navigate("/operations/visits")`로 호출합니다(인자는 `AppRoute`로 제한되어 오타는 컴파일 에러).
5. `src/routeConfig.spec.ts`에 해석/폴백 케이스를 추가하고 `pnpm run verify`로 검증합니다. 새 경로는 `routeMap`을 순회하는 테스트가 자동으로 정규 해석을 확인합니다.

> 미등록 하위 경로를 의도적으로 특정 라우트로 보내고 싶다면 `resolveRouteResult`의 폴백 분기를 수정하고, 해당 동작을 `routeConfig.spec.ts`로 못 박습니다.

## 테마 / 다크 모드

웹앱의 색·표면·텍스트·라인·그림자는 전부 `apps/web-app/src/styles.css`의 `:root` **OKLCH 디자인 토큰**으로 정의됩니다(하드코딩 색 없이 토큰 참조). 다크 모드는 토큰 값만 덮어쓰는 방식으로, 별도 라이브러리 없이 동작합니다.

- 활성화: `:root[data-theme="dark"]`(사용자 명시 선택) **및** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`(시스템 기본값 — 단, 라이트로 고정한 선택은 존중). 다크 블록은 동일 토큰 이름의 명도만 반전하고 hue/chroma는 유지하며, 네이티브 컨트롤을 위해 `color-scheme`도 함께 전환합니다.
- 깜빡임 방지(no-FOUC): `index.html` `<head>`의 작은 인라인 스크립트가 paint 전에 `localStorage`의 `theme`(없으면 `prefers-color-scheme`)를 읽어 `document.documentElement.dataset.theme`를 설정합니다.
- 토글: `apps/web-app/src/components/common/ThemeToggle.tsx`(헤더 우상단)가 라이트/다크를 전환하고 `localStorage('theme')`에 영속화합니다(접근성 aria-label + sun/moon 글리프).
- 대비: 다크 토큰은 본문/표면·버튼 라벨이 모두 WCAG AA를 넘도록 잡혀 있습니다(라이브 측정 확인).
- 토큰 값을 바꿀 때는 라이트(`:root`)와 다크(명시 선택자 + 미디어쿼리) **세 위치**를 함께 갱신해야 합니다(CSS at-rule 경계상 한 선언부 공유 불가).

## 데이터 영속화 (DB 없이 JSON 파일 스토어)

API 서버의 도메인 데이터(`care-logs`, `settlements`, `claims`, 어드민 요금제)는 **DB/ORM나 새 npm 의존성 없이** `node:fs`만으로 재시작 후에도 살아남습니다. sibling 저장소 **proto-live의 "atomic JSON file store" 패턴**(`backend/src/projects/projects.store.ts`)을 이식한 것입니다.

- 구현: `apps/api-server/src/common/json-store.ts`의 재사용 헬퍼 `JsonCollectionStore<T>`. 각 서비스(`@Injectable` 싱글톤)가 컬렉션별 JSON 파일 하나를 백킹 스토어로 가집니다.
  - `care-logs.json`, `settlements.json`, `claims.json` — 자동 증가 id(`seq`)를 사용하는 컬렉션
  - `admin-plans.json` — 고정 id(starter/pro/enterprise) 컬렉션(`seq` 없음)
- 원자적 쓰기: 임시 파일에 기록 후 `rename`으로 교체해 부분 기록을 방지합니다.
- 시작 시 로드: 파일이 없으면 기존 seed(빈 배열 또는 초기 요금제 3종)로 초기화하므로 dev 경험은 그대로입니다. 파일이 있으면 관용적으로 역직렬화하며, `items` 누락/형식 오류는 빈 배열로, `seq` 누락은 데이터의 `max(id)+1`로 복원합니다(스키마 마이그레이션 내성). 손상된 파일은 seed로 폴백합니다.
- 저장 위치: 기본 `<cwd>/data/` (api-server 실행 위치 기준). 환경 변수 `FCP_DATA_DIR`로 덮어쓸 수 있습니다. `data/`는 `.gitignore`로 제외되어 런타임 데이터는 커밋되지 않습니다.
- 테스트 격리: vitest(`VITEST`) 또는 `NODE_ENV=test` 환경에서는 파일 I/O 없이 **인메모리로만** 동작하고 `save()`는 no-op입니다. 따라서 각 서비스 인스턴스는 항상 seed에서 시작하며, 기존 유닛 테스트의 격리(매 테스트 fresh seed)가 그대로 유지됩니다.

## 개발 플로우

1. 운영 탭에서 `care-logs`, `settlements`, `claims` API 흐름을 먼저 사용해 실데이터 등록 동선을 확인
2. 어드민 탭에서 수익 지표와 요금제 파라미터를 조정해 운영 목표를 점검
3. `pnpm run verify`로 타입체크/빌드/검증 플로우 점검
4. `pnpm run smoke:web`로 샘플 시나리오 등록/조회/상태 변경까지 브라우저 연동 검증

## 운영 가이드

- 운영 핵심 지표: 활성 가구 수, 미승인 보험청구, 이번 달 정산 금액
- 수익성 지표: MRR, 연 매출 환산, 요금제 전환율

## 실행 가이드

- 프론트: `http://localhost:5173`
- API: `http://localhost:3001/api`
- 어드민 기능: 상단 탭의 `어드민 페이지`에서 확인

스모크 실행 전제:

- 웹앱/API가 각각 실행 중이어야 하며, 브라우저 포트 충돌 시 스크립트가 후보 포트를 탐색합니다.

## API 엔드포인트(백엔드)

- `GET /api/care-logs`
- `POST /api/care-logs`
- `GET /api/settlements`
- `POST /api/settlements`
- `GET /api/claims`
- `POST /api/claims`
- `GET /api/admin/overview`
- `GET /api/admin/plans`
- `PATCH /api/admin/plans`
