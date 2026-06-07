import { useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card, CardHeader, Icon, PageHeader } from '../ui'
import type { AppRoute, PublicNavigateState } from '../../routeConfig'
import { routeDefs } from '../../routeConfig'

type TutorialPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

type TutorialStep = {
  step: string
  title: string
  desc: string
  route: AppRoute
  action: string
  icon: 'schedule' | 'care' | 'settlement' | 'claims'
  duration: string
}

type TutorialGoal = {
  title: string
  detail: string
  route: AppRoute
  action: string
}

type TutorialScenario = {
  title: string
  duration: string
  target: AppRoute
  ctaLabel: string
  steps: readonly number[]
  summary: string
}

type TutorialMilestone = {
  phase: string
  title: string
  plan: string
  route: AppRoute
  action: string
  icon: 'schedule' | 'care' | 'settlement' | 'claims' | 'analytics'
}

type TutorialPersona = {
  role: string
  summary: string
  startAt: string
  route: AppRoute
  action: string
  icon: 'care' | 'analytics' | 'claims' | 'schedule'
}

type TutorialFaq = {
  q: string
  a: string
}

const tutorialSteps: TutorialStep[] = [
  {
    step: '1',
    title: '오늘 일정 등록',
    desc: '센터 운영은 “누가, 언제, 무슨 일을 하는지”가 선행되어야 흐름이 멈추지 않습니다. 우선 첫 대상자를 등록하세요.',
    route: '/schedule',
    action: '일정 화면으로 이동',
    icon: 'schedule',
    duration: '2분',
  },
  {
    step: '2',
    title: '실무 기록 남기기',
    desc: '방문 완료 후에 바로 돌봄 기록을 작성하면, 정산·청구의 근거가 동시에 축적됩니다.',
    route: '/care',
    action: '돌봄 기록으로 이동',
    icon: 'care',
    duration: '2분',
  },
  {
    step: '3',
    title: '돌봄비 계산',
    desc: '방문 시간과 기본 단가를 입력하면 돌봄비가 바로 계산됩니다. 예외 케이스는 메모에 분리해 둡니다.',
    route: '/settlements',
    action: '정산 화면으로 이동',
    icon: 'settlement',
    duration: '2분',
  },
  {
    step: '4',
    title: '보험청구 상태 업데이트',
    desc: '요청→검토중→승인 상태를 남기면 팀이 다음 조치를 놓치지 않습니다.',
    route: '/claims',
    action: '청구 화면으로 이동',
    icon: 'claims',
    duration: '4분',
  },
]

const quickGoals: TutorialGoal[] = [
  {
    title: '대시보드 한 번으로 오늘 할 일 정리',
    detail: '오늘 일정/기록/정산/청구 상태를 한 화면에서 볼 수 있는 기준점을 잡습니다.',
    route: '/',
    action: '대시보드 보기',
  },
  {
    title: '분기 점검',
    detail: '정산·청구를 매월 묶어 운영이 흔들리는 지점을 빠르게 찾습니다.',
    route: '/analytics',
    action: '운영 분석 보기',
  },
  {
    title: '가격·요금 정책 사전 점검',
    detail: '센터 규모별 가격 정책이 어느 지점에서 바뀌어야 하는지 시뮬레이션으로 확인합니다.',
    route: '/plans',
    action: '요금제 보기',
  },
]

const onboardingMilestones: TutorialMilestone[] = [
  {
    phase: 'D+1',
    title: '운영 준비 완료',
    plan: '대시보드에서 오늘 할 일, 일정, 미처리 청구 건을 먼저 파악합니다.',
    route: '/',
    action: '대시보드로 이동',
    icon: 'analytics',
  },
  {
    phase: '1주차',
    title: '현장 기록 정착',
    plan: '일정 등록 후 즉시 돌봄 기록과 정산을 남겨 운영 공백을 줄입니다.',
    route: '/schedule',
    action: '일정 화면으로 이동',
    icon: 'schedule',
  },
  {
    phase: '2주차',
    title: '정산/청구 일치',
    plan: '돌봄비 계산과 청구 상태 갱신까지 한 번에 점검해 이월 지연을 줄입니다.',
    route: '/claims',
    action: '청구 화면으로 이동',
    icon: 'claims',
  },
]

