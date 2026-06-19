import { useEffect, useRef, useState, type FormEvent } from 'react'

import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_HINTS,
  INQUIRY_CATEGORY_LABELS,
  INQUIRY_STATUS_LABELS,
  listInquiries,
  submitInquiry,
  type Inquiry,
  type InquiryCategory,
  type InquiryStatus,
} from '../../lib/inquiryApi'
import { routeDefs, type AppRoute } from '../../routeConfig'
import { cn } from '../../utils/cn'
import {
  type BadgeTone,
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

import type { ProtectedNavigateState } from '../../appRoutes'

type InquiryPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

const TITLE_MAX = 120
const BODY_MAX = 4000
const NAME_MAX = 80

/** 상태 뱃지 톤 매핑(진행도에 따라 디자인 토큰 톤을 고른다). */
const STATUS_TONE: Record<InquiryStatus, BadgeTone> = {
  new: 'info',
  in_progress: 'accent',
  resolved: 'success',
  closed: 'neutral',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** ISO 날짜를 간단한 상대 표기로. 1주 이상은 YYYY.MM.DD 절대 표기로 폴백. */
function shortRelativeDate(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) {
    return ''
  }
  const diffMs = Date.now() - then.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) {
    return '방금'
  }
  if (minutes < 60) {
    return `${minutes}분 전`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}시간 전`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}일 전`
  }
  return then.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} plain>
      {INQUIRY_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  return (
    <article className="grid gap-2 rounded-md border border-border-subtle bg-bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral" plain>
          {INQUIRY_CATEGORY_LABELS[inquiry.category] ?? inquiry.category}
        </Badge>
        <StatusBadge status={inquiry.status} />
        <span className="ml-auto shrink-0 text-xs text-fg-subtle">
          {shortRelativeDate(inquiry.createdAt)}
        </span>
      </div>
      <h3 className="text-sm font-semibold break-keep text-fg-strong">{inquiry.title}</h3>
      <p className="line-clamp-3 text-sm leading-6 break-words text-fg-muted">{inquiry.body}</p>
      <p className="text-xs text-fg-subtle">{inquiry.authorName?.trim() || '익명'}</p>
    </article>
  )
}

type BoardState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; items: Inquiry[] }

