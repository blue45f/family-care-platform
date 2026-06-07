# 가족 돌봄 운영 플랫폼 아키텍처

## 프로젝트 형태

- pnpm monorepo(workspace) 구조
- `apps/web`: React + Vite 프론트엔드
- `apps/api`: NestJS 백엔드 API

## 스크립트 책임 분리

- 루트 `package.json`
  - 전체 워크스페이스 개발/빌드/검증 스크립트 제공
- 웹(`apps/web`)
  - `dev`, `build`, `preview`, `typecheck`, `test`, `lint`
- API(`apps/api`)
  - `dev`, `build`, `start`, `start:prod`, `typecheck`, `test`, `lint`
- 어드민 데이터(`/admin`)
  - 수익성 지표 조회 / 요금제 운용 API 제공

## 통신 규칙

- API 엔드포인트 기본 접두사: `/api`
- 운영 스크립트에서는 브라우저에서 백엔드를 직접 호출(`BASE_URL=http://127.0.0.1:3001/api`)하거나 `VITE_API_URL`로 덮어씁니다.

## 엔티티 도메인

- 방문 일정: `schedules`
- 운영 기록: `care-logs`
- 정산: `settlements`
- 보험청구: `claims`
- 수익 관리: `admin`

## 클라이언트 라우터 (React Router DOM)

- 웹앱은 `react-router-dom` v7 기반입니다. `main.tsx`에서 `BrowserRouter`를 제공하고, `App.tsx`는 `Routes`, `Route`, `Navigate`, `useLocation`, `useNavigate`로 인증 게이트와 페이지 전환을 처리합니다.
- 구성: `apps/web/src/routeConfig.ts`(경로 타입·메타데이터·내비게이션 IA·순수 해석기), `appRoutes.tsx`(React Router에 연결되는 보호 라우트/인증 라우트 매니페스트), `routeNavigation.ts`(URL 정규화·스크롤·포커스 순수 헬퍼).
- 비로그인 사용자의 `/`는 공개 홈페이지를 보여주고, 로그인 후 `/`는 운영 대시보드를 보여줍니다. 보호 라우트(`/schedule`, `/care`, `/claims` 등)에 직접 접근하면 로그인 화면으로 이동하되 원래 경로로 복귀할 수 있게 `location.state.from`을 유지합니다.
- 경로는 `AppRoute` 유니온으로 타입 고정되어 잘못된 경로는 컴파일 에러입니다. 미등록/비정규 URL은 `canonicalizeLocation` 결과를 기준으로 `Navigate`/`replace` 처리하며, 라우트 변경 시 스크롤 복원 + 메인 포커스 이동(a11y), `isFallback` not-found 안내를 유지합니다.
- 자세한 설계/라우트 추가법은 `docs/DEVELOPMENT.md`의 "라우터" 절을 참고하세요.

## 데이터 레이어 (DB 없는 JSON 파일 영속화)

- DB/ORM 없이 `node:fs`만으로 데이터를 영속화합니다. proto-live의 "atomic JSON file store" 패턴을 이식했습니다.
- 재사용 헬퍼 `apps/api/src/common/json-store.ts`(`JsonCollectionStore<T>`)가 컬렉션별 JSON 파일(`data/*.json`)을 백킹합니다: 원자적 temp-write+rename, 시작 시 seed 로드, 관용적 역직렬화(누락 필드 기본값/`seq` 복원).
- 서비스 싱글톤은 시작 시 파일에서 상태를 로드하고, 생성/수정 시 즉시 파일을 갱신합니다.
- 테스트 환경(`VITEST`/`NODE_ENV=test`)에서는 인메모리로만 동작(파일 I/O 없음)해 기존 테스트 격리를 유지합니다.
- 자세한 동작/저장 위치/환경 변수는 `docs/DEVELOPMENT.md`의 "데이터 영속화" 절을 참고하세요.

## 검증 흐름

1. API 타입체크(`typecheck`) → 웹 타입체크(`typecheck`)
2. 빌드(`build`) → 통합 빌드(`pnpm -r run build`)
3. `ci`/`verify`를 통해 포맷+린트+타입체크+테스트+빌드 실행
4. 실행 중인 웹/API를 대상으로 `pnpm run smoke:web`, `python3 scripts/verify-web-ui.py`로 샘플 API 흐름과 주요 화면 라우팅을 검증
