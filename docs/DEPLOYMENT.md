# 배포 가이드 (Docker)

가족 돌봄 운영 플랫폼은 두 개의 컨테이너로 구성됩니다.

- **web** — Vite + React 정적 빌드를 `vite preview`로 서빙 (포트 `4173`)
- **api** — NestJS 서버. 외부 DB 없이 원자적 JSON 파일 스토어를 사용 (포트 `3001`)

루트에 두 Dockerfile과 한 개의 Compose 파일이 있습니다.

- `Dockerfile.web` — `node:22-alpine` 멀티스테이지, `pnpm`으로 web 빌드 후 `vite preview`
- `Dockerfile.api` — `node:22-alpine` 멀티스테이지, `nest build` 후 `node apps/api/dist/src/main.js`
- `docker-compose.yml` — web + api를 로컬 풀스택으로 빌드/실행

## 로컬 풀스택 실행 (권장)

```bash
docker compose up --build
```

| 서비스 | 컨테이너 포트 | 호스트 URL |
| --- | --- | --- |
| web | 4173 | http://localhost:4173 |
| api | 3001 | http://localhost:3001/api |

중지/정리:

```bash
docker compose down          # 컨테이너 중지 (데이터 볼륨 유지)
docker compose down -v       # 데이터 볼륨까지 삭제
```

## 환경 변수

| 변수 | 대상 | 기본값(compose) | 설명 |
| --- | --- | --- | --- |
| `PORT` | api | `3001` | API 리슨 포트 |
| `FCP_DATA_DIR` | api | `/data` | JSON 파일 스토어 디렉터리. named volume이 마운트됨 |
| `CORS_ALLOWED_ORIGINS` | api | `http://localhost:4173,http://127.0.0.1:4173` | 쉼표 구분 허용 origin. 운영에서는 실제 웹 도메인으로 교체 |
| `VITE_API_URL` | web (빌드 타임) | `http://localhost:3001/api` | 브라우저 번들에 박히는 API 주소. `--build-arg`로 주입 |
| `PORT` / `HOST` | web | `4173` / `0.0.0.0` | preview 서버 바인딩 |

`VITE_API_URL`은 **빌드 타임** 변수입니다. 값이 바뀌면 web 이미지를 다시 빌드해야 합니다.
미지정 시 운영 빌드는 상대경로 `/api`를 사용합니다(같은 오리진에서 API를 리버스 프록시할 때).

## 데이터 영속화

API는 외부 데이터베이스를 쓰지 않고 `FCP_DATA_DIR` 디렉터리의 JSON 파일에 원자적으로 기록합니다.
Compose는 named volume `api-data`를 컨테이너의 `/data`에 마운트하므로 컨테이너를 재생성해도
로컬 데이터가 유지됩니다. 초기화하려면 `docker compose down -v`로 볼륨을 제거하세요.

## 개별 이미지 빌드

```bash
# API 이미지
docker build -f Dockerfile.api -t family-care-api .

# Web 이미지 (브라우저가 호출할 API 주소를 빌드 타임에 주입)
docker build -f Dockerfile.web \
  --build-arg VITE_API_URL=https://api.your-domain.com/api \
  -t family-care-web .
```

두 빌드 모두 **빌드 컨텍스트는 리포지토리 루트**(`.`)입니다. pnpm 워크스페이스
전체(`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `apps/*`)가 필요하기 때문입니다.

## 컨테이너 호스트 배포

위 두 이미지는 컨테이너를 받는 어떤 호스트(예: Render, Cloud Run, Fly.io, Railway,
또는 임의의 Docker 호스트)에든 그대로 올릴 수 있습니다. 핵심 계약은 다음과 같습니다.

1. **api 서비스**
   - 이미지: `Dockerfile.api` 빌드 결과
   - 리슨 포트: `PORT`(기본 3001). 호스트가 `PORT`를 주입하면 그대로 따릅니다.
   - 영속 디스크를 `FCP_DATA_DIR`에 마운트하세요(예: Render Disk, Fly Volume).
     영속 스토리지가 없으면 JSON 데이터는 재배포 시 사라집니다.
   - `CORS_ALLOWED_ORIGINS`에 실제 웹 도메인을 설정하세요(`NODE_ENV=production`에서는 필수).
2. **web 서비스**
   - 이미지: `Dockerfile.web` 빌드 결과. `--build-arg VITE_API_URL=<공개 API 주소>`로 빌드.
   - 리슨 포트: `PORT`(기본 4173).
   - 정적 자산만 서빙하므로 영속 스토리지가 필요 없습니다.

> 단일 오리진으로 묶으려면 web 앞단에 리버스 프록시를 두고 `/api`를 api 서비스로
> 포워딩한 뒤, web 이미지를 `VITE_API_URL=/api`(또는 미지정)로 빌드하면 됩니다.
