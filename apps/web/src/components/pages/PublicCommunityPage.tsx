import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { Badge, Button, Card, CardHeader, Icon, PageHeader } from '../ui'

import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type SortMode = 'latest' | 'popular' | 'reply' | 'views'

type CommunityThreadState = 'open' | 'closed'

type CommunityComment = {
  id: string
  author: string
  text: string
  at: string
  createdAt: number
}

type CommunityThreadCategory = '운영 팁' | '문제 해결' | '도입 상담' | '운영 정책'

type CommunityThread = {
  id: string
  title: string
  category: CommunityThreadCategory
  author: string
  at: string
  summary: string
  body: string
  likes: number
  views: number
  replies: CommunityComment[]
  tags: string[]
  createdAt: number
  state: CommunityThreadState
  isPinned: boolean
  reportCount: number
}

type CommunityThreadActionType =
  | 'view'
  | 'like'
  | 'comment'
  | 'publish'
  | 'pin'
  | 'close'
  | 'report'
  | 'delete_comment'
  | 'bookmark'
  | 'unbookmark'
  | 'blocked'
  | 'search'
  | 'category-filter'
  | 'state-filter'
  | 'sort-change'

type CommunityActionLog = {
  id: string
  threadId: string
  threadTitle: string
  action: CommunityThreadActionType
  at: number
  note?: string
}

type DraftPost = {
  title: string
  category: CommunityThreadCategory
  text: string
}

type ThreadFilterMode = '전체' | '열린 글' | '종료 글' | '고정 글' | '북마크 글' | '신고 많은 글'

type ReportReason = '스팸' | '욕설/비방' | '허위정보' | '개인정보침해' | '영리성 광고' | '기타'

type CommunityMission = {
  id: string
  title: string
  detail: string
  requiredAction: CommunityThreadActionType
  tone: 'accent' | 'neutral'
}

const COMMUNITY_DEMO_STORAGE = 'public-community-demo-v1'
const COMMUNITY_LIKE_STORAGE = 'public-community-liked-threads-v1'
const COMMUNITY_BOOKMARK_STORAGE = 'public-community-bookmarked-threads-v1'
const COMMUNITY_ACTIVITY_LOG_STORAGE = 'public-community-activity-log-v1'
const TERMS_CONSENT_STATUS_STORAGE = 'terms-consent-status-v1'
const REPORT_WARNING_THRESHOLD = 3
const MIN_POST_TITLE_LENGTH = 8
const MIN_POST_TEXT_LENGTH = 120
const MIN_REPLY_TEXT_LENGTH = 10
const MAX_POST_TITLE_LENGTH = 80
const MAX_POST_TEXT_LENGTH = 1_200
const MAX_REPLY_TEXT_LENGTH = 500
const MAX_REPORT_NOTE_LENGTH = 240
const MAX_LOG_ENTRIES = 64
const DEFAULT_REPORT_REASON: ReportReason = '스팸'
const DEMO_COMMENT_AUTHOR = '데모 사용자'
const TERMS_REQUIRED_SECTION_IDS = ['public-scope', 'access-control', 'data-policy'] as const
type TermsRequiredSectionId = (typeof TERMS_REQUIRED_SECTION_IDS)[number]
const now = Date.now()
const DAY_MS = 24 * 60 * 60 * 1000

const BASE_THREADS: CommunityThread[] = [
  {
    id: 't-001',
    title: '일정이 바뀌면 상태는 어디에 남겨야 하나요?',
    category: '문제 해결',
    author: '이현우 센터장',
    at: '3일 전',
    summary: '일정 변경 시 실무자 혼선을 줄이려면 기록·변경·메모를 한 화면에서 묶어 남겨야 합니다.',
    body: '일정 변경은 일정 수정 + 상태 전환 + 메모 3개 항목을 동시에 남겨야 추적이 쉬워집니다. 예를 들어 방문 지연이 발생하면 상태를 진행중→예정으로 바꾸고, 메모에 전화 확인 시간과 수정 이유를 남겨주세요.',
    likes: 14,
    views: 128,
    createdAt: now - DAY_MS * 3,
    state: 'open',
    isPinned: true,
    reportCount: 0,
    tags: ['일정', '메모', '담당자 인수인계'],
    replies: [
      {
        id: 'c-001',
        author: '관리자 도움',
        text: '담당자 변경 시 노트도 같이 남기면 좋습니다.',
        at: '2일 전',
        createdAt: now - DAY_MS * 2,
      },
      {
        id: 'c-002',
        author: '김서연',
        text: '상태 이전 사유를 간단히 남기면 월말 정산 점검에도 도움이 됩니다.',
        at: '1일 전',
        createdAt: now - DAY_MS * 1,
      },
    ],
  },
  {
    id: 't-002',
    title: '돌봄 기록 템플릿은 언제 기준을 바꿔야 하나요?',
    category: '운영 팁',
    author: '관리지원팀',
    at: '7일 전',
    summary: '대상별/시간대별 패턴이 다를수록 템플릿을 분기해 관리하면 정산 누락이 줄어듭니다.',
    body: '돌봄 유형별로 입력 항목을 분리하고, 일괄 템플릿은 최소 3개로 고정하세요. 방문, 원격 상담, 야간 돌봄은 체크 항목이 다르면 감사 기준 처리도 안정적입니다.',
    likes: 22,
    views: 95,
    createdAt: now - DAY_MS * 7,
    state: 'open',
    isPinned: false,
    reportCount: 1,
    tags: ['기록', '정산', '템플릿'],
    replies: [
      {
        id: 'c-003',
        author: '운영기획실',
        text: '실무팀이 가장 자주 쓰는 항목만 남기고 점차 추가하는 방식이 관리가 쉽습니다.',
        at: '5일 전',
        createdAt: now - DAY_MS * 5,
      },
    ],
  },
  {
    id: 't-003',
    title: '보험청구 상태가 멈춘 건이 계속 남아요',
    category: '문제 해결',
    author: '박민수',
    at: '12일 전',
    summary:
      '요청→검토중→승인 흐름에서 “검토중”이 오래 머무르면 제출 자료 체크리스트를 같이 남기세요.',
    body: '검토 상태 건은 보험사 반려 사유, 영수증 상태, 서류 재요청 항목을 기록해두면 다음 작업으로 넘어갈 때 기준을 놓치지 않습니다.',
    likes: 9,
    views: 63,
    createdAt: now - DAY_MS * 12,
    state: 'closed',
    isPinned: false,
    reportCount: 3,
    tags: ['보험청구', '검토', '상태 관리'],
    replies: [
      {
        id: 'c-004',
        author: '지원팀',
        text: '상태 변경 로그를 매일 1회 점검해두면 멈춤 건이 자연히 줄어듭니다.',
        at: '10일 전',
        createdAt: now - DAY_MS * 10,
      },
      {
        id: 'c-005',
        author: '박민수',
        text: '오케이, 다음 스프린트에서 이 규칙을 반영해보겠습니다.',
        at: '9일 전',
        createdAt: now - DAY_MS * 9,
      },
    ],
  },
]

