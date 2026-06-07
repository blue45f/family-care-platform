import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { Badge, Button, Card, CardHeader, Icon, PageHeader } from '../ui'
import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type PrivacyRequestType = '열람' | '정정' | '삭제' | '동의철회' | '이용제한'
type PrivacyRequestStatus = '접수' | '처리중' | '완료'
type PrivacyRequestPriority = '높음' | '보통' | '낮음'
type PrivacyRequestStatusFilter = 'all' | PrivacyRequestStatus
type PrivacyRequestSort = '최신순' | '오래됨순' | '우선순위순' | '기한임박순'

type PrivacyRequestHistory = {
  status: PrivacyRequestStatus
  at: number
  note?: string
}

type PrivacySection = {
  title: string
  items: string[]
}

type PrivacyPlaybookItem = {
  id: string
  title: string
  details: string
}

type PrivacyRequest = {
  id: string
  requester: string
  contact: string
  type: PrivacyRequestType
  detail: string
  createdAt: number
  status: PrivacyRequestStatus
  priority: PrivacyRequestPriority
  dueAt: number
  note: string
  statusHistory: PrivacyRequestHistory[]
}

const collectingItems = [
  '센터명, 담당자명, 연락처(사업 상호 작용을 위한 최소 항목)',
  '로그인 계정 정보(이메일, 임시 비밀번호 토큰 관련 식별자)',
  '서비스 이용 기록(접근 로그, 기기 정보, 기능 이벤트 타임스탬프)',
  '운영 데이터(일정, 기록, 정산, 청구 상태 등 서비스 운영용 데이터)',
]

const usePurposeItems = [
  '계정 인증 및 로그인 유지',
  '일정/기록/정산/청구 화면 렌더링 및 저장',
  '이상징후 점검, 오류 진단, 안정성 개선',
  '서비스 알림, 안내 메시지 발송, 영업 지원',
]

const sharingItems = [
  '법령에 명시된 보존/제공 의무가 있는 경우',
  '동의받은 위임 대상(운영지원 파트너)와 계약 범위 내 처리',
  '보안·백업·장애대응을 위한 하위 처리자와의 제한적 공유',
]

const retentionItems = [
  '로그인 계정: 계약 종료 또는 계정 삭제 요청 시까지 보존 후 즉시 파기',
  '운영 데이터: 센터 정책 및 계약 협의된 기간까지 보존 후 지정 절차에 따라 삭제',
  '분석 로그: 익명화 수준에서 일정 기간 집계 후 장기 보관 여부 결정',
]

const userRightItems = [
  '열람·정정 요구: 본인 데이터가 누적된 범위를 조회·요청할 수 있습니다.',
  '정정·삭제·정지: 계약 상태와 법령에 따라 처리 방식이 달라집니다.',
  '동의 철회: 수집 동의 철회 요청 시 제한적 기능 축소가 있을 수 있습니다.',
]

const privacySections: PrivacySection[] = [
  { title: '수집 항목', items: collectingItems },
  { title: '이용 목적', items: usePurposeItems },
  { title: '제3자 제공 기준', items: sharingItems },
  { title: '보관 기간', items: retentionItems },
]

const additionalInfo = [
  '개인정보를 기반으로 한 분석은 통계화 단계에서 사용되며, 개별 이용자 식별 가능 정보와는 분리되어 처리됩니다.',
  '보안 조치로 암호화, 접근권한 분리, 행위 추적 로그를 운영합니다.',
  '서비스 보안 점검 시 모니터링 로그가 추가로 수집될 수 있습니다.',
]

const trustSignals = [
  '최소 수집 원칙: 기능 동작에 꼭 필요한 항목만 사용합니다.',
  '권한 분리: 운영 기능과 정산·청구는 필요한 범위에서만 연동됩니다.',
  '보유·파기: 보관 기간이 끝나면 삭제 프로세스를 우선 적용합니다.',
]

