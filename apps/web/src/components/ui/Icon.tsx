import type { ReactElement, SVGProps } from 'react'

/**
 * 가벼운 스트로크 아이콘 세트(외부 의존성 없음).
 * 모두 currentColor를 사용하므로 부모 텍스트 색을 그대로 따른다.
 * 장식용이므로 기본 aria-hidden; 의미가 필요한 곳에서는 호출부에서 라벨을 단다.
 */
export type IconName =
  | 'home'
  | 'care'
  | 'settlement'
  | 'claims'
  | 'analytics'
  | 'plans'
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
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  care: (
    <>
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A3.5 3.5 0 0 0 12 6 3.5 3.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7Z" />
    </>
  ),
  settlement: (
    <>
      <path d="M3 7h18" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
      <path d="M3 7l2.5-3h13L21 7" />
      <path d="M12 11v5" />
      <path d="M9.5 13.5h5" />
    </>
  ),
  claims: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M3 20h18" />
    </>
  ),
  plans: (
    <>
      <path d="M3 9h18" />
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 14h4" />
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
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
  heart: (
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A3.5 3.5 0 0 0 12 6 3.5 3.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7Z" />
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
    {...props}
  >
    {PATHS[name]}
  </svg>
)