const cloneSeedThreads = () =>
  BASE_THREADS.map((thread) => ({
    ...thread,
    replies: thread.replies.map((reply) => ({ ...reply })),
    tags: [...thread.tags],
  }))

const communityMissions: CommunityMission[] = [
  {
    id: 'view-thread',
    title: '글 상세 열람',
    detail: '목록에서 글을 선택해 상세 내용을 확인해 보세요.',
    requiredAction: 'view',
    tone: 'neutral',
  },
  {
    id: 'like-thread',
    title: '좋아요 반응',
    detail: '운영자가 반응을 남기면 협업 피드백이 누적됩니다.',
    requiredAction: 'like',
    tone: 'accent',
  },
  {
    id: 'comment-thread',
    title: '댓글 작성',
    detail: '선택 글에 댓글을 추가해 소통 동작이 저장되는지 확인하세요.',
    requiredAction: 'comment',
    tone: 'accent',
  },
  {
    id: 'report-thread',
    title: '신고 처리',
    detail: '의심되는 글을 신고해 검토 로그가 남는지 확인하세요.',
    requiredAction: 'report',
    tone: 'neutral',
  },
  {
    id: 'publish-thread',
    title: '새 글 작성',
    detail: '샘플 글을 등록해 커뮤니티 운영 플로우가 유지되는지 점검하세요.',
    requiredAction: 'publish',
    tone: 'accent',
  },
  {
    id: 'pin-thread',
    title: '글 고정 처리',
    detail: '운영 공지성 글을 상단 고정하여 우선 노출 흐름을 확인하세요.',
    requiredAction: 'pin',
    tone: 'neutral',
  },
  {
    id: 'bookmark-thread',
    title: '북마크 저장',
    detail: '중요 글을 북마크에 남겨 추후 점검 동작을 확인하세요.',
    requiredAction: 'bookmark',
    tone: 'accent',
  },
  {
    id: 'search-thread',
    title: '검색 탐색',
    detail: '검색창을 이용해 대상 글을 찾습니다.',
    requiredAction: 'search',
    tone: 'neutral',
  },
  {
    id: 'filter-thread',
    title: '필터 탐색',
    detail: '카테고리/상태 필터를 조정해 노출을 점검합니다.',
    requiredAction: 'category-filter',
    tone: 'neutral',
  },
  {
    id: 'sort-thread',
    title: '정렬 점검',
    detail: '정렬 기준을 바꿔 정렬 동작을 점검합니다.',
    requiredAction: 'sort-change',
    tone: 'neutral',
  },
]

const categoryList: readonly (CommunityThread['category'] | '전체')[] = [
  '전체',
  '운영 팁',
  '문제 해결',
  '도입 상담',
  '운영 정책',
] as const

type CommunitySort = {
  value: SortMode
  label: string
}

type ThreadFilterModeItem = {
  value: ThreadFilterMode
  label: string
}

const sortModes: CommunitySort[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '좋아요/댓글순' },
  { value: 'reply', label: '댓글 많은 순' },
  { value: 'views', label: '조회수 순' },
]

const threadFilterModes: ThreadFilterModeItem[] = [
  { value: '전체', label: '전체 보기' },
  { value: '열린 글', label: '열린 글' },
  { value: '종료 글', label: '종료 글' },
  { value: '고정 글', label: '고정 글' },
  { value: '북마크 글', label: '북마크 글' },
  { value: '신고 많은 글', label: '신고 많은 글' },
]

const reportReasonItems: { value: ReportReason; label: string; hint: string }[] = [
  { value: '스팸', label: '스팸', hint: '반복적/무의미한 홍보성 글인지 확인합니다.' },
  {
    value: '욕설/비방',
    label: '욕설/비방',
    hint: '운영 규칙을 위반하는 공격적 표현인지 확인합니다.',
  },
  { value: '허위정보', label: '허위정보', hint: '사실 확인이 필요한 내용인지 점검합니다.' },
  {
    value: '개인정보침해',
    label: '개인정보침해',
    hint: '개인 정보 노출 가능성이 있는지 확인합니다.',
  },
  {
    value: '영리성 광고',
    label: '영리성 광고',
    hint: '업무 목적과 무관한 영리성 게시물인지 확인합니다.',
  },
  { value: '기타', label: '기타', hint: '기타 이슈는 메모로 함께 남겨주세요.' },
]

const formatNumber = (value: number) => value.toLocaleString('ko-KR')

const formatRelativeTime = (value: number, baseline = Date.now()) => {
  const diffMs = Math.max(0, baseline - value)
  const mins = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (mins < 1) {
    return '방금 전'
  }
  if (mins < 60) {
    return `${mins}분 전`
  }
  if (hours < 24) {
    return `${hours}시간 전`
  }
  return `${days}일 전`
}

const normalizeText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const normalizeCategory = (value: unknown): CommunityThreadCategory => {
  if (
    value === '운영 팁' ||
    value === '문제 해결' ||
    value === '도입 상담' ||
    value === '운영 정책'
  ) {
    return value
  }
  return '운영 팁'
}

const normalizeThreadState = (value: unknown): CommunityThreadState =>
  value === 'closed' ? 'closed' : 'open'

const normalizeBoolean = (value: unknown): boolean => value === true

const normalizeCount = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0

const normalizeActionType = (value: unknown): CommunityThreadActionType | undefined => {
  if (
    value === 'view' ||
    value === 'like' ||
    value === 'comment' ||
    value === 'publish' ||
    value === 'pin' ||
    value === 'close' ||
    value === 'report' ||
    value === 'delete_comment' ||
    value === 'bookmark' ||
    value === 'unbookmark' ||
    value === 'blocked' ||
    value === 'search' ||
    value === 'category-filter' ||
    value === 'state-filter' ||
    value === 'sort-change'
  ) {
    return value
  }
  return undefined
}

const formatActionLabel = (action: CommunityThreadActionType) => {
  if (action === 'view') {
    return '조회'
  }
  if (action === 'like') {
    return '좋아요'
  }
  if (action === 'comment') {
    return '댓글'
  }
  if (action === 'publish') {
    return '글 작성'
  }
  if (action === 'pin') {
    return '고정 토글'
  }
  if (action === 'close') {
    return '종료 토글'
  }
  if (action === 'bookmark') {
    return '북마크'
  }
  if (action === 'unbookmark') {
    return '북마크 해제'
  }
  if (action === 'search') {
    return '검색'
  }
  if (action === 'blocked') {
    return '차단'
  }
  if (action === 'category-filter') {
    return '카테고리 필터'
  }
  if (action === 'state-filter') {
    return '상태 필터'
  }
  if (action === 'sort-change') {
    return '정렬 변경'
  }
  if (action === 'delete_comment') {
    return '댓글 삭제'
  }
  return '신고'
}

