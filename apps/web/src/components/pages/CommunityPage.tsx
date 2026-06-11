import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { COMMUNITY_ATTACHMENT_MAX_COUNT, type CommunityAttachmentInput } from '@family-care/shared'

import {
  deleteCommunityAttachment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityPost,
  fetchCommunityPosts,
  patchCommunityVisibility,
  postCommunityComment,
  postCommunityPost,
} from '../../api'
import { useAuth } from '../../auth/useAuth'
import {
  ATTACHMENT_ACCEPT,
  attachmentErrorMessage,
  fileToAttachmentInput,
  formatByteSize,
} from '../../features/community/attachment'
import {
  communityCategories,
  communityPostFormSchema,
  type CommunityPostFormValues,
} from '../../features/community/schema'
import {
  buildCommentThreads,
  formatRelativeIso,
  normalizeApiErrorMessage,
  visibleCommentCount,
} from '../../features/community/view'
import { routeDefs, type AppRoute } from '../../routeConfig'
import type { ProtectedNavigateState } from '../../appRoutes'
import type { CommunityComment, CommunityPostDetail, CommunityPostSummary } from '../../types'
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
  Select,
  Skeleton,
  SkeletonLines,
  Textarea,
} from '../ui'

type CommunityPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

const CATEGORY_FILTERS = ['전체', ...communityCategories] as const
type CategoryFilter = (typeof CATEGORY_FILTERS)[number]

/** 댓글 한 건(삭제 placeholder 포함) 렌더. */
const CommentBody = ({ comment }: { comment: CommunityComment }) =>
  comment.deleted ? (
    <p className="comment-deleted">삭제된 댓글입니다.</p>
  ) : (
    <p className="comment-body">{comment.body}</p>
  )

