import { useEffect, useMemo, useState } from 'react'

import { routeDefs } from '../../routeConfig'
import { Badge, Button, Card, CardHeader, Icon, PageHeader } from '../ui'

import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type GuidePageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

const workflowSteps: {
  step: string
  title: string
  desc: string
  route: AppRoute
  action: string
  icon: 'schedule' | 'care' | 'settlement' | 'claims'
}[] = [
  {
    step: '1',
    title: '방문 일정을 먼저 정합니다',
    desc: '돌봄 받는 분, 담당자, 방문 날짜와 시간을 등록합니다. 일정이 먼저 잡혀야 기록 누락과 정산 착오를 줄일 수 있습니다.',
    route: '/schedule',
    action: '일정 화면 열기',
    icon: 'schedule',
  },
  {
    step: '2',
    title: '돌봄 기록을 바로 남깁니다',
    desc: '방문, 원격상담, 투약, 식사관리처럼 실제로 제공한 돌봄을 대상자와 담당자 기준으로 기록합니다.',
    route: '/care',
    action: '기록 화면 열기',
    icon: 'care',
  },
  {
    step: '3',
    title: '돌봄비를 계산합니다',
    desc: '돌봄 시간과 시간당 금액을 입력하면 가족별 정산액이 계산됩니다. 메모에는 야간 돌봄, 추가 방문 같은 예외를 남기세요.',
    route: '/settlements',
    action: '정산 화면 열기',
    icon: 'settlement',
  },
  {
    step: '4',
    title: '보험청구 상태를 끝까지 봅니다',
    desc: '요청, 검토중, 승인, 거절 상태를 최신으로 유지합니다. 승인 전 단계는 대시보드와 사이드바에서 다시 알려줍니다.',
    route: '/claims',
    action: '청구 화면 열기',
    icon: 'claims',
  },
]

const dailyChecks = [
  '대시보드에서 오늘 처리할 일을 확인합니다.',
  '오늘 방문 일정의 시간, 담당자, 취소 여부를 먼저 확인합니다.',
  '방문이나 상담이 끝나면 돌봄 기록에 바로 남깁니다.',
  '정산이 필요한 대상자는 돌봄 시간과 단가를 입력합니다.',
  '요청 또는 검토중인 보험청구가 있으면 상태를 업데이트합니다.',
  '월말에는 운영 분석에서 정산 추이와 승인률을 확인합니다.',
]

const firstDayTutorial: {
  title: string
  desc: string
  route: AppRoute
  action: string
}[] = [
  {
    title: '오늘 방문할 대상자를 하나 등록합니다',
    desc: '방문 일정에서 대상자, 담당자, 날짜, 시작/종료 시간을 입력합니다. 처음에는 실제 운영과 같은 이름 한 건만 등록해도 충분합니다.',
    route: '/schedule',
    action: '방문 일정으로 이동',
  },
  {
    title: '방문 후 기록을 남깁니다',
    desc: '돌봄 기록에서 같은 대상자를 입력하고 활동 유형을 선택합니다. 메모에는 다음 담당자가 바로 이해할 만큼만 구체적으로 남깁니다.',
    route: '/care',
    action: '돌봄 기록으로 이동',
  },
  {
    title: '돌봄비를 계산합니다',
    desc: '정산 화면에서 돌봄 시간과 시간당 금액을 입력합니다. 총액은 자동 계산되므로 금액 계산보다 시간과 단가 확인에 집중하세요.',
    route: '/settlements',
    action: '정산으로 이동',
  },
  {
    title: '보험청구 진행 상태를 남깁니다',
    desc: '청구가 필요한 대상자는 기관명, 예상 금액, 접수일, 상태를 입력합니다. 상태가 바뀌면 목록에서 바로 업데이트합니다.',
    route: '/claims',
    action: '보험청구로 이동',
  },
]

