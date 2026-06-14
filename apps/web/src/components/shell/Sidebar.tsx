import { NavLink } from 'react-router-dom'

import { navGroups, SITE_NAME } from '../../routeConfig'
import { Icon } from '../ui/Icon'

import type { AppRoute } from '../../routeConfig'

type NavBadges = Partial<Record<AppRoute, number>>

type SidebarProps = {
  onNavigate: (path: AppRoute) => void
  badges?: NavBadges
  isOnline: boolean
  userName?: string
  onLogout?: () => void
  /** 관리자 여부. 관리자 전용 메뉴(회원 관리)를 일반 회원에게 숨긴다. */
  isAdmin?: boolean
}

/**
 * 사이드바 내비게이션. 데스크톱에서는 고정, 모바일에서는 AppShell이 드로어로 감싼다.
 * 자체적으로 nav 랜드마크를 제공한다.
 */
export const Sidebar = ({
  onNavigate,
  badges = {},
  isOnline,
  userName,
  onLogout,
  isAdmin = false,
}: SidebarProps) => (
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
          {group.items
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const badge = badges[item.path]
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className="nav-item"
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
                </NavLink>
              )
            })}
        </div>
      ))}
    </nav>

    {userName ? (
      <div className="sidebar-user">
        <span className="sidebar-user-meta">
          <span className="sidebar-user-avatar" aria-hidden="true">
            {userName.trim().charAt(0) || '?'}
          </span>
          <span className="sidebar-user-name">{userName}</span>
        </span>
        {onLogout ? (
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <Icon name="logout" size={16} />
            <span>로그아웃</span>
          </button>
        ) : null}
      </div>
    ) : null}

    <div className="sidebar-foot">
      <span className="conn-dot" data-state={isOnline ? 'online' : 'offline'}>
        {isOnline ? '서버 연결됨' : '오프라인'}
      </span>
      <span>v1</span>
    </div>
  </>
)