const scenarios: TutorialScenario[] = [
  {
    title: '신규 담당자 1일차 적응',
    duration: '약 7분',
    target: '/schedule',
    ctaLabel: '일정 화면으로 이동',
    steps: [0, 1],
    summary: '일정 등록 → 돌봄 기록까지 한 번에 연결합니다.',
  },
  {
    title: '정산·청구 관리 시작',
    duration: '약 10분',
    target: '/claims',
    ctaLabel: '청구 화면으로 이동',
    steps: [2, 3],
    summary: '돌봄비 계산 후 청구 상태까지 점검 흐름으로 넘어갑니다.',
  },
  {
    title: '운영 정합성 점검',
    duration: '약 5분',
    target: '/analytics',
    ctaLabel: '운영 분석 보기',
    steps: [0, 2, 3],
    summary: '일정/정산/청구를 월간 관점으로 교차 확인합니다.',
  },
]

const tutorialPersonas: TutorialPersona[] = [
  {
    role: '운영팀장',
    summary: '중요한 건은 오늘 상태가 한 번에 보이고, 예외 처리 규칙이 문서화되어야 합니다.',
    startAt: '대시보드 → 일정 → 기록',
    route: '/',
    action: '운영자 시작점 보기',
    icon: 'analytics',
  },
  {
    role: '관리자',
    summary: '정산·청구 흐름을 월 기준으로 점검하고 승인 대기 건을 미리 알 수 있어야 합니다.',
    startAt: '정산 → 청구 → 분석',
    route: '/analytics',
    action: '관리 시작점 보기',
    icon: 'claims',
  },
  {
    role: '신규 담당자',
    summary: '4개 핵심 작업을 분기 없이 따라가면 오차를 크게 줄일 수 있습니다.',
    startAt: '일정 → 기록 → 정산',
    route: '/schedule',
    action: '실무자 시작점 보기',
    icon: 'care',
  },
]

const tutorialFaq: TutorialFaq[] = [
  {
    q: '튜토리얼에서 무엇을 먼저 보면 좋나요?',
    a: '처음엔 4단계 업무 흐름(일정→기록→정산→청구)부터 진행한 뒤, 대시보드와 분석 화면으로 돌아와 전체 흐름이 연결되는지 점검하세요.',
  },
  {
    q: '업무 화면을 바꿨는데 상태가 엉켜 보입니다.',
    a: '대부분 같은 대상명을 다르게 입력했거나 일정 등록 후 기록/정산에 동일한 컨텍스트가 안 맞을 때 발생합니다. 대상자명·담당자명을 통일해 다시 입력해 주세요.',
  },
  {
    q: '데모 계정으로 바로 시작해도 되나요?',
    a: '네, 로그인 페이지에서 데모 계정으로 들어가면 서버 없이도 화면 동선을 확인할 수 있습니다. 다만 데모 종료 시 저장된 데이터는 리셋될 수 있습니다.',
  },
  {
    q: '오프라인이면 어떤 화면이 먼저 보이나요?',
    a: '오프라인에서는 입력/수정이 제한될 수 있고, 연결 상태 배지는 오프라인 메시지를 보여줍니다. 네트워크 복구 후 이어서 입력하면 됩니다.',
  },
]

const TUTORIAL_PROGRESS_KEY = 'tutorial-progress-v1'

const isValidStepIndex = (value: number) =>
  Number.isInteger(value) && value >= 0 && value < tutorialSteps.length

const normalizeTutorialSteps = (values: number[]) =>
  [...new Set(values)].filter(isValidStepIndex).sort((left, right) => left - right)