const screenGuides: {
  route: AppRoute
  purpose: string
  details: string[]
}[] = [
  {
    route: '/',
    purpose: '오늘 처리할 업무를 한눈에 보는 출발 화면입니다.',
    details: [
      '상단 업무 큐는 방문 일정, 돌봄 기록, 정산, 보험청구 순서로 표시됩니다.',
      '오늘 일정과 확인할 청구가 있으면 먼저 처리할 항목으로 올라옵니다.',
    ],
  },
  {
    route: '/schedule',
    purpose: '방문 시간, 담당자, 진행 상태를 관리합니다.',
    details: [
      '예정, 진행중, 완료, 취소 상태를 목록에서 바로 바꿀 수 있습니다.',
      '비슷한 방문은 복제한 뒤 날짜와 시간만 바꿔 빠르게 등록합니다.',
    ],
  },
  {
    route: '/care',
    purpose: '실제 제공한 돌봄 활동을 대상자와 담당자 기준으로 남깁니다.',
    details: [
      '방문, 원격상담, 투약, 식사관리, 기타 유형을 선택합니다.',
      '정산이나 청구 근거가 될 수 있는 내용은 메모에 남깁니다.',
    ],
  },
  {
    route: '/settlements',
    purpose: '돌봄 시간과 단가로 가족별 정산액을 계산합니다.',
    details: [
      '시간과 기준 금액을 입력하면 총액이 계산됩니다.',
      '야간 돌봄, 추가 방문, 예외 금액은 메모에 구분해 둡니다.',
    ],
  },
  {
    route: '/claims',
    purpose: '보험청구 요청부터 승인까지의 진행 상태를 추적합니다.',
    details: [
      '요청, 검토중, 승인, 거절 상태를 최신으로 유지합니다.',
      '반려나 서류 보완 사유는 메모에 남겨 다음 조치를 놓치지 않게 합니다.',
    ],
  },
  {
    route: '/analytics',
    purpose: '월별 정산과 청구 추이를 확인하는 운영 점검 화면입니다.',
    details: [
      '정산 합계, 청구 건수, 승인률 변화를 월별로 비교합니다.',
      '서버 집계가 없으면 클라이언트 계산 폴백으로 현재 데이터를 보여줍니다.',
    ],
  },
  {
    route: '/plans',
    purpose: '요금제 단가와 이용 가구 수로 매출 시나리오를 점검합니다.',
    details: [
      '월 단가, 연간 할인, 활성 고객 수를 저장합니다.',
      '가격 인상률과 업그레이드 전환율을 조정해 목표 대비 격차를 확인합니다.',
    ],
  },
]

const roleGuides = [
  {
    role: '센터 관리자',
    checks: [
      '대시보드에서 미처리 업무 확인',
      '운영 분석에서 월별 추이 확인',
      '요금제 변경 전 매출 영향 점검',
    ],
  },
  {
    role: '방문 담당자',
    checks: [
      '오늘 일정의 시간과 대상자 확인',
      '방문 완료 후 돌봄 기록 작성',
      '취소나 변경 사항을 일정 메모에 기록',
    ],
  },
  {
    role: '정산·청구 담당자',
    checks: [
      '정산 시간과 단가 검토',
      '청구 상태를 요청에서 승인까지 갱신',
      '거절 사유와 보완 요청을 메모에 기록',
    ],
  },
]

const dataRules = [
  {
    title: '대상자 이름',
    desc: '일정, 기록, 정산, 청구에서 같은 표기를 사용하세요. 띄어쓰기와 별칭이 섞이면 같은 사람을 여러 명으로 보게 됩니다.',
  },
  {
    title: '날짜와 시간',
    desc: '방문 전에는 일정 시간을 먼저 등록하고, 방문 후에는 실제 제공한 돌봄 내용을 기록합니다. 종료 시간은 시작 시간보다 늦어야 합니다.',
  },
  {
    title: '메모',
    desc: '다음 담당자가 행동할 수 있는 내용만 남깁니다. 예: 준비물, 보호자 요청, 영수증 확인, 서류 보완 사유.',
  },
  {
    title: '상태값',
    desc: '상태는 현재 업무가 어디까지 진행됐는지 나타내는 신호입니다. 확정되지 않은 건은 요청/검토중/예정처럼 중간 상태로 남겨둡니다.',
  },
]

const examples = [
  {
    label: '방문 일정 메모',
    value: '오전 9시 방문, 혈압계 지참, 보호자에게 도착 전 연락',
  },
  {
    label: '돌봄 기록 메모',
    value: '점심 식사 도움, 혈압 확인, 오후 약 복용 확인',
  },
  {
    label: '정산 메모',
    value: '오전 방문 2시간, 야간 원격 체크 1시간 포함',
  },
  {
    label: '청구 메모',
    value: '영수증 확인 필요, 보호자에게 서류 요청 완료',
  },
]

