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
      <path d="M4.25 10.8 12 4.25l7.75 6.55" />
      <path d="M6.25 9.75v8.65a1.35 1.35 0 0 0 1.35 1.35h8.8a1.35 1.35 0 0 0 1.35-1.35V9.75" />
      <path d="M9.6 19.75v-5.4h4.8v5.4" />
      <path d="M10.1 10.75h3.8" />
    </>
  ),
  schedule: (
    <>
      <rect x="4.25" y="5.25" width="15.5" height="14.5" rx="2" />
      <path d="M8.2 3.75v3" />
      <path d="M15.8 3.75v3" />
      <path d="M4.25 9.2h15.5" />
      <path d="M8.35 13.15h2.25" />
      <path d="M13.4 13.15h2.25" />
      <path d="M8.35 16.35h2.25" />
    </>
  ),
  care: (
    <>
      <path d="M7.2 12.2H5.5a2.5 2.5 0 0 0-2.2 1.3l-.8 1.45" />
      <path d="M16.8 12.2h1.7a2.5 2.5 0 0 1 2.2 1.3l.8 1.45" />
      <path d="M7.3 15.2 12 19.3l4.7-4.1" />
      <path d="M15.9 7.4a2.7 2.7 0 0 0-3.9-.15 2.7 2.7 0 0 0-3.9.15c-1.05 1.15-.95 2.95.2 4.05L12 14.9l3.7-3.45c1.15-1.1 1.25-2.9.2-4.05Z" />
    </>
  ),
  settlement: (
    <>
      <path d="M7.25 3.75h9.5a1.5 1.5 0 0 1 1.5 1.5v15l-2-1.1-2 1.1-2.25-1.1-2.25 1.1-2-1.1-2 1.1v-15a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.85 8.2h6.3" />
      <path d="M8.85 11.35h4.1" />
      <path d="M9.6 15.45h4.8" />
      <path d="M12 13.15v4.6" />
    </>
  ),
  claims: (
    <>
      <path d="M14.2 3.75H7.4A1.65 1.65 0 0 0 5.75 5.4v13.2a1.65 1.65 0 0 0 1.65 1.65h9.2a1.65 1.65 0 0 0 1.65-1.65V7.8Z" />
      <path d="M14.2 3.75v4.1h4.05" />
      <path d="M8.85 12.35h4.25" />
      <path d="M8.85 16.2h2.55" />
      <path d="m13.75 15.85 1.3 1.3 2.45-2.7" />
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
      <rect x="4.25" y="5.25" width="15.5" height="13.5" rx="2" />
      <path d="M7.25 8.7h3.2" />
      <path d="M7.25 12h9.5" />
      <path d="M7.25 15.25h5.2" />
      <path d="M15.25 8.6h1.5" />
    </>
  ),
  guide: (
    <>
      <path d="M6.25 4.75h8.9a2.6 2.6 0 0 1 2.6 2.6v12.4H8.85a2.6 2.6 0 0 1-2.6-2.6Z" />
      <path d="M8.85 4.75a2.6 2.6 0 0 0-2.6 2.6v12.4" />
      <path d="M9.65 9.1h5.2" />
      <path d="M9.65 12.45h5.2" />
      <path d="M9.65 15.8h3.3" />
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
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <g vectorEffect="non-scaling-stroke">{PATHS[name]}</g>
  </svg>
)
