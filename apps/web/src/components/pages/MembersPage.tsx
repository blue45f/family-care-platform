import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { useAuth } from '../../auth/useAuth'
import { formatRelativeIso, normalizeApiErrorMessage } from '../../domains/community/view'
import {
  deleteCommunityForbiddenWord,
  fetchAdminUsers,
  fetchCommunityForbiddenWords,
  patchAdminUser,
  patchCommunityForbiddenWord,
  postCommunityForbiddenWord,
} from '../../infrastructure/api'
import { routeDefs, type AppRoute } from '../../routeConfig'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
} from '../ui'

import type { ProtectedNavigateState } from '../../appRoutes'
import type {
  AdminUserUpdateInput,
  CommunityForbiddenWord,
  MemberStatus,
  MemberUser,
} from '../../types'

type MembersPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

type MemberConfirmAction = {
  member: MemberUser
  status: Extract<MemberStatus, 'active' | 'suspended' | 'withdrawn'>
}

const memberStatus = (member: MemberUser): MemberStatus => {
  if (member.withdrawnAt) {
    return 'withdrawn'
  }
  return member.suspended ? 'suspended' : 'active'
}

export const MembersPage = ({ onNavigate }: MembersPageProps) => {
  const routeDef = routeDefs['/members']
  const auth = useAuth()
  const isAdmin = auth.user?.role === 'admin'
  const myId = auth.user ? Number(auth.user.id) : null

  const [members, setMembers] = useState<MemberUser[]>([])
  const [forbiddenWords, setForbiddenWords] = useState<CommunityForbiddenWord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [wordBusyId, setWordBusyId] = useState<number | 'new' | null>(null)
  // window.confirm 금지 컨벤션 — 정지/해제/탈퇴는 접근성 확인 모달로 처리한다.
  const [confirmAction, setConfirmAction] = useState<MemberConfirmAction | null>(null)
  const [wordDraft, setWordDraft] = useState('')
  const [editingWordId, setEditingWordId] = useState<number | null>(null)
  // 삭제 확인 모달을 띄울 금칙어 — 모달 확정 시 실제 삭제가 실행된다.
  const [confirmWordDelete, setConfirmWordDelete] = useState<CommunityForbiddenWord | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshMembers = useCallback(async () => {
    try {
      setMembers(await fetchAdminUsers())
      setError('')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '회원 목록을 불러오지 못했습니다.'))
    }
  }, [])

  const refreshForbiddenWords = useCallback(async () => {
    try {
      setForbiddenWords(await fetchCommunityForbiddenWords())
      setError('')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '금칙어 목록을 불러오지 못했습니다.'))
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([refreshMembers(), refreshForbiddenWords()])
    setLoading(false)
  }, [refreshForbiddenWords, refreshMembers])

  useEffect(() => {
    if (isAdmin) {
      let cancelled = false
      Promise.all([fetchAdminUsers(), fetchCommunityForbiddenWords()])
        .then(([nextMembers, nextWords]) => {
          if (cancelled) {
            return
          }
          setMembers(nextMembers)
          setForbiddenWords(nextWords)
          setError('')
        })
        .catch((cause) => {
          if (cancelled) {
            return
          }
          setError(normalizeApiErrorMessage(cause, '회원 목록을 불러오지 못했습니다.'))
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false)
          }
        })
      return () => {
        cancelled = true
      }
    }
  }, [isAdmin])

  const stats = useMemo(
    () => ({
      total: members.length,
      suspended: members.filter((member) => memberStatus(member) === 'suspended').length,
      withdrawn: members.filter((member) => memberStatus(member) === 'withdrawn').length,
      organizations: members.filter((member) => member.organization).length,
    }),
    [members]
  )

  const applyMemberUpdate = async (
    member: MemberUser,
    input: AdminUserUpdateInput,
    message: string
  ) => {
    if (updatingId !== null) {
      return
    }
    setUpdatingId(member.id)
    setError('')
    try {
      const updated = await patchAdminUser(member.id, input)
      setMembers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setNotice(message)
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '회원 상태 변경에 실패했습니다.'))
    } finally {
      setUpdatingId(null)
      setConfirmAction(null)
    }
  }

  const applyConfirmedAction = async (action: MemberConfirmAction) => {
    const status = action.status
    const message =
      status === 'withdrawn'
        ? `${action.member.name}님을 탈퇴 처리했습니다.`
        : status === 'suspended'
          ? `${action.member.name}님을 이용 정지했습니다.`
          : `${action.member.name}님의 정지를 해제했습니다.`
    await applyMemberUpdate(action.member, { status }, message)
  }

  const applyRole = async (member: MemberUser, role: MemberUser['role']) => {
    if (role === member.role) {
      return
    }
    await applyMemberUpdate(
      member,
      { role },
      `${member.name}님의 역할을 ${role === 'admin' ? '관리자' : '운영자'}로 변경했습니다.`
    )
  }

  const submitForbiddenWord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (wordBusyId !== null) {
      return
    }
    const term = wordDraft.trim()
    if (!term) {
      setError('금칙어를 입력해 주세요.')
      return
    }

    setWordBusyId(editingWordId ?? 'new')
    setError('')
    try {
      const saved =
        editingWordId === null
          ? await postCommunityForbiddenWord({ term })
          : await patchCommunityForbiddenWord(editingWordId, { term })
      setForbiddenWords((prev) => {
        const exists = prev.some((word) => word.id === saved.id)
        const next = exists
          ? prev.map((word) => (word.id === saved.id ? saved : word))
          : [...prev, saved]
        return next.sort((a, b) => a.term.localeCompare(b.term, 'ko') || a.id - b.id)
      })
      setWordDraft('')
      setEditingWordId(null)
      setConfirmWordDelete(null)
      setNotice(editingWordId === null ? '금칙어를 추가했습니다.' : '금칙어를 수정했습니다.')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '금칙어 저장에 실패했습니다.'))
    } finally {
      setWordBusyId(null)
    }
  }

  const startEditForbiddenWord = (word: CommunityForbiddenWord) => {
    setEditingWordId(word.id)
    setWordDraft(word.term)
    setConfirmWordDelete(null)
  }

  const deleteForbiddenWord = async (word: CommunityForbiddenWord) => {
    setWordBusyId(word.id)
    setError('')
    try {
      await deleteCommunityForbiddenWord(word.id)
      setForbiddenWords((prev) => prev.filter((item) => item.id !== word.id))
      setConfirmWordDelete(null)
      if (editingWordId === word.id) {
        setEditingWordId(null)
        setWordDraft('')
      }
      setNotice('금칙어를 삭제했습니다.')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '금칙어 삭제에 실패했습니다.'))
    } finally {
      setWordBusyId(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow={routeDef.eyebrow}
          title={routeDef.title}
          description={routeDef.description}
        />
        <Card>
          <EmptyState
            icon="shield"
            title="관리자 권한이 필요합니다"
            description="회원 관리는 관리자 계정에서만 사용할 수 있습니다. 권한이 필요하면 운영팀에 문의해 주세요."
            action={
              <Button variant="secondary" size="sm" onClick={() => onNavigate('/')}>
                대시보드로 돌아가기
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const columns: TableColumn<MemberUser>[] = [
    {
      key: 'name',
      header: '이름',
      cell: (member) => (
        <span className="cell-strong">
          {member.name}
          {myId !== null && member.id === myId ? ' (나)' : ''}
        </span>
      ),
    },
    { key: 'email', header: '이메일', cell: (member) => member.email },
    {
      key: 'organization',
      header: '소속 기관',
      cell: (member) =>
        member.organization ? (
          <Badge tone="info" plain>
            {member.organization}
          </Badge>
        ) : (
          <span className="cell-muted">개인</span>
        ),
    },
    {
      key: 'role',
      header: '역할',
      cell: (member) => {
        const isSelf = myId !== null && member.id === myId
        const disabled = isSelf || memberStatus(member) === 'withdrawn' || updatingId !== null
        return (
          <Select
            aria-label={`${member.name} 역할`}
            value={member.role}
            disabled={disabled}
            onChange={(event) => void applyRole(member, event.target.value as MemberUser['role'])}
          >
            <option value="operator">운영자</option>
            <option value="admin">관리자</option>
          </Select>
        )
      },
    },
    {
      key: 'createdAt',
      header: '가입일',
      cell: (member) => formatRelativeIso(member.createdAt) || member.createdAt,
    },
    {
      key: 'status',
      header: '상태',
      cell: (member) => {
        const status = memberStatus(member)
        if (status === 'withdrawn') {
          return <Badge tone="neutral">탈퇴</Badge>
        }
        return status === 'suspended' ? (
          <Badge tone="danger">이용 정지</Badge>
        ) : (
          <Badge tone="success">정상</Badge>
        )
      },
    },
    {
      key: 'actions',
      header: '관리',
      cell: (member) => {
        const isSelf = myId !== null && member.id === myId
        const status = memberStatus(member)
        const locked = isSelf || status === 'withdrawn'
        return (
          <span className="confirm-bar-actions">
            <Button
              variant={status === 'suspended' ? 'secondary' : 'ghost'}
              size="sm"
              disabled={locked || updatingId !== null}
              aria-label={
                locked
                  ? `${member.name}: 본인/탈퇴 계정은 상태를 변경할 수 없습니다`
                  : status === 'suspended'
                    ? `${member.name} 이용 정지 해제`
                    : `${member.name} 이용 정지`
              }
              onClick={() =>
                setConfirmAction({
                  member,
                  status: status === 'suspended' ? 'active' : 'suspended',
                })
              }
            >
              {updatingId === member.id
                ? '변경 중…'
                : status === 'suspended'
                  ? '정지 해제'
                  : '이용 정지'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={locked || updatingId !== null}
              onClick={() => setConfirmAction({ member, status: 'withdrawn' })}
            >
              탈퇴 처리
            </Button>
          </span>
        )
      },
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={routeDef.description}
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            새로고침
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

      <section aria-label="회원 요약" className="stat-row">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div className="stat" key={i}>
              <Skeleton width="55%" height="0.85rem" />
              <Skeleton width="70%" height="1.4rem" />
            </div>
          ))
        ) : (
          <>
            <Stat
              icon="users"
              label="전체 회원"
              value={`${stats.total}명`}
              foot="가입한 모든 계정"
            />
            <Stat
              icon="shield"
              label="이용 정지"
              value={`${stats.suspended}명`}
              foot="로그인·글쓰기 차단 상태"
            />
            <Stat
              icon="trash"
              label="탈퇴 처리"
              value={`${stats.withdrawn}명`}
              foot="익명화되어 로그인 불가"
            />
            <Stat
              icon="plans"
              label="기업/기관 회원"
              value={`${stats.organizations}명`}
              foot="소속 기관을 등록한 계정"
            />
          </>
        )}
      </section>

      <Card>
        <CardHeader
          title="회원 목록"
          subtitle="역할과 상태를 변경합니다. 마지막 관리자와 본인 계정의 권한 하향·정지·탈퇴는 서버에서 차단됩니다."
        />

        {loading ? (
          <div className="stack-sm" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height="2.75rem" radius="var(--radius-md)" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon="users"
            title="회원이 없습니다"
            description="가입한 회원이 아직 없습니다."
          />
        ) : (
          <Table
            caption="회원 목록"
            columns={columns}
            rows={members}
            rowKey={(member) => String(member.id)}
          />
        )}
      </Card>

      <Card>
        <CardHeader
          title="커뮤니티 금칙어"
          subtitle="등록된 표현이 게시글 제목·본문 또는 댓글에 포함되면 작성이 차단됩니다."
        />

        <form
          className="mb-3 flex gap-2"
          onSubmit={submitForbiddenWord}
          aria-busy={wordBusyId !== null}
        >
          <Input
            type="text"
            value={wordDraft}
            maxLength={60}
            placeholder="차단할 표현 입력"
            aria-label="커뮤니티 금칙어"
            disabled={wordBusyId !== null}
            onChange={(event) => setWordDraft(event.target.value)}
            className="min-w-0 flex-1"
          />
          <Button type="submit" size="sm" disabled={wordBusyId !== null || !wordDraft.trim()}>
            {wordBusyId === 'new' || (editingWordId !== null && wordBusyId === editingWordId)
              ? '저장 중…'
              : editingWordId === null
                ? '추가'
                : '수정'}
          </Button>
          {editingWordId !== null ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={wordBusyId !== null}
              onClick={() => {
                setEditingWordId(null)
                setWordDraft('')
              }}
            >
              취소
            </Button>
          ) : null}
        </form>

        {loading ? (
          <div className="stack-sm" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} height="2.5rem" radius="var(--radius-md)" />
            ))}
          </div>
        ) : forbiddenWords.length === 0 ? (
          <EmptyState
            icon="shield"
            title="등록된 금칙어가 없습니다"
            description="커뮤니티 운영 기준에 맞춰 필요한 표현을 추가하세요."
          />
        ) : (
          <ul className="stack-sm" aria-label="커뮤니티 금칙어 목록">
            {forbiddenWords.map((word) => (
              <li key={word.id} className="feedback confirm-bar">
                <span>
                  <Badge tone="danger" plain>
                    {word.term}
                  </Badge>
                </span>
                <span className="confirm-bar-actions">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={wordBusyId !== null}
                    onClick={() => startEditForbiddenWord(word)}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={wordBusyId !== null}
                    aria-label={`금칙어 "${word.term}" 삭제`}
                    onClick={() => setConfirmWordDelete(word)}
                  >
                    {wordBusyId === word.id ? '삭제 중…' : '삭제'}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmAction(null)
          }
        }}
        tone={confirmAction?.status === 'active' ? 'default' : 'danger'}
        busy={updatingId !== null}
        title={
          confirmAction?.status === 'withdrawn'
            ? '회원 탈퇴 처리'
            : confirmAction?.status === 'active'
              ? '이용 정지 해제'
              : '이용 정지'
        }
        description={
          confirmAction?.status === 'withdrawn'
            ? `${confirmAction.member.name}님을 탈퇴 처리할까요? 개인정보가 익명화되고 로그인할 수 없습니다.`
            : confirmAction?.status === 'active'
              ? `${confirmAction.member.name}님의 이용 정지를 해제할까요?`
              : confirmAction
                ? `${confirmAction.member.name}님의 이용을 정지할까요? 정지 즉시 로그인과 글쓰기가 차단됩니다.`
                : ''
        }
        confirmLabel={
          updatingId !== null
            ? '변경 중…'
            : confirmAction?.status === 'withdrawn'
              ? '탈퇴 확정'
              : confirmAction?.status === 'active'
                ? '해제 확정'
                : '정지 확정'
        }
        onConfirm={() => {
          if (confirmAction) {
            void applyConfirmedAction(confirmAction)
          }
        }}
      />

      <ConfirmDialog
        open={confirmWordDelete !== null}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmWordDelete(null)
          }
        }}
        tone="danger"
        busy={wordBusyId !== null}
        title="금칙어 삭제"
        description={
          confirmWordDelete
            ? `금칙어 "${confirmWordDelete.term}"을(를) 삭제할까요? 이 표현은 다시 작성에서 허용됩니다.`
            : ''
        }
        confirmLabel={wordBusyId !== null ? '삭제 중…' : '삭제 확정'}
        onConfirm={() => {
          if (confirmWordDelete) {
            void deleteForbiddenWord(confirmWordDelete)
          }
        }}
      />
    </div>
  )
}