const faq = [
  {
    q: '잘못 입력한 기록은 어떻게 처리하나요?',
    a: '방문 일정과 돌봄 기록은 기존 항목을 복제해 새 항목으로 다시 저장할 수 있습니다. 삭제, 직접 수정, 수정 이력 관리는 다음 확장 기능으로 분리해 안전하게 추가하는 것이 좋습니다.',
  },
  {
    q: '방문 일정 상태는 어떻게 쓰나요?',
    a: '방문 전에는 예정, 담당자가 이동하거나 서비스를 제공 중이면 진행중, 방문이 끝나면 완료로 바꾸세요. 보호자 요청이나 기관 사정으로 못 가는 일정은 취소로 남깁니다.',
  },
  {
    q: '오프라인이거나 API 서버가 꺼져 있으면 어떻게 보이나요?',
    a: '상단 피드백 영역과 사이드바 연결 상태에서 서버 연결 문제를 알려줍니다. API 서버를 다시 실행한 뒤 새로고침하면 최신 데이터를 불러옵니다.',
  },
  {
    q: '보험청구 상태는 언제 바꾸나요?',
    a: '서류를 접수하면 요청, 보험사나 기관 검토가 시작되면 검토중, 금액이 확정되면 승인으로 바꾸세요. 반려되면 거절로 남기고 메모에 사유를 적습니다.',
  },
]

const GUIDE_CHECKLIST_STORAGE_KEY = 'guide-first-day-checklist-v1'
const parseChecklistState = () => {
  if (typeof window === 'undefined') {
    return [] as number[]
  }

  try {
    const raw = globalThis.localStorage.getItem(GUIDE_CHECKLIST_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((value): value is number => Number.isInteger(value))
  } catch {
    return []
  }
}

const clampStepIndex = (index: number) => {
  if (index < 0 || Number.isNaN(index)) {
    return false
  }
  return index >= 0 && index < firstDayTutorial.length
}

const useFirstDayChecklist = () => {
  const [checkedSteps, setCheckedSteps] = useState<number[]>(parseChecklistState)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    globalThis.localStorage.setItem(GUIDE_CHECKLIST_STORAGE_KEY, JSON.stringify(checkedSteps))
  }, [checkedSteps])

  const toggleStep = (stepIndex: number, checked: boolean) => {
    if (!clampStepIndex(stepIndex)) {
      return
    }
    setCheckedSteps((current) => {
      const next = current.filter((step) => step !== stepIndex)
      if (!checked) {
        return next
      }
      if (current.includes(stepIndex)) {
        return current
      }
      return [...current, stepIndex]
    })
  }

  const clear = () => setCheckedSteps([])

  return { checkedSteps, toggleStep, clear }
}

