import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import {
  fetchSupportThread,
  fetchSupportThreads,
  patchSupportStatus,
  postSupportMessage,
  postSupportThread,
} from '../../api'
import { useAuth } from '../../auth/useAuth'
import { formatRelativeIso, normalizeApiErrorMessage } from '../../features/community/view'
import { routeDefs, type AppRoute } from '../../routeConfig'
import type { ProtectedNavigateState } from '../../appRoutes'
import type { SupportThreadDetail, SupportThreadSummary } from '../../types'
import { cn } from '../../utils/cn'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
  Skeleton,
  Textarea,
} from '../ui'

type SupportPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

/** 상담은 응답 대기 화면이라 쪽지보다 조금 짧게 폴링한다(분당 10회 ≪ 레이트리밋 120). */
const POLL_INTERVAL_MS = 6000

export const SupportPage = ({ onNavigate }: SupportPageProps) => {
  const routeDef = routeDefs['/support']
  const auth = useAuth()
  const isStaff = auth.user?.role === 'admin'

  const [threads, setThreads] = useState<SupportThreadSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [thread, setThread] = useState<SupportThreadDetail | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [subject, setSubject] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pollFailed, setPollFailed] = useState(false)
  const logRef = useRef<HTMLDivElement | null>(null)

  const refreshThreads = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      setThreads(await fetchSupportThreads())
      setPollFailed(false)
    } catch (cause) {
      if (!options.silent) {
        setError(normalizeApiErrorMessage(cause, '상담 목록을 불러오지 못했습니다.'))
      }
      setPollFailed(true)
    } finally {
      if (!options.silent) {
        setListLoading(false)
      }
    }
  }, [])

  const loadThreads = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setListLoading(true)
      }
      await refreshThreads(options)
    },
    [refreshThreads]
  )

  const openThread = useCallback(async (threadId: number, options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setThreadLoading(true)
      setActiveThreadId(threadId)
    }
    try {
      setThread(await fetchSupportThread(threadId))
      setPollFailed(false)
    } catch (cause) {
      if (!options.silent) {
        setThread(null)
        setError(normalizeApiErrorMessage(cause, '상담 내용을 불러오지 못했습니다.'))
      } else {
        setPollFailed(true)
      }
    } finally {
      if (!options.silent) {
        setThreadLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchSupportThreads()
      .then((next) => {
        if (cancelled) {
          return
        }
        setThreads(next)
        setPollFailed(false)
      })
      .catch((cause) => {
        if (cancelled) {
          return
        }
        setError(normalizeApiErrorMessage(cause, '상담 목록을 불러오지 못했습니다.'))
        setPollFailed(true)
      })
      .finally(() => {
        if (!cancelled) {
          setListLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 폴링: 탭이 보일 때만 목록·활성 상담을 조용히 갱신한다(실패해도 기존 화면 유지).
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) {
        return
      }
      void loadThreads({ silent: true })
      if (activeThreadId !== null) {
        void openThread(activeThreadId, { silent: true })
      }
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [activeThreadId, loadThreads, openThread])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [thread?.messages.length])

  const createThread = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) {
      return
    }
    if (!subject.trim() || !firstMessage.trim()) {
      setError('상담 제목과 내용을 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await postSupportThread({
        subject: subject.trim(),
        message: firstMessage.trim(),
      })
      setSubject('')
      setFirstMessage('')
      setCreating(false)
      setActiveThreadId(created.id)
      setThread(created)
      await loadThreads({ silent: true })
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '상담을 시작하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || activeThreadId === null) {
      return
    }
    const body = draft.trim()
    if (!body) {
      setError('메시지 내용을 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await postSupportMessage(activeThreadId, { body })
      setDraft('')
      await openThread(activeThreadId, { silent: true })
      await loadThreads({ silent: true })
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '메시지를 보내지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async () => {
    if (busy || !thread) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await patchSupportStatus(thread.id, thread.status === 'open' ? 'closed' : 'open')
      await openThread(thread.id, { silent: true })
      await loadThreads({ silent: true })
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '상담 상태를 변경하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const statusBadge = (status: 'open' | 'closed') =>
    status === 'open' ? (
      <Badge tone="success" plain>
        진행 중
      </Badge>
    ) : (
      <Badge tone="neutral" plain>
        종료됨
      </Badge>
    )

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={
          isStaff
            ? '운영팀 보기: 모든 회원의 상담 요청을 확인하고 답변합니다.'
            : routeDef.description
        }
        actions={
          !isStaff ? (
            <Button onClick={() => setCreating((value) => !value)}>
              <Icon name="plus" size={16} />
              {creating ? '작성 닫기' : '새 상담 시작'}
            </Button>
          ) : undefined
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
          새 답변 확인에 실패했습니다. 연결되면 자동으로 다시 갱신됩니다.
        </p>
      ) : null}

      {creating && !isStaff ? (
        <Card>
          <CardHeader
            title="새 상담 시작"
            subtitle="운영팀이 확인 후 이 화면에서 바로 답변드립니다."
          />
          <form className="stack-sm" onSubmit={createThread} aria-busy={busy}>
            <Field label="상담 제목" required>
              {(field) => (
                <Input
                  type="text"
                  maxLength={80}
                  placeholder="예: 간병인 교체 절차 문의"
                  value={subject}
                  disabled={busy}
                  {...field}
                  onChange={(event) => setSubject(event.target.value)}
                />
              )}
            </Field>
            <Field label="상담 내용" required>
              {(field) => (
                <Textarea
                  rows={4}
                  maxLength={2000}
                  placeholder="궁금하신 내용을 자세히 적어 주세요. (2000자 이내)"
                  value={firstMessage}
                  disabled={busy}
                  {...field}
                  onChange={(event) => setFirstMessage(event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" disabled={busy || !subject.trim() || !firstMessage.trim()}>
              {busy ? '접수 중…' : '상담 접수'}
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader
            title={isStaff ? '전체 상담' : '내 상담'}
            subtitle="최근 메시지가 있는 상담부터 보여줍니다."
          />
          {listLoading ? (
            <div className="stack-sm" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} height="3rem" radius="var(--radius-md)" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              icon="chat"
              title={isStaff ? '접수된 상담이 없습니다' : '진행 중인 상담이 없습니다'}
              description={
                isStaff
                  ? '회원이 상담을 접수하면 이 목록에 표시됩니다.'
                  : '궁금한 점이 있다면 새 상담을 시작해 보세요. 운영팀이 답변드립니다.'
              }
              action={
                !isStaff ? (
                  <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
                    <Icon name="plus" size={14} />새 상담 시작
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid gap-2" aria-label="상담 목록">
              {threads.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'grid w-full cursor-pointer gap-1 rounded-md border border-border-subtle bg-bg-surface p-3 text-left hover:bg-[var(--bg-hover)]',
                      activeThreadId === item.id && 'border-accent bg-accent-soft'
                    )}
                    aria-current={activeThreadId === item.id ? 'true' : undefined}
                    onClick={() => void openThread(item.id)}
                  >
                    <span className="flex items-baseline gap-2 text-fg-strong">
                      <strong className="text-sm break-keep">{item.subject}</strong>
                      <span className="ml-auto shrink-0 text-xs text-fg-subtle">
                        {formatRelativeIso(item.lastMessageAt)}
                      </span>
                    </span>
                    <span className="truncate text-sm text-fg-muted">
                      {item.lastMessagePreview}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-fg-subtle">
                      {statusBadge(item.status)}
                      {isStaff ? <span>{item.userName}</span> : null}
                      <span>메시지 {item.messageCount}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {activeThreadId === null ? (
            <EmptyState
              icon="chat"
              title="상담을 선택해 주세요"
              description={
                isStaff
                  ? '왼쪽 목록에서 상담을 선택하면 대화 내용이 표시됩니다.'
                  : '왼쪽 목록에서 상담을 고르거나 새 상담을 시작해 보세요.'
              }
            />
          ) : threadLoading && !thread ? (
            <div aria-busy="true">
              <Skeleton width="50%" height="1.2rem" />
              <div style={{ marginTop: 'var(--space-3)' }} className="stack-sm">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} height="2.4rem" radius="var(--radius-md)" />
                ))}
              </div>
            </div>
          ) : thread ? (
            <>
              <CardHeader
                title={thread.subject}
                subtitle={
                  <>
                    {statusBadge(thread.status)} {thread.userName} ·{' '}
                    {formatRelativeIso(thread.createdAt)} 시작
                  </>
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void toggleStatus()}
                  >
                    {thread.status === 'open' ? '상담 종료' : '상담 다시 열기'}
                  </Button>
                }
              />

              <div
                ref={logRef}
                className="max-h-[26rem] overflow-y-auto rounded-md border border-border-subtle bg-bg-sunken p-3"
                role="log"
                aria-label={`상담 대화: ${thread.subject}`}
              >
                <ul className="grid gap-3">
                  {thread.messages.map((message) => {
                    const mine = message.senderRole === (isStaff ? 'staff' : 'user')
                    return (
                      <li
                        key={message.id}
                        className={cn(
                          'grid max-w-[85%] justify-items-start gap-1',
                          mine && 'justify-self-end justify-items-end'
                        )}
                      >
                        <span className="text-xs text-fg-subtle">
                          {message.senderRole === 'staff'
                            ? `운영팀 ${message.senderName}`
                            : message.senderName}{' '}
                          · {formatRelativeIso(message.createdAt)}
                        </span>
                        <span
                          className={cn(
                            'whitespace-pre-line break-words rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-fg-default',
                            mine && 'border-sage-200 bg-accent-soft text-sage-700'
                          )}
                        >
                          {message.body}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {thread.status === 'open' ? (
                <form className="composer" onSubmit={sendMessage} aria-busy={busy}>
                  <Field label={isStaff ? '운영팀 답변 보내기' : '메시지 보내기'} required>
                    {(field) => (
                      <Textarea
                        rows={3}
                        maxLength={2000}
                        placeholder="메시지 내용 (2000자 이내)"
                        value={draft}
                        disabled={busy}
                        {...field}
                        onChange={(event) => setDraft(event.target.value)}
                      />
                    )}
                  </Field>
                  <Button type="submit" disabled={busy || draft.trim().length === 0}>
                    <Icon name="send" size={15} />
                    {busy ? '보내는 중…' : '보내기'}
                  </Button>
                </form>
              ) : (
                <p className="feedback feedback-warning" role="status">
                  종료된 상담입니다. 추가 문의가 있다면 상담을 다시 열거나 새 상담을 시작해 주세요.
                </p>
              )}
            </>
          ) : null}
        </Card>
      </div>

      {!isStaff ? (
        <p className="page-desc">
          긴 정보 공유나 다른 보호자들의 의견이 필요하다면{' '}
          <button type="button" className="inline-action" onClick={() => onNavigate('/community')}>
            커뮤니티 게시판
          </button>
          도 함께 활용해 보세요.
        </p>
      ) : null}
    </div>
  )
}
