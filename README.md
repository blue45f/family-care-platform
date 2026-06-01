# 가족 돌봄 운영 플랫폼 (독립형)

보호자 가족이 간병인 매칭이 아니라
`운영·기록·정산·보험청구`를 한 번에 관리하고, 어드민 수익 전략까지 운영할 수 있는
독립형 모노레포 프로젝트입니다.

## 프로젝트 구조

- `apps/web-app`: Vite + React 프론트엔드
- `apps/api-server`: NestJS 백엔드
- `pnpm-workspace.yaml`: 워크스페이스 정의
- `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`: 운영 가이드

## 시작하기

```bash
pnpm install
pnpm run dev
```

- 웹: `http://localhost:5173`
- API: `http://localhost:3001/api`

## 주요 명령어

- `pnpm run dev`: 웹/API 동시 실행
- `pnpm run build`: 워크스페이스 빌드
- `pnpm run lint`: 워크스페이스 정적 타입 검사
- `pnpm run typecheck`: 타입 검사
- `pnpm run test`: 테스트 (`api-server`/`web-app` 유닛 테스트)
- `pnpm run verify`: lint → typecheck → test → build
- `pnpm run ci`: CI 게이트
- `pnpm run smoke:web`: 샘플 시나리오 기반 브라우저/API 스모크 실행

개별 앱 실행 예시:

```bash
pnpm --dir apps/api-server install
pnpm --dir apps/api-server dev

pnpm --dir apps/web-app install
pnpm --dir apps/web-app dev
```

## 브라우저 스모크 테스트

- 웹앱/API 실행 후 아래로 샘플 시나리오를 검증합니다.

```bash
pnpm run dev
pnpm run smoke:web
```

- 스크립트는 웹앱 URL 후보(`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:5178`, `http://127.0.0.1:5178`)를 탐색해 실제 기동 포트로 연결합니다.

## API 엔드포인트

- `GET /api/care-logs`
- `POST /api/care-logs`
- `GET /api/settlements`
- `POST /api/settlements`
- `GET /api/claims`
- `POST /api/claims`
- `PATCH /api/claims/:id/status`
- `GET /api/admin/overview`
- `GET /api/admin/plans`
- `PATCH /api/admin/plans`

`GET /api/admin/overview` 응답에는 다음 항목이 포함됩니다.

- `activeHouseholds`: 활동 가구 수
- `thisMonthSettlement`: 월별 정산 합계
- `approvedClaims`, `totalClaims`, `conversionRate`: 승인/총청구와 승인률
- `monthlyTrend`: 최근 3개월 월별 `settlementTotal`, `claimCount`, `approvedClaimCount`, `approvalRate`
- `monthlyRecurringRevenue`, `planTakeRate`: 요금제 기반 수익성 지표

## 운영 가이드

- 운영 탭: 돌봄 기록, 정산, 보험청구를 운영자로 등록/조회
- 어드민 탭: 수익성 지표, 요금제 가격/할인율/고객 수 조정, 매출 예측 수치 확인
