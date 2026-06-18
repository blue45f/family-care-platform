/**
 * DeskCloud 위젯 묶음 — 앱 셸 최상위에 한 번만 마운트한다(main.tsx).
 *
 * 각 desk 는 해당 VITE_*_URL 환경 변수가 설정된 경우에만 렌더된다(env-gated). 미설정이면
 * 아무것도 그리지 않아 앱에 전혀 영향을 주지 않는다. publishable 키(pk)는 VITE_*_PK 가
 * 있으면 쓰고, 없으면 'pk_demo' 로 폴백한다(SurveyDesk FeedbackWidget 마운트 패턴과 동일).
 *
 * - ChangelogDesk / NotifyDesk / SearchDesk = 보편 위젯(헤더/셸 성격).
 * - ChatDesk / MediaDesk = 콘텐츠 위젯이지만 붙일 명확한 페이지가 없어 플로팅 런처로 마운트.
 *
 * 사용자 식별이 필요한 desk(NotifyDesk·ChatDesk)는 로그인 사용자가 있을 때만 렌더한다.
 */
import type { ReactElement } from 'react'

import { useAuth } from '../../auth/useAuth'

import { ChatWidget } from './chatdesk/ChatWidget'
import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { MediaLauncher } from './mediadesk/MediaLauncher'
import { NotificationBell } from './notifydesk/NotificationBell'
import { SearchPalette } from './searchdesk/SearchPalette'

const env = import.meta.env
const DEMO_PK = 'pk_demo'

export function DeskCloudWidgets(): ReactElement | null {
  const { user } = useAuth()
  const recipientId = user ? String(user.id) : null

  return (
    <>
      {/* ChangelogDesk — 변경 이력 벨(플로팅, 보편 위젯) */}
      {env.VITE_CHANGELOGDESK_URL ? (
        <ChangelogWidget
          publishableKey={env.VITE_CHANGELOGDESK_PK ?? DEMO_PK}
          endpoint={env.VITE_CHANGELOGDESK_URL}
          position="bottom-left"
        />
      ) : null}

      {/* SearchDesk — ⌘K 검색 팔레트(글로벌 단축키, 보편 위젯) */}
      {env.VITE_SEARCHDESK_URL ? (
        <SearchPalette
          publishableKey={env.VITE_SEARCHDESK_PK ?? DEMO_PK}
          endpoint={env.VITE_SEARCHDESK_URL}
        />
      ) : null}

      {/* NotifyDesk — 알림 인박스 벨(로그인 사용자 한정) */}
      {env.VITE_NOTIFYDESK_URL && recipientId ? (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 16,
            zIndex: 2147482800,
          }}
        >
          <NotificationBell
            recipientId={recipientId}
            publishableKey={env.VITE_NOTIFYDESK_PK ?? DEMO_PK}
            endpoint={env.VITE_NOTIFYDESK_URL}
          />
        </div>
      ) : null}

      {/* ChatDesk — 쪽지·채팅(로그인 사용자 한정, 플로팅 런처) */}
      {env.VITE_CHATDESK_URL && recipientId ? (
        <ChatWidget
          publishableKey={env.VITE_CHATDESK_PK ?? DEMO_PK}
          endpoint={env.VITE_CHATDESK_URL}
          memberId={recipientId}
          memberName={user?.name}
        />
      ) : null}

      {/* MediaDesk — 미디어 업로더·갤러리(플로팅 런처) */}
      {env.VITE_MEDIADESK_URL ? (
        <MediaLauncher
          publishableKey={env.VITE_MEDIADESK_PK ?? DEMO_PK}
          endpoint={env.VITE_MEDIADESK_URL}
        />
      ) : null}
    </>
  )
}

export default DeskCloudWidgets
