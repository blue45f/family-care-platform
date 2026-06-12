import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchAdminUsers, patchUserSuspension } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { formatRelativeIso, normalizeApiErrorMessage } from '../../features/community/view'
import { routeDefs, type AppRoute } from '../../routeConfig'
import type { ProtectedNavigateState } from '../../appRoutes'
import type { MemberUser } from '../../types'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Icon,
  PageHeader,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
} from '../ui'

type MembersPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

export const MembersPage = ({ onNavigate }: MembersPageProps) => {
  const routeDef = routeDefs['/members']
  const auth = useAuth()
  const isAdmin = auth.user?.role === 'admin'
  const myId = auth.user ? Number(auth.user.id) : null

  const [members, setMembers] = useState<MemberUser[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  // window.confirm 금지 컨벤션 — 정지/해제는 2단계 인라인 확인으로 처리한다.
  const [confirmTarget, setConfirmTarget] = useState<MemberUser | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMembers(await fetchAdminUsers())
      setError('')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '회원 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      void load()
    } else {
      setLoading(false)
    }
  }, [isAdmin, load])

  const stats = useMemo(
    () => ({
      total: members.length,
      suspended: members.filter((member) => member.suspended).length,
      organizations: members.filter((member) => member.organization).length,
    }),
    [members],
  )

  const applySuspension = async (member: MemberUser) => {
    if (updatingId !== null) {
      return
    }
    const next = !member.suspended
    setUpdatingId(member.id)
    setError('')
    // 낙관적 뮤테이션: 토글 결과를 먼저 보여주고, 실패하면 스냅샷(member)으로 원복한다.
    setMembers((prev) =>
      prev.map((item) => (item.id === member.id ? { ...item, suspended: next } : item)),
    )
    try {
      // 성공 재동기화: 서버가 확정한 회원 정보로 교체한다.
      const updated = await patchUserSuspension(member.id, next)
      setMembers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setNotice(
        next ? `${member.name}님을 이용 정지했습니다.` : `${member.name}님의 정지를 해제했습니다.`,
      )
    } catch (cause) {
      setMembers((prev) => prev.map((item) => (item.id === member.id ? member : item)))
      setError(normalizeApiErrorMessage(cause, '회원 상태 변경에 실패했습니다.'))
    } finally {
      setUpdatingId(null)
      setConfirmTarget(null)
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
      cell: (member) =>
        member.role === 'admin' ? (
          <Badge tone="accent" plain>
            관리자
          </Badge>
        ) : (
          <Badge tone="neutral" plain>
            운영자
          </Badge>
        ),
    },
    {
      key: 'createdAt',
      header: '가입일',
      cell: (member) => formatRelativeIso(member.createdAt) || member.createdAt,
    },
    {
      key: 'status',
      header: '상태',
      cell: (member) =>
        member.suspended ? (
          <Badge tone="danger">이용 정지</Badge>
        ) : (
          <Badge tone="success">정상</Badge>
        ),
    },
    {
      key: 'actions',
      header: '관리',
      cell: (member) => {
        const isSelf = myId !== null && member.id === myId
        const locked = member.role === 'admin' || isSelf
        return (
          <Button
            variant={member.suspended ? 'secondary' : 'ghost'}
            size="sm"
            disabled={locked || updatingId !== null}
            aria-label={
              locked
                ? `${member.name}: 관리자/본인 계정은 정지할 수 없습니다`
                : member.suspended
                  ? `${member.name} 이용 정지 해제`
                  : `${member.name} 이용 정지`
            }
            onClick={() => setConfirmTarget(member)}
          >
            {updatingId === member.id ? '변경 중…' : member.suspended ? '정지 해제' : '이용 정지'}
          </Button>
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
          Array.from({ length: 3 }, (_, i) => (
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
          subtitle="이용 정지된 계정은 즉시 로그인이 차단되고 기존 세션도 무효화됩니다. 관리자/본인 계정은 정지할 수 없습니다."
        />

        {confirmTarget ? (
          <div className="feedback feedback-warning confirm-bar" role="alert">
            <span>
              {confirmTarget.suspended
                ? `${confirmTarget.name}님의 이용 정지를 해제할까요?`
                : `${confirmTarget.name}님의 이용을 정지할까요? 정지 즉시 로그인과 글쓰기가 차단됩니다.`}
            </span>
            <span className="confirm-bar-actions">
              <Button
                variant="primary"
                size="sm"
                disabled={updatingId !== null}
                onClick={() => void applySuspension(confirmTarget)}
              >
                {updatingId === confirmTarget.id
                  ? '변경 중…'
                  : confirmTarget.suspended
                    ? '해제 확정'
                    : '정지 확정'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={updatingId !== null}
                onClick={() => setConfirmTarget(null)}
              >
                취소
              </Button>
            </span>
          </div>
        ) : null}
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
    </div>
  )
}
