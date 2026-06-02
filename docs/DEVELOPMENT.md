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

| 용도 | 라이브러리 | 비고 |
| --- | --- | --- |
| 웹 UI | `react`, `react-dom` (v19) | 프론트엔드 전부. UI 라이브러리/상태관리 라이브러리 없음 |
| 웹 빌드/개발 서버 | `vite` | React Compiler(`reactCompilerPreset`) 활성화 |
| API 서버 | NestJS 코어(`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | DB/ORM 없음. 데이터는 원자적 JSON 파일 스토어로 영속화(아래 참고) |
| API 입력 검증 | `zod` (4.x) | 요청 입력 스키마 검증(모듈별 `*.schema.ts` + `ZodValidationPipe`) |
| 테스트 | `vitest` | 웹·API 공통 유닛 테스트 |
| 타입 | `typescript` | 모노레포 전역 + 워크스페이스별 typecheck |

위 외 추가 라이브러리가 정말 필요해지기 전까지는 표준 라이브러리/네이티브 API로 해결하는 것을 우선합니다.

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
