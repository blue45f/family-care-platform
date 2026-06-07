import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'warn' | 'danger' | 'info' | 'accent'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  /** 점 마커를 숨긴다(텍스트 전용 태그). */
  plain?: boolean
  className?: string
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: '',
  success: 'badge-success',
  warn: 'badge-warn',
  danger: 'badge-danger',
  info: 'badge-info',
  accent: 'badge-accent',
}

export const Badge = ({
  children,
  tone = 'neutral',
  plain = false,
  className = '',
}: BadgeProps) => (
  <span
    className={['badge', TONE_CLASS[tone], plain ? 'badge-plain' : '', className]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </span>
)
