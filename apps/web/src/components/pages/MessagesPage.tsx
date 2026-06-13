import { MESSAGE_BODY_MAX } from '@family-care/shared'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { formatRelativeIso, normalizeApiErrorMessage } from '../../domains/community/view'
import {
  fetchConversation,
  fetchConversations,
  fetchMessageRecipients,
  postConversationRead,
  postDirectMessage,
} from '../../infrastructure/api'
import { routeDefs, type AppRoute } from '../../routeConfig'
import { cn } from '../../utils/cn'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Icon,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '../ui'

import type { ProtectedNavigateState } from '../../appRoutes'
import type { ConversationDetail, ConversationSummary, MessageRecipient } from '../../types'

type MessagesPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

/** 쪽지는 비실시간이므로 폴링 주기를 보수적으로 잡는다(분당 약 7회 ≪ 레이트리밋 120). */
const POLL_INTERVAL_MS = 8000

export const MessagesPage = ({ onNavigate }: MessagesPageProps) => {
  const routeDef = routeDefs['/messages']
  const auth = useAuth()
  const myId = auth.user ? Number(auth.user.id) : null
  const location = useLocation()
  const prefill = (location.state as ProtectedNavigateState | null) ?? {}

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [recipients, setRecipients] = useState<MessageRecipient[]>([])
  const [activePartnerId, setActivePartnerId] = useState<number | null>(prefill.recipientId ?? null)
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [conversationLoading, setConversationLoading] = useState(() => Boolean(prefill.recipientId))
  const [draft, setDraft] = useState('')
  const [newRecipientId, setNewRecipientId] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pollFailed, setPollFailed] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)
  // 마운트 시점의 프리필/내 id 를 한 번만 고정한다. 초기 로드 effect 가
  // 이후 렌더의 prefill(매 렌더 새 객체)·myId 변화에 재실행되지 않도록 ref 로 캡처.
  const initialLoadRef = useRef({ prefillRecipientId: prefill.recipientId, myId })

  const refreshConversations = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      setConversations(await fetchConversations())
      setPollFailed(false)
      return true
    } catch (cause) {
      if (!options.silent) {
        setError(normalizeApiErrorMessage(cause, '쪽지함을 불러오지 못했습니다.'))
      }
      setPollFailed(true)
      return false
    } finally {
      if (!options.silent) {
        setListLoading(false)
      }
    }
  }, [])

  const loadConversations = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setListLoading(true)
      }
      return refreshConversations(options)
    },
    [refreshConversations],
  )

  const refreshConversation = useCallback(
    async (partnerId: number, options: { silent?: boolean } = {}) => {
      try {
        const detail = await fetchConversation(partnerId)
        setConversation(detail)
        setPollFailed(false)
        // 받은 쪽지를 읽음 처리하고 목록의 안 읽음 배지를 조용히 갱신한다.
        const unread = detail.messages.some(
          (message) => myId !== null && message.recipientId === myId && message.readAt === null,
        )
        if (unread) {
          await postConversationRead(partnerId)
          await refreshConversations({ silent: true })
        }
      } catch (cause) {
        if (!options.silent) {
          setConversation(null)
          setError(normalizeApiErrorMessage(cause, '대화를 불러오지 못했습니다.'))
        } else {
          setPollFailed(true)
        }
      } finally {
        if (!options.silent) {
          setConversationLoading(false)
        }
      }
    },
    [myId, refreshConversations],
  )

  const openConversation = useCallback(
    async (partnerId: number, options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setConversationLoading(true)
        setActivePartnerId(partnerId)
      }
      await refreshConversation(partnerId, options)
    },
    [refreshConversation],
  )

  // 초기 로드: 목록 + 받는 사람 후보 + (커뮤니티에서 넘어온) 프리필 대화.
  useEffect(() => {
    let cancelled = false
    fetchConversations()
      .then((next) => {
        if (cancelled) {
          return
        }
        setConversations(next)
        setPollFailed(false)
      })
      .catch((cause) => {
        if (cancelled) {
          return
        }
        setError(normalizeApiErrorMessage(cause, '쪽지함을 불러오지 못했습니다.'))
        setPollFailed(true)
      })
      .finally(() => {
        if (!cancelled) {
          setListLoading(false)
        }
      })
    fetchMessageRecipients()
      .then((next) => {
        if (!cancelled) {
          setRecipients(next)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecipients([])
        }
      })
    const { prefillRecipientId, myId: mountMyId } = initialLoadRef.current
    if (prefillRecipientId !== undefined) {
      fetchConversation(prefillRecipientId)
        .then(async (detail) => {
          if (cancelled) {
            return
          }
          setConversation(detail)
          setPollFailed(false)
          const unread = detail.messages.some(
            (message) =>
              mountMyId !== null && message.recipientId === mountMyId && message.readAt === null,
          )
          if (unread) {
            await postConversationRead(prefillRecipientId)
            const nextConversations = await fetchConversations()
            if (!cancelled) {
              setConversations(nextConversations)
            }
          }
        })
        .catch((cause) => {
          if (cancelled) {
            return
          }
          setConversation(null)
          setError(normalizeApiErrorMessage(cause, '대화를 불러오지 못했습니다.'))
        })
        .finally(() => {
          if (!cancelled) {
            setConversationLoading(false)
          }
        })
    }
    return () => {
      cancelled = true
    }
    // location.state 프리필은 마운트 시 한 번만 반영한다(값은 initialLoadRef 로 고정).
  }, [])

  // 폴링: 탭이 보일 때만 목록·활성 대화를 조용히 갱신한다(실패해도 기존 화면 유지).
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) {
        return
      }
      void loadConversations({ silent: true })
      if (activePartnerId !== null) {
        void openConversation(activePartnerId, { silent: true })
      }
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [activePartnerId, loadConversations, openConversation])

  // 새 메시지가 붙으면 로그를 맨 아래로 내린다.
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [conversation?.messages.length])

  const startNewConversation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const partnerId = Number(newRecipientId)
    if (!Number.isInteger(partnerId) || partnerId <= 0) {
      setError('받는 사람을 선택해 주세요.')
      return
    }
    setError('')
    void openConversation(partnerId)
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending || activePartnerId === null) {
      return
    }
    const body = draft.trim()
    if (!body) {
      setError('쪽지 내용을 입력해 주세요.')
      return
    }
    setSending(true)
    setError('')
    try {
      await postDirectMessage({ recipientId: activePartnerId, body })
      setDraft('')
      await openConversation(activePartnerId, { silent: true })
      await loadConversations({ silent: true })
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '쪽지를 보내지 못했습니다.'))
    } finally {
      setSending(false)
    }
  }

  const activeSummary = useMemo(
    () => conversations.find((item) => item.partnerId === activePartnerId),
    [activePartnerId, conversations],
  )
  const partnerName =
    conversation?.partnerName ?? activeSummary?.partnerName ?? prefill.recipientName ?? ''
  const newRecipientOptions = useMemo(
    () => recipients.filter((recipient) => recipient.id !== myId),
    [myId, recipients],
  )

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={routeDef.description}
        actions={
          <Button variant="secondary" onClick={() => onNavigate('/community')}>
            <Icon name="users" size={16} />
            커뮤니티로
          </Button>
        }
      />

      {error ? (
        <p className="feedback feedback-error" role="alert" aria-live="assertive">
          {error}
          <button type="button" className="inline-action" onClick={() => setError('')}>
            닫기
          </button>
        </p>
      ) : null}
      {pollFailed ? (
        <p className="feedback feedback-warning" role="status" aria-live="polite">
          새 쪽지 확인에 실패했습니다. 연결되면 자동으로 다시 갱신됩니다.
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader title="대화 목록" subtitle="가장 최근 대화부터 보여줍니다." />

          <form
            className="mb-4 flex flex-col gap-3 border-b border-border-subtle pb-4"
            onSubmit={startNewConversation}
            aria-label="새 쪽지 시작"
          >
            <Field
              label="새 쪽지 받는 사람"
              hint="커뮤니티 글의 ‘작성자에게 쪽지’로도 시작할 수 있어요."
            >
              {(field) => (
                <Select
                  {...field}
                  value={newRecipientId}
                  onChange={(event) => setNewRecipientId(event.target.value)}
                >
                  <option value="">받는 사람 선택…</option>
                  {newRecipientOptions.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Button type="submit" variant="secondary" size="sm" disabled={!newRecipientId}>
              <Icon name="plus" size={14} />
              대화 시작
            </Button>
          </form>

          {listLoading ? (
            <div className="stack-sm" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} height="3rem" radius="var(--radius-md)" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="주고받은 쪽지가 없습니다"
              description="위에서 받는 사람을 선택해 첫 쪽지를 보내 보세요."
            />
          ) : (
            <ul className="grid gap-2" aria-label="대화 목록">
              {conversations.map((item) => (
                <li key={item.partnerId}>
                  <button
                    type="button"
                    className={cn(
                      'grid w-full cursor-pointer gap-1 rounded-md border border-border-subtle bg-bg-surface p-3 text-left hover:bg-[var(--bg-hover)]',
                      activePartnerId === item.partnerId && 'border-accent bg-accent-soft',
                    )}
                    aria-current={activePartnerId === item.partnerId ? 'true' : undefined}
                    onClick={() => void openConversation(item.partnerId)}
                  >
                    <span className="flex items-baseline gap-2 text-fg-strong">
                      <strong className="text-sm break-keep">{item.partnerName}</strong>
                      <span className="ml-auto shrink-0 text-xs text-fg-subtle">
                        {formatRelativeIso(item.lastMessageAt)}
                      </span>
                    </span>
                    <span className="truncate text-sm text-fg-muted">
                      {item.lastMessagePreview}
                    </span>
                    {item.unreadCount > 0 ? (
                      <Badge tone="accent">안 읽음 {item.unreadCount}</Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {activePartnerId === null ? (
            <EmptyState
              icon="inbox"
              title="대화를 선택해 주세요"
              description="왼쪽 목록에서 대화를 고르거나 새 쪽지를 시작하면 내용이 여기에 표시됩니다."
            />
          ) : conversationLoading && !conversation ? (
            <div aria-busy="true">
              <Skeleton width="40%" height="1.2rem" />
              <div style={{ marginTop: 'var(--space-3)' }} className="stack-sm">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} height="2.4rem" radius="var(--radius-md)" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <CardHeader
                title={partnerName ? `${partnerName}님과의 대화` : '대화'}
                subtitle="쪽지는 실시간 채팅이 아니에요. 새 쪽지는 몇 초 간격으로 자동 확인됩니다."
              />
              <div
                ref={logRef}
                className="max-h-[26rem] overflow-y-auto rounded-md border border-border-subtle bg-bg-sunken p-3"
                role="log"
                aria-label={`${partnerName || '상대'}와 주고받은 쪽지`}
              >
                {conversation && conversation.messages.length > 0 ? (
                  <ul className="grid gap-3">
                    {conversation.messages.map((message) => {
                      const mine = myId !== null && message.senderId === myId
                      return (
                        <li
                          key={message.id}
                          className={cn(
                            'grid max-w-[85%] justify-items-start gap-1',
                            mine && 'justify-self-end justify-items-end',
                          )}
                        >
                          <span className="text-xs text-fg-subtle">
                            {mine ? '나' : message.senderName} ·{' '}
                            {formatRelativeIso(message.createdAt)}
                            {mine && message.readAt ? ' · 읽음' : ''}
                          </span>
                          <span
                            className={cn(
                              'whitespace-pre-line break-words rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-fg-default',
                              mine && 'border-sage-200 bg-accent-soft text-sage-700',
                            )}
                          >
                            {message.body}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="empty-desc">
                    아직 주고받은 쪽지가 없습니다. 아래에서 첫 쪽지를 보내 보세요.
                  </p>
                )}
              </div>

              <form className="composer" onSubmit={sendMessage} aria-busy={sending}>
                <Field label={`${partnerName || '상대'}에게 쪽지 보내기`} required>
                  {(field) => (
                    <Textarea
                      rows={3}
                      maxLength={MESSAGE_BODY_MAX}
                      placeholder={`쪽지 내용 (${MESSAGE_BODY_MAX}자 이내)`}
                      value={draft}
                      disabled={sending}
                      {...field}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                  )}
                </Field>
                <Button type="submit" disabled={sending || draft.trim().length === 0}>
                  <Icon name="send" size={15} />
                  {sending ? '보내는 중…' : '쪽지 보내기'}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