const makeActionId = () => `ca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const makeThreadId = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const makeReplyId = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0
  )
}

const normalizeComment = (
  raw: unknown,
  fallbackAt: number,
  index: number
): CommunityComment | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<CommunityComment> & { createdAt?: unknown }
  const createdAt =
    typeof candidate.createdAt === 'number' && candidate.createdAt > 0
      ? candidate.createdAt
      : fallbackAt

  return {
    id: normalizeText(candidate.id, `c-${Date.now()}-${index}`),
    author: normalizeText(candidate.author, '익명 사용자'),
    text: normalizeText(candidate.text, ''),
    at: normalizeText(candidate.at, formatRelativeTime(createdAt)),
    createdAt,
  }
}

const normalizeThread = (raw: unknown, index: number): CommunityThread | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const candidate = raw as Partial<CommunityThread> & { replies?: unknown; createdAt?: unknown }
  const createdAt =
    typeof candidate.createdAt === 'number' && candidate.createdAt > 0
      ? candidate.createdAt
      : now - index * DAY_MS * 1.2

  const replies = Array.isArray(candidate.replies)
    ? candidate.replies
        .map((reply, replyIndex) => normalizeComment(reply, createdAt, replyIndex))
        .filter((reply): reply is CommunityComment => Boolean(reply))
    : []

  return {
    id: normalizeText(candidate.id, `t-${now}-${index}`),
    title: normalizeText(candidate.title, '제목을 입력해 주세요.'),
    category: normalizeCategory(candidate.category),
    author: normalizeText(candidate.author, '익명 사용자'),
    at: normalizeText(candidate.at, formatRelativeTime(createdAt)),
    summary: normalizeText(
      candidate.summary,
      normalizeText(candidate.body, '내용을 입력해 주세요.').slice(0, 74)
    ),
    body: normalizeText(candidate.body, ''),
    likes: normalizeCount(candidate.likes),
    views: normalizeCount(candidate.views),
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tag): tag is string =>
          Boolean(typeof tag === 'string' && tag.trim().length > 0)
        )
      : ['운영'],
    replies,
    isPinned: normalizeBoolean(candidate.isPinned),
    state: normalizeThreadState(candidate.state),
    reportCount: normalizeCount(candidate.reportCount),
    createdAt,
  }
}

const isTermsSectionId = (value: unknown): value is TermsRequiredSectionId =>
  typeof value === 'string' && (TERMS_REQUIRED_SECTION_IDS as readonly string[]).includes(value)

type TermsConsentState = {
  agreedIds: TermsRequiredSectionId[]
}

const readTermsConsentState = (): TermsConsentState => {
  if (typeof window === 'undefined') {
    return { agreedIds: [] }
  }

  try {
    const raw = globalThis.localStorage.getItem(TERMS_CONSENT_STATUS_STORAGE)
    if (!raw) {
      return { agreedIds: [] }
    }

    const parsed = JSON.parse(raw) as Partial<{ agreedIds: unknown }>
    const agreedIds = Array.isArray(parsed.agreedIds)
      ? parsed.agreedIds.filter(isTermsSectionId)
      : []

    return { agreedIds }
  } catch {
    return { agreedIds: [] }
  }
}

const readCommunityActionLog = (): CommunityActionLog[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = globalThis.localStorage.getItem(COMMUNITY_ACTIVITY_LOG_STORAGE)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const next: CommunityActionLog[] = []

    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        continue
      }

      const candidate = item as Partial<CommunityActionLog> & { action?: unknown }
      const action = normalizeActionType(candidate.action)

      if (
        typeof candidate.id !== 'string' ||
        !candidate.id.trim() ||
        typeof candidate.threadId !== 'string' ||
        !candidate.threadId.trim() ||
        typeof candidate.threadTitle !== 'string' ||
        !candidate.threadTitle.trim() ||
        !action ||
        typeof candidate.at !== 'number'
      ) {
        continue
      }

      next.push({
        id: candidate.id,
        threadId: candidate.threadId,
        threadTitle: candidate.threadTitle,
        action,
        at: candidate.at,
        note: typeof candidate.note === 'string' ? candidate.note : undefined,
      })
    }

    return next.slice(-MAX_LOG_ENTRIES)
  } catch {
    return []
  }
}

const readLikedThreads = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = globalThis.localStorage.getItem(COMMUNITY_LIKE_STORAGE)
    return raw ? normalizeStringArray(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

const readBookmarkedThreads = (): string[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = globalThis.localStorage.getItem(COMMUNITY_BOOKMARK_STORAGE)
    return raw ? normalizeStringArray(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

const readCommunityThreads = (): CommunityThread[] => {
  if (typeof window === 'undefined') {
    return cloneSeedThreads()
  }

  try {
    const raw = globalThis.localStorage.getItem(COMMUNITY_DEMO_STORAGE)
    if (!raw) {
      return cloneSeedThreads()
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return cloneSeedThreads()
    }

    const normalized = parsed
      .map((item, index) => normalizeThread(item, index))
      .filter((item): item is CommunityThread => Boolean(item))

    return normalized.length ? normalized : cloneSeedThreads()
  } catch {
    return cloneSeedThreads()
  }
}

type PublicCommunityPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

const threadStateLabel = (state: CommunityThreadState) => (state === 'open' ? '열림' : '종료')

const threadStateTone = (state: CommunityThreadState) => (state === 'open' ? 'accent' : 'neutral')

const getStateFilter = (
  mode: ThreadFilterMode,
  thread: CommunityThread,
  bookmarkedIds: string[]
) => {
  if (mode === '전체') {
    return true
  }
  if (mode === '열린 글') {
    return thread.state === 'open'
  }
  if (mode === '종료 글') {
    return thread.state === 'closed'
  }
  if (mode === '고정 글') {
    return thread.isPinned
  }
  if (mode === '북마크 글') {
    return bookmarkedIds.includes(thread.id)
  }
  return thread.reportCount >= REPORT_WARNING_THRESHOLD
}

const trimBodySummary = (value: string) => `${value.slice(0, 74)}${value.length > 74 ? '…' : ''}`

export const PublicCommunityPage = ({ onNavigate }: PublicCommunityPageProps) => {
  const toastTimer = useRef<number | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<CommunityThread['category'] | '전체'>('전체')
  const [threadFilterMode, setThreadFilterMode] = useState<ThreadFilterMode>('전체')
  const [sortMode, setSortMode] = useState<SortMode>('latest')
  const termsConsent = useMemo(() => readTermsConsentState(), [])

  const [threads, setThreads] = useState<CommunityThread[]>(readCommunityThreads)
  const [threadActionLogs, setThreadActionLogs] =
    useState<CommunityActionLog[]>(readCommunityActionLog)
  const [likedThreadIds, setLikedThreadIds] = useState<string[]>(readLikedThreads)
  const [bookmarkedThreadIds, setBookmarkedThreadIds] = useState<string[]>(readBookmarkedThreads)
  const [selectedThreadId, setSelectedThreadId] = useState('')

  const [reportReason, setReportReason] = useState<ReportReason>(DEFAULT_REPORT_REASON)
  const [reportMemo, setReportMemo] = useState('')
  const [reportError, setReportError] = useState('')

  const [draft, setDraft] = useState<DraftPost>({
    title: '',
    category: '운영 팁',
    text: '',
  })
  const [draftError, setDraftError] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [replyError, setReplyError] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const isTermsReady = useMemo(
    () => TERMS_REQUIRED_SECTION_IDS.every((id) => termsConsent.agreedIds.includes(id)),
    [termsConsent]
  )
  const missionProgress = useMemo(
    () =>
      communityMissions.map((mission) => ({
        ...mission,
        completed: threadActionLogs.some((entry) => entry.action === mission.requiredAction),
      })),
    [threadActionLogs]
  )
  const missionRate = useMemo(
    () =>
      Math.round(
        (missionProgress.filter((mission) => mission.completed).length / missionProgress.length) *
          100
      ),
    [missionProgress]
  )
  const threadActionSummary = useMemo(
    () => ({
      viewCount: threadActionLogs.filter((item) => item.action === 'view').length,
      likeCount: threadActionLogs.filter((item) => item.action === 'like').length,
      commentCount: threadActionLogs.filter((item) => item.action === 'comment').length,
      reportCount: threadActionLogs.filter((item) => item.action === 'report').length,
      publishCount: threadActionLogs.filter((item) => item.action === 'publish').length,
      pinCount: threadActionLogs.filter((item) => item.action === 'pin').length,
      closeCount: threadActionLogs.filter((item) => item.action === 'close').length,
      bookmarkCount: threadActionLogs.filter((item) => item.action === 'bookmark').length,
      unbookmarkCount: threadActionLogs.filter((item) => item.action === 'unbookmark').length,
      searchCount: threadActionLogs.filter((item) => item.action === 'search').length,
      categoryFilterCount: threadActionLogs.filter((item) => item.action === 'category-filter')
        .length,
      stateFilterCount: threadActionLogs.filter((item) => item.action === 'state-filter').length,
      sortChangeCount: threadActionLogs.filter((item) => item.action === 'sort-change').length,
      blockedCount: threadActionLogs.filter((item) => item.action === 'blocked').length,
    }),
    [threadActionLogs]
  )

  const filteredThreads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const matched = threads.filter((thread) => {
      const matchCategory =
        activeCategory === '전체'
          ? true
          : thread.category === activeCategory || thread.tags.includes(activeCategory)

      if (!matchCategory || !getStateFilter(threadFilterMode, thread, bookmarkedThreadIds)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const target = `${thread.title} ${thread.summary} ${thread.body} ${thread.author} ${thread.tags.join(' ')}`
      return target.toLowerCase().includes(normalizedQuery)
    })

    const sorted = [...matched].sort((left, right) => {
      const pinned = Number(right.isPinned) - Number(left.isPinned)
      if (pinned !== 0) {
        return pinned
      }

      if (sortMode === 'latest') {
        return right.createdAt - left.createdAt
      }

      if (sortMode === 'popular') {
        const leftScore = left.likes * 3 + left.replies.length
        const rightScore = right.likes * 3 + right.replies.length
        if (leftScore === rightScore) {
          return right.createdAt - left.createdAt
        }
        return rightScore - leftScore
      }

      if (sortMode === 'reply') {
        if (right.replies.length === left.replies.length) {
          return right.createdAt - left.createdAt
        }
        return right.replies.length - left.replies.length
      }

      if (sortMode === 'views') {
        if (right.views === left.views) {
          return right.createdAt - left.createdAt
        }
        return right.views - left.views
      }

      return right.createdAt - left.createdAt
    })

    return sorted
  }, [searchQuery, activeCategory, sortMode, threadFilterMode, threads, bookmarkedThreadIds])

  const demoStats = useMemo(
    () => [
      {
        label: '등록된 글',
        value: formatNumber(threads.length),
      },
      {
        label: '주제 수',
        value: formatNumber(
          threads.length ? [...new Set(threads.map((thread) => thread.category))].length : 0
        ),
      },
      {
        label: '총 조회',
        value: formatNumber(threads.reduce((sum, thread) => sum + thread.views, 0)),
      },
      {
        label: '총 좋아요',
        value: formatNumber(threads.reduce((sum, thread) => sum + thread.likes, 0)),
      },
      {
        label: '북마크 글',
        value: formatNumber(bookmarkedThreadIds.length),
      },
    ],
    [threads, bookmarkedThreadIds]
  )

  const sortedCategoryCount = useMemo(
    () =>
      categoryList
        .filter((category) => category !== '전체')
        .map((category) => ({
          category,
          total: threads.filter((thread) => thread.category === category).length,
        })),
    [threads]
  )

  const recentActivity = useMemo(
    () => [...threadActionLogs].sort((left, right) => right.at - left.at).slice(0, 8),
    [threadActionLogs]
  )
  const recentBlockedActivity = useMemo(
    () => recentActivity.filter((item) => item.action === 'blocked'),
    [recentActivity]
  )

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? filteredThreads[0],
    [filteredThreads, selectedThreadId, threads]
  )

  const resetReportDraft = () => {
    setReportReason(DEFAULT_REPORT_REASON)
    setReportMemo('')
    setReportError('')
  }

  const requireTerms = (action: string, thread: CommunityThread | undefined, detail = '') => {
    if (isTermsReady) {
      return true
    }

    appendActionLog(thread, 'blocked', detail || `약관 미동의로 ${action} 차단`)
    showFeedback(`필수 약관 동의 후에만 ${action}할 수 있어요.`)
    return false
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      globalThis.localStorage.setItem(COMMUNITY_DEMO_STORAGE, JSON.stringify(threads))
    } catch {
      // ignore
    }
  }, [threads])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      globalThis.localStorage.setItem(COMMUNITY_ACTIVITY_LOG_STORAGE, JSON.stringify(threadActionLogs))
    } catch {
      // ignore
    }
  }, [threadActionLogs])

  const persistLikedThreads = (next: string[]) => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      globalThis.localStorage.setItem(COMMUNITY_LIKE_STORAGE, JSON.stringify(next))
    } catch {
      // ignore storage failures
    }
  }

  const persistBookmarkedThreads = (next: string[]) => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      globalThis.localStorage.setItem(COMMUNITY_BOOKMARK_STORAGE, JSON.stringify(next))
    } catch {
      // ignore storage failures
    }
  }

  const showFeedback = (message: string) => {
    setFeedbackMessage(message)
    if (typeof window === 'undefined') {
      return
    }
    if (toastTimer.current) {
      globalThis.clearTimeout(toastTimer.current)
    }
    toastTimer.current = globalThis.setTimeout(() => setFeedbackMessage(''), 1600)
  }

  const appendActionLog = (
    thread: Pick<CommunityThread, 'id' | 'title'> | undefined,
    action: CommunityThreadActionType,
    note?: string
  ) => {
    const targetThread = thread ?? threads[0]
    if (!targetThread) {
      return
    }

    setThreadActionLogs((current) => {
      const next = [
        ...current,
        {
          id: makeActionId(),
          threadId: targetThread.id,
          threadTitle: targetThread.title,
          action,
          at: Date.now(),
          note,
        },
      ]
      return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next
    })
  }

  const updateThread = (
    threadId: string,
    updater: (thread: CommunityThread) => CommunityThread
  ) => {
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? updater(thread) : thread))
    )
  }

  const handleSelectThread = (threadId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      showFeedback('선택한 글을 찾을 수 없습니다.')
      return
    }
    if (threadId === selectedThreadId) {
      return
    }

    setSelectedThreadId(threadId)
    resetReportDraft()
    updateThread(threadId, (thread) => ({
      ...thread,
      views: thread.views + 1,
    }))
    appendActionLog(target, 'view', '상세 보기 이동')
  }

  const handleLike = (threadId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    if (target.state === 'closed') {
      showFeedback('종료 글은 좋아요 기능이 비활성화됩니다.')
      return
    }

    if (!requireTerms('좋아요', target)) {
      return
    }

    const isLiked = likedThreadIds.includes(threadId)
    setLikedThreadIds((current) => {
      const next = isLiked ? current.filter((value) => value !== threadId) : [...current, threadId]
      persistLikedThreads(next)
      return next
    })

    updateThread(threadId, (thread) => ({
      ...thread,
      likes: isLiked ? Math.max(thread.likes - 1, 0) : thread.likes + 1,
    }))

    appendActionLog(target, 'like', isLiked ? '좋아요 취소' : '좋아요 등록')
    showFeedback(isLiked ? '좋아요를 취소했습니다.' : '좋아요를 반영했습니다.')
  }

  const handleTogglePin = (threadId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    if (!requireTerms('고정 토글', target)) {
      return
    }

    updateThread(threadId, (thread) => ({ ...thread, isPinned: !thread.isPinned }))
    appendActionLog(target, 'pin', target.isPinned ? '고정 해제' : '고정 설정')
    showFeedback(target.isPinned ? '상단 고정 해제했습니다.' : '상단 고정을 적용했습니다.')
  }

  const handleToggleClose = (threadId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    if (!requireTerms('상태 전환', target)) {
      return
    }

    updateThread(threadId, (thread) => ({
      ...thread,
      state: thread.state === 'open' ? 'closed' : 'open',
    }))
    appendActionLog(target, 'close', target.state === 'open' ? '종료 처리' : '재개 처리')
    showFeedback(target.state === 'open' ? '해당 글을 종료했습니다.' : '해당 글을 다시 열었습니다.')
  }

  const handleToggleBookmark = (threadId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    if (!requireTerms('북마크', target)) {
      return
    }

    const isBookmarked = bookmarkedThreadIds.includes(threadId)
    setBookmarkedThreadIds((current) => {
      const next = isBookmarked
        ? current.filter((value) => value !== threadId)
        : [...current, threadId]
      persistBookmarkedThreads(next)
      return next
    })

    appendActionLog(
      target,
      isBookmarked ? 'unbookmark' : 'bookmark',
      isBookmarked ? '북마크 해제' : '북마크 등록'
    )
    showFeedback(isBookmarked ? '북마크를 해제했습니다.' : '북마크를 추가했습니다.')
  }

  const handleReport = (threadId: string, reason: ReportReason, memo = '') => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    if (!requireTerms('신고 처리', target)) {
      return
    }

    const trimmedMemo = memo.trim()
    if (trimmedMemo.length > MAX_REPORT_NOTE_LENGTH) {
      setReportError(`신고 메모는 ${MAX_REPORT_NOTE_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    const nextCount = target.reportCount + 1
    const shouldAutoClose = target.state === 'open' && nextCount >= REPORT_WARNING_THRESHOLD

    updateThread(threadId, (thread) => ({
      ...thread,
      reportCount: nextCount,
      state: shouldAutoClose ? 'closed' : thread.state,
    }))

    const reportNote = [reason, trimmedMemo || '메모 없음'].filter(Boolean).join(' · ')
    appendActionLog(target, 'report', `신고 사유: ${reportNote}`)

    if (shouldAutoClose) {
      appendActionLog(target, 'close', '신고 임계치 도달로 자동 종료')
    }

    setReportMemo('')
    setReportError('')
    showFeedback(
      shouldAutoClose
        ? `신고가 접수되었고 임계치(${REPORT_WARNING_THRESHOLD}건)로 자동 종료 처리되었습니다.`
        : '신고가 접수되어 운영 로그에 남았습니다.'
    )
  }

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedThread) {
      setReportError('신고할 글이 선택되지 않았습니다.')
      return
    }

    if (!reportReason) {
      setReportError('신고 사유를 선택해 주세요.')
      return
    }

    if (!requireTerms('신고 처리', selectedThread, '신고 폼 제출 차단')) {
      return
    }

    handleReport(selectedThread.id, reportReason, reportMemo)
  }

  const deleteComment = (threadId: string, commentId: string) => {
    const target = threads.find((thread) => thread.id === threadId)
    if (!target) {
      return
    }

    const targetReply = target.replies.find((reply) => reply.id === commentId)
    if (!targetReply) {
      return
    }

    if (!requireTerms('댓글 삭제', target, '댓글 삭제 차단')) {
      return
    }

    if (targetReply.author !== DEMO_COMMENT_AUTHOR) {
      showFeedback('본인 댓글만 삭제할 수 있습니다.')
      return
    }

    updateThread(threadId, (thread) => ({
      ...thread,
      replies: thread.replies.filter((reply) => reply.id !== commentId),
    }))
    appendActionLog(target, 'delete_comment', `댓글 ${commentId} 삭제`)
    showFeedback('댓글이 삭제되었습니다.')
  }

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedThread) {
      setReplyError('댓글을 작성할 글이 선택되지 않았습니다.')
      return
    }

    if (selectedThread.state === 'closed') {
      setReplyError('종료 글에는 댓글을 남길 수 없습니다.')
      return
    }

    if (!requireTerms('댓글 작성', selectedThread, '댓글 등록 차단')) {
      return
    }

    const text = replyDraft.trim()
    if (!text) {
      setReplyError('댓글 내용을 입력해 주세요.')
      return
    }

    if (text.length < MIN_REPLY_TEXT_LENGTH) {
      setReplyError(`댓글은 최소 ${MIN_REPLY_TEXT_LENGTH}자 이상 입력해 주세요.`)
      return
    }

    if (text.length > MAX_REPLY_TEXT_LENGTH) {
      setReplyError(`댓글은 ${MAX_REPLY_TEXT_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    const replyId = makeReplyId()
    setThreads((current) =>
      current.map((thread) => {
        if (thread.id !== selectedThread.id) {
          return thread
        }
        const createdAt = Date.now()
        return {
          ...thread,
          replies: [
            ...thread.replies,
            {
              id: replyId,
              author: DEMO_COMMENT_AUTHOR,
              text,
              at: '방금 전',
              createdAt,
            },
          ],
        }
      })
    )

    appendActionLog(selectedThread, 'comment', `입력 길이 ${text.length}`)
    setReplyDraft('')
    setReplyError('')
    showFeedback('댓글이 저장되었습니다.')
  }

  const submitPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = draft.title.trim()
    const text = draft.text.trim()

    if (!title || !text) {
      setDraftError('제목과 내용을 모두 입력해 주세요.')
      return
    }

    if (title.length < MIN_POST_TITLE_LENGTH) {
      setDraftError(`제목은 최소 ${MIN_POST_TITLE_LENGTH}자 이상 입력해 주세요.`)
      return
    }

    if (title.length > MAX_POST_TITLE_LENGTH) {
      setDraftError(`제목은 ${MAX_POST_TITLE_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    if (text.length < MIN_POST_TEXT_LENGTH) {
      setDraftError(`내용은 최소 ${MIN_POST_TEXT_LENGTH}자 이상 입력해 주세요.`)
      return
    }

    if (text.length > MAX_POST_TEXT_LENGTH) {
      setDraftError(`내용은 ${MAX_POST_TEXT_LENGTH}자 이하로 입력해 주세요.`)
      return
    }

    if (!requireTerms('글 등록', undefined, '글 등록 차단')) {
      return
    }

    const threadId = makeThreadId()
    setThreads((current) => {
      const createdAt = Date.now()
      const newThread: CommunityThread = {
        id: threadId,
        title,
        category: draft.category,
        author: DEMO_COMMENT_AUTHOR,
        at: '방금 전',
        summary: trimBodySummary(text),
        body: text,
        likes: 0,
        views: 0,
        tags: [draft.category === '운영 팁' ? '운영팁' : draft.category],
        replies: [],
        createdAt,
        state: 'open',
        isPinned: false,
        reportCount: 0,
      }
      return [newThread, ...current]
    })
    setSelectedThreadId(threadId)
    appendActionLog({ id: threadId, title }, 'publish')
    setDraft((current) => ({ ...current, title: '', text: '' }))
    setDraftError('')
    resetReportDraft()
    showFeedback('게시글이 등록되었습니다.')
  }

  const handleSetSort = (value: SortMode) => {
    setSortMode(value)
    appendActionLog(
      undefined,
      'sort-change',
      `정렬 변경: ${sortModes.find((mode) => mode.value === value)?.label}`
    )
    showFeedback(`${sortModes.find((mode) => mode.value === value)?.label}로 정렬했습니다.`)
  }

  const clearActionLogs = () => {
    setThreadActionLogs([])
    showFeedback('활동 로그를 삭제했습니다.')
  }

  const resetDemo = () => {
    const seedThreads = cloneSeedThreads()
    setThreads(seedThreads)
    setSelectedThreadId(seedThreads[0]?.id ?? '')
    setThreadActionLogs([])
    setLikedThreadIds([])
    setBookmarkedThreadIds([])
    persistLikedThreads([])
    persistBookmarkedThreads([])
    resetReportDraft()
    setDraft({
      title: '',
      category: '운영 팁',
      text: '',
    })
    setDraftError('')
    setReplyDraft('')
    setReplyError('')
    setSearchQuery('')
    setActiveCategory('전체')
    setThreadFilterMode('전체')
    setSortMode('latest')
    if (typeof window !== 'undefined') {
      try {
        globalThis.localStorage.removeItem(COMMUNITY_DEMO_STORAGE)
        globalThis.localStorage.removeItem(COMMUNITY_ACTIVITY_LOG_STORAGE)
      } catch {
        // ignore
      }
    }
    showFeedback('데모를 기본 샘플 데이터로 초기화했습니다.')
  }

  useEffect(() => {
    if (feedbackMessage === '') {
      return
    }

    return () => {
      if (toastTimer.current) {
        globalThis.clearTimeout(toastTimer.current)
      }
    }
  }, [feedbackMessage])

  useEffect(
    () => () => {
      if (toastTimer.current) {
        globalThis.clearTimeout(toastTimer.current)
      }
    },
    []
  )

  const isCurrentSelectionLiked = selectedThread
    ? likedThreadIds.includes(selectedThread.id)
    : false
  const isCurrentSelectionBookmarked = selectedThread
    ? bookmarkedThreadIds.includes(selectedThread.id)
    : false

  return (
    <div className="stack">
      <PageHeader
        eyebrow="커뮤니티 데모"
        title="실제 운영에서 쓰는 소통 기능을 먼저 봅니다"
        description="게시글 작성, 댓글, 좋아요, 고정/종료 처리, 신고 및 로그까지 한 번에 점검할 수 있는 공개 데모입니다."
        actions={
          <Button
            variant="secondary"
            onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}
          >
            로그인 후 데모로 이동
            <Icon name="arrow-right" size={16} />
          </Button>
        }
      />

      <section className="public-band" aria-label="커뮤니티 통계">
        <div className="public-section-head">
          <p className="page-eyebrow">커뮤니티 미리보기</p>
          <h2>운영 커뮤니티의 데모 동선</h2>
          <p>
            운영 공지·질의응답·신고 처리까지 실제 운영에서 자주 반복되는 동작을 동일한 규칙으로
            점검합니다.
          </p>
        </div>

        <div className="public-metric-list public-metric-list--narrow">
          {demoStats.map((item) => (
            <article className="public-metric-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>샘플 데이터 기준 계산값</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          <h3>주제별 분포</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {sortedCategoryCount.map((item) => (
              <span className="text-xs font-semibold text-fg-subtle" key={item.category}>
                {item.category} {item.total}건
              </span>
            ))}
          </div>
        </div>

        {feedbackMessage ? (
          <p
            role="status"
            className="feedback feedback-warning"
            style={{ marginTop: 'var(--space-3)' }}
          >
            {feedbackMessage}
          </p>
        ) : null}

        <Card>
          <CardHeader
            title="커뮤니티 데모 미션"
            subtitle={`완료 ${missionProgress.filter((mission) => mission.completed).length}/${missionProgress.length}`}
          />
          <div className="guide-progress" aria-live="polite" aria-atomic="true">
            <div className="guide-progress-head">
              <span>진행률</span>
              <strong>{missionRate}%</strong>
            </div>
            <div className="guide-progress-track" style={{ marginTop: 0 }}>
              <span style={{ width: `${missionRate}%` }} />
            </div>
            <p className="text-sm text-fg-muted" style={{ marginTop: 'var(--space-2)' }}>
              데모 동작 요약: 조회 {threadActionSummary.viewCount}건 · 좋아요{' '}
              {threadActionSummary.likeCount}건 · 댓글 {threadActionSummary.commentCount}건 · 신고{' '}
              {threadActionSummary.reportCount}건 · 글작성 {threadActionSummary.publishCount}건 ·
              고정 {threadActionSummary.pinCount}건 · 종료 {threadActionSummary.closeCount}건 ·
              북마크 {threadActionSummary.bookmarkCount}건 · 북마크해제{' '}
              {threadActionSummary.unbookmarkCount}건 · 검색 {threadActionSummary.searchCount}건 ·
              카테고리 필터 {threadActionSummary.categoryFilterCount}건 · 상태 필터{' '}
              {threadActionSummary.stateFilterCount}건 · 정렬 변경{' '}
              {threadActionSummary.sortChangeCount}건 · 차단 {threadActionSummary.blockedCount}건
            </p>
            {recentBlockedActivity.length > 0 ? (
              <p
                className="text-sm"
                style={{ marginTop: 'var(--space-1)', color: 'var(--c-warn-fg)' }}
              >
                약관 미동의 차단 {recentBlockedActivity.length}건 · 필수 조항 동의 후 같은 동작을
                다시 실행하세요.
              </p>
            ) : null}
          </div>
          <ul className="guide-checklist">
            {missionProgress.map((mission) => (
              <li key={mission.id}>
                <label className="guide-check-item">
                  <input type="checkbox" checked={mission.completed} readOnly />
                  <Icon
                    name={mission.completed ? 'check' : 'clock'}
                    size={16}
                    aria-hidden="true"
                    style={{
                      marginTop: '0.15rem',
                      color: mission.completed ? 'var(--accent)' : 'var(--fg-muted)',
                    }}
                  />
                  <div>
                    <strong>{mission.title}</strong>
                    <p
                      className="text-sm text-fg-muted"
                      style={{
                        marginTop: 'var(--space-1)',
                        marginBottom: 0,
                        color: 'var(--fg-muted)',
                      }}
                    >
                      {mission.detail}
                    </p>
                    <Badge tone={mission.completed ? mission.tone : 'neutral'} plain>
                      {mission.completed ? '완료' : '미완료'}
                    </Badge>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" onClick={clearActionLogs}>
              로그 삭제
            </Button>
            <Button
              variant={missionRate === 100 ? 'primary' : 'secondary'}
              size="sm"
              onClick={resetDemo}
            >
              데모 초기화
            </Button>
          </div>
        </Card>
      </section>

      <section className="public-band">
        <div className="public-section-head" style={{ marginBottom: 'var(--space-4)' }}>
          <p className="page-eyebrow">실시간 운영형 데모</p>
          <h2>커뮤니티를 직접 다루어 보는 흐름</h2>
        </div>

        <div className="public-community-layout">
          <Card>
            <CardHeader
              title="토론 목록"
              subtitle="카테고리·상태·정렬을 바꿔 글이 어떻게 보이는지 바로 확인하세요."
            />

            <div className="public-community-toolbar" role="search" aria-label="커뮤니티 검색">
              <input
                type="search"
                placeholder="제목/요약/작성자/태그로 검색"
                value={searchQuery}
                onChange={(event) => {
                  const next = event.target.value
                  if (!searchQuery && next.trim()) {
                    appendActionLog(undefined, 'search', '검색어 입력 시작')
                  }
                  setSearchQuery(next)
                }}
                className="public-community-search"
                aria-label="커뮤니티 검색"
              />

              <div className="public-community-filters" aria-label="카테고리 필터">
                {categoryList.map((category) => (
                  <button
                    type="button"
                    className={`public-community-filter ${activeCategory === category ? 'is-active' : ''}`}
                    key={category}
                    onClick={() => {
                      if (activeCategory !== category) {
                        setActiveCategory(category)
                        appendActionLog(undefined, 'category-filter', `카테고리 필터: ${category}`)
                      }
                    }}
                  >
                    <Badge tone={activeCategory === category ? 'accent' : 'neutral'} plain>
                      {category}
                    </Badge>
                  </button>
                ))}
              </div>

              <div
                className="public-community-filters"
                aria-label="상태 필터"
                style={{ marginTop: 'var(--space-2)' }}
              >
                {threadFilterModes.map((mode) => (
                  <button
                    type="button"
                    className={`public-community-filter ${threadFilterMode === mode.value ? 'is-active' : ''}`}
                    key={mode.value}
                    onClick={() => {
                      if (threadFilterMode !== mode.value) {
                        setThreadFilterMode(mode.value)
                        appendActionLog(undefined, 'state-filter', `상태 필터: ${mode.label}`)
                      }
                    }}
                  >
                    <Badge tone={threadFilterMode === mode.value ? 'accent' : 'neutral'} plain>
                      {mode.label}
                    </Badge>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2" aria-label="정렬 기준">
                {sortModes.map((mode) => (
                  <button
                    type="button"
                    key={mode.value}
                    className={sortMode === mode.value ? 'is-active' : ''}
                    onClick={() => handleSetSort(mode.value)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="public-community-list" aria-live="polite">
              {filteredThreads.length === 0 ? (
                <p className="public-faq-empty" role="status">
                  조건과 일치하는 글이 없습니다. 검색어를 줄이거나 필터를 바꿔보세요.
                </p>
              ) : (
                filteredThreads.map((thread) => (
                  <article
                    className={`public-community-thread ${
                      thread.id === selectedThread?.id ? 'public-community-thread--active' : ''
                    }`}
                    key={thread.id}
                  >
                    <button
                      type="button"
                      className="public-community-thread-button"
                      onClick={() => handleSelectThread(thread.id)}
                    >
                      <div className="public-community-thread-meta">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{thread.category}</span>
                          {thread.isPinned ? (
                            <Badge tone="accent" plain>
                              고정
                            </Badge>
                          ) : null}
                          {bookmarkedThreadIds.includes(thread.id) ? (
                            <Badge tone="success" plain>
                              북마크
                            </Badge>
                          ) : null}
                          <Badge tone={threadStateTone(thread.state)} plain>
                            {threadStateLabel(thread.state)}
                          </Badge>
                        </div>
                        <strong>{thread.title}</strong>
                        <small>
                          {thread.author} · {formatRelativeTime(thread.createdAt)}
                        </small>
                        <small>
                          조회 {formatNumber(thread.views)} · 좋아요 {formatNumber(thread.likes)} ·
                          댓글 {formatNumber(thread.replies.length)} · 신고{' '}
                          {formatNumber(thread.reportCount)}
                        </small>
                      </div>
                      <p>{thread.summary}</p>
                      <div className="public-community-tag-wrap">
                        {thread.tags.map((tag) => (
                          <Badge key={tag} tone="neutral" plain>
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  </article>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="선택된 글 보기"
              subtitle={
                selectedThread
                  ? '좋아요/댓글·종료 처리·신고까지 동작을 점검하세요.'
                  : '글을 선택해 주세요.'
              }
              action={
                selectedThread ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}
                  >
                    운영 가이드 보기
                    <Icon name="arrow-right" size={14} />
                  </Button>
                ) : null
              }
            />

            {selectedThread ? (
              <div className="public-community-detail">
                <div className="public-community-detail-head">
                  <p>
                    <strong>{selectedThread.title}</strong>
                  </p>
                  <p>
                    {selectedThread.category} · 작성자 {selectedThread.author} ·{' '}
                    {formatRelativeTime(selectedThread.createdAt)}
                  </p>
                  <div
                    className="public-community-tag-wrap"
                    style={{ marginTop: 'var(--space-2)' }}
                  >
                    <Badge tone={threadStateTone(selectedThread.state)} plain>
                      상태: {threadStateLabel(selectedThread.state)}
                    </Badge>
                    <Badge tone={selectedThread.isPinned ? 'accent' : 'neutral'} plain>
                      {selectedThread.isPinned ? '고정' : '일반'}
                    </Badge>
                    {isCurrentSelectionBookmarked ? (
                      <Badge tone="accent" plain>
                        북마크
                      </Badge>
                    ) : null}
                    <span className="text-xs font-semibold text-fg-subtle" aria-label="조회수">
                      조회 {formatNumber(selectedThread.views)}
                    </span>
                  </div>
                </div>

                <p>{selectedThread.body}</p>

                <div className="public-community-action-row">
                  <button
                    type="button"
                    className="public-community-action-btn"
                    onClick={() => handleLike(selectedThread.id)}
                    aria-pressed={isCurrentSelectionLiked}
                    disabled={selectedThread.state === 'closed'}
                  >
                    <Icon name="heart" size={16} />
                    좋아요 {formatNumber(selectedThread.likes)}
                  </button>
                  <Button
                    variant="ghost"
                    className="public-community-action-btn"
                    size="sm"
                    onClick={() => handleTogglePin(selectedThread.id)}
                  >
                    {selectedThread.isPinned ? '고정 해제' : '고정'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="public-community-action-btn"
                    size="sm"
                    onClick={() => handleToggleBookmark(selectedThread.id)}
                  >
                    {isCurrentSelectionBookmarked ? '북마크 해제' : '북마크'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="public-community-action-btn"
                    size="sm"
                    onClick={() => handleToggleClose(selectedThread.id)}
                  >
                    {selectedThread.state === 'open' ? '종료로 전환' : '다시 오픈'}
                  </Button>
                  <span
                    className="public-community-action-btn"
                    role="status"
                    aria-live="polite"
                    aria-label="신고 접수 수"
                  >
                    신고 {formatNumber(selectedThread.reportCount)}
                  </span>
                </div>

                <ul className="public-community-replies" aria-label="댓글 목록">
                  {selectedThread.replies.length === 0 ? (
                    <li>
                      <p>아직 댓글이 없습니다.</p>
                    </li>
                  ) : (
                    selectedThread.replies.map((reply) => (
                      <li key={reply.id}>
                        <p>
                          <strong>{reply.author}</strong>
                          <small> · {formatRelativeTime(reply.createdAt)}</small>
                          {reply.author === DEMO_COMMENT_AUTHOR ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteComment(selectedThread.id, reply.id)}
                            >
                              삭제
                            </Button>
                          ) : null}
                        </p>
                        <p>{reply.text}</p>
                      </li>
                    ))
                  )}
                </ul>

                <form className="public-community-reply-form" onSubmit={submitComment} noValidate>
                  <label className="public-lead-form">
                    새 댓글 입력
                    <textarea
                      className="public-community-textarea"
                      value={replyDraft}
                      onChange={(event) => {
                        setReplyDraft(event.target.value)
                        setReplyError('')
                      }}
                      rows={3}
                      maxLength={MAX_REPLY_TEXT_LENGTH}
                      placeholder={
                        selectedThread.state === 'closed'
                          ? '종료 글에는 댓글을 입력할 수 없습니다.'
                          : '댓글은 운영 규칙에 맞춰 간결하게 작성해보세요.'
                      }
                      disabled={selectedThread.state === 'closed'}
                    />
                  </label>
                  <p className="text-xs text-fg-muted">
                    {replyDraft.length} / {MAX_REPLY_TEXT_LENGTH}자
                  </p>
                  {replyError ? <p className="public-faq-answer is-open">{replyError}</p> : null}
                  <Button type="submit" size="sm" disabled={selectedThread.state === 'closed'}>
                    댓글 등록
                  </Button>
                </form>

                <form className="public-community-reply-form" onSubmit={submitReport} noValidate>
                  <label className="public-lead-form">
                    신고 사유
                    <select
                      className="public-community-select"
                      value={reportReason}
                      onChange={(event) => {
                        setReportReason(event.target.value as ReportReason)
                        setReportError('')
                      }}
                      aria-label="신고 사유"
                    >
                      {reportReasonItems.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="public-lead-form">
                    신고 메모
                    <textarea
                      className="public-community-textarea"
                      value={reportMemo}
                      onChange={(event) => {
                        setReportMemo(event.target.value)
                        setReportError('')
                      }}
                      rows={3}
                      maxLength={MAX_REPORT_NOTE_LENGTH}
                      aria-label="신고 메모"
                      placeholder="신고 판단에 필요한 핵심 증거를 간단히 남겨보세요."
                    />
                    <small>
                      {reportMemo.length} / {MAX_REPORT_NOTE_LENGTH}자
                    </small>
                  </label>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 'var(--text-sm)' }}>
                    {reportReasonItems.find((item) => item.value === reportReason)?.hint}
                  </p>
                  {reportError ? <p className="public-faq-answer is-open">{reportError}</p> : null}
                  <Button type="submit" size="sm">
                    신고 처리
                  </Button>
                </form>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <section className="public-band">
        <Card>
          <CardHeader
            title="데모 글 작성"
            subtitle="실제 기능처럼 동작하는 샘플 입력 흐름을 확인하세요."
          />
          <form className="public-community-form" onSubmit={submitPost} noValidate>
            <label className="public-lead-form">
              제목
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="예: 야간 돌봄 정산 체크포인트를 이렇게 씁니다"
                aria-label="커뮤니티 글 제목"
                maxLength={MAX_POST_TITLE_LENGTH}
              />
              <small>
                {draft.title.length} / {MAX_POST_TITLE_LENGTH}자
              </small>
            </label>
            <label className="public-lead-form">
              카테고리
              <select
                className="public-community-select"
                value={draft.category}
                aria-label="글 카테고리"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as CommunityThread['category'],
                  }))
                }
              >
                {categoryList
                  .filter((category) => category !== '전체')
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </label>
            <label className="public-lead-form">
              내용
              <textarea
                className="public-community-textarea"
                value={draft.text}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, text: event.target.value }))
                }
                rows={6}
                maxLength={MAX_POST_TEXT_LENGTH}
                placeholder="운영에서 실제로 공유하고 싶은 포인트를 2~3문장으로 남겨보세요."
                aria-label="커뮤니티 글 내용"
              />
              <small>
                {draft.text.length} / {MAX_POST_TEXT_LENGTH}자
              </small>
            </label>

            {draftError ? <p className="public-faq-answer is-open">{draftError}</p> : null}

            <Button type="submit">글 등록 (샘플 저장)</Button>
          </form>
        </Card>
      </section>

      <section className="public-band">
        <Card>
          <CardHeader
            title="데모 활동 로그"
            subtitle="조회·좋아요·댓글·핀/종료/신고 동작이 어떻게 남는지 확인하세요."
          />
          {recentActivity.length === 0 ? (
            <p className="public-faq-empty" role="status">
              아직 데모 활동이 없습니다. 글을 선택하거나 동작을 시도하면 로그가 기록됩니다.
            </p>
          ) : (
            <ul className="guide-checklist">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className={item.action === 'blocked' ? 'guide-checklist-blocked' : undefined}
                >
                  <p>
                    <strong>{item.threadTitle}</strong> · {formatActionLabel(item.action)} ·{' '}
                    {new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(item.at))}
                  </p>
                  {item.note ? (
                    <small style={{ color: 'var(--fg-muted)' }}>{item.note}</small>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" onClick={clearActionLogs}>
              로그 초기화
            </Button>
          </div>
        </Card>
      </section>

      <section className="public-band">
        <div className="public-cta" style={{ marginTop: '0' }}>
          <h2>기능 데모 안내</h2>
          <p>
            실제 제품에서는 권한 정책(작성/삭제 권한, 스팸/신고 처리 정책, 관리자 승인 플로우)과
            함께 본 동작을 연결해 운영자 제어가 강화됩니다.
          </p>
          <div className="public-hero-actions">
            <Button onClick={() => onNavigate('/register', { source: 'hero', fromLanding: true })}>
              <Icon name="arrow-right" size={16} />
              회원가입 후 이용해보기
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
