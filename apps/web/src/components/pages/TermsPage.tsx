import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import { Button, Card, CardHeader, Icon, PageHeader } from '../ui'
import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type TermsSection = {
  id: string
  title: string
  required: boolean
  items: string[]
}

type ReadinessCheck = {
  id: string
  title: string
  required: boolean
  hint: string
  evaluate: (params: { agreedIds: string[]; isOutdated: boolean; hasHistory: boolean }) => {
    passed: boolean
    blocker: string
  }
}

const TERMS_STORAGE_KEY = 'terms-consent-status-v1'
const TERMS_HISTORY_KEY = 'terms-consent-history-v1'
const TERMS_ACTION_LOG_KEY = 'terms-action-log-v1'
const TERMS_UPDATE_DATE = '2026-06-08'
const TERMS_VERSION = 'v2026-06-08'
const MIN_KEYWORD_LENGTH = 2
const MAX_LOGS = 12

type TermsConsentRecord = {
  version: string
  agreedIds: string[]
  requiredRate: number
  totalRate: number
  updatedAt: number
}

type TermsReadinessMission = {
  id: string
  title: string
  required: boolean
  hint: string
  details: string
}

const termsSections: TermsSection[] = [
  {
    id: 'public-scope',
    title: '1. 서비스 공개 범위',
    required: true,
    items: [
      '가족 돌봄 운영 플랫폼은 돌봄 일정, 기록, 정산, 보험청구 지원 기능을 제공합니다.',
      '계정이 없는 사용자는 공개 페이지(소개/가이드/커뮤니티 데모/이용약관/개인정보 처리방침)만 이용할 수 있습니다.',
      '유료 기능은 가입 후 정해진 플랜과 관리자 설정에 따라 제한될 수 있습니다.',
    ],
  },
  {
    id: 'access-control',
    title: '2. 계정과 접근 권한',
    required: true,
    items: [
      '센터 계정은 실무자 단위로 생성되며, 데이터 접근은 운영자가 부여한 권한 범위 내에서만 가능합니다.',
      '권한은 일정·기록·정산·청구 화면의 읽기, 편집, 관리자 설정 단계로 분리해 운영되어야 합니다.',
      '로그인 정보 유실·분실 시 즉시 비밀번호 초기화 절차를 거쳐야 하며, 승인되지 않은 장치 접근은 즉시 제보해야 합니다.',
    ],
  },
  {
    id: 'data-policy',
    title: '3. 데이터·콘텐츠 사용 범위',
    required: true,
    items: [
      '센터 운영 데이터는 서비스 목적 범위를 넘는 용도로 전송하거나 재유통할 수 없습니다.',
      '대응 및 감사를 위해 기록된 업무 데이터는 내부 검토와 지원 목적의 제한된 분석 대상이 될 수 있습니다.',
      '저작권, 초상권 또는 제3자 권리를 침해하는 정보 업로드는 금지됩니다.',
    ],
  },
  {
    id: 'billing',
    title: '4. 계약·요금·환불',
    required: false,
    items: [
      '요금제 변경은 계약 및 플랜 상태에 따라 정기 결제 또는 맞춤 견적으로 처리됩니다.',
      '상업적 계약은 영업 또는 공식 계약 채널을 통해 확정되며, 데모 계정은 제약이 있을 수 있습니다.',
      '환불은 유료 계약 조건 및 법정 기준에 따라 처리되며, 세부 정책은 상호 협의 문서로 안내됩니다.',
    ],
  },
  {
    id: 'service-change',
    title: '5. 이용 제한 및 변경 안내',
    required: false,
    items: [
      '이용약관은 사전 고지 후 개정됩니다.',
      '시스템 점검, 긴급 보안 업데이트, 법적 변경이 있을 때 이용 제한이 발생할 수 있습니다.',
      '개정된 내용은 공개 페이지에서 공지일로부터 효력 발생합니다.',
    ],
  },
]