const playbookItems: PrivacyPlaybookItem[] = [
  {
    id: 'check-collection',
    title: '수집 항목 점검',
    details: '수집 목적에 맞는 최소 데이터만 남아 있는지 점검합니다.',
  },
  {
    id: 'check-consent',
    title: '동의 범위 점검',
    details: '선택 항목은 동의가 없으면 기능 노출을 제한합니다.',
  },
  {
    id: 'check-retention',
    title: '보관·파기 규칙 점검',
    details: '반납 기간이 지난 항목은 보관 기간 정책으로 재배치됩니다.',
  },
  {
    id: 'check-rights',
    title: '이용자 권리 요청 처리 점검',
    details: '열람·정정·삭제 요청을 처리 상태로 추적할 수 있습니다.',
  },
]

const rightRequestTypeOptions: PrivacyRequestType[] = [
  '열람',
  '정정',
  '삭제',
  '동의철회',
  '이용제한',
]
const requestTypeIcon: Record<
  PrivacyRequestType,
  'check' | 'refresh' | 'close' | 'clock' | 'claims'
> = {
  열람: 'check',
  정정: 'refresh',
  삭제: 'close',
  동의철회: 'clock',
  이용제한: 'claims',
}
const statusToneMap: Record<PrivacyRequestStatus, 'warn' | 'info' | 'success'> = {
  접수: 'warn',
  처리중: 'info',
  완료: 'success',
}

const maxRequestDetailLength = 900
const MAX_REQUEST_NOTE_LENGTH = 500
const MAX_CONTACT_LENGTH = 32
const MAX_REQUESTER_LENGTH = 24
const PRIVACY_REQUEST_KEY = 'privacy-right-requests-demo-v1'
const PRIVACY_PLAYBOOK_KEY = 'privacy-playbook-checklist-v1'
const PRIVACY_PRIORITY_HOURS: Record<PrivacyRequestPriority, number> = {
  높음: 24,
  보통: 72,
  낮음: 120,
}
const priorityLabelMap: Record<PrivacyRequestPriority, string> = {
  높음: '24시간',
  보통: '72시간',
  낮음: '120시간',
}
const statusPriority: Record<PrivacyRequestPriority, number> = {
  높음: 0,
  보통: 1,
  낮음: 2,
}
const rightRequestPriorityOptions: PrivacyRequestPriority[] = ['높음', '보통', '낮음']

const isValidRequestType = (value: unknown): value is PrivacyRequestType =>
  value === '열람' ||
  value === '정정' ||
  value === '삭제' ||
  value === '동의철회' ||
  value === '이용제한'

const isValidRequestStatus = (value: unknown): value is PrivacyRequestStatus =>
  value === '접수' || value === '처리중' || value === '완료'

const isValidPriority = (value: unknown): value is PrivacyRequestPriority =>
  value === '높음' || value === '보통' || value === '낮음'

const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / (60 * 1000)))
  const totalHours = Math.floor(totalMinutes / 60)
  const remainMinutes = totalMinutes % 60
  const totalDays = Math.floor(totalHours / 24)
  const remainHours = totalHours % 24

  if (totalMinutes <= 0) {
    return '지연'
  }
  if (totalDays > 0) {
    return `${totalDays}일 ${remainHours}시간`
  }
  if (remainHours > 0) {
    return `${remainHours}시간 ${remainMinutes}분`
  }
  return `${remainMinutes}분`
}

const formatMinutes = (ms: number) => {
  const totalMinutes = Math.round(ms / (60 * 1000))
  if (totalMinutes >= 60 * 24) {
    return `${Math.round(totalMinutes / (60 * 24))}일`
  }
  if (totalMinutes >= 60) {
    return `${Math.round(totalMinutes / 60)}시간`
  }
  return `${totalMinutes}분`
}

const formatShortDateTime = (value: number) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const normalizeHistory = (raw: unknown): PrivacyRequestHistory[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const candidate = item as {
        status?: unknown
        at?: unknown
        note?: unknown
      }

      return isValidRequestStatus(candidate.status) && typeof candidate.at === 'number'
        ? ({
            status: candidate.status,
            at: candidate.at,
            ...(typeof candidate.note === 'string' ? { note: candidate.note } : {}),
          } as PrivacyRequestHistory)
        : null
    })
    .filter((item): item is PrivacyRequestHistory => item !== null)
}

const normalizeRequestStatus = (request: PrivacyRequest): PrivacyRequest => {
  const fallbackStatus = request.statusHistory
    .slice()
    .sort((left, right) => right.at - left.at)[0]?.status
  return {
    ...request,
    status:
      isValidRequestStatus(fallbackStatus) && request.statusHistory.length > 0
        ? fallbackStatus
        : request.status,
  }
}

