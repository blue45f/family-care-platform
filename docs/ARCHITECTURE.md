# 가족 돌봄 운영 플랫폼 아키텍처

## 프로젝트 형태

- pnpm monorepo(workspace) 구조
- `apps/web-app`: React + Vite 프론트엔드
- `apps/api-server`: NestJS 백엔드 API

## 스크립트 책임 분리

- 루트 `package.json`
  - 전체 워크스페이스 개발/빌드/검증 스크립트 제공
- 웹(`apps/web-app`)
  - `dev`, `build`, `preview`, `typecheck`, `test`, `lint`
- API(`apps/api-server`)
  - `dev`, `build`, `start`, `start:prod`, `typecheck`, `test`, `lint`
- 어드민 데이터(`/admin`)
  - 수익성 지표 조회 / 요금제 운용 API 제공

## 통신 규칙

- API 엔드포인트 기본 접두사: `/api`
- 프론트는 Vite 프록시(`http://localhost:3001`)로 백엔드 호출

## 엔티티 도메인

- 운영 기록: `care-logs`
- 정산: `settlements`
- 보험청구: `claims`
- 수익 관리: `admin`

## 검증 흐름

1. API 타입체크(`typecheck`) → 웹 타입체크(`typecheck`)
2. 빌드(`build`) → 통합 빌드(`pnpm -r run build`)
3. 필요 시 `ci`/`verify`를 통해 타입체크+테스트+빌드 실행