const quickGuide = [
  '로그인 없이도 서비스 소개, 튜토리얼, 커뮤니티 데모를 통해 기능 흐름을 먼저 확인할 수 있습니다.',
  '실제 운영 전환 전에는 이용범위·권한·요금 범위를 내부 정책과 함께 점검하세요.',
  '약관 변경은 공지와 함께 적용되며, 민감 변경은 사전 안내 후 동의 요청할 수 있습니다.',
]

const termsVersionNotes: { date: string; version: string; items: string[] }[] = [
  {
    date: TERMS_UPDATE_DATE,
    version: TERMS_VERSION,
    items: [
      '공개 데모 동의 흐름과 동의 로그 분석 블록을 추가해 실제 도입 전 점검 단계까지 연결했습니다.',
      '커뮤니티/튜토리얼로 이어지는 연동 가이드를 명시해 로그인 전에도 핵심 흐름을 체감할 수 있게 정리했습니다.',
      '버전 동기화와 검색·필터 사용 점검 미션을 넣어 운영 체크리스트로 바로 연결했습니다.',
    ],
  },
]

const termsReadinessMissions: TermsReadinessMission[] = [
  {
    id: 'required-check',
    title: '필수 조항 동의',
    required: true,
    hint: '서비스 시작 전 필수 조항이 누락되면 다음 단계 연동이 불안정해집니다.',
    details: '서비스 공개 범위·권한·데이터 정책은 필수 동의 기준입니다.',
  },
  {
    id: 'version-sync',
    title: '최신 버전 정합',
    required: true,
    hint: '버전 동기화는 데모에서의 점검 결과 해석 정확도를 보장합니다.',
    details: '현재 저장 버전이 최신으로 맞춰져야 합니다.',
  },
  {
    id: 'history-check',
    title: '동의 이력 남기기',
    required: false,
    hint: '이력이 없으면 감사성 분석이 어렵고 운영 이력 추적이 단절될 수 있습니다.',
    details: '동의 변경 시 히스토리가 쌓였는지 확인합니다.',
  },
  {
    id: 'explore-check',
    title: '조항 탐색 완료',
    required: false,
    hint: '검색·필터를 사용하면 필수/선택 항목 구분이 빠르게 정리됩니다.',
    details: '조항 검색 또는 분류 필터 조작을 했는지 확인합니다.',
  },
]

const readinessChecks: ReadinessCheck[] = [
  {
    id: 'required',
    title: '필수 조항 동의',
    required: true,
    hint: '서비스 범위, 권한, 데이터 처리는 계약의 최소 조건입니다.',
    evaluate: ({ agreedIds }) => {
      const requiredIds = ['public-scope', 'access-control', 'data-policy']
      const passed = requiredIds.every((id) => agreedIds.includes(id))
      return {
        passed,
        blocker: passed ? '필수 동의 항목을 통과했습니다.' : '필수 조항을 모두 동의해 주세요.',
      }
    },
  },
  {
    id: 'optional',
    title: '선택 조항 검토',
    required: false,
    hint: '요금/변경 안내는 내부 운영 절차까지 반영할 때 함께 검토하는 걸 권장합니다.',
    evaluate: ({ agreedIds }) => {
      const passed = ['billing', 'service-change'].some((id) => agreedIds.includes(id))
      return {
        passed,
        blocker: passed
          ? '선택 조항 중 일부를 검토했습니다.'
          : '선택 조항을 열람 후 최소 1개 이상 동의해 진행 규칙을 명확히 하세요.',
      }
    },
  },
  {
    id: 'history',
    title: '동의 이력 저장',
    required: false,
    hint: '동의 조치가 로그로 남으면 운영 감사와 추적이 쉬워집니다.',
    evaluate: ({ hasHistory }) => ({
      passed: hasHistory,
      blocker: hasHistory ? '동의 이력이 누적됩니다.' : '동의를 저장하면 데모 이력이 기록됩니다.',
    }),
  },
  {
    id: 'version',
    title: '버전 동기화',
    required: true,
    hint: '최신 버전 기준에서 동의 상태를 기준으로 볼 수 있도록 유지해야 합니다.',
    evaluate: ({ isOutdated }) => ({
      passed: !isOutdated,
      blocker: isOutdated
        ? '현재 버전이 이전 기준입니다. 안내 동의 갱신이 필요합니다.'
        : '현재 버전 기준으로 정상입니다.',
    }),
  },
]

