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

## 개발 플로우

1. 운영 탭에서 `care-logs`, `settlements`, `claims` API 흐름을 먼저 사용해 실데이터 등록 동선을 확인
2. 어드민 탭에서 수익 지표와 요금제 파라미터를 조정해 운영 목표를 점검
3. `pnpm run verify`로 타입체크/빌드/검증 플로우 점검

## 운영 가이드

- 운영 핵심 지표: 활성 가구 수, 미승인 보험청구, 이번 달 정산 금액
- 수익성 지표: MRR, 연 매출 환산, 요금제 전환율

## 실행 가이드

- 프론트: `http://localhost:5173`
- API: `http://localhost:3001/api`
- 어드민 기능: 상단 탭의 `어드민 페이지`에서 확인

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
