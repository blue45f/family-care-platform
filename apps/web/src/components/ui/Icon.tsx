import type { ReactElement, SVGProps } from 'react'

/**
 * 가벼운 스트로크 아이콘 세트(외부 의존성 없음).
 * 모두 currentColor를 사용하므로 부모 텍스트 색을 그대로 따른다.
 * 장식용이므로 기본 aria-hidden; 의미가 필요한 곳에서는 호출부에서 라벨을 단다.
 */
export type IconName =
  | 'home'
  | 'schedule'
  | 'care'
  | 'settlement'
  | 'claims'
  | 'analytics'
  | 'plans'
  | 'guide'
  | 'book-open'
  | 'menu'
  | 'close'
  | 'arrow-right'
  | 'plus'
  | 'refresh'
  | 'check'
  | 'clock'
  | 'inbox'
  | 'heart'
  | 'logout'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  size?: number
}

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3 10.5 12 4l9 6.5v8.5A1.5 1.5 0 0 1 19.5 21H4.5A1.5 1.5 0 0 1 3 19.5Z" />
      <path d="M9 21v-6.8h6V21" />
      <path d="M8.25 10.75h7.5" />
    </>
  ),
  schedule: (
    <>
      <path d="M7.25 3.75v3" />
      <path d="M16.75 3.75v3" />
      <path d="M4.5 9h15" />
      <rect x="4.25" y="5.5" width="15.5" height="15" rx="2" />
      <path d="M7.5 13h9" />
      <path d="M7.5 16.5h6.5" />
    </>
  ),
  care: (
    <>
      <path d="M12 20.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
      <path d="M8 11.3c.8-1.9 2.5-3.2 4.5-3.2 2 0 3.8 1.3 4.5 3.2" />
      <path d="M9.7 16h4.6" />
    </>
  ),
  settlement: (
    <>
      <path d="M4.5 4.75h15v14.5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M8.25 8.75h7.5" />
      <path d="M8.25 11.5h7.5" />
      <path d="M8.25 14.25h7.5" />
      <path d="M11 17v-1.5h2V17" />
    </>
  ),
  claims: (
    <>
      <path d="M17.25 4H6.75A1.75 1.75 0 0 0 5 5.75V19a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V7.25Z" />
      <path d="M9 8h6" />
      <path d="M9 12h4.5" />
      <path d="M9 15h3" />
      <path d="M17 7.25V4" />
    </>
  ),
  analytics: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M6.4 16.5v-5.2" />
      <path d="M12 16.5V6.8" />
      <path d="M17.6 16.5v-7.1" />
      <path d="m5.75 8.8 3.5 2.55 3.65-4.2 5.35 2.55" />
      <path d="M18.25 9.7V6.9h-2.8" />
    </>
  ),
  plans: (
    <>
      <path d="M8.25 4.5h7A1.5 1.5 0 0 1 16.75 6v2.5H7.25V6A1.5 1.5 0 0 1 8.75 4.5h-.5Z" />
      <path d="M7.25 8.5h9.5" />
      <path d="M7.25 11.25h9.5" />
      <path d="M7.25 14h7.5" />
      <path d="M7.25 16.75h5.5" />
      <path d="M17 4.5v14a1.5 1.5 0 0 1-1.5 1.5H8.25" />
    </>
  ),
  guide: (
    <>
      <path d="M8 4h8.5a2 2 0 0 1 2 2v13H6V6a2 2 0 0 1 2-2Z" />
      <path d="M8 7.25h8.5" />
      <path d="M9.5 10h5.5" />
      <path d="M9.5 13h5.5" />
      <path d="M9.5 16h2.75" />
    </>
  ),
  'book-open': (
    <>
      <path d="M6.5 5.5h11a2 2 0 0 1 2 2v12.5H8.5a2 2 0 0 0-2 2" />
      <path d="M6.5 4.5A1.5 1.5 0 0 0 5 6v13.5h10.5" />
      <path d="M6.5 20h11.5" />
      <path d="M4 6a1.5 1.5 0 0 1 2-1.5h0.5" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.25 11.85a8.25 8.25 0 1 1-2.35-5.78" />
      <path d="M20.25 4.75v4.7h-4.7" />
    </>
  ),
  check: <path d="m5.25 12.35 4.25 4.2 9.25-9.1" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.6v4.65l3.15 1.85" />
      <path d="M12 3.75v1.2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
  heart: (
    <>
      <path d="M16.15 6.25A3.15 3.15 0 0 0 12 6.9a3.15 3.15 0 0 0-4.15-.65c-1.65.98-2.05 3.3-.75 4.82 1.35 1.58 4.9 4.62 4.9 4.62s3.55-3.04 4.9-4.62c1.3-1.52.9-3.84-.75-4.82Z" />
      <path d="M7.2 17.1h9.6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
}

export const Icon = ({ name, size = 20, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    shapeRendering="geometricPrecision"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <g vectorEffect="non-scaling-stroke">{PATHS[name]}</g>
  </svg>
)
