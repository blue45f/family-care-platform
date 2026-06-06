import type { AppRoute } from '../../routeConfig'
import { navGroups, SITE_NAME } from '../../routeConfig'
import { Icon } from '../ui/Icon'

type NavBadges = Partial<Record<AppRoute, number>>

type SidebarProps = {
  activeRoute: AppRoute
  onNavigate: (path: AppRoute) => void
  badges?: NavBadges
  isOnline: boolean
}

/**
 * 사이드바 내비게이션. 데스크톱에서는 고정, 모바일에서는 AppShell이 드로어로 감싼다.
 * 자체적으로 nav 랜드마크를 제공한다.
 */
export const Sidebar = ({ activeRoute, onNavigate, badges = {}, isOnline }: SidebarProps) => (
  <>
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <Icon name="heart" size={20} />
      </span>
      <span>
        <span className="brand-name">{SITE_NAME}</span>
        <span className="brand-sub">CARE OPERATIONS</span>
      </span>
    </div>

    <nav className="nav" aria-label="주요 메뉴">
      {navGroups.map((group) => (
        <div key={group.section}>
          <p className="nav-section-label">{group.label}</p>
          {group.items.map((item) => {
            const isActive = item.path === activeRoute
            const badge = badges[item.path]
            return (
              <button
                key={item.path}
                type="button"
                className="nav-item"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.path)}
              >
                <span className="nav-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span>{item.title}</span>
                {badge ? (
                  <span className="nav-badge" aria-label={`${badge}건`}>
                    {badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ))}
    </nav>

    <div className="sidebar-foot">
      <span className="conn-dot" data-state={isOnline ? 'online' : 'offline'}>
        {isOnline ? '서버 연결됨' : '오프라인'}
      </span>
      <span>v1</span>
    </div>
  </>
)