const isTermsSection = (value: unknown): value is TermsSection['id'] =>
  typeof value === 'string' && termsSections.some((section) => section.id === value)

type TermsState = {
  agreedIds: string[]
  updatedAt: number
  version: string
}

const parseConsentState = (): TermsState => {
  if (typeof window === 'undefined') {
    return {
      agreedIds: [],
      updatedAt: 0,
      version: TERMS_VERSION,
    }
  }

  try {
    const raw = window.localStorage.getItem(TERMS_STORAGE_KEY)
    if (!raw) {
      return {
        agreedIds: [],
        updatedAt: 0,
        version: TERMS_VERSION,
      }
    }

    const parsed = JSON.parse(raw) as Partial<TermsState> & {
      version?: unknown
      updatedAt?: unknown
    }

    const agreedIds = Array.isArray(parsed.agreedIds) ? parsed.agreedIds.filter(isTermsSection) : []
    const storedVersion = typeof parsed.version === 'string' ? parsed.version : TERMS_VERSION
    const updatedAt = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0

    return {
      agreedIds,
      updatedAt,
      version: storedVersion,
    }
  } catch {
    return {
      agreedIds: [],
      updatedAt: 0,
      version: TERMS_VERSION,
    }
  }
}

const readConsentHistory = (): TermsConsentRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(TERMS_HISTORY_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const isValidRecord = (value: unknown): value is TermsConsentRecord =>
      typeof value === 'object' &&
      value !== null &&
      typeof (value as TermsConsentRecord).version === 'string' &&
      Array.isArray((value as TermsConsentRecord).agreedIds) &&
      typeof (value as TermsConsentRecord).updatedAt === 'number' &&
      typeof (value as TermsConsentRecord).requiredRate === 'number' &&
      typeof (value as TermsConsentRecord).totalRate === 'number'

    return parsed.filter(isValidRecord).slice(-20)
  } catch {
    return []
  }
}

const readTermsActionLog = (): TermsActionLog[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(TERMS_ACTION_LOG_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const isValidActionLog = (value: unknown): value is TermsActionLog =>
      typeof value === 'object' &&
      value !== null &&
      typeof (value as TermsActionLog).id === 'string' &&
      typeof (value as TermsActionLog).at === 'number' &&
      typeof (value as TermsActionLog).action === 'string' &&
      typeof (value as TermsActionLog).label === 'string'

    return parsed.filter(isValidActionLog).slice(-MAX_LOGS)
  } catch {
    return []
  }
}

type TermsPageProps = {
  onNavigate?: (path: AppRoute, state?: PublicNavigateState) => void
}

type TermsActionLog = {
  id: string
  at: number
  action: string
  label: string
}

