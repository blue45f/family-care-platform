import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

// 간격은 reset(`p,h1{margin:0}`, unlayered)을 이기지 못하는 margin 유틸 대신
// flex 컨테이너의 gap으로 준다(eyebrow→제목 4px, 제목→설명 8px).
export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      {eyebrow ? (
        <p className="text-xs font-semibold leading-normal tracking-[0.04em] text-accent-hover">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl leading-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="max-w-[68ch] text-sm leading-normal text-fg-muted">{description}</p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
)
