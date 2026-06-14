import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '../ui/Icon'

import { Sidebar } from './Sidebar'

import type { AppRoute } from '../../routeConfig'

type AppShellProps = {
  /** 현재 라우트 타이틀(모바일 상단바 + 드로어 헤더). */
  routeTitle: string
  badges?: Partial<Record<AppRoute, number>>
  isOnline: boolean
  /** 본문 영역 ref(라우트 포커스 관리). */
  mainRef: React.RefObject<HTMLDivElement | null>
  mainId: string
  children: ReactNode
  /** 로그인 사용자 표시명(사이드바 푸터). */
  userName?: string
  /** 로그아웃 핸들러(사이드바 푸터). */
  onLogout?: () => void
  /** 관리자 여부(관리자 전용 메뉴 노출). */
  isAdmin?: boolean
}

const DESKTOP_QUERY = '(min-width: 64rem)'

/**
 * 모바일 우선 앱 셸: 데스크톱은 좌측 고정 사이드바, 모바일/태블릿은 오프캔버스 드로어.
 * 스킵링크, 랜드마크(role), 드로어 Escape 닫기, 포커스 관리를 포함한다.
 */
export const AppShell = ({
  routeTitle,
  badges,
  isOnline,
  mainRef,
  mainId,
  children,
  userName,
  onLogout,
  isAdmin,
}: AppShellProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    toggleRef.current?.focus()
  }, [])

  const handleNavigate = useCallback(() => {
    closeDrawer()
  }, [closeDrawer])

  // 드로어가 열리면 본문 스크롤을 잠그고 첫 포커스를 드로어로 옮긴다.
  useEffect(() => {
    if (!drawerOpen) {
      return
    }
    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    drawerRef.current?.querySelector<HTMLElement>('button, a, [tabindex]')?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [closeDrawer, drawerOpen])

  // 데스크톱으로 넓어지면 드로어 상태를 정리한다(잔여 스크롤 락 방지).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const mq = window.matchMedia(DESKTOP_QUERY)
    const sync = () => {
      if (mq.matches) {
        setDrawerOpen(false)
      }
    }
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <div className="app">
      <a className="skip-link" href={`#${mainId}`}>
        본문 바로가기
      </a>

      {drawerOpen ? (
        <button type="button" className="scrim" aria-label="메뉴 닫기" onClick={closeDrawer} />
      ) : null}

      <aside
        ref={drawerRef}
        id="app-sidebar"
        className="sidebar"
        data-open={drawerOpen ? 'true' : 'false'}
        aria-label="사이드바"
      >
        <Sidebar
          onNavigate={handleNavigate}
          badges={badges}
          isOnline={isOnline}
          userName={userName}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      </aside>

      <div className="main-col">
        <div className="topbar">
          <button
            ref={toggleRef}
            type="button"
            className="icon-btn"
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen}
            aria-controls="app-sidebar"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <Icon name={drawerOpen ? 'close' : 'menu'} size={22} />
          </button>
          <span className="topbar-title">{routeTitle}</span>
        </div>

        <main
          id={mainId}
          ref={mainRef}
          tabIndex={-1}
          className="content"
          aria-label="현재 화면 본문"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
