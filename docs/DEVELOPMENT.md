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

이 저장소는 **의도적으로 의존성을 최소화**합니다(toss-assignment 기준선). 날짜/라우터/유틸리티 라이브러리(date-fns, react-router, lodash 등)는 추가하지 않으며, 필요한 동작은 작은 네이티브 헬퍼로 직접 구현합니다(예: 로컬 타임존 날짜 키를 만드는 `localYmd`/`localMonthKey`).

| 용도 | 라이브러리 | 비고 |
| --- | --- | --- |
| 웹 UI | `react`, `react-dom` (v19) | 프론트엔드 전부. UI 라이브러리/상태관리 라이브러리 없음 |
| 웹 빌드/개발 서버 | `vite` | React Compiler(`reactCompilerPreset`) 활성화 |
| API 서버 | NestJS 코어(`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | 인메모리 서비스, DB/ORM 없음 |
| 테스트 | `vitest` | 웹·API 공통 유닛 테스트 |
| 타입 | `typescript` | 모노레포 전역 + 워크스페이스별 typecheck |

추가 라이브러리가 정말 필요해지기 전까지는 표준 라이브러리/네이티브 API로 해결하는 것을 우선합니다.

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
