import { describe, expect, it } from 'vitest'

import stylesCss from './styles.css?raw'

type Oklch = { l: number; c: number; h: number }
type Rgb = [number, number, number]

/** :root 토큰 선언에서 oklch(L C H [/ alpha]) 성분을 읽는다 (alpha는 무시). */
function tokenOklch(name: string): Oklch {
  const match = stylesCss.match(new RegExp(`${name}:\\s*oklch\\(([^)]+)\\)`))
  if (!match) throw new Error(`styles.css에서 토큰을 찾지 못했습니다: ${name}`)
  const [l, c, h] = match[1].split('/')[0].trim().split(/\s+/).map(Number)
  return { l, c, h }
}

/** OKLCH → sRGB (CSS Color 4 변환 행렬). 채널은 [0, 1] 클램프 후 감마 인코딩. */
function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const lm = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mm = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sm = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const encode = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
  }
  return [
    encode(4.0767416621 * lm - 3.3077115913 * mm + 0.2309699292 * sm),
    encode(-1.2684380046 * lm + 2.6097574011 * mm - 0.3413193965 * sm),
    encode(-0.0041960863 * lm - 0.7034186147 * mm + 1.707614701 * sm),
  ]
}

/** WCAG 2.x 상대 휘도 (감마 인코딩된 sRGB 0–1 채널 기준). */
function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 대비율 (1–21). */
function contrastRatio(fg: Oklch, bg: Oklch): number {
  const lumA = relativeLuminance(oklchToSrgb(fg))
  const lumB = relativeLuminance(oklchToSrgb(bg))
  const [hi, lo] = lumA > lumB ? [lumA, lumB] : [lumB, lumA]
  return (hi + 0.05) / (lo + 0.05)
}

describe('design tokens', () => {
  const fgOnAccent = tokenOklch('--fg-on-accent')

  it('Primary 버튼 라벨은 AA 4.5:1 이상이다 (--fg-on-accent on sage-500)', () => {
    const ratio = contrastRatio(fgOnAccent, tokenOklch('--c-sage-500'))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('hover/active 배경에서도 버튼 라벨 대비는 AA를 유지한다 (sage-600/700)', () => {
    expect(contrastRatio(fgOnAccent, tokenOklch('--c-sage-600'))).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(fgOnAccent, tokenOklch('--c-sage-700'))).toBeGreaterThanOrEqual(4.5)
  })

  it('소프트 칩 텍스트는 AA 4.5:1 이상이다 (sage-700 on sage-100)', () => {
    const ratio = contrastRatio(tokenOklch('--c-sage-700'), tokenOklch('--c-sage-100'))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('작은 글씨/플레이스홀더(--fg-subtle=sand-550)는 주요 표면에서 AA 4.5:1 이상이다', () => {
    // fg-subtle는 타임스탬프·캡션·플레이스홀더에 두루 쓰인다. 가장 흔한 표면인
    // surface(sand-50)에서 본문 AA 4.5:1을 만족해야 한다(이전 sand-500은 3.04:1로 미달).
    const subtle = tokenOklch('--c-sand-550')
    expect(contrastRatio(subtle, tokenOklch('--c-sand-50'))).toBeGreaterThanOrEqual(4.5)
    // sunken/hover(sand-150)·app-bg(sand-100)에서도 large-text 3:1을 넉넉히 넘는다.
    expect(contrastRatio(subtle, tokenOklch('--c-sand-150'))).toBeGreaterThanOrEqual(4.0)
    expect(contrastRatio(subtle, tokenOklch('--c-sand-100'))).toBeGreaterThanOrEqual(4.4)
  })

  it('포커스 링 색상은 --accent(sage-500)와 동기화되어 있다', () => {
    expect(tokenOklch('--accent-ring')).toEqual(tokenOklch('--c-sage-500'))
  })
})

describe('public anchor offsets', () => {
  it('앵커 타깃 밴드는 sticky 네비 높이만큼 scroll-margin-top을 확보한다', () => {
    const rule = stylesCss.match(/\.public-band\[id\]\s*\{[^}]*\}/)?.[0]
    if (!rule) throw new Error('styles.css에서 .public-band[id] 규칙을 찾지 못했습니다')
    expect(rule).toContain('scroll-margin-top')
    // PublicHomePage가 동기화하는 변수 + 단일 행 네비 폴백(min-height 4.25rem)을 함께 검증한다.
    expect(rule).toContain('var(--public-nav-height, 4.25rem)')
  })
})

describe('public nav mobile diet', () => {
  it('39rem 이하에서는 앵커 링크를 숨겨 sticky 네비가 히어로를 폴드 밖으로 밀지 않는다', () => {
    const mobileBlock = stylesCss.match(/@media \(max-width: 39rem\) \{([\s\S]*?)\n\}/)?.[1]
    if (!mobileBlock) throw new Error('styles.css에서 39rem 모바일 블록을 찾지 못했습니다')
    const rule = mobileBlock.match(/\.public-anchor-link\s*\{[^}]*\}/)?.[0]
    if (!rule) throw new Error('모바일 블록에서 .public-anchor-link 규칙을 찾지 못했습니다')
    expect(rule).toContain('display: none')
  })
})

describe('public nav mid-band wrap', () => {
  it('네비 컨테이너는 flex-wrap으로 중간 폭(39–47rem)에서 브랜드를 찌부러뜨리지 않고 줄바꿈한다', () => {
    const rule = stylesCss.match(/\.public-nav\s*\{[^}]*\}/)?.[0]
    if (!rule) throw new Error('styles.css에서 .public-nav 규칙을 찾지 못했습니다')
    expect(rule).toContain('flex-wrap: wrap')
  })

  it('액션 클러스터는 자기 줄로 내려가도 margin-left:auto로 우측 정렬을 유지한다', () => {
    const rule = stylesCss.match(/\.public-nav-actions\s*\{[^}]*\}/)?.[0]
    if (!rule) throw new Error('styles.css에서 .public-nav-actions 규칙을 찾지 못했습니다')
    expect(rule).toContain('margin-left: auto')
  })
})

describe('public footer', () => {
  it('푸터 링크(--fg-muted=sand-600)는 푸터 배경(--bg-surface=sand-50)에서 AA 4.5:1 이상이다', () => {
    const ratio = contrastRatio(tokenOklch('--c-sand-600'), tokenOklch('--c-sand-50'))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('태블릿 중간 구간(48–54rem)은 링크 그룹을 2열로 배치하고 브랜드는 전체 행을 차지한다', () => {
    const midBlock = stylesCss.match(
      /@media \(min-width: 48rem\) and \(max-width: 53\.99rem\) \{([\s\S]*?)\n\}/
    )?.[1]
    if (!midBlock) throw new Error('styles.css에서 48–54rem 푸터 중간 구간 블록을 찾지 못했습니다')
    const inner = midBlock.match(/\.public-footer-inner\s*\{[^}]*\}/)?.[0]
    const brand = midBlock.match(/\.public-footer-brand\s*\{[^}]*\}/)?.[0]
    expect(inner).toContain('repeat(2, minmax(0, 1fr))')
    expect(brand).toContain('grid-column: 1 / -1')
  })

  it('푸터 한국어 태그라인은 keep-all로 단어 중간 개행을 막는다', () => {
    const rule = stylesCss.match(/\.public-footer-brand-copy p\s*\{[^}]*\}/)?.[0]
    if (!rule) throw new Error('styles.css에서 .public-footer-brand-copy p 규칙을 찾지 못했습니다')
    expect(rule).toContain('word-break: keep-all')
  })
})