const readPrivacyRequests = (): PrivacyRequest[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(PRIVACY_REQUEST_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((rawRequest) => {
        if (!rawRequest || typeof rawRequest !== 'object') {
          return null
        }

        const candidate = rawRequest as Partial<PrivacyRequest> & {
          dueAt?: unknown
          priority?: unknown
          note?: unknown
          statusHistory?: unknown
          createdAt?: unknown
        }

        if (
          typeof candidate.id !== 'string' ||
          typeof candidate.requester !== 'string' ||
          typeof candidate.contact !== 'string' ||
          typeof candidate.detail !== 'string' ||
          typeof candidate.createdAt !== 'number' ||
          !isValidRequestType(candidate.type) ||
          !isValidRequestStatus(candidate.status)
        ) {
          return null
        }

        const createdAt = candidate.createdAt
        const priority = isValidPriority(candidate.priority) ? candidate.priority : '보통'
        const dueAt =
          typeof candidate.dueAt === 'number' && candidate.dueAt > createdAt
            ? candidate.dueAt
            : createdAt + PRIVACY_PRIORITY_HOURS[priority] * 60 * 60 * 1000

        const history = normalizeHistory(candidate.statusHistory)
        const statusHistory =
          history.length > 0
            ? history
            : [{ status: candidate.status, at: candidate.createdAt, note: '기존 데이터 복원' }]

        return normalizeRequestStatus({
          id: candidate.id,
          requester: candidate.requester,
          contact: candidate.contact,
          type: candidate.type,
          detail: candidate.detail,
          createdAt,
          status: candidate.status,
          priority,
          dueAt,
          note: typeof candidate.note === 'string' ? candidate.note : '',
          statusHistory,
        })
      })
      .filter((item): item is PrivacyRequest => item !== null)
      .sort((left, right) => right.createdAt - left.createdAt)
  } catch {
    return []
  }
}

const readPlaybookChecklist = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(PRIVACY_PLAYBOOK_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    const isValidItem = (item: unknown): item is string =>
      typeof item === 'string' && playbookItems.some((candidate) => candidate.id === item)
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : []
  } catch {
    return []
  }
}

