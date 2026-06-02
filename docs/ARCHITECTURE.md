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
- 운영 스크립트에서는 브라우저에서 백엔드를 직접 호출(`BASE_URL=http://127.0.0.1:3001/api`)하거나 `VITE_API_URL`로 덮어씁니다.

## 엔티티 도메인

- 운영 기록: `care-logs`
- 정산: `settlements`
- 보험청구: `claims`
- 수익 관리: `admin`

## 데이터 레이어 (DB 없는 JSON 파일 영속화)

- DB/ORM 없이 `node:fs`만으로 데이터를 영속화합니다. proto-live의 "atomic JSON file store" 패턴을 이식했습니다.
- 재사용 헬퍼 `apps/api-server/src/common/json-store.ts`(`JsonCollectionStore<T>`)가 컬렉션별 JSON 파일(`data/*.json`)을 백킹합니다: 원자적 temp-write+rename, 시작 시 seed 로드, 관용적 역직렬화(누락 필드 기본값/`seq` 복원).
- 서비스 싱글톤은 시작 시 파일에서 상태를 로드하고, 생성/수정 시 즉시 파일을 갱신합니다.
- 테스트 환경(`VITEST`/`NODE_ENV=test`)에서는 인메모리로만 동작(파일 I/O 없음)해 기존 테스트 격리를 유지합니다.
- 자세한 동작/저장 위치/환경 변수는 `docs/DEVELOPMENT.md`의 "데이터 영속화" 절을 참고하세요.

## 검증 흐름

1. API 타입체크(`typecheck`) → 웹 타입체크(`typecheck`)
2. 빌드(`build`) → 통합 빌드(`pnpm -r run build`)
3. 필요 시 `ci`/`verify`를 통해 타입체크+테스트+빌드 실행
