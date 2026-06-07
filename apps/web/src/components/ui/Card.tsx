import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div'
  pad?: boolean
}

export const Card = ({ children, className = '', as: As = 'section', pad = true }: CardProps) => (
  <As className={['card', pad ? 'card-pad' : '', className].filter(Boolean).join(' ')}>
    {children}
  </As>
)

type CardHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** 제목 요소 레벨(접근성 문맥에 맞춰 조정). 기본 h2. */
  titleAs?: 'h2' | 'h3'
}

export const CardHeader = ({
  title,
  subtitle,
  action,
  titleAs: TitleTag = 'h2',
}: CardHeaderProps) => (
  <div className="card-head">
    <div>
      <TitleTag className="card-title">{title}</TitleTag>
      {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
)