const parseProgress = () => {
  if (typeof window === 'undefined') {
    return [] as number[]
  }

  try {
    const raw = window.localStorage.getItem(TUTORIAL_PROGRESS_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? normalizeTutorialSteps(
          parsed.filter((value: unknown): value is number => Number.isInteger(value as number)),
        )
      : []
  } catch {
    return []
  }
}

const useTutorialProgress = () => {
  const [checkedSteps, setCheckedSteps] = useState<number[]>(parseProgress)
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(checkedSteps))
  }, [checkedSteps])

  const toggleStep = (stepIndex: number, checked: boolean) => {
    setCheckedSteps((current) => {
      if (!isValidStepIndex(stepIndex)) {
        return current
      }

      if (!checked) {
        return current.filter((value) => value !== stepIndex)
      }

      if (current.includes(stepIndex)) {
        return current
      }
      return normalizeTutorialSteps([...current, stepIndex])
    })
  }

  const reset = () => setCheckedSteps([])

  const checkedCount = checkedSteps.length
  const progressRate = useMemo(
    () => Math.round((checkedCount / tutorialSteps.length) * 100),
    [checkedCount],
  )
  const nextUnfinishedStep = useMemo(
    () => tutorialSteps.findIndex((_, index) => !checkedSteps.includes(index)),
    [checkedSteps],
  )
  const nextStep = nextUnfinishedStep >= 0 ? tutorialSteps[nextUnfinishedStep] : tutorialSteps[0]
  const allChecked = checkedSteps.length === tutorialSteps.length

  return {
    checkedSteps,
    checkedCount,
    progressRate,
    toggleStep,
    reset,
    openFaqIndex,
    setOpenFaqIndex,
    nextStep,
    allChecked,
  }
}