export const GuidePage = ({ onNavigate }: GuidePageProps) => {
  const def = routeDefs['/guide']
  const { checkedSteps, toggleStep, clear } = useFirstDayChecklist()
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1)

  const checkedCount = checkedSteps.length
  const completionRate = useMemo(
    () => Math.round((checkedCount / firstDayTutorial.length) * 100),
    [checkedCount]
  )

  return (
    <div className="stack">
      <PageHeader eyebrow={def.eyebrow} title={def.title} description={def.description} />

      <section className="guide-hero" aria-labelledby="guide-start-title">
        <div className="guide-hero-copy">
          <Badge tone="accent" plain>
            처음 시작
          </Badge>
          <h2 id="guide-start-title">방문 일정 → 돌봄 기록 → 정산 → 보험청구 순서로 진행하세요</h2>
          <p>
            이 서비스는 센터 운영자가 하루 업무를 놓치지 않도록 같은 흐름을 반복해서 보여줍니다.
            대시보드는 오늘 해야 할 일을 먼저 보여주고, 각 화면은 입력과 확인을 한곳에서 끝낼 수
            있게 구성되어 있습니다.
          </p>
        </div>
        <div className="guide-mini-map" aria-label="업무 흐름 요약">
          {workflowSteps.map((item) => (
            <button
              key={item.route}
              type="button"
              className="guide-mini-step"
              onClick={() => onNavigate(item.route)}
            >
              <span aria-hidden="true">
                <Icon name={item.icon} size={20} />
              </span>
              <span>
                {item.step}. {item.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="guide-flow" aria-labelledby="guide-flow-title">
        <div>
          <p className="page-eyebrow">기본 업무 순서</p>
          <h2 id="guide-flow-title" className="section-title">
            처음 하루를 이렇게 시작합니다
          </h2>
        </div>
        <div className="guide-flow-list">
          {workflowSteps.map((item) => (
            <Card as="article" className="guide-step-card" key={item.route}>
              <span className="guide-step-number">{item.step}</span>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <Button variant="secondary" size="sm" onClick={() => onNavigate(item.route)}>
                {item.action}
                <Icon name="arrow-right" size={15} />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader
          title="처음 10분 튜토리얼"
          subtitle="샘플 데이터 한 건으로 전체 흐름을 끝까지 확인하는 순서입니다."
        />
        <div className="guide-progress" aria-live="polite" aria-atomic="true">
          <div className="guide-progress-head">
            <span>진행률</span>
            <strong>
              {checkedCount} / {firstDayTutorial.length} 단계 완료
            </strong>
          </div>
          <div className="guide-progress-track">
            <span style={{ width: `${completionRate}%` }} />
          </div>
          {checkedCount > 0 ? (
            <button type="button" className="card-link guide-progress-reset" onClick={clear}>
              진행률 초기화
            </button>
          ) : null}
        </div>
        <ol className="guide-checklist guide-checklist--interactive">
          {firstDayTutorial.map((item, index) => (
            <li key={item.title}>
              <label className="guide-check-item">
                <input
                  type="checkbox"
                  aria-label={`${item.title} 완료`}
                  checked={checkedSteps.includes(index)}
                  onChange={(event) => toggleStep(index, event.currentTarget.checked)}
                />
                <span>{index + 1}</span>
                <p>
                  <strong>{item.title}</strong>
                  {item.desc}
                </p>
                <button type="button" className="card-link" onClick={() => onNavigate(item.route)}>
                  {item.action}
                </button>
              </label>
            </li>
          ))}
        </ol>
      </Card>

      <section className="guide-flow" aria-labelledby="guide-screen-title">
        <div>
          <p className="page-eyebrow">화면별 사용법</p>
          <h2 id="guide-screen-title" className="section-title">
            각 화면에서 확인할 내용
          </h2>
        </div>
        <div className="guide-card-grid">
          {screenGuides.map((item) => {
            const route = routeDefs[item.route]
            return (
              <Card as="article" className="guide-article-card" key={item.route}>
                <span className="guide-step-icon" aria-hidden="true">
                  <Icon name={route.icon} size={22} />
                </span>
                <h3>{route.title}</h3>
                <p>{item.purpose}</p>
                <ul className="guide-bullets">
                  {item.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <Button variant="secondary" size="sm" onClick={() => onNavigate(item.route)}>
                  화면 열기
                  <Icon name="arrow-right" size={15} />
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="grid-2">
        <Card>
          <CardHeader
            title="매일 확인할 체크리스트"
            subtitle="센터 담당자가 업무 시작과 마감 전에 확인하면 좋은 순서입니다."
          />
          <ol className="guide-checklist">
            {dailyChecks.map((item, index) => (
              <li key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader
            title="입력 예시"
            subtitle="메모는 짧아도 됩니다. 다음 사람이 이해할 정도로만 남기세요."
          />
          <dl className="guide-examples">
            {examples.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader
            title="역할별 체크포인트"
            subtitle="담당 업무에 따라 먼저 볼 화면과 확인할 항목을 나눴습니다."
          />
          <div className="guide-faq">
            {roleGuides.map((item) => (
              <article key={item.role}>
                <h3>{item.role}</h3>
                <ul className="guide-bullets">
                  {item.checks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="데이터 입력 원칙"
            subtitle="나중에 검색, 정산, 청구 흐름이 흔들리지 않게 하는 기준입니다."
          />
          <div className="guide-faq">
            {dataRules.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="자주 묻는 질문"
          subtitle="운영 중 막히기 쉬운 상황을 기준으로 정리했습니다."
        />
        <div className="guide-faq">
          {faq.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <article className="public-faq-item" key={item.q}>
                <button
                  type="button"
                  className={`public-faq-question ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
                  aria-expanded={isOpen}
                  aria-controls={`guide-faq-answer-${index}`}
                >
                  <span>{item.q}</span>
                  <span className={`public-faq-sign ${isOpen ? 'is-open' : ''}`} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`guide-faq-answer-${index}`}
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
