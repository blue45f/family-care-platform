/**
 * NotifyDesk(네이티브) — 대시보드 "최근 알림" 카드.
 * ──────────────────────────────────────────────────────────────────────────
 * 발행된 SDK(@heejun/deskcloud)의 브라우저 NotifyClient 로 인박스를 읽고 읽음 처리한다.
 * 위젯 벨/플로팅 런처가 아니라, 이 앱의 Card·Badge·Button·EmptyState·Skeleton 로
 * 렌더해 대시보드의 다른 카드와 한 몸처럼 보이게 한다.
 *
 * env-gated: VITE_NOTIFYDESK_URL 가 설정되고(getNotifyClient 가 non-null) 로그인
 * 사용자가 있을 때만 마운트한다. 미설정이면 호출부에서 렌더하지 않는다.
 */
import { useCallback, useEffect, useState } from 'react'

import { Badge, Button, Card, CardHeader, EmptyState, Icon, SkeletonLines } from '../ui'

import { getNotifyClient } from './deskClients'
import { formatRelativeTime } from './deskFormat'

import type { NotifyNotification } from '@heejun/deskcloud'

type LoadState = 'loading' | 'ready' | 'error'

type DeskNotificationsCardProps = {
  /** 로그인 사용자 식별자(NotifyDesk recipientId). */
  recipientId: string
}

const INBOX_LIMIT = 6

export function DeskNotificationsCard({ recipientId }: DeskNotificationsCardProps) {
  // env 로 한 번 결정되는 클라이언트(렌더 간 안정). 호출부가 마운트 전에 게이트한다.
  const [client] = useState(getNotifyClient)
  const [items, setItems] = useState<NotifyNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [state, setState] = useState<LoadState>('loading')
  const [marking, setMarking] = useState(false)

  // 인박스 로드는 효과 안에서 직접 Promise 체인으로 한다(상태 변경은 .then/.catch
  // 콜백에서만 — 효과 본문의 동기 setState 를 피해 레포의 react-hooks 게이트 준수).
  // state 는 useState 초기값('loading')으로 시작하고, recipientId 가 바뀌어 다시
  // 불러올 때는 직전 목록을 잠깐 유지하다 응답이 최종 상태를 정한다(파괴적 동작 아님).
  useEffect(() => {
    if (!client) {
      return undefined
    }
    let cancelled = false
    client
      .getInbox({ recipientId, limit: INBOX_LIMIT })
      .then((inbox) => {
        if (cancelled) {
          return
        }
        setItems(inbox.items)
        setUnread(inbox.unreadCount)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setState('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, recipientId])

  const markAllRead = useCallback(async () => {
    if (!client || unread === 0) {
      return
    }
    setMarking(true)
    try {
      const result = await client.markRead({ recipientId, all: true })
      setUnread(result.unreadCount)
      setItems((prev) =>
        prev.map((n) => (n.status === 'read' ? n : { ...n, status: 'read', readAt: n.readAt }))
      )
    } catch {
      // 실패 시 다음 로드에서 자연 복구된다(파괴적 동작 아님).
    } finally {
      setMarking(false)
    }
  }, [client, recipientId, unread])

  return (
    <Card>
      <CardHeader
        title="최근 알림"
        subtitle="운영 알림을 한곳에서 확인합니다."
        titleAs="h2"
        action={
          unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={marking}>
              {marking ? '처리 중…' : '모두 읽음'}
            </Button>
          ) : null
        }
      />

      {state === 'loading' ? (
        <SkeletonLines lines={3} />
      ) : state === 'error' ? (
        <EmptyState
          icon="inbox"
          title="알림을 불러오지 못했어요"
          description="잠시 후 새로고침하면 다시 확인할 수 있습니다."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="check"
          title="새 알림이 없어요"
          description="중요한 운영 변동이 생기면 이곳에서 알려드립니다."
        />
      ) : (
        <ul className="flex flex-col">
          {items.map((n) => {
            const isUnread = n.status !== 'read'
            return (
              <li
                className="flex items-start gap-3 border-b border-border-subtle py-3 last:border-b-0"
                key={n.id}
              >
                <span
                  className={[
                    'mt-[0.15rem] grid h-8 w-8 flex-none place-items-center rounded-full',
                    isUnread ? 'bg-accent-soft text-accent-soft-fg' : 'bg-bg-sunken text-fg-subtle',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  <Icon name="inbox" size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[0.15rem]">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-fg-strong">{n.title}</span>
                    {isUnread ? (
                      <Badge tone="accent" plain>
                        새 알림
                      </Badge>
                    ) : null}
                  </span>
                  {n.body ? <span className="text-xs text-fg-muted">{n.body}</span> : null}
                  <span className="text-xs text-fg-subtle">{formatRelativeTime(n.createdAt)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
