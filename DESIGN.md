# DESIGN — 가족 돌봄 운영 플랫폼

The design system for the Phase 1 redesign. Light-first, warm-humane, clean and
airy. All tokens live in `apps/web/src/styles.css` (`:root`). Components in
`apps/web/src/components/ui/`. Shell in `apps/web/src/components/shell/`.

## Color

**Strategy: Restrained.** Tinted warm neutrals carry the surface; one sage accent
appears on roughly 10% of pixels (active nav, primary actions, accents). Status
colors are warm-tuned. OKLCH throughout; no `#000`/`#fff` (every neutral is
tinted toward the warm hue ~80).

### Why sage on warm sand (not white + teal)

Healthcare's training-data reflex is white + teal; the next reflex is generic
sage wellness. We commit to a **sage-green accent for care/trust** but ground it
in genuinely **warm sand/oat neutrals** plus a sparing **clay** secondary, so the
result reads as a considered, humane operations tool, not a clinic and not a
wellness landing page. The neutrals and copy do the warmth; sage does the trust.

### Warm neutral ramp (hue ~80, chroma 0.004-0.014)

`--c-sand-50 … --c-sand-900` from `oklch(0.992 0.004 85)` (near-white sand) to
`oklch(0.235 0.012 80)` (warm near-black). Role tokens:

- App bg `--bg-app` = sand-100, surfaces `--bg-surface` = sand-50, raised
  `--bg-surface-raised` ≈ 0.998.
- Text: `--fg-strong` sand-900, `--fg-default` sand-800, `--fg-muted` sand-600,
  `--fg-subtle` sand-500.
- Borders: subtle sand-200, default sand-300, strong sand-400.

### Sage accent (hue ~150)

`--accent` = `oklch(0.585 0.09 150)`, hover `0.5`, active `0.42`, soft fill
`--accent-soft` = sage-100, soft fg = sage-700. Focus ring uses
`oklch(0.585 0.09 150 / 0.45)`.

### Clay secondary (hue ~45) and status

Clay (`--c-clay-*`) for required-field marks and rare warm emphasis. Status pairs
(bg + fg) for success (sage), warn (amber ~70-85), danger (warm red ~30), info
(muted blue ~245).

## Theme

**Light only.** Scene: a care-center operator at a daytime desk or on a phone
between visits, wanting calm reassurance. That forces light + warm. The previous
dark/blue theme and the theme toggle were removed for simplicity.
`color-scheme: light`.

## Typography

- Font: **Pretendard Variable** (Korean-optimized), loaded via CDN with system-ui
  fallback (`-apple-system`, `Apple SD Gothic Neo`, `Noto Sans KR`).
- Scale ~1.25 (major third), base 16px: `--text-2xs` 11px → `--text-3xl` 39px.
  Steps: 2xs .694rem, xs .8, sm .875, base 1, lg 1.25, xl 1.5625, 2xl 1.953,
  3xl 2.441rem.
- Weights 400/500/600/700; headings 600 with `-0.012em` tracking, tight leading
  (1.18). Body leading 1.6.
- Prose capped at `--measure: 68ch` (`.page-desc`, `.prose`).

## Spacing, radius, elevation

- Spacing: 4px base, `--space-1 … --space-16` (0.25rem → 4rem).
- Radius: xs .375, sm .5, md .75, lg 1, xl 1.375rem, full.
- Elevation: four soft, **warm-tinted** shadows (`--shadow-xs … --shadow-lg`)
  built from `oklch(0.42 0.013 76 / …)`. No glassmorphism (one intentional
  backdrop-blur on the mobile top bar only).

## Motion

- Easing: `--ease-out` = `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint-ish),
  plus `--ease-out-soft`. No bounce, no elastic.
- Durations: 150 / 200 / 250ms. Drawer slides at 250ms.
- Never animate layout properties; transitions are on color/opacity/transform.
- Full `prefers-reduced-motion` reset.

## Layout / shell

Mobile-first, starts at 320px.

- **Desktop (≥64rem / 1024px):** persistent left sidebar (`--sidebar-w` 16rem),
  grouped nav, sticky full-height.
- **Tablet/mobile (<64rem):** off-canvas drawer toggled from a sticky top bar
  (hamburger), dark scrim, Escape-to-close, scroll lock, focus moved into the
  drawer and returned to the toggle on close.
- Content max width `--content-max` 76rem, centered, generous padding that scales
  up at 48rem.
- Touch targets ≥44px (nav items, buttons, inputs all min-height 2.75rem).

## Accessibility

Skip-link, landmark roles (`main`, `nav`, `aside`), `aria-current="page"` on
active nav, `:focus-visible` sage rings everywhere, route focus management +
`aria-live` route announcement (kept from prior work), per-route `document.title`
and OG/canonical sync via `useRouteMeta`.

## Components (`components/ui/`)

`Button` (primary/secondary/ghost, sm, block), `Card` + `CardHeader`, `Badge`
(neutral/success/warn/danger/info/accent), `Field` + `Input`/`Textarea`/`Select`
(auto id + aria-describedby/aria-invalid), `Table` + `TableColumn` (collapses to
labeled cards below 48rem via `data-label`), `EmptyState`, `Skeleton` +
`SkeletonLines`, `PageHeader`, `Stat` (calm label+value, explicitly NOT the
hero-metric template), `Icon` (hand-rolled stroke SVG set, no deps).

## Information architecture

Separated top-level routes (React Router DOM with typed route metadata):

비로그인 `/` 공개 홈페이지 · 로그인 후 `/` Dashboard · `/schedule` 방문 일정 · `/care`
돌봄 기록 · `/settlements` 돌봄비 정산 · `/claims` 보험청구 · `/analytics` 운영 분석 ·
`/plans` 요금제 관리 · `/guide` 사용 가이드 · `/login` · `/register`. Nav groups:
돌봄 운영 (dashboard/schedule/care/settlements/claims) and 서비스 관리
(analytics/plans/guide). Source of truth: `routeConfig.ts` `routeDefs` and
`appRoutes.tsx` route manifests.

## Banned (do not reintroduce)

Hero-metric template, side-stripe colored borders, gradient text,
glassmorphism-as-default, identical-card grids, em dashes, dark theme,
count-up number animation.
