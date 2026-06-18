/**
 * ChangelogDesk(네이티브) — 가이드 페이지 "서비스 업데이트" 카드.
 * ──────────────────────────────────────────────────────────────────────────
 * 발행된 SDK(@heejun/deskcloud)의 브라우저 ChangelogClient 로 published 변경 이력을
 * 읽어, 이 앱의 Card·Badge·prose 로 렌더한다(플로팅 벨 위젯/외부 CSS 사용 안 함).
 *
 * env-gated: VITE_CHANGELOGDESK_URL 미설정이면 getChangelogClient() 가 null 이라
 * 이 컴포넌트는 아무것도 렌더하지 않고(null), 가이드 페이지는 기존 모습 그대로 유지된다.
 *
 * bodyHtml 은 ChangelogDesk 서버가 sanitize 한 HTML 이다(SDK 타입 주석 명시).
 */
import { useEffect, useState } from 'react'

import { Badge, Card, CardHeader, Icon, SkeletonLines, type BadgeTone } from '../ui'

import { getChangelogClient } from './deskClients'
import { formatRelativeTime } from './deskFormat'

import type { ChangelogEntry, ChangelogEntryTag } from '@heejun/deskcloud'

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

const TAG_META: Record<ChangelogEntryTag, { tone: BadgeTone; label: string }> = {
  new: { tone: 'accent', label: '신규' },
  improved: { tone: 'info', label: '개선' },
  fixed: { tone: 'success', label: '수정' },
  announcement: { tone: 'warn', label: '공지' },
}

const ENTRY_LIMIT = 5

export function DeskChangelogCard() {
  // 클라이언트는 env 로 한 번 결정된다(렌더 간 안정). useState 초기화로 만들어
  // 렌더 중에도 안전하게 읽을 수 있다(ref-during-render 경고 회피).
  const [client] = useState(getChangelogClient)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    if (!client) {
      return
    }
    // state 는 useState 초기값('loading')으로 시작한다. 클라이언트는 env 로 한 번만
    // 결정돼(deps=[client]) 재요청이 없으므로 여기서 다시 'loading' 으로 set 하지 않는다.
    const controller = new AbortController()
    client
      .getWall({ limit: ENTRY_LIMIT, signal: controller.signal })
      .then((wall) => {
        if (controller.signal.aborted) {
          return
        }
        setEntries(wall.items)
        setState(wall.items.length === 0 ? 'empty' : 'ready')
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }
        setState('error')
      })
    return () => controller.abort()
  }, [client])

  // env 미설정(클라이언트 없음) 또는 빈 이력이면 섹션을 통째로 숨긴다 —
  // 가이드 페이지의 기존 정보 구조를 어지럽히지 않기 위함이다.
  if (!client || state === 'empty' || state === 'error') {
    return null
  }

  return (
    <Card>
      <CardHeader title="서비스 업데이트" subtitle="최근 추가·개선된 기능을 모아 보여드립니다." />
      {state === 'loading' ? (
        <SkeletonLines lines={3} />
      ) : (
        <ol className="flex flex-col">
          {entries.map((entry) => {
            const meta = TAG_META[entry.tag]
            return (
              <li
                className="flex flex-col gap-2 border-b border-border-subtle py-4 first:pt-0 last:border-b-0 last:pb-0"
                key={entry.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <h3 className="text-base font-semibold text-fg-strong">{entry.title}</h3>
                  {entry.version ? (
                    <Badge tone="neutral" plain>
                      v{entry.version}
                    </Badge>
                  ) : null}
                </div>
                <div
                  className="prose text-sm text-fg-muted"
                  // ChangelogDesk 서버가 sanitize 한 HTML(bodyHtml). SDK 타입이 명시한다.
                  dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
                />
                {entry.publishedAt ? (
                  <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
                    <Icon name="clock" size={13} aria-hidden="true" />
                    {formatRelativeTime(entry.publishedAt)}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}
