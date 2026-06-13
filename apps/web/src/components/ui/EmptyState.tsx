import { Icon, type IconName } from './Icon'

import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: IconName
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export const EmptyState = ({ icon = 'inbox', title, description, action }: EmptyStateProps) => (
  <div className="empty">
    <span className="empty-icon">
      <Icon name={icon} size={22} />
    </span>
    <p className="empty-title">{title}</p>
    {description ? <p className="empty-desc">{description}</p> : null}
    {action ? <div>{action}</div> : null}
  </div>
)