export const PublicTutorialPage = ({ onNavigate }: TutorialPageProps) => {
  const def = routeDefs['/tutorial']
  const {
    checkedSteps,
    checkedCount,
    progressRate,
    toggleStep,
    reset,
    openFaqIndex,
    setOpenFaqIndex,
    nextStep,
    allChecked,
  } = useTutorialProgress()
  const progressLabel = allChecked
    ? '모든 단계 완료'
    : `${checkedCount} / ${tutorialSteps.length} 단계`

  const [copyResult, setCopyResult] = useState('')

  const scenarioSummaries = useMemo(
    () =>
      scenarios.map((scenario) => {
        const completedSteps = scenario.steps.filter((step) => checkedSteps.includes(step))
        const rate = Math.round((completedSteps.length / scenario.steps.length) * 100)
        return {
          ...scenario,
          completed: completedSteps.length === scenario.steps.length,
          rate,
        }
      }),
    [checkedSteps],
  )

  const summaryText = useMemo(
    () =>
      [
        `튜토리얼 진행률: ${progressLabel}`,
        ...scenarioSummaries.map(
          (scenario) =>
            `${scenario.title} (${scenario.duration}) - ${scenario.completed ? '완료' : `${scenario.rate}%`}: ${scenario.summary}`,
        ),
      ].join('\n'),
    [progressLabel, scenarioSummaries],
  )

  const copySummary = async () => {
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.clipboard) {
      setCopyResult('브라우저에서 클립보드를 지원하지 않습니다.')
      return
    }

    try {
      await window.navigator.clipboard.writeText(summaryText)
      setCopyResult('요약 내용을 복사했습니다.')
    } catch {
      setCopyResult('복사에 실패했습니다. 브라우저 권한을 확인해 주세요.')
    }

    window.setTimeout(() => {
      setCopyResult('')
    }, 1600)
  }

  return (
    <div className="stack">
      <PageHeader eyebrow={def.eyebrow} title={def.title} description={def.description} />

      <section className="guide-hero" aria-labelledby="tutorial-title">
        <div className="guide-hero-copy">
          <Badge tone="accent" plain>
            공개 튜토리얼
          </Badge>
          <h2 id="tutorial-title">3~10분으로 기본 업무 흐름을 점검하세요</h2>
          <p>
            로그인 없이도 이 안내 페이지에서 전체 동선을 확인할 수 있습니다. 실제 운영은 로그인 후
            동일한 순서로 진행하면 되고, 데모 계정으로 바로 시험해볼 수도 있습니다.
          </p>
          <div className="public-hero-actions">
            <Button onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}>
              <Icon name="arrow-right" size={16} />
              데모 로그인으로 시작
            </Button>
            <Button
              variant={allChecked ? 'primary' : 'secondary'}
              onClick={() =>
                onNavigate(nextStep.route, {
                  source: 'hero',
                  fromLanding: true,
                })
              }
            >
              {allChecked ? '전체 흐름 점검으로 이동' : `${nextStep.step}단계 바로가기`}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}
            >
              자세한 사용법으로 이동
            </Button>
            <Button variant="secondary" onClick={copySummary}>
              <Icon name="arrow-right" size={15} />
              진행 요약 복사
            </Button>
          </div>
        </div>
        {copyResult ? <p role="status">{copyResult}</p> : null}
        <div className="guide-mini-map" aria-label="튜토리얼 단계 요약">
          {tutorialSteps.map((item) => (
            <button
              key={item.route}
              type="button"
              className="guide-mini-step"
              onClick={() => onNavigate(item.route, { source: 'hero', fromLanding: true })}
            >
              <span aria-hidden="true">
                <Icon name={item.icon} size={20} />
              </span>
              <span>
                {item.step}. {item.title}
              </span>
              <span>{item.duration}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="guide-flow" aria-labelledby="tutorial-flow-title">
        <div className="guide-flow-title">
          <p className="page-eyebrow">추천 운영 시퀀스</p>
          <h2 id="tutorial-flow-title" className="section-title">
            업무 시작 1회차 동선
          </h2>
        </div>
        <div className="guide-flow-list">
          {tutorialSteps.map((step) => (
            <Card as="article" className="guide-step-card" key={step.route}>
              <span className="guide-step-number">{step.step}</span>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name={step.icon} size={20} />
              </span>
              <h3>
                {step.title}
                <span style={{ marginLeft: 'var(--space-2)' }}>· {step.duration}</span>
              </h3>
              <p>{step.desc}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate(step.route, { source: 'hero', fromLanding: true })}
              >
                {step.action}
                <Icon name="arrow-right" size={15} />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader
          title="도입 유형별 추천 시작점"
          subtitle="역할에 따라 집중하면 교육 비용이 줄어듭니다."
        />
        <div className="guide-examples" style={{ marginTop: 'var(--space-4)' }}>
          {tutorialPersonas.map((persona) => (
            <div key={persona.role}>
              <dl>
                <dt>
                  <Icon name={persona.icon} size={16} /> {persona.role}
                </dt>
                <dd>
                  {persona.summary}
                  <div
                    style={{
                      marginTop: 'var(--space-3)',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <Badge tone="neutral" plain>
                      추천 시작: {persona.startAt}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() =>
                        onNavigate(persona.route, { source: 'hero', fromLanding: true })
                      }
                    >
                      {persona.action}
                    </Button>
                  </div>
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="10분 체크리스트"
          subtitle="각 단계 완료 시 체크하면 진척률이 남습니다."
        />
        <div className="guide-progress" aria-live="polite" aria-atomic="true">
          <div className="guide-progress-head">
            <span>진행률</span>
            <strong>{progressLabel}</strong>
          </div>
          <div className="guide-progress-track">
            <span style={{ width: `${progressRate}%` }} />
          </div>
          {checkedCount > 0 ? (
            <button type="button" className="card-link guide-progress-reset" onClick={reset}>
              진행률 초기화
            </button>
          ) : null}
        </div>
        <ol className="guide-checklist guide-checklist--interactive">
          {tutorialSteps.map((step, index) => (
            <li key={step.step}>
              <label className="guide-check-item">
                <input
                  type="checkbox"
                  aria-label={`${step.title} 완료`}
                  checked={checkedSteps.includes(index)}
                  onChange={(event) => toggleStep(index, event.currentTarget.checked)}
                />
                <span>{step.step}</span>
                <div>
                  <strong>{step.title}</strong>
                  <span
                    className="guide-step-subtitle"
                    style={{ display: 'block', marginTop: '0.25rem' }}
                  >
                    {step.duration} · {step.desc}
                  </span>
                  <button
                    type="button"
                    className="card-link"
                    onClick={() =>
                      onNavigate(step.route, {
                        source: 'hero',
                        fromLanding: true,
                      })
                    }
                  >
                    {checkedSteps.includes(index) ? '재확인하기' : '지금 실행'}
                  </button>
                  <button
                    type="button"
                    className="card-link"
                    style={{ marginLeft: 'var(--space-2)' }}
                    onClick={() =>
                      onNavigate(step.route, {
                        source: 'hero',
                        fromLanding: true,
                      })
                    }
                  >
                    데모에서 바로 실행
                  </button>
                </div>
              </label>
            </li>
          ))}
        </ol>
      </Card>

      <section className="guide-flow" aria-labelledby="tutorial-scenarios-title">
        <div>
          <p className="page-eyebrow">시나리오별 진행 체크</p>
          <h2 id="tutorial-scenarios-title" className="section-title">
            역할/목표별 추천 흐름
          </h2>
        </div>
        <div className="guide-card-grid">
          {scenarioSummaries.map((scenario) => (
            <Card as="article" className="guide-article-card" key={scenario.title}>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name="check" size={20} />
              </span>
              <Badge tone={scenario.completed ? 'accent' : 'neutral'} plain>
                {scenario.completed ? '시나리오 완료' : `${scenario.rate}%`}
              </Badge>
              <h3>{scenario.title}</h3>
              <p>{scenario.summary}</p>
              <p className="guide-step-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                예상 소요: {scenario.duration}
              </p>
              <Button
                variant={scenario.completed ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onNavigate(scenario.target, { source: 'hero', fromLanding: true })}
              >
                {scenario.ctaLabel}
                <Icon name="arrow-right" size={15} />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="guide-flow" aria-labelledby="tutorial-goals-title">
        <div>
          <p className="page-eyebrow">도입 후 자주 확인할 화면</p>
          <h2 id="tutorial-goals-title" className="section-title">
            첫 일주일 운영 체크포인트
          </h2>
        </div>
        <div className="guide-card-grid">
          {onboardingMilestones.map((milestone) => (
            <Card as="article" className="guide-article-card" key={milestone.phase}>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name={milestone.icon} size={20} />
              </span>
              <Badge tone="neutral" plain>
                {milestone.phase}
              </Badge>
              <h3>{milestone.title}</h3>
              <p>{milestone.plan}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate(milestone.route, { source: 'hero', fromLanding: true })}
              >
                {milestone.action}
                <Icon name="arrow-right" size={15} />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="guide-flow" aria-labelledby="tutorial-checkpoint-title">
        <div>
          <p className="page-eyebrow">정합성 점검 루틴</p>
          <h2 id="tutorial-checkpoint-title" className="section-title">
            운영을 안정적으로 확장하는 기준
          </h2>
        </div>
        <div className="guide-card-grid">
          {quickGoals.map((goal) => {
            return (
              <Card as="article" className="guide-article-card" key={goal.title}>
                <span className="guide-step-icon" aria-hidden="true">
                  <Icon name="check" size={20} />
                </span>
                <h3>{goal.title}</h3>
                <p>{goal.detail}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate(goal.route, { source: 'hero', fromLanding: true })}
                >
                  {goal.action}
                  <Icon name="arrow-right" size={15} />
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      <Card>
        <CardHeader
          title="오류를 줄이는 운영 규칙"
          subtitle="작은 규칙 하나가 다음 사용자가 바로 이어받기 쉬운 운영으로 바뀝니다."
        />
        <div className="guide-faq">
          <article>
            <h3>기록 기준</h3>
            <p>
              대상자·담당자명은 화면 간 동일 표기로 맞추고, 메모에는 실제 실행 가능한 조치만
              남깁니다.
            </p>
          </article>
          <article>
            <h3>일정·기록 시간 규칙</h3>
            <p>
              방문 전에는 일정 시간을 먼저 등록하고, 방문 후에는 실제 소요 시간 기준으로 기록을
              남깁니다.
            </p>
          </article>
          <article>
            <h3>상태 전환 규칙</h3>
            <p>
              확정되지 않은 건은 요청·검토중 같은 중간 상태로 둬서 후속 조치(보완/재심사)를
              유도합니다.
            </p>
          </article>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="자주 묻는 질문"
          subtitle="도입 초기에 많이 묻는 운영 질문을 정리했습니다."
        />
        <div className="guide-faq">
          {tutorialFaq.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <article className="public-faq-item" key={item.q}>
                <button
                  type="button"
                  className={`public-faq-question ${isOpen ? 'is-open' : ''}`}
                  aria-expanded={isOpen}
                  aria-controls={`tutorial-faq-${index}`}
                  onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
                >
                  <span>{item.q}</span>
                  <span className={`public-faq-sign ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`tutorial-faq-${index}`}
                  className={`public-faq-answer ${isOpen ? 'is-open' : ''}`}
                >
                  <p>{item.a}</p>
                </div>
              </article>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
