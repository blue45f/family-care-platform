# Tailwind 마이그레이션 가이드

기존 OKLCH 수제 CSS 디자인 시스템(`apps/web/src/styles.css`, ~3.4k줄)을 Tailwind v4
유틸리티로 **점진적·선별적**으로 옮기기 위한 기준이다. 목표는 "가능한 한 Tailwind"이지,
"무조건 전부"가 아니다 — 옮겨서 **더 단순·명확해지는 것만** 옮기고, 정교한 CSS는 그대로 둔다.

## 파운데이션 (이미 완료)

- `styles/tailwind.css`의 `@theme`가 디자인 토큰을 Tailwind 네임스페이스에 매핑한다:
  색(`bg-accent`, `text-fg-muted`, `border-border-subtle` …), `rounded-*`, `text-*`,
  `shadow-*`, `leading-*`, `font-*`, `ease-*`, `max-w-content`. → 유틸이 **정확한 디자인 값**으로 나온다.
- `--text-*--line-height`가 `--leading-normal`(1.6)로 설정돼, `text-*`는 **자동 1.6**.
  제목 `h1`~`h4`는 unlayered reset(1.18)이 utilities 레이어를 이겨 **자동 1.18** 유지.
  → 본문/제목 모두 `leading-*`를 따로 붙일 필요가 없다.
- preflight는 의도적으로 제외. `styles.css`가 base reset/토큰의 단일 소스다.

## Tailwind 유틸로 옮긴다 (MIGRATE)

다음은 유틸이 더 단순·일관적이다:

- **레이아웃**: flex/grid(표준 트랙), 정렬, 간격(`gap`), 컨테이너 `padding`/사이즈.
- **타이포그래피**: 타입 스케일 + role 색 (`text-sm`, `text-fg-strong`, `font-semibold` …).
- **테두리/모서리/그림자**: 토큰 기반 (`border`, `rounded-md`, `shadow-sm`).
- **단순 반응형**: `sm:` `md:` 등 표준 브레이크포인트 한두 개로 표현되는 변형.

## styles.css에 CSS로 둔다 (KEEP)

옮기면 arbitrary 값 범벅이 되어 **더 나빠지는** 것들:

- **그라데이션 / 합성 배경**: `linear-gradient(…)` 또는 여러 배경 레이어
  (예: `.today-panel`의 `linear-gradient(135deg,…), var(--bg-surface)`).
- **계산 색**: `color-mix(in oklch, …)` (예: `.today-task[data-tone='primary']`).
- **복잡한 반응형 그리드**: `grid-template-columns: auto auto minmax(0,1fr) auto`처럼
  브레이크포인트마다 트랙이 재편되는 그리드.
- **keyframe 애니메이션**: `@keyframes` 및 이를 쓰는 클래스 (예: `.skeleton` shimmer,
  `.auth-splash-dot` pulse).
- **상태/데이터 속성 변형**이 CSS가 더 읽기 쉬운 경우.
- **base reset · `:root` 토큰 · `@theme`**: 항상 CSS/설정에 둔다.

## 간격 규칙 (중요한 함정)

`styles.css`의 base reset(`p, h1~h4, ul, ol { margin: 0 }`)이 **unlayered라
`@layer utilities`를 이긴다.** 따라서 **reset 요소에 margin/space-y 유틸은 안 먹는다.**

- ✅ 간격은 flex/grid 컨테이너의 **`gap`**(또는 컨테이너 `padding`)으로 준다.
- 비균등 간격은 **중첩 flex**로 (예: `PageHeader` — eyebrow→제목 `gap-1`, 제목→설명 `gap-2`).
- ❌ `<p className="mt-2">` 류는 reset에 막혀 무효 → 쓰지 말 것.

`@layer base`로 reset을 옮기는 전역 변경은 **하지 않는다**(actor의 공개 페이지 포함 광범위
cascade 리스크 + `gap`으로 충분).

## 레거시 클래스 제거 규칙

`.card` `.stat` `.field` `.empty` `.grid-2` `.card-link` 등 **공유 클래스**는 페이지 전반에서
raw `className`으로 쓰인다(공개/마케팅 페이지 포함).

- 클래스는 **모든 사용처가 사라졌을 때만** `styles.css`에서 제거한다.
- 한 컴포넌트/페이지만 바꿨다고 공유 클래스를 지우면 다른 화면이 깨진다.
- 따라서 **그 surface 전용 클래스만** 함께 제거한다 (예: `PageHeader`에서 `.page-header*`
  4개 제거, 공유 `.page-eyebrow`(22곳)·`.page-desc`는 유지).
- 공유 클래스의 완전 제거는 모든 페이지가 마이그레이션된 뒤의 별도 정리 작업이다.

## 검증 (모든 마이그레이션 PR 필수)

DOM/시각 회귀 테스트가 없으므로(`vitest` `environment: 'node'`) **실측 검증**한다:

1. 백엔드: `pnpm --dir apps/api run dev` (인메모리, 외부 DB 불필요, :3001).
2. 웹: `pnpm --dir apps/web run dev` (:5173 점유 시 자동 증가). `/api`는 :3001 프록시.
3. 인증 화면은 로그인 화면의 **"데모 계정으로 둘러보기"**(`demo@familycare.app`)로 진입.
4. 변환 **전/후** 동일성 확인: 스크린샷 + `getComputedStyle`로 font-size·line-height·색·간격 비교.

## 진행 현황 / 순서

- ✅ #26 토큰 파운데이션 · #28 line-height 기본값 · #27 `PageHeader`(모범 사례).
- 다음: 단순 surface 우선(인증 폼 등) → 페이지 단위. 정교 CSS·공유 클래스는 위 기준대로 보존.