function InquiryBoard() {
  const [state, setState] = useState<BoardState>({ phase: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  // 부모가 boardKey(remount)로 새 문의 등록 후 재조회를 처리한다. 여기서는 수동 새로고침만 관리.
  useEffect(() => {
    const controller = new AbortController()
    listInquiries(20, 0, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) {
          return
        }
        setState({ phase: 'ready', items: list.items })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : '문의 목록을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [reloadKey])

  const loading = state.phase === 'loading'
  const reload = () => {
    setState({ phase: 'loading' })
    setReloadKey((value) => value + 1)
  }

  return (
    <Card>
      <CardHeader
        title="최근 문의"
        subtitle="등록된 문의는 이 게시판에 공개로 표시됩니다."
        action={
          <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
            <Icon name="refresh" size={14} />
            새로고침
          </Button>
        }
      />

      <div aria-live="polite" aria-busy={loading}>
        {state.phase === 'loading' ? (
          <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height="7rem" radius="var(--radius-md)" />
            ))}
          </div>
        ) : state.phase === 'error' ? (
          <div className="grid gap-3">
            <p className="feedback feedback-error" role="alert">
              {state.message}
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={reload}>
                <Icon name="refresh" size={14} />
                다시 시도
              </Button>
            </div>
          </div>
        ) : state.items.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="아직 등록된 문의가 없습니다"
            description="첫 문의를 남겨 주세요. 등록된 문의는 이 게시판에 공개로 표시됩니다."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="공개 문의 목록">
            {state.items.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryCard inquiry={inquiry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

export const InquiryPage = ({ onNavigate }: InquiryPageProps) => {
  const routeDef = routeDefs['/inquiry']
  const [category, setCategory] = useState<InquiryCategory>('usage')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('') // 허니팟 — 사람은 채우지 않는다.
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // 새 문의를 등록하면 게시판을 remount해 다시 불러오기 위한 키.
  const [boardKey, setBoardKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // 라우트 진입 시 페이지 제목으로 포커스를 옮긴다(스크린리더 컨텍스트 + 키보드 시작점).
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const validate = (): string | null => {
    if (!title.trim()) {
      return '제목을 입력해 주세요.'
    }
    if (title.trim().length > TITLE_MAX) {
      return `제목은 ${TITLE_MAX}자 이하로 입력해 주세요.`
    }
    if (!body.trim()) {
      return '내용을 입력해 주세요.'
    }
    if (body.trim().length > BODY_MAX) {
      return `내용은 ${BODY_MAX}자 이하로 입력해 주세요.`
    }
    if (authorName.trim().length > NAME_MAX) {
      return `이름은 ${NAME_MAX}자 이하로 입력해 주세요.`
    }
    if (contactEmail.trim() && !EMAIL_PATTERN.test(contactEmail.trim())) {
      return '올바른 이메일 형식을 입력해 주세요.'
    }
    return null
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setAuthorName('')
    setContactEmail('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitted(false)

    // 허니팟이 채워졌으면 봇으로 간주하고 조용히 성공 처리한다(서버도 무음).
    if (website.trim()) {
      setSubmitted(true)
      resetForm()
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await submitInquiry({
        category,
        title: title.trim(),
        body: body.trim(),
        authorName: authorName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      })
      setSubmitted(true)
      resetForm()
      setBoardKey((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={
          <span ref={headingRef} tabIndex={-1} className="outline-none">
            {routeDef.title}
          </span>
        }
        description="제휴·버그·의견·이용 문의를 남겨 주세요. 접수된 문의는 아래 게시판에 공개로 표시되며, 운영자가 확인 후 상태를 업데이트합니다."
        actions={
          <Button variant="secondary" onClick={() => onNavigate('/support')}>
            <Icon name="chat" size={16} />
            1:1 상담으로
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="문의 남기기"
          subtitle="카테고리를 고르고 제목과 내용을 작성하세요. 이름·이메일은 선택 사항입니다."
        />

        {submitted ? (
          <div className="grid gap-3" role="status">
            <p className="feedback feedback-loading">
              문의가 접수되었습니다. 아래 게시판에서 확인할 수 있으며, 운영자가 확인 후 상태를
              업데이트합니다.
            </p>
            <div>
              <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                <Icon name="plus" size={14} />
                문의 더 남기기
              </Button>
            </div>
          </div>
        ) : (
          <form className="stack-sm" onSubmit={handleSubmit} aria-busy={submitting} noValidate>
            <fieldset className="grid gap-2 border-0 p-0">
              <legend className="field-label">카테고리</legend>
              <div className="flex flex-wrap gap-2">
                {INQUIRY_CATEGORIES.map((value) => {
                  const selected = value === category
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      title={INQUIRY_CATEGORY_HINTS[value]}
                      onClick={() => setCategory(value)}
                      className={cn(
                        'cursor-pointer rounded-md border px-3 py-1.5 text-sm font-semibold',
                        selected
                          ? 'border-accent bg-accent-soft text-accent-soft-fg'
                          : 'border-border-subtle bg-bg-surface text-fg-muted hover:bg-[var(--bg-hover)]'
                      )}
                    >
                      {INQUIRY_CATEGORY_LABELS[value]}
                    </button>
                  )
                })}
              </div>
              <p className="field-hint">{INQUIRY_CATEGORY_HINTS[category]}</p>
            </fieldset>

            <Field label={`제목 (${title.length}/${TITLE_MAX})`} required>
              {(field) => (
                <Input
                  type="text"
                  maxLength={TITLE_MAX}
                  placeholder="문의 제목을 한 줄로 적어 주세요"
                  value={title}
                  disabled={submitting}
                  {...field}
                  onChange={(event) => setTitle(event.target.value)}
                />
              )}
            </Field>

            <Field label={`내용 (${body.length}/${BODY_MAX})`} required>
              {(field) => (
                <Textarea
                  rows={6}
                  maxLength={BODY_MAX}
                  placeholder="문의 내용을 자세히 적어 주세요. 버그 신고라면 재현 방법과 환경을 함께 알려 주시면 빠르게 확인할 수 있습니다."
                  value={body}
                  disabled={submitting}
                  {...field}
                  onChange={(event) => setBody(event.target.value)}
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="이름 (선택)" hint="게시판에 표시될 이름">
                {(field) => (
                  <Input
                    type="text"
                    maxLength={NAME_MAX}
                    autoComplete="name"
                    placeholder="익명"
                    value={authorName}
                    disabled={submitting}
                    {...field}
                    onChange={(event) => setAuthorName(event.target.value)}
                  />
                )}
              </Field>
              <Field label="이메일 (선택)" hint="답변 받을 이메일 (비공개)">
                {(field) => (
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={contactEmail}
                    disabled={submitting}
                    {...field}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                )}
              </Field>
            </div>

            {/* 허니팟: 스크린리더·일반 사용자에게 숨김. 봇이 채우면 무음 처리. */}
            <div aria-hidden="true" className="sr-only">
              <label htmlFor="inquiry-website">웹사이트(입력하지 마세요)</label>
              <input
                id="inquiry-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            {/* 검증/등록 에러는 aria-live로 announce. */}
            {error ? (
              <p className="feedback feedback-error" role="alert" aria-live="assertive">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={submitting}>
                <Icon name="send" size={15} />
                {submitting ? '접수 중…' : '문의 접수'}
              </Button>
              <span className="text-xs text-fg-subtle">이메일은 비공개로 운영자만 확인합니다.</span>
            </div>
          </form>
        )}
      </Card>

      <InquiryBoard key={boardKey} />
    </div>
  )
}