export const CommunityPage = ({ onNavigate }: CommunityPageProps) => {
  const routeDef = routeDefs['/community']
  const auth = useAuth()
  const myId = auth.user ? Number(auth.user.id) : null
  const isAdmin = auth.user?.role === 'admin'

  /* ---- 목록 상태 ---- */
  const [posts, setPosts] = useState<CommunityPostSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('전체')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  /* ---- 상세 상태 ---- */
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<CommunityPostDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  /* ---- 작성/댓글 상태 ---- */
  const [composing, setComposing] = useState(false)
  const [attachments, setAttachments] = useState<CommunityAttachmentInput[]>([])
  const [attachmentBusy, setAttachmentBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null)
  const [commentBusy, setCommentBusy] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  // window.confirm 금지 컨벤션 — 글 삭제는 2단계 인라인 확인으로 처리한다.
  const [confirmingPostDelete, setConfirmingPostDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CommunityPostFormValues>({
    resolver: zodResolver(communityPostFormSchema),
    defaultValues: { category: '정보공유', title: '', body: '' },
    mode: 'onChange',
  })

  const loadPosts = useCallback(
    async (filter: { category: CategoryFilter; q: string }, options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setListLoading(true)
      }
      try {
        const next = await fetchCommunityPosts({
          category: filter.category === '전체' ? undefined : filter.category,
          q: filter.q || undefined,
        })
        setPosts(next)
        setError('')
        return next
      } catch (cause) {
        setError(normalizeApiErrorMessage(cause, '게시글을 불러오지 못했습니다.'))
        return null
      } finally {
        setListLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadPosts({ category, q: appliedQuery })
  }, [appliedQuery, category, loadPosts])

  const openPost = useCallback(async (postId: number) => {
    setSelectedId(postId)
    setComposing(false)
    setReplyTo(null)
    setCommentDraft('')
    setConfirmingPostDelete(false)
    setDetailLoading(true)
    try {
      setDetail(await fetchCommunityPost(postId))
      setError('')
    } catch (cause) {
      setDetail(null)
      setError(normalizeApiErrorMessage(cause, '게시글을 불러오지 못했습니다.'))
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const refreshAfterMutation = useCallback(
    async (postId: number | null) => {
      await loadPosts({ category, q: appliedQuery }, { silent: true })
      if (postId !== null) {
        try {
          setDetail(await fetchCommunityPost(postId))
        } catch {
          setDetail(null)
          setSelectedId(null)
        }
      }
    },
    [appliedQuery, category, loadPosts],
  )

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedQuery(searchInput.trim())
  }

  /* ---- 첨부 선택 ---- */
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    setAttachmentBusy(true)
    setError('')
    try {
      let count = attachments.length
      const accepted: CommunityAttachmentInput[] = []
      for (const file of Array.from(files)) {
        const message = attachmentErrorMessage(file, count)
        if (message) {
          setError(message)
          continue
        }
        try {
          accepted.push(await fileToAttachmentInput(file))
          count += 1
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : '파일을 처리하지 못했습니다.')
        }
      }
      if (accepted.length > 0) {
        setAttachments((prev) => [...prev, ...accepted])
      }
    } finally {
      setAttachmentBusy(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const submitPost = handleSubmit(async (values) => {
    if (submitting) {
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const created = await postCommunityPost({ ...values, attachments })
      reset({ category: '정보공유', title: '', body: '' })
      setAttachments([])
      setComposing(false)
      setNotice('게시글이 등록되었습니다.')
      setSelectedId(created.id)
      setDetail(created)
      await loadPosts({ category, q: appliedQuery }, { silent: true })
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '게시글 등록에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  })

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail || commentBusy) {
      return
    }
    const body = commentDraft.trim()
    if (!body) {
      setError('댓글 내용을 입력해 주세요.')
      return
    }
    setCommentBusy(true)
    setError('')
    try {
      await postCommunityComment(detail.id, { body, parentId: replyTo ? replyTo.id : null })
      setCommentDraft('')
      setReplyTo(null)
      setNotice(replyTo ? '답글이 등록되었습니다.' : '댓글이 등록되었습니다.')
      await refreshAfterMutation(detail.id)
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '댓글 등록에 실패했습니다.'))
    } finally {
      setCommentBusy(false)
    }
  }

  const runAction = async (
    action: () => Promise<unknown>,
    doneMessage: string,
    postIdForRefresh: number | null,
  ): Promise<boolean> => {
    if (actionBusy) {
      return false
    }
    setActionBusy(true)
    setError('')
    try {
      await action()
      setNotice(doneMessage)
      await refreshAfterMutation(postIdForRefresh)
      return true
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '요청을 처리하지 못했습니다.'))
      return false
    } finally {
      setActionBusy(false)
    }
  }

  const commentThreads = useMemo(
    () => (detail ? buildCommentThreads(detail.comments) : []),
    [detail],
  )

  const canModerate = (authorId: number) => isAdmin || (myId !== null && authorId === myId)

  const messageAuthor = (authorId: number, authorName: string) => {
    onNavigate('/messages', {
      recipientId: authorId,
      recipientName: authorName,
      source: 'community',
    })
  }

  const composeForm = (
    <Card>
      <CardHeader
        title="새 글 쓰기"
        subtitle="정보공유·질문·간병후기 중 카테고리를 골라 작성하세요. 이미지(긴 변 1600px 자동 축소)와 PDF를 파일당 2MB까지 첨부할 수 있습니다."
        action={
          <button type="button" className="card-link" onClick={() => setComposing(false)}>
            닫기
          </button>
        }
      />
      <form className="stack-sm" onSubmit={submitPost} noValidate aria-busy={submitting}>
        <Field label="카테고리" required>
          {(field) => (
            <Select disabled={submitting} {...field} {...register('category')}>
              {communityCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="제목" required error={errors.title?.message}>
          {(field) => (
            <Input
              type="text"
              maxLength={80}
              placeholder="예: 방문 요양 신청 절차 정리"
              disabled={submitting}
              {...field}
              {...register('title')}
            />
          )}
        </Field>
        <Field label="내용" required error={errors.body?.message}>
          {(field) => (
            <Textarea
              rows={6}
              maxLength={4000}
              placeholder="다른 보호자/간병인에게 나누고 싶은 내용을 적어 주세요."
              disabled={submitting}
              {...field}
              {...register('body')}
            />
          )}
        </Field>

        <Field
          label="첨부 파일"
          hint={`이미지(jpeg/png/webp)·PDF, 파일당 2MB, 최대 ${COMMUNITY_ATTACHMENT_MAX_COUNT}개`}
        >
          {(field) => (
            <input
              {...field}
              ref={fileInputRef}
              className="input"
              type="file"
              accept={ATTACHMENT_ACCEPT}
              multiple
              disabled={
                submitting || attachmentBusy || attachments.length >= COMMUNITY_ATTACHMENT_MAX_COUNT
              }
              onChange={(event) => void handleFiles(event.target.files)}
            />
          )}
        </Field>
        {attachmentBusy ? (
          <p className="field-hint" role="status">
            파일을 처리하는 중입니다…
          </p>
        ) : null}

        {attachments.length > 0 ? (
          <ul className="attach-grid" aria-label="첨부 목록">
            {attachments.map((attachment, index) => (
              <li key={`${attachment.name}-${index}`} className="attach-item">
                {attachment.mimeType === 'application/pdf' ? (
                  <span className="attach-chip">
                    <Icon name="paperclip" size={14} />
                    PDF
                  </span>
                ) : (
                  <img
                    className="attach-thumb"
                    src={attachment.dataUrl}
                    alt={`첨부 미리보기: ${attachment.name}`}
                  />
                )}
                <span className="attach-name">{attachment.name}</span>
                <button
                  type="button"
                  className="inline-action"
                  aria-label={`${attachment.name} 첨부 제거`}
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <Button type="submit" block disabled={submitting || attachmentBusy || !isValid}>
          {submitting ? '등록 중…' : '게시글 등록'}
        </Button>
      </form>
    </Card>
  )

  const detailCard = !selectedId ? (
    <Card>
      <EmptyState
        icon="users"
        title="글을 선택해 주세요"
        description="왼쪽 목록에서 글을 선택하면 본문과 댓글이 여기에 표시됩니다."
        action={
          <Button variant="secondary" size="sm" onClick={() => setComposing(true)}>
            <Icon name="plus" size={14} />첫 글 쓰기
          </Button>
        }
      />
    </Card>
  ) : detailLoading || !detail ? (
    <Card aria-busy="true">
      <Skeleton width="55%" height="1.3rem" />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <SkeletonLines lines={5} />
      </div>
    </Card>
  ) : (
    <Card>
      <article aria-label={`게시글: ${detail.title}`}>
        <div className="board-detail-head">
          <div className="board-detail-meta">
            <Badge tone="accent" plain>
              {detail.category}
            </Badge>
            {detail.hidden ? (
              <Badge tone="warn" plain>
                숨김 처리됨
              </Badge>
            ) : null}
          </div>
          <h2 className="board-detail-title">{detail.title}</h2>
          <p className="board-detail-byline">
            {detail.authorName} · {formatRelativeIso(detail.createdAt)}
          </p>
        </div>

        <p className="board-detail-body">{detail.body}</p>

        {detail.attachments.length > 0 ? (
          <section aria-label="첨부 파일" className="stack-sm">
            <h3 className="board-section-title">
              <Icon name="paperclip" size={14} /> 첨부 {detail.attachments.length}개
            </h3>
            <ul className="attach-grid">
              {detail.attachments.map((attachment) => (
                <li key={attachment.id} className="attach-item">
                  {attachment.kind === 'image' ? (
                    <img
                      className="attach-preview"
                      src={attachment.dataUrl}
                      alt={`첨부 이미지: ${attachment.name}`}
                    />
                  ) : (
                    <a className="attach-chip" href={attachment.dataUrl} download={attachment.name}>
                      <Icon name="paperclip" size={14} />
                      {attachment.name} 내려받기
                    </a>
                  )}
                  <span className="attach-name">
                    {attachment.name} · {formatByteSize(attachment.size)}
                  </span>
                  {canModerate(detail.authorId) ? (
                    <button
                      type="button"
                      className="inline-action"
                      disabled={actionBusy}
                      aria-label={`${attachment.name} 첨부 삭제`}
                      onClick={() =>
                        void runAction(
                          () => deleteCommunityAttachment(detail.id, attachment.id),
                          '첨부를 삭제했습니다.',
                          detail.id,
                        )
                      }
                    >
                      삭제
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="board-actions" role="group" aria-label="게시글 동작">
          {myId !== null && detail.authorId !== myId ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => messageAuthor(detail.authorId, detail.authorName)}
            >
              <Icon name="inbox" size={14} />
              작성자에게 쪽지
            </Button>
          ) : null}
          {isAdmin ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={actionBusy}
              onClick={() =>
                void runAction(
                  () => patchCommunityVisibility(detail.id, !detail.hidden),
                  detail.hidden ? '게시글을 복구했습니다.' : '게시글을 숨겼습니다.',
                  detail.id,
                )
              }
            >
              <Icon name="shield" size={14} />
              {detail.hidden ? '게시글 복구' : '게시글 숨김'}
            </Button>
          ) : null}
          {canModerate(detail.authorId) && !confirmingPostDelete ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionBusy}
              onClick={() => setConfirmingPostDelete(true)}
            >
              <Icon name="trash" size={14} />글 삭제
            </Button>
          ) : null}
        </div>

        {confirmingPostDelete ? (
          <div className="feedback feedback-warning confirm-bar" role="alert">
            <span>이 글을 삭제할까요? 댓글도 함께 삭제되며 되돌릴 수 없습니다.</span>
            <span className="confirm-bar-actions">
              <Button
                variant="primary"
                size="sm"
                disabled={actionBusy}
                onClick={() => {
                  void (async () => {
                    const deleted = await runAction(
                      () => deleteCommunityPost(detail.id),
                      '게시글을 삭제했습니다.',
                      null,
                    )
                    if (deleted) {
                      setSelectedId(null)
                      setDetail(null)
                      setConfirmingPostDelete(false)
                    }
                  })()
                }}
              >
                삭제 확정
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={actionBusy}
                onClick={() => setConfirmingPostDelete(false)}
              >
                취소
              </Button>
            </span>
          </div>
        ) : null}
      </article>

      <section aria-label="댓글" className="comment-section">
        <h3 className="board-section-title">댓글 {visibleCommentCount(detail.comments)}개</h3>

        {commentThreads.length === 0 ? (
          <p className="empty-desc">아직 댓글이 없습니다. 첫 의견을 남겨 보세요.</p>
        ) : (
          <ul className="comment-list">
            {commentThreads.map(({ comment, replies }) => (
              <li key={comment.id} className="comment-item">
                <div className="comment-head">
                  <strong>{comment.authorName}</strong>
                  <span className="comment-time">{formatRelativeIso(comment.createdAt)}</span>
                </div>
                <CommentBody comment={comment} />
                <div className="comment-actions">
                  {!comment.deleted ? (
                    <button
                      type="button"
                      className="inline-action"
                      onClick={() => setReplyTo(replyTo?.id === comment.id ? null : comment)}
                    >
                      {replyTo?.id === comment.id ? '답글 취소' : '답글'}
                    </button>
                  ) : null}
                  {!comment.deleted && canModerate(comment.authorId) ? (
                    <button
                      type="button"
                      className="inline-action"
                      disabled={actionBusy}
                      onClick={() =>
                        void runAction(
                          () => deleteCommunityComment(comment.id),
                          '댓글을 삭제했습니다.',
                          detail.id,
                        )
                      }
                    >
                      삭제
                    </button>
                  ) : null}
                </div>

                {replies.length > 0 ? (
                  <ul className="comment-replies">
                    {replies.map((reply) => (
                      <li key={reply.id} className="comment-item comment-item--reply">
                        <div className="comment-head">
                          <strong>{reply.authorName}</strong>
                          <span className="comment-time">{formatRelativeIso(reply.createdAt)}</span>
                        </div>
                        <CommentBody comment={reply} />
                        {!reply.deleted && canModerate(reply.authorId) ? (
                          <div className="comment-actions">
                            <button
                              type="button"
                              className="inline-action"
                              disabled={actionBusy}
                              onClick={() =>
                                void runAction(
                                  () => deleteCommunityComment(reply.id),
                                  '답글을 삭제했습니다.',
                                  detail.id,
                                )
                              }
                            >
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form className="stack-sm" onSubmit={submitComment} aria-busy={commentBusy}>
          {replyTo ? (
            <p className="feedback feedback-loading" role="status">
              <Icon name="arrow-right" size={14} /> {replyTo.authorName}님의 댓글에 답글 작성 중
              <button type="button" className="inline-action" onClick={() => setReplyTo(null)}>
                취소
              </button>
            </p>
          ) : null}
          <Field label={replyTo ? '답글 내용' : '새 댓글'} required>
            {(field) => (
              <Textarea
                rows={3}
                maxLength={1000}
                placeholder="따뜻한 정보와 경험을 나눠 주세요. (1000자 이내)"
                value={commentDraft}
                disabled={commentBusy}
                {...field}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
            )}
          </Field>
          <Button
            type="submit"
            size="sm"
            disabled={commentBusy || commentDraft.trim().length === 0}
          >
            {commentBusy ? '등록 중…' : replyTo ? '답글 등록' : '댓글 등록'}
          </Button>
        </form>
      </section>
    </Card>
  )

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={routeDef.description}
        actions={
          <Button onClick={() => setComposing((value) => !value)}>
            <Icon name="plus" size={16} />
            {composing ? '작성 닫기' : '새 글 쓰기'}
          </Button>
        }
      />

      {notice ? (
        <p className="feedback feedback-loading" role="status" aria-live="polite">
          {notice}
          <button type="button" className="inline-action" onClick={() => setNotice('')}>
            닫기
          </button>
        </p>
      ) : null}
      {error ? (
        <p className="feedback feedback-error" role="alert" aria-live="assertive">
          {error}
          <button type="button" className="inline-action" onClick={() => setError('')}>
            닫기
          </button>
        </p>
      ) : null}

      <div className="board-layout">
        <Card>
          <CardHeader title="게시글" subtitle="보호자·간병인이 함께 쓰는 공간입니다." />

          <form
            className="board-toolbar"
            role="search"
            aria-label="게시글 검색"
            onSubmit={submitSearch}
          >
            <Input
              type="search"
              placeholder="제목·내용·작성자 검색"
              aria-label="게시글 검색어"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit" variant="secondary" size="sm">
              검색
            </Button>
          </form>

          <div className="board-filters" role="group" aria-label="카테고리 필터">
            {CATEGORY_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className={`board-filter ${category === option ? 'is-active' : ''}`}
                aria-pressed={category === option}
                onClick={() => setCategory(option)}
              >
                {option}
              </button>
            ))}
          </div>

          {listLoading ? (
            <div className="stack-sm" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height="3.4rem" radius="var(--radius-md)" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="users"
              title={
                appliedQuery || category !== '전체'
                  ? '조건에 맞는 글이 없습니다'
                  : '아직 게시글이 없습니다'
              }
              description={
                appliedQuery || category !== '전체'
                  ? '검색어를 줄이거나 카테고리를 바꿔 보세요.'
                  : '첫 글을 작성해 커뮤니티를 시작해 보세요.'
              }
              action={
                <Button variant="secondary" size="sm" onClick={() => setComposing(true)}>
                  <Icon name="plus" size={14} />새 글 쓰기
                </Button>
              }
            />
          ) : (
            <ul className="board-list" aria-label="게시글 목록">
              {posts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    className={`board-item ${selectedId === post.id ? 'is-active' : ''} ${post.hidden ? 'is-hidden' : ''}`}
                    aria-current={selectedId === post.id ? 'true' : undefined}
                    onClick={() => void openPost(post.id)}
                  >
                    <span className="board-item-meta">
                      <Badge tone="accent" plain>
                        {post.category}
                      </Badge>
                      {post.hidden ? (
                        <Badge tone="warn" plain>
                          숨김
                        </Badge>
                      ) : null}
                      <span className="board-item-time">{formatRelativeIso(post.createdAt)}</span>
                    </span>
                    <strong className="board-item-title">{post.title}</strong>
                    <span className="board-item-excerpt">{post.excerpt}</span>
                    <span className="board-item-foot">
                      {post.authorName} · 댓글 {post.commentCount}
                      {post.attachmentCount > 0 ? ` · 첨부 ${post.attachmentCount}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="stack-sm">
          {composing ? composeForm : null}
          {detailCard}
        </div>
      </div>
    </div>
  )
}