const makeTermsActionId = () => `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const updateConsent = (next: string[]) =>
  typeof window !== 'undefined'
    ? window.localStorage.setItem(
        TERMS_STORAGE_KEY,
        JSON.stringify({ version: TERMS_VERSION, agreedIds: next, updatedAt: Date.now() }),
      )
    : undefined

const makeConsentHistoryEntry = (agreedIds: string[], agreeRate: number, requiredRate: number) => ({
  version: TERMS_VERSION,
  agreedIds: [...agreedIds],
  requiredRate,
  totalRate: agreeRate,
  updatedAt: Date.now(),
})

export const TermsPage = ({ onNavigate }: TermsPageProps) => {
  const initialState = parseConsentState()
  const [agreedIds, setAgreedIds] = useState<string[]>(initialState.agreedIds)
  const [agreedAt, setAgreedAt] = useState(initialState.updatedAt)
  const [storedVersion, setStoredVersion] = useState(initialState.version)
  const [consentHistory, setConsentHistory] = useState<TermsConsentRecord[]>(readConsentHistory)
  const [copyMessage, setCopyMessage] = useState('')
  const [filter, setFilter] = useState<'all' | 'required' | 'optional'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [hasTermsExplored, setHasTermsExplored] = useState(false)
  const [actionLogs, setActionLogs] = useState<TermsActionLog[]>(readTermsActionLog)
  const didInitRef = useRef(false)
  const copyMessageTimer = useRef<number | undefined>(undefined)

  const requiredIds = useMemo(
    () => termsSections.filter((section) => section.required).map((section) => section.id),
    [],
  )
  const requiredSections = useMemo(() => termsSections.filter((section) => section.required), [])
  const optionalSections = useMemo(() => termsSections.filter((section) => !section.required), [])

  const agreeRate = useMemo(
    () => Math.round((agreedIds.length / termsSections.length) * 100),
    [agreedIds],
  )

  const requiredRate = useMemo(
    () =>
      Math.round(
        (requiredIds.filter((id) => agreedIds.includes(id)).length / requiredIds.length) * 100,
      ),
    [agreedIds, requiredIds],
  )

  const isOutdated = storedVersion !== TERMS_VERSION

  const sectionSearch = searchKeyword.trim().toLowerCase()

  const requiredCheckedCount = useMemo(
    () => requiredSections.filter((section) => agreedIds.includes(section.id)).length,
    [agreedIds, requiredSections],
  )
  const optionalCheckedCount = useMemo(
    () => optionalSections.filter((section) => agreedIds.includes(section.id)).length,
    [agreedIds, optionalSections],
  )

  const readinessChecksResult = useMemo(
    () =>
      readinessChecks.map((check) => {
        const result = check.evaluate({
          agreedIds,
          isOutdated,
          hasHistory: consentHistory.length > 0,
        })
        return {
          id: check.id,
          title: check.title,
          required: check.required,
          hint: check.hint,
          passed: result.passed,
          blocker: result.blocker,
        }
      }),
    [consentHistory.length, agreedIds, isOutdated],
  )

  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      return
    }

    updateConsent(agreedIds)
    const now = Date.now()
    const nextEntry = {
      version: TERMS_VERSION,
      agreedIds: [...agreedIds],
      requiredRate,
      totalRate: agreeRate,
      updatedAt: now,
    }

    setStoredVersion(TERMS_VERSION)
    setAgreedAt(now)
    setConsentHistory((current) => {
      const next = [...current, nextEntry].slice(-MAX_LOGS)

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(TERMS_HISTORY_KEY, JSON.stringify(next))
        } catch {
          // ignore storage failure for history log
        }
      }

      return next
    })
  }, [agreedIds, requiredRate, agreeRate])

  const logAction = (action: string, label: string) => {
    setActionLogs((current) =>
      [...current, { id: makeTermsActionId(), at: Date.now(), action, label }].slice(-MAX_LOGS),
    )
  }

  useEffect(() => {
    if (!copyMessage) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (copyMessageTimer.current) {
      window.clearTimeout(copyMessageTimer.current)
    }

    copyMessageTimer.current = window.setTimeout(() => setCopyMessage(''), 1700)
    return () => {
      if (copyMessageTimer.current) {
        window.clearTimeout(copyMessageTimer.current)
      }
    }
  }, [copyMessage])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(TERMS_ACTION_LOG_KEY, JSON.stringify(actionLogs))
    } catch {
      // ignore storage failures
    }
  }, [actionLogs])

  const allRequiredAgreed = requiredIds.every((id) => agreedIds.includes(id))
  const requiredMissed = requiredIds.filter((id) => !agreedIds.includes(id))

  const readinessRate = Math.round(
    (readinessChecksResult.filter((item) => item.passed).length / readinessChecks.length) * 100,
  )
  const readinessBlocked = readinessChecksResult.filter((item) => item.required && !item.passed)
  const isReadyToProceed = readinessRate >= 75 && readinessBlocked.length === 0

  const missionProgress = useMemo(
    () =>
      termsReadinessMissions.map((mission) => {
        if (mission.id === 'required-check') {
          return { ...mission, completed: allRequiredAgreed }
        }
        if (mission.id === 'version-sync') {
          return { ...mission, completed: !isOutdated }
        }
        if (mission.id === 'history-check') {
          return { ...mission, completed: consentHistory.length > 0 }
        }
        return { ...mission, completed: hasTermsExplored }
      }),
    [allRequiredAgreed, consentHistory.length, hasTermsExplored, isOutdated],
  )

  const termsMissionRate = useMemo(
    () =>
      Math.round(
        (missionProgress.filter((item) => item.completed).length / missionProgress.length) * 100,
      ),
    [missionProgress],
  )

  const termsActionSummary = useMemo(
    () => ({
      agreeCount: actionLogs.filter((item) => item.action === 'agree').length,
      disagreeCount: actionLogs.filter((item) => item.action === 'disagree').length,
      resetCount: actionLogs.filter((item) => item.action === 'reset').length,
      syncCount: actionLogs.filter((item) => item.action === 'sync').length,
      copySuccessCount: actionLogs.filter((item) => item.action === 'copy-success').length,
      copyFailCount: actionLogs.filter((item) => item.action === 'copy-failed').length,
      allActionCount: actionLogs.length,
    }),
    [actionLogs],
  )

  const toggleAgree = (id: string, checked: boolean) => {
    if (checked) {
      logAction('agree', `${id} 동의`)
      setAgreedIds((current) => (current.includes(id) ? current : [...current, id]))
      return
    }
    logAction('disagree', `${id} 미동의`)
    setAgreedIds((current) => current.filter((item) => item !== id))
  }

  const acceptAll = () => {
    logAction('all', '전체 동의')
    setAgreedIds(termsSections.map((section) => section.id))
  }

  const syncVersion = () => {
    if (!isOutdated) {
      logAction('sync', '이미 최신 버전 상태')
      return
    }
    logAction('sync', '최신 약관 버전 반영')
    updateConsent(agreedIds)
    setStoredVersion(TERMS_VERSION)
    setAgreedAt(Date.now())
    setConsentHistory((current) => {
      const next = [...current, makeConsentHistoryEntry(agreedIds, agreeRate, requiredRate)].slice(
        -MAX_LOGS,
      )
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(TERMS_HISTORY_KEY, JSON.stringify(next))
        } catch {
          // ignore storage failure for history log
        }
      }
      return next
    })
  }

  const reset = () => {
    logAction('reset', '동의 항목 초기화')
    setAgreedIds([])
  }

  const lastUpdatedText = agreedAt
    ? new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(agreedAt))
    : '미동의'

  const filteredSections = useMemo(
    () =>
      termsSections.filter((section) => {
        if (sectionSearch.length >= MIN_KEYWORD_LENGTH) {
          const target = `${section.title} ${section.items.join(' ')}`.toLowerCase()
          if (!target.includes(sectionSearch)) {
            return false
          }
        }

        if (filter === 'required') {
          return section.required
        }
        if (filter === 'optional') {
          return !section.required
        }
        return true
      }),
    [filter, sectionSearch],
  )

  const handleSearchChange = (nextValue: string) => {
    setSearchKeyword(nextValue)
    if (!hasTermsExplored && nextValue.trim().length >= MIN_KEYWORD_LENGTH) {
      setHasTermsExplored(true)
    }
  }

  const handleFilterExplore = () => {
    if (!hasTermsExplored) {
      setHasTermsExplored(true)
    }
  }

  const copySummary = async () => {
    const summary = [
      '약관 동의 데모 요약',
      `버전: ${TERMS_VERSION}`,
      `준비도: ${readinessRate}%`,
      `총 동의: ${agreeRate}%`,
      `필수 동의: ${requiredRate}%`,
      `동의 완료 시각: ${lastUpdatedText}`,
      `동의 항목: ${agreedIds.join(', ') || '없음'}`,
    ].join('\n')

    if (typeof window === 'undefined' || !window.navigator || !window.navigator.clipboard) {
      setCopyMessage('클립보드를 지원하지 않습니다.')
      logAction('copy-failed', '동의 요약 복사 실패: 클립보드 미지원')
      return
    }

    try {
      await window.navigator.clipboard.writeText(summary)
      setCopyMessage('동의 요약을 복사했습니다.')
      logAction('copy-success', '동의 요약 복사')
    } catch {
      setCopyMessage('복사에 실패했습니다.')
      logAction('copy-failed', '동의 요약 복사 실패')
    }
  }

  const clearActionLogs = () => setActionLogs([])

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value as 'all' | 'required' | 'optional')
  }

  const quickGuideLinks = [
    {
      label: '사용 가이드',
      path: '/guide',
      icon: 'guide' as const,
    },
    {
      label: '튜토리얼',
      path: '/tutorial',
      icon: 'book-open' as const,
    },
    {
      label: '커뮤니티 데모',
      path: '/community',
      icon: 'inbox' as const,
    },
    {
      label: '개인정보 처리방침',
      path: '/privacy',
      icon: 'guide' as const,
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow="서비스 계약 조건"
        title="이용약관"
        description="서비스를 이용하기 전에 꼭 확인해야 할 핵심 규칙입니다. 운영 범위와 책임을 명확히 구분해 사용하세요."
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
        <CardHeader title="시행일" subtitle={`최종 업데이트: ${TERMS_UPDATE_DATE}`} />
        <p id="terms-scope">
          본 약관은 가족 돌봄 운영 플랫폼의 공개 범위, 로그인 계정 이용 범위, 데이터 취급 기준, 요금
          및 지원 범위를 규정합니다. 별도 계약이 있는 경우 계약 문서가 우선합니다.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="동의 정합성"
          subtitle={`필수 ${requiredCheckedCount}/${requiredSections.length} · 선택 ${optionalCheckedCount}/${optionalSections.length}`}
        />
        <p
          style={{
            margin: 0,
            color: 'var(--fg-muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          현재 저장 버전: {storedVersion}
          {' · '}
          마지막 저장: {lastUpdatedText}
        </p>
        <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant={isOutdated ? 'primary' : 'secondary'} onClick={syncVersion}>
            {isOutdated ? '최신 버전으로 갱신' : '버전 동기화 상태 반영'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={isOutdated ? '약관 버전 갱신 필요' : '요약 한 줄'}
          subtitle="초기 검토에 필요한 체크 항목을 빠르게 확인할 수 있습니다."
        />
        <ul className="public-check-list">
          {quickGuide.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="약관 동의 데모"
          subtitle={`${agreeRate}% 동의 · 필수 항목 ${requiredRate}% 반영`}
        />
        <div className="public-hero-actions" style={{ marginBottom: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={copySummary}>
            동의 요약 복사
          </Button>
          <Button variant="secondary" onClick={reset}>
            동의 상태 초기화
          </Button>
        </div>
        <div className="guide-progress-track" aria-label="동의 진행률" style={{ marginTop: 0 }}>
          <span style={{ width: `${agreeRate}%` }} />
        </div>
        <p
          style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'var(--fg-muted)',
          }}
        >
          필수 항목 동의 후에 계약형 기능 안내를 진행할 수 있습니다. 데모 상태로 저장만 하며
          실계정에 자동 반영되지 않습니다.
        </p>
        <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={acceptAll}>
            전체 동의
          </Button>
          <Button variant="ghost" onClick={() => setAgreedIds(requiredIds)}>
            필수 항목만 동의
          </Button>
          <Button variant="secondary" onClick={reset}>
            선택 초기화
          </Button>
        </div>
        {copyMessage ? <p role="status">{copyMessage}</p> : null}
        <p
          style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-sm)',
            color: 'var(--fg-muted)',
          }}
        >
          마지막 저장 시각: {lastUpdatedText}
        </p>
        {!allRequiredAgreed ? (
          <p
            style={{
              marginTop: 'var(--space-2)',
              color: 'var(--fg-default)',
              fontSize: 'var(--text-sm)',
            }}
          >
            필수 미동의 항목: {requiredMissed.length}건
            {requiredMissed.length ? ` (${requiredMissed.join(', ')})` : ''}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardHeader
          title="도입 준비도 점검"
          subtitle={`현재 진행률: ${readinessRate}% · 필수 기준 충족률: ${readinessBlocked.length}개`}
        />
        <div className="guide-progress-track" aria-label="준비도 진행률" style={{ marginTop: 0 }}>
          <span style={{ width: `${readinessRate}%` }} />
        </div>
        <ul className="guide-checklist" style={{ marginTop: 'var(--space-3)' }}>
          {readinessChecksResult.map((item) => (
            <li className="guide-check-item" key={item.id}>
              <Icon
                name={item.passed ? 'check' : 'clock'}
                size={16}
                aria-hidden="true"
                style={{
                  marginTop: '0.15rem',
                  color: item.passed ? 'var(--accent)' : 'var(--fg-muted)',
                }}
              />
              <span>{item.title}</span>
              <div>
                <strong>
                  {item.title}
                  {item.required ? ' (필수)' : ' (선택)'}
                </strong>
                <p
                  style={{
                    marginTop: 'var(--space-2)',
                    marginBottom: 0,
                    color: 'var(--fg-muted)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {item.passed ? '완료' : `미완료: ${item.blocker}`}{' '}
                  {!item.passed ? `(힌트: ${item.hint})` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={copySummary}>
            준비도 요약 복사
          </Button>
          <Button
            variant={isReadyToProceed ? 'primary' : 'secondary'}
            onClick={() => onNavigate?.('/community', { source: 'hero', fromLanding: true })}
          >
            {isReadyToProceed ? '커뮤니티 데모로 이동해 운영 연동 확인' : '준비 항목 완료 후 이동'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="약관 데모 체크리스트"
          subtitle={`완료 ${termsMissionRate}%`}
        ></CardHeader>
        <div className="guide-progress" aria-live="polite" aria-atomic="true">
          <div className="guide-progress-head">
            <span>도입 점검</span>
            <strong>{termsMissionRate}%</strong>
          </div>
          <div className="guide-progress-track">
            <span style={{ width: `${termsMissionRate}%` }} />
          </div>
        </div>
        <ul className="guide-checklist" style={{ marginTop: 'var(--space-3)' }}>
          {missionProgress.map((mission) => (
            <li className="guide-check-item" key={mission.id}>
              <Icon
                name={mission.completed ? 'check' : 'clock'}
                size={16}
                aria-hidden="true"
                style={{
                  marginTop: '0.15rem',
                  color: mission.completed ? 'var(--accent)' : 'var(--fg-muted)',
                }}
              />
              <span>{mission.id}</span>
              <div>
                <strong>
                  {mission.title}
                  {mission.required ? ' (필수)' : ''}
                </strong>
                <p
                  style={{
                    marginTop: 'var(--space-2)',
                    marginBottom: 0,
                    color: 'var(--fg-muted)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {mission.completed ? '완료' : '미완료'} ·{' '}
                  {mission.completed ? mission.hint : mission.details}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p
          style={{
            marginTop: 'var(--space-2)',
            color: 'var(--fg-muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          액션 로그: 동의 {termsActionSummary.agreeCount}건 · 반대{' '}
          {termsActionSummary.disagreeCount}건 · 동기화
          {termsActionSummary.syncCount}건 · 복사 시도 {termsActionSummary.allActionCount}건
        </p>
        <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={copySummary}>
            체크리스트 복사
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="변경 이력" subtitle="최신 버전의 반영 포인트를 확인하세요." />
        <ul className="guide-checklist">
          {termsVersionNotes.map((entry) => (
            <li key={`${entry.version}-${entry.date}`}>
              <p style={{ marginBottom: 0 }}>
                <strong>{entry.version}</strong> · {entry.date}
              </p>
              <ul className="public-check-list" style={{ marginTop: 'var(--space-2)' }}>
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="약관 조항" subtitle="항목별로 동의 상태를 기록해보세요." />
        <label className="public-lead-form" style={{ marginBottom: 'var(--space-3)' }}>
          조항 검색
          <input
            type="search"
            value={searchKeyword}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
            placeholder="조항명/키워드로 검색"
            className="public-community-search"
            aria-label="조항 검색"
          />
        </label>
        <div
          className="public-community-filters"
          aria-label="약관 필터"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          <label>
            <input
              type="radio"
              name="terms-filter"
              value="all"
              checked={filter === 'all'}
              onChange={(event) => {
                handleFilterExplore()
                handleFilterChange(event)
              }}
            />{' '}
            전체
          </label>
          <label>
            <input
              type="radio"
              name="terms-filter"
              value="required"
              checked={filter === 'required'}
              onChange={(event) => {
                handleFilterExplore()
                handleFilterChange(event)
              }}
            />{' '}
            필수
          </label>
          <label>
            <input
              type="radio"
              name="terms-filter"
              value="optional"
              checked={filter === 'optional'}
              onChange={(event) => {
                handleFilterExplore()
                handleFilterChange(event)
              }}
            />{' '}
            선택
          </label>
        </div>
        <ol className="guide-checklist">
          {filteredSections.map((section) => (
            <li key={section.id}>
              <label className="guide-check-item">
                <input
                  type="checkbox"
                  checked={agreedIds.includes(section.id)}
                  onChange={(event) => toggleAgree(section.id, event.currentTarget.checked)}
                  aria-label={`${section.title} 동의`}
                />
                <span>{termsSections.findIndex((item) => item.id === section.id) + 1}</span>
                <div>
                  <strong>
                    {section.title}
                    {section.required ? ' (필수)' : ' (선택)'}
                  </strong>
                  <ul className="public-check-list" style={{ marginTop: 'var(--space-3)' }}>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </label>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader
          title="동의 로그"
          subtitle="최신 저장 이력을 확인해 데모 기준을 추적해볼 수 있습니다."
        />
        {consentHistory.length === 0 ? (
          <p className="public-faq-empty" role="status">
            아직 동의 이력이 없습니다.
          </p>
        ) : (
          <ul className="guide-checklist">
            {consentHistory
              .slice()
              .reverse()
              .map((history) => {
                return (
                  <li key={`${history.updatedAt}-${history.version}`}>
                    <p style={{ margin: 0 }}>
                      <strong>버전 {history.version}</strong> · 전체 {history.totalRate}% · 필수{' '}
                      {history.requiredRate}%
                    </p>
                    <small style={{ color: 'var(--fg-muted)' }}>
                      {new Intl.DateTimeFormat('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(history.updatedAt))}
                    </small>
                    <p style={{ marginTop: 'var(--space-1)' }}>
                      동의 항목: {history.agreedIds.length ? history.agreedIds.join(', ') : '없음'}
                    </p>
                  </li>
                )
              })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="운영 검토 액션 로그"
          subtitle="동의 동작을 기준별로 확인해 운영 정책 반영 전 흐름을 점검합니다."
        />
        {actionLogs.length === 0 ? (
          <p className="public-faq-empty" role="status">
            동의 액션이 남지 않았습니다.
          </p>
        ) : (
          <ul className="guide-checklist">
            {actionLogs
              .slice()
              .reverse()
              .map((action) => (
                <li key={action.id}>
                  <p style={{ margin: 0 }}>
                    <strong>{action.action}</strong> · {action.label}
                  </p>
                  <small style={{ color: 'var(--fg-muted)' }}>
                    {new Intl.DateTimeFormat('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(action.at))}
                  </small>
                </li>
              ))}
          </ul>
        )}
        <div className="public-hero-actions" style={{ marginTop: 'var(--space-3)' }}>
          <Button variant={actionLogs.length > 0 ? 'secondary' : 'ghost'} onClick={clearActionLogs}>
            액션 로그 삭제
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="관련 페이지" subtitle="기능 탐색에 함께 보면 더 빠르게 이해됩니다." />
        <div className="public-hero-actions">
          {onNavigate
            ? quickGuideLinks.map((link) => (
                <Button
                  key={link.path}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onNavigate(link.path as AppRoute, { source: 'hero', fromLanding: true })
                  }
                >
                  {link.label}
                  <Icon name={link.icon} size={14} />
                </Button>
              ))
            : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="진행 상태 요약"
          subtitle={allRequiredAgreed ? '필수 동의 완료' : '필수 동의 항목이 남아 있습니다'}
        />
        <p>
          현재 데모 동의 상태는 브라우저에만 저장되며, 로그인한 계정에 자동 반영되지 않습니다. 실제
          운영에서는 법무 검토를 거쳐 확정 정책과 함께 동의 로그를 남겨야 합니다.
        </p>
      </Card>
    </div>
  )
}