const makeRequestId = () =>
  `privacy-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

type PrivacyPageProps = {
  onNavigate?: (path: AppRoute, state?: PublicNavigateState) => void
}

type DraftRequest = {
  requester: string
  contact: string
  type: PrivacyRequestType
  detail: string
  priority: PrivacyRequestPriority
}

const getRequestDueByPriority = (createdAt: number, priority: PrivacyRequestPriority) =>
  createdAt + PRIVACY_PRIORITY_HOURS[priority] * 60 * 60 * 1000

const isOverdue = (request: PrivacyRequest, now = Date.now()) =>
  request.status !== '완료' && request.dueAt <= now

const getLatestStatusAt = (
  request: PrivacyRequest,
  target: PrivacyRequestStatus,
): number | undefined => {
  for (let index = request.statusHistory.length - 1; index >= 0; index--) {
    const record = request.statusHistory[index]
    if (record.status === target) {
      return record.at
    }
  }
  if (request.status === target) {
    return request.createdAt
  }
  return undefined
}

const averageMinutes = (values: number[]) =>
  values.length === 0
    ? 0
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

const getCompletedDuration = (request: PrivacyRequest): number | undefined => {
  const completedAt = getLatestStatusAt(request, '완료')
  if (!completedAt) {
    return undefined
  }
  return completedAt - request.createdAt
}

const getNextStatus = (status: PrivacyRequestStatus): PrivacyRequestStatus => {
  if (status === '접수') {
    return '처리중'
  }
  return '완료'
}

const getRemainingMinutes = (request: PrivacyRequest, now: number) => {
  if (request.status === '완료') {
    return 0
  }
  return Math.max(0, Math.round((request.dueAt - now) / (60 * 1000)))
}

const formatRemainingLabel = (request: PrivacyRequest, now: number) => {
  if (request.status === '완료') {
    return '처리 완료'
  }
  const remainingMinutes = getRemainingMinutes(request, now)
  if (remainingMinutes <= 0) {
    return '기한 초과'
  }
  return `예상 잔여 ${formatMinutes(remainingMinutes * 60 * 1000)}`
}

const buildHistoryLabel = (request: PrivacyRequest, at: number, status: PrivacyRequestStatus) => {
  const isOverdue = request.dueAt <= at
  const duration = formatDuration(at - request.createdAt)
  return status === '완료'
    ? `${request.type} 처리 완료 (${duration})`
    : `${request.type} 상태 변경: ${status}${isOverdue ? ' (기한 초과 상태에서 처리 진행)' : ''}`
}

export const PrivacyPage = ({ onNavigate }: PrivacyPageProps) => {
  const timeoutRef = useRef<number | undefined>(undefined)
  const [requests, setRequests] = useState<PrivacyRequest[]>(readPrivacyRequests)
  const [playbookDoneIds, setPlaybookDoneIds] = useState<string[]>(readPlaybookChecklist)
  const [copyMessage, setCopyMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestFilter, setRequestFilter] = useState<PrivacyRequestStatusFilter>('all')
  const [requestSort, setRequestSort] = useState<PrivacyRequestSort>('최신순')
  const [requestQuery, setRequestQuery] = useState('')
  const [editingRequestId, setEditingRequestId] = useState('')
  const [editingNote, setEditingNote] = useState('')

  const [draft, setDraft] = useState<DraftRequest>({
    requester: '',
    contact: '',
    type: '열람',
    detail: '',
    priority: '보통',
  })

  const requestCountByStatus = useMemo(
    () => ({
      접수: requests.filter((item) => item.status === '접수').length,
      처리중: requests.filter((item) => item.status === '처리중').length,
      완료: requests.filter((item) => item.status === '완료').length,
    }),
    [requests],
  )

  const completedCount = useMemo(
    () => playbookItems.filter((item) => playbookDoneIds.includes(item.id)).length,
    [playbookDoneIds],
  )
  const playbookRate = Math.round((completedCount / playbookItems.length) * 100)

  const now = useMemo(() => Date.now(), [requests])
  const requestCountByPriority = useMemo(
    () => ({
      높음: requests.filter((request) => request.priority === '높음').length,
      보통: requests.filter((request) => request.priority === '보통').length,
      낮음: requests.filter((request) => request.priority === '낮음').length,
    }),
    [requests],
  )

  const overdueCount = useMemo(
    () => requests.filter((request) => isOverdue(request, now)).length,
    [requests, now],
  )
  const avgCompleteMinutes = useMemo(() => {
    const durations = requests
      .map((request) => getCompletedDuration(request))
      .filter((duration): duration is number => typeof duration === 'number')
    return averageMinutes(durations)
  }, [requests])
  const filteredRequests = useMemo(() => {
    const normalizedQuery = requestQuery.trim().toLowerCase()

    const filtered = requests.filter((request) => {
      const isStatusMatched = requestFilter === 'all' ? true : request.status === requestFilter

      if (!isStatusMatched) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const target = `${request.requester} ${request.contact} ${request.type} ${request.detail} ${request.status}`
      return target.toLowerCase().includes(normalizedQuery)
    })

    if (requestSort === '오래됨순') {
      return [...filtered].sort((left, right) => left.createdAt - right.createdAt)
    }

    if (requestSort === '우선순위순') {
      return [...filtered].sort((left, right) => {
        const priorityDiff = statusPriority[left.priority] - statusPriority[right.priority]
        if (priorityDiff !== 0) {
          return priorityDiff
        }
        return right.createdAt - left.createdAt
      })
    }

    if (requestSort === '기한임박순') {
      return [...filtered].sort((left, right) => {
        const leftScore = isOverdue(left, now) ? Number.MAX_SAFE_INTEGER : left.dueAt - now
        const rightScore = isOverdue(right, now) ? Number.MAX_SAFE_INTEGER : right.dueAt - now

        if (leftScore === rightScore) {
          return right.createdAt - left.createdAt
        }
        return leftScore - rightScore
      })
    }

    return [...filtered].sort((left, right) => right.createdAt - left.createdAt)
  }, [now, requestFilter, requestQuery, requestSort, requests])

  const avgCompleteMinutesText = useMemo(
    () => formatMinutes(avgCompleteMinutes * 60 * 1000),
    [avgCompleteMinutes],
  )
  const completedRate = Math.round((requestCountByStatus.완료 / Math.max(requests.length, 1)) * 100)
  const requestSummary = useMemo(
    () =>
      `권리요청 ${requests.length}건 · 접수 ${requestCountByStatus.접수} · 처리중 ${requestCountByStatus.처리중} · 완료 ${requestCountByStatus.완료} (${completedRate}%) · 지연 ${overdueCount}건 · 완료 평균 ${avgCompleteMinutesText}`,
    [avgCompleteMinutesText, completedRate, requestCountByStatus, requests.length, overdueCount],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PRIVACY_REQUEST_KEY, JSON.stringify(requests))
  }, [requests])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PRIVACY_PLAYBOOK_KEY, JSON.stringify(playbookDoneIds))
  }, [playbookDoneIds])

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  const showCopyMessage = (message: string) => {
    setCopyMessage(message)
    if (typeof window === 'undefined') {
      return
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => setCopyMessage(''), 1700)
  }

  const togglePlaybookItem = (itemId: string, checked: boolean) => {
    setPlaybookDoneIds((current) =>
      checked ? [...new Set([...current, itemId])] : current.filter((value) => value !== itemId),
    )
  }

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const requester = draft.requester.trim()
    const contact = draft.contact.trim()
    const detail = draft.detail.trim()
    const now = Date.now()

    if (!requester || !contact || !detail) {
      setRequestError('요청자명·연락처·요청 내용을 모두 입력해 주세요.')
      return
    }

    if (requester.length > MAX_REQUESTER_LENGTH) {
      setRequestError(`요청자명은 ${MAX_REQUESTER_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    if (contact.length > MAX_CONTACT_LENGTH) {
      setRequestError(`연락처는 ${MAX_CONTACT_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    if (detail.length > maxRequestDetailLength) {
      setRequestError(`요청 내용은 ${maxRequestDetailLength}자 이하로 입력해 주세요.`)
      return
    }

    const nextRequest: PrivacyRequest = {
      id: makeRequestId(),
      requester,
      contact,
      type: draft.type,
      detail,
      createdAt: now,
      status: '접수',
      priority: draft.priority,
      dueAt: getRequestDueByPriority(now, draft.priority),
      note: '',
      statusHistory: [{ status: '접수', at: now, note: '요청 접수' }],
    }

    setRequests((current) => [nextRequest, ...current])
    setDraft((current) => ({ ...current, detail: '', priority: '보통' }))
    setRequestError('')
    showCopyMessage('권리 요청이 접수되었습니다. 데모 리스트에 저장했습니다.')
  }

  const updateRequestStatus = (requestId: string, status: PrivacyRequestStatus) => {
    if (status !== '접수' && status !== '처리중' && status !== '완료') {
      return
    }

    setRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) {
          return request
        }

        if (request.status === status) {
          return request
        }

        const now = Date.now()
        const note = buildHistoryLabel(request, now, status)

        return {
          ...request,
          status,
          statusHistory: [...request.statusHistory, { status, at: now, note }],
          note: request.note,
        }
      }),
    )
  }

  const updateRequestNote = (requestId: string) => {
    const next = editingNote.trim()
    if (next.length > MAX_REQUEST_NOTE_LENGTH) {
      setRequestError(`메모는 ${MAX_REQUEST_NOTE_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, note: next || request.note } : request,
      ),
    )
    setRequestError('')
    setEditingRequestId('')
    setEditingNote('')
  }

  const startEditingNote = (request: PrivacyRequest) => {
    setEditingRequestId(request.id)
    setEditingNote(request.note)
  }

  const nextStatusLabel = (status: PrivacyRequestStatus) =>
    status === '접수' ? '처리중으로 전환' : '완료 처리'

  const copyRequestSummary = async () => {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.clipboard) {
      showCopyMessage('브라우저 클립보드 API를 사용할 수 없습니다.')
      return
    }

    try {
      await window.navigator.clipboard.writeText(requestSummary)
      showCopyMessage('요청 요약을 복사했습니다.')
    } catch {
      showCopyMessage('복사에 실패했습니다.')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="개인정보 처리방침"
        title="개인정보를 어디에, 어떻게 쓰는지 정리했습니다"
        description="센터 운영에 필요한 범위 내에서만 수집·보관·이용하도록 설계된 정책입니다."
        actions={
          onNavigate ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('/', { source: 'hero', fromLanding: true })}
            >
              공개 홈으로 이동
              <Icon name="arrow-right" size={14} />
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader
          title="적용 범위"
          subtitle="본 방침은 사이트 공개 영역과 로그인 기반 운영 영역 모두에 적용됩니다."
        />
        <p>
          이용자가 입력한 민감 정보는 돌봄 기록·청구 증빙 목적 외에 다른 용도로 무단 처리되지
          않습니다. 공개 페이지에서 수집하는 정보는 영업 지원·상담 안내에 필요한 최소 범위로
          제한합니다.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="개인정보 처리 플레이북(데모)"
          subtitle={`${playbookRate}% 완료 · 실제 운영 전환 전 점검용 데모입니다.`}
        />
        <div className="guide-progress">
          <div className="guide-progress-track">
            <span style={{ width: `${playbookRate}%` }} />
          </div>
        </div>
        <ul className="guide-checklist" style={{ marginTop: 'var(--space-3)' }}>
          {playbookItems.map((item) => (
            <li key={item.id}>
              <label className="guide-check-item">
                <input
                  type="checkbox"
                  checked={playbookDoneIds.includes(item.id)}
                  onChange={(event) => togglePlaybookItem(item.id, event.currentTarget.checked)}
                  aria-label={`${item.title} 완료`}
                />
                <span>{item.id.split('-')[1]}</span>
                <div>
                  <strong>{item.title}</strong>
                  <span
                    className="guide-step-subtitle"
                    style={{ display: 'block', marginTop: 'var(--space-2)' }}
                  >
                    {item.details}
                  </span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="개인정보 보호 기본 원칙" subtitle="도입 전 점검 포인트" />
        <ul className="public-check-list">
          {trustSignals.map((item) => (
            <li key={item}>
              <Icon name="check" size={14} />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {privacySections.map((section) => (
        <Card key={section.title}>
          <CardHeader title={section.title} />
          <ul className="public-check-list">
            {section.items.map((item) => (
              <li key={item}>
                <Icon name="check" size={14} />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Card>
        <CardHeader
          title="보안과 추가 안내"
          subtitle="데이터 접근/보관 정책은 정기 보완 점검을 통해 업데이트됩니다."
        />
        <ul className="public-check-list">
          {additionalInfo.map((item) => (
            <li key={item}>
              <Icon name="check" size={14} />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="권리 요구 처리 데모"
          subtitle="실제 시스템처럼 요청을 접수·처리중·완료로 이동시키며, 진행 상태를 추적해볼 수 있습니다."
          action={
            <Button size="sm" variant="secondary" onClick={copyRequestSummary}>
              처리 요약 복사
            </Button>
          }
        />

        <div
          className="public-metric-list public-metric-list--narrow"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <article className="public-metric-item">
            <strong>{requests.length}</strong>
            <span>총 요청</span>
          </article>
          <article className="public-metric-item">
            <strong>{requestCountByStatus.접수}</strong>
            <span>접수</span>
          </article>
          <article className="public-metric-item">
            <strong>{requestCountByStatus.처리중}</strong>
            <span>처리중</span>
          </article>
          <article className="public-metric-item">
            <strong>{requestCountByStatus.완료}</strong>
            <span>완료</span>
          </article>
          <article className="public-metric-item">
            <strong>{overdueCount}</strong>
            <span>지연</span>
          </article>
          <article className="public-metric-item">
            <strong>{avgCompleteMinutesText}</strong>
            <span>완료 평균</span>
          </article>
          <article className="public-metric-item">
            <strong>
              {requestCountByPriority.높음}/{requestCountByPriority.보통}/
              {requestCountByPriority.낮음}
            </strong>
            <span>우선순위(높음/보통/낮음)</span>
          </article>
        </div>

        {copyMessage ? <p role="status">{copyMessage}</p> : null}

        <form className="public-community-form" onSubmit={submitRequest} noValidate>
          <label className="public-lead-form">
            요청 유형
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as PrivacyRequestType,
                }))
              }
              aria-label="요청 유형"
            >
              {rightRequestTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="public-lead-form">
            요청자명
            <input
              value={draft.requester}
              maxLength={MAX_REQUESTER_LENGTH}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  requester: event.target.value,
                }))
              }
              placeholder="예: 김돌봄"
              aria-label="요청자명"
            />
            <small className="public-community-counter">
              {draft.requester.length} / {MAX_REQUESTER_LENGTH}자
            </small>
          </label>
          <label className="public-lead-form">
            연락처
            <input
              value={draft.contact}
              maxLength={MAX_CONTACT_LENGTH}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  contact: event.target.value,
                }))
              }
              placeholder="이메일 또는 전화번호"
              aria-label="연락처"
            />
            <small className="public-community-counter">
              {draft.contact.length} / {MAX_CONTACT_LENGTH}자
            </small>
          </label>
          <label className="public-lead-form">
            우선순위
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priority: event.target.value as PrivacyRequestPriority,
                }))
              }
              aria-label="요청 우선순위"
            >
              {rightRequestPriorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority} · {priorityLabelMap[priority]}
                </option>
              ))}
            </select>
            <small className="public-community-counter">
              {priorityLabelMap[draft.priority]} 기준 SLA 반영
            </small>
          </label>
          <label className="public-lead-form">
            요청 내용
            <textarea
              className="public-community-textarea"
              value={draft.detail}
              maxLength={maxRequestDetailLength}
              rows={6}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  detail: event.target.value,
                }))
              }
              placeholder="요청 이유를 간단히 적어주세요. 데모라서 제출과 처리 흐름만 저장됩니다."
              aria-label="요청 내용"
            />
            <small className="public-community-counter">
              {draft.detail.length} / {maxRequestDetailLength}자
            </small>
          </label>

          {requestError ? <p className="public-faq-answer is-open">{requestError}</p> : null}

          <Button type="submit">
            권리 요청 접수하기
            <Icon name="arrow-right" size={15} />
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="요청 현황"
          subtitle="완료 흐름을 이동시키며 운영 대응 로직을 점검할 수 있습니다."
        />
        <div className="public-community-filters" style={{ marginBottom: 'var(--space-4)' }}>
          <label>
            상태:
            <select
              value={requestFilter}
              onChange={(event) =>
                setRequestFilter(event.target.value as PrivacyRequestStatusFilter)
              }
              style={{ marginLeft: 'var(--space-2)' }}
            >
              <option value="all">전체</option>
              <option value="접수">접수</option>
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
            </select>
          </label>
          <label>
            정렬:
            <select
              value={requestSort}
              onChange={(event) => setRequestSort(event.target.value as PrivacyRequestSort)}
              style={{ marginLeft: 'var(--space-2)' }}
            >
              <option value="최신순">최신순</option>
              <option value="오래됨순">오래됨순</option>
              <option value="우선순위순">우선순위순</option>
              <option value="기한임박순">기한임박순</option>
            </select>
          </label>
          <label>
            검색:
            <input
              type="search"
              value={requestQuery}
              onChange={(event) => setRequestQuery(event.currentTarget.value)}
              placeholder="요청자·연락처·유형·상태"
              style={{ marginLeft: 'var(--space-2)' }}
            />
          </label>
        </div>
        {filteredRequests.length === 0 ? (
          <p className="public-faq-empty" role="status">
            아직 요청이 없습니다.
          </p>
        ) : (
          <ul className="guide-checklist" aria-live="polite" aria-atomic="true">
            {filteredRequests.map((request) => {
              const isCompleted = request.status === '완료'
              const isEditing = editingRequestId === request.id
              const remainingText = formatRemainingLabel(request, now)
              return (
                <li key={request.id}>
                  <article className="guide-check-item">
                    <Badge tone={statusToneMap[request.status]} plain>
                      {request.status}
                    </Badge>
                    <span>
                      <Icon name={requestTypeIcon[request.type]} size={16} />
                    </span>
                    <div>
                      <p style={{ marginBottom: 'var(--space-1)' }}>
                        <strong>{requesterLabel(request)}</strong>
                      </p>
                      <small style={{ color: 'var(--fg-muted)' }}>
                        요청일: {formatDateTime(request.createdAt)} · 처리유형: {request.type} ·
                        우선순위: {request.priority}
                      </small>
                      <small style={{ color: 'var(--fg-muted)' }}>
                        기한:{' '}
                        {request.status === '완료'
                          ? formatShortDateTime(
                              getLatestStatusAt(request, '완료') ?? request.createdAt,
                            )
                          : `${formatDateTime(request.dueAt)} (${remainingText})`}
                      </small>
                      <p style={{ marginTop: 'var(--space-2)' }}>{request.detail}</p>
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <strong style={{ color: 'var(--fg-strong)' }}>이력:</strong>{' '}
                        {request.statusHistory
                          .slice()
                          .sort((left, right) => right.at - left.at)
                          .slice(0, 3)
                          .map((item) => `${formatShortDateTime(item.at)} ${item.status}`)
                          .join(' · ')}
                      </div>
                      <div
                        style={{
                          marginTop: 'var(--space-2)',
                          padding: 'var(--space-2)',
                          borderRadius: 'var(--radius-md)',
                          background:
                            'color-mix(in oklch, var(--bg-surface) 70%, var(--bg-surface-raised))',
                        }}
                      >
                        <strong style={{ color: 'var(--fg-muted)' }}>메모</strong>
                        {isEditing ? (
                          <div
                            style={{
                              marginTop: 'var(--space-2)',
                              display: 'grid',
                              gap: 'var(--space-2)',
                            }}
                          >
                            <textarea
                              className="public-community-textarea"
                              rows={3}
                              maxLength={MAX_REQUEST_NOTE_LENGTH}
                              value={editingNote}
                              onChange={(event) => setEditingNote(event.currentTarget.value)}
                              aria-label={`${requesterLabel(request)} 메모`}
                            />
                            <small className="public-community-counter">
                              {editingNote.length} / {MAX_REQUEST_NOTE_LENGTH}자
                            </small>
                            <div>
                              <button
                                type="button"
                                className="card-link"
                                onClick={() => updateRequestNote(request.id)}
                              >
                                메모 저장
                              </button>
                              <button
                                type="button"
                                className="card-link"
                                onClick={() => {
                                  setEditingRequestId('')
                                  setEditingNote('')
                                }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: 'var(--space-1)',
                              color: 'var(--fg-muted)',
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {request.note || '작성된 메모가 없습니다.'}
                          </div>
                        )}
                        {!isEditing ? (
                          <button
                            type="button"
                            className="card-link"
                            onClick={() => startEditingNote(request)}
                          >
                            메모 수정
                          </button>
                        ) : null}
                      </div>
                      <div
                        style={{
                          marginTop: 'var(--space-3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className="card-link"
                          onClick={() =>
                            updateRequestStatus(
                              request.id,
                              request.status === '완료' ? '완료' : getNextStatus(request.status),
                            )
                          }
                          disabled={isCompleted}
                        >
                          {isCompleted ? '처리 완료 상태' : nextStatusLabel(request.status)}
                        </button>
                        {!isCompleted ? (
                          <button
                            type="button"
                            className="card-link"
                            onClick={() => updateRequestStatus(request.id, '완료')}
                          >
                            바로 완료 처리
                          </button>
                        ) : null}
                        {request.status === '완료' ? (
                          <button
                            type="button"
                            className="card-link"
                            onClick={() =>
                              setRequests((current) =>
                                current.filter((item) => item.id !== request.id),
                              )
                            }
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="이용자 권리" subtitle="개인정보 주체로서의 권리를 안내합니다." />
        <ul className="public-check-list">
          {userRightItems.map((item) => (
            <li key={item}>
              <Icon name="check" size={14} />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="관련 정책 바로가기"
          subtitle="탐색 흐름을 함께 보면 더 빠르게 이해됩니다."
        />
        <div className="public-hero-actions">
          {onNavigate ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}
              >
                사용 가이드
                <Icon name="arrow-right" size={14} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('/tutorial', { source: 'hero', fromLanding: true })}
              >
                튜토리얼
                <Icon name="arrow-right" size={14} />
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigate('/terms', { source: 'hero', fromLanding: true })}
              >
                이용약관 보기
                <Icon name="arrow-right" size={14} />
              </Button>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

const requesterLabel = (request: PrivacyRequest) =>
  `${request.requester}(${request.contact}) · ${request.type} 요청`
