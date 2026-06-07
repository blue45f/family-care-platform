import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'

import type { AppRoute } from '../../routeConfig'
import type { PublicNavigateState } from '../../routeConfig'
import { Button, Icon } from '../ui'

type PublicHomePageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

const publicWorkflow = [
  {
    step: '1',
    title: '방문 일정',
    desc: '오늘 방문할 대상자와 담당자를 먼저 정합니다.',
    icon: 'schedule',
  },
  {
    step: '2',
    title: '돌봄 기록',
    desc: '방문, 상담, 투약, 식사관리 내용을 바로 남깁니다.',
    icon: 'care',
  },
  {
    step: '3',
    title: '정산·청구',
    desc: '돌봄비와 보험청구 상태를 같은 흐름에서 확인합니다.',
    icon: 'claims',
  },
] as const

const publicHighlights = [
  '오늘 처리할 일을 먼저 보여주는 대시보드',
  '방문 일정, 담당자, 상태 변경을 한 화면에서 관리',
  '정산 금액 자동 계산과 보험청구 진행 상태 추적',
  '처음 쓰는 담당자를 위한 사용 가이드와 역할별 체크포인트',
]

const publicMetricCards = [
  {
    value: '12',
    label: '분 안에',
    desc: '일일 현황 요약을 확인하고 다음 할 일을 시작합니다.',
  },
  {
    value: '98%',
    label: '기록 완료율',
    desc: '방문 전용 템플릿으로 누락된 기록 항목을 줄입니다.',
  },
  {
    value: '25%',
    label: '정산 소요 단축',
    desc: '정산·청구 화면 한 번에 상태 흐름을 관리해 시간을 줄입니다.',
  },
]

const publicPricingTiers = [
  {
    name: '스타터',
    price: '월 49,000원',
    desc: '작은 센터, 소규모 팀 파일럿용',
    bullets: ['월 최대 30건 일정', '돌봄 기록/정산 기본 탭', '데모 기반 튜토리얼 포함'],
  },
  {
    name: '프로',
    price: '월 119,000원',
    desc: '정규 운영 중인 팀 운영용',
    bullets: ['월 최대 200건 일정', '권한별 업무 템플릿', '보험청구 대시보드 강화'],
    highlight: true,
  },
  {
    name: '엔터프라이즈',
    price: '문의',
    desc: '다수 센터·규모형 운영용',
    bullets: ['센터 다중 운영', '조직 맞춤 규칙', '우선 지원 및 온보딩 지원'],
  },
]

const publicFaqs = [
  {
    question: '지금 바로 데모를 볼 수 있나요?',
    answer:
      '로그인 화면의 데모 시작 버튼으로 샘플 데이터와 함께 바로 체험할 수 있습니다. 별도 계약 전에도 사용 흐름을 확인해보세요.',
  },
  {
    question: '직원 수가 적은 작은 센터도 사용할 수 있나요?',
    answer:
      '네, 스태프 수와 대상자 수가 적은 센터를 기준으로 설계되어 있습니다. 대시보드와 일정표는 기본 사용자 수가 늘어나도 팀 구성에 맞춰 확장됩니다.',
  },
  {
    question: '보험청구/정산은 어느 단계부터 쓰기 시작할 수 있나요?',
    answer:
      '등록된 방문 일정에서 돌봄 내역이 쌓이면 정산 항목 생성이 자동으로 이어집니다. 이후 정산 목록에서 청구 상태를 한눈에 확인하면 됩니다.',
  },
  {
    question: '센터 전체 규정을 반영한 맞춤 설정이 가능할까요?',
    answer:
      '업무 절차에 맞게 체크포인트·상태 문구·권한 관리를 조정해 단계별 운영 규칙을 맞출 수 있습니다. 향후 추가 설정은 가이드 페이지와 함께 점진적으로 확장될 예정입니다.',
  },
] as const

type DemoLead = {
  centerName: string
  name: string
  email: string
  phone: string
}

type DemoLeadValidationError = {
  centerName?: string
  name?: string
  email?: string
  phone?: string
}

const productPreviewRows = [
  ['09:00', '이은정', '방문 예정', '예정'],
  ['11:30', '김민수', '복약 확인', '진행중'],
  ['14:00', '최성수', '정산 확인', '완료'],
]

const DEMO_LEAD_DRAFT_KEY = 'public-home-demo-lead-draft-v1'

const DEMO_LEAD_FALLBACK: DemoLead = {
  centerName: '',
  name: '',
  email: '',
  phone: '',
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PHONE_REGEX = /^[0-9+\-()\s]{9,20}$/

const readDemoLeadDraft = () => {
  if (typeof window === 'undefined') {
    return DEMO_LEAD_FALLBACK
  }

  try {
    const raw = window.localStorage.getItem(DEMO_LEAD_DRAFT_KEY)
    if (!raw) {
      return DEMO_LEAD_FALLBACK
    }

    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.centerName === 'string' &&
      typeof parsed?.name === 'string' &&
      typeof parsed?.email === 'string' &&
      typeof parsed?.phone === 'string'
    ) {
      return {
        centerName: parsed.centerName,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
      }
    }
  } catch {
    // ignore malformed draft and fall back to clean state
  }

  return DEMO_LEAD_FALLBACK
}

const validateDemoLead = (value: DemoLead): DemoLeadValidationError => {
  const errors: DemoLeadValidationError = {}

  if (!value.centerName.trim()) {
    errors.centerName = '센터명을 입력해 주세요.'
  }

  if (!value.name.trim()) {
    errors.name = '담당자 이름을 입력해 주세요.'
  }

  if (!value.email.trim()) {
    errors.email = '이메일을 입력해 주세요.'
  } else if (!EMAIL_REGEX.test(value.email.trim())) {
    errors.email = '올바른 이메일 주소 형식을 입력해 주세요.'
  }

  if (!value.phone.trim()) {
    errors.phone = '연락처를 입력해 주세요.'
  } else if (!PHONE_REGEX.test(value.phone.trim())) {
    errors.phone = '연락 가능한 번호 형식으로 입력해 주세요.'
  }

  return errors
}

const hasDemoLeadValidationError = (errors: DemoLeadValidationError) =>
  Object.values(errors).some(Boolean)

export const PublicHomePage = ({ onNavigate }: PublicHomePageProps) => {
  const leadFormId = useId()
  const [faqSearch, setFaqSearch] = useState('')
  const [activeFaqQuestion, setActiveFaqQuestion] = useState('')
  const [demoLead, setDemoLead] = useState<DemoLead>(readDemoLeadDraft)
  const [leadErrors, setLeadErrors] = useState<DemoLeadValidationError>({})
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  const leadCenterErrorId = `${leadFormId}-center-error`
  const leadNameErrorId = `${leadFormId}-name-error`
  const leadEmailErrorId = `${leadFormId}-email-error`
  const leadPhoneErrorId = `${leadFormId}-phone-error`

  const hasAnyLeadError = hasDemoLeadValidationError(leadErrors)
  const draftStateAvailable = typeof window !== 'undefined'

  useEffect(() => {
    if (leadSubmitted || typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(DEMO_LEAD_DRAFT_KEY, JSON.stringify(demoLead))
    } catch {
      // storage unavailable: ignore persistence gracefully
    }
  }, [demoLead, leadSubmitted])

  const visibleFaqs = useMemo(() => {
    const term = faqSearch.trim().toLowerCase()
    if (!term) {
      return publicFaqs
    }

    return publicFaqs.filter(
      ({ question, answer }) =>
        question.toLowerCase().includes(term) || answer.toLowerCase().includes(term),
    )
  }, [faqSearch])

  useEffect(() => {
    if (!visibleFaqs.length) {
      setActiveFaqQuestion('')
      return
    }

    if (!activeFaqQuestion || !visibleFaqs.some((faq) => faq.question === activeFaqQuestion)) {
      setActiveFaqQuestion(visibleFaqs[0].question)
    }
  }, [activeFaqQuestion, visibleFaqs])

  const resetLeadDraft = () => {
    setLeadSubmitted(false)
    setDemoLead(DEMO_LEAD_FALLBACK)
    setLeadErrors({})
    if (draftStateAvailable) {
      try {
        window.localStorage.removeItem(DEMO_LEAD_DRAFT_KEY)
      } catch {
        // ignore
      }
    }
  }

  const clearLeadError = (field: keyof DemoLeadValidationError) => {
    setLeadErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const updateDemoLead = (field: keyof DemoLead, value: string) => {
    setDemoLead((current) => ({ ...current, [field]: value }))
    clearLeadError(field)
  }

  const submitDemoLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = {
      centerName: demoLead.centerName.trim(),
      name: demoLead.name.trim(),
      email: demoLead.email.trim(),
      phone: demoLead.phone.trim(),
    }

    const errors = validateDemoLead(trimmed)

    if (hasDemoLeadValidationError(errors)) {
      setLeadErrors(errors)
      return
    }

    setDemoLead(trimmed)
    setLeadErrors({})
    if (draftStateAvailable) {
      try {
        window.localStorage.removeItem(DEMO_LEAD_DRAFT_KEY)
      } catch {
        // ignore
      }
    }

    setLeadSubmitted(true)
  }

  return (
    <main className="public-page" aria-labelledby="public-home-title">
      <header className="public-nav" aria-label="공개 사이트 내비게이션">
        <button type="button" className="public-brand" onClick={() => onNavigate('/')}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={18} />
          </span>
          <span>
            <strong>가족 돌봄 운영 플랫폼</strong>
            <small>CARE OPERATIONS</small>
          </span>
        </button>
        <nav className="public-nav-actions" aria-label="서비스 탐색 및 계정">
          <a className="public-anchor-link" href="#workflow">
            핵심 기능
          </a>
          <a className="public-anchor-link" href="#metrics">
            성과 지표
          </a>
          <button
            type="button"
            className="public-text-link"
            onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}
          >
            시작 가이드
          </button>
          <button
            type="button"
            className="public-text-link"
            onClick={() => onNavigate('/overview', { source: 'hero', fromLanding: true })}
          >
            서비스 소개
          </button>
          <button
            type="button"
            className="public-text-link"
            onClick={() => onNavigate('/plans', { source: 'pricing_button', fromLanding: true })}
          >
            요금제
          </button>
          <a className="public-anchor-link" href="#plans">
            요금 안내
          </a>
          <a className="public-anchor-link" href="#contact">
            데모 문의
          </a>
          <a className="public-anchor-link" href="#faq">
            자주 묻는 질문
          </a>
          <button
            type="button"
            className="public-text-link"
            onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}
          >
            로그인
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('/register', { source: 'hero', fromLanding: true })}
          >
            회원가입
          </Button>
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="page-eyebrow">돌봄 센터 운영자를 위한 업무 플랫폼</p>
          <h1 id="public-home-title">가족 돌봄 운영 플랫폼</h1>
          <p>방문 일정부터 보험청구까지, 센터 담당자가 오늘 해야 할 일을 놓치지 않게 정리합니다.</p>
          <div className="public-hero-actions">
            <Button onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}>
              <Icon name="arrow-right" size={16} />
              데모 계정으로 둘러보기
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}
            >
              운영 가이드 보기
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('/register', { source: 'hero', fromLanding: true })}
            >
              센터 계정 만들기
            </Button>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="public-band public-workflow"
        aria-labelledby="public-workflow-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">운영 흐름</p>
          <h2 id="public-workflow-title">하루 업무가 같은 순서로 정리됩니다</h2>
        </div>
        <div className="public-workflow-list">
          {publicWorkflow.map((item) => (
            <article className="public-workflow-item" key={item.title}>
              <span className="public-step">{item.step}</span>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="public-band public-preview-section"
        aria-labelledby="public-preview-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">제품 미리보기</p>
          <h2 id="public-preview-title">로그인하면 이런 운영 화면을 사용합니다</h2>
          <p>데모 계정으로 실제 일정, 기록, 정산, 청구 흐름을 눌러볼 수 있습니다.</p>
        </div>
        <div className="public-preview">
          <div className="public-preview-bar">
            <span>오늘 방문</span>
            <strong>3건</strong>
          </div>
          <div className="public-preview-grid">
            <div>
              <span>확인할 청구</span>
              <strong>2건</strong>
            </div>
            <div>
              <span>이번 달 정산</span>
              <strong>1,280,000원</strong>
            </div>
          </div>
          <table className="public-preview-table">
            <caption className="sr-only">공개 홈페이지 제품 미리보기 일정 표</caption>
            <thead>
              <tr>
                <th>시간</th>
                <th>대상자</th>
                <th>업무</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {productPreviewRows.map((row) => (
                <tr key={row.join('-')}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="public-band public-split" aria-labelledby="public-feature-title">
        <div>
          <p className="page-eyebrow">왜 필요한가요</p>
          <h2 id="public-feature-title">스프레드시트와 기억에 흩어진 일을 한곳으로 모읍니다</h2>
        </div>
        <ul className="public-check-list">
          {publicHighlights.map((item) => (
            <li key={item}>
              <Icon name="check" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="public-band public-metric"
        id="metrics"
        aria-labelledby="public-metric-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">운영 성과</p>
          <h2 id="public-metric-title">개발 초기에도 확인 가능한 운영 효율 예시</h2>
          <p>실제 도입 전에도 아래 지표로 운영 리스크를 줄이는 기준을 맞춥니다.</p>
        </div>
        <div className="public-metric-list">
          {publicMetricCards.map((metric) => (
            <article className="public-metric-item" key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <p>{metric.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="public-band public-pricing"
        id="plans"
        aria-labelledby="public-pricing-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">도입 계획</p>
          <h2 id="public-pricing-title">규모에 맞는 시작점을 바로 고를 수 있습니다</h2>
          <p>
            운영 규모가 커질수록 실제 적용 단계가 달라집니다. 지금은 데모로 기능을 확인한 뒤
            단계적으로 확장하세요.
          </p>
        </div>
        <div className="public-pricing-list">
          {publicPricingTiers.map((plan) => (
            <article
              className={`public-pricing-item ${plan.highlight ? 'public-pricing-item--highlight' : ''}`}
              key={plan.name}
            >
              <p className="public-pricing-name">{plan.name}</p>
              <h3>{plan.price}</h3>
              <p>{plan.desc}</p>
              <ul>
                {plan.bullets.map((bullet) => (
                  <li key={bullet}>
                    <Icon name="check" size={16} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'primary' : 'secondary'}
                onClick={() =>
                  onNavigate('/register', {
                    source: 'pricing_button',
                    plan: plan.name,
                    fromLanding: true,
                  })
                }
              >
                {plan.highlight ? '가장 많이 쓰는 플랜 보기' : '도입 문의'}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="public-band public-lead" id="contact" aria-labelledby="public-lead-title">
        <div className="public-section-head">
          <p className="page-eyebrow">상담 신청</p>
          <h2 id="public-lead-title">실제 운영 전 확인사항이 있으면 바로 보내주세요</h2>
          <p>
            센터 규모, 이용자 수, 보험 처리 방식 같은 핵심 정보를 남기면 맞춤 데모 시나리오를 먼저
            제안합니다.
          </p>
        </div>
        {leadSubmitted ? (
          <article className="public-lead-success" role="status">
            <p>접수 완료했습니다. 영업팀에서 1일 내로 연락드리겠습니다.</p>
            <div className="public-hero-actions">
              <Button type="button" onClick={resetLeadDraft}>
                새로운 문의 작성
              </Button>
            </div>
          </article>
        ) : (
          <form className="public-lead-form" onSubmit={submitDemoLead} noValidate>
            <label htmlFor="lead-center">
              센터명
              <small>필수 입력</small>
            </label>
            <input
              id="lead-center"
              name="centerName"
              value={demoLead.centerName}
              onChange={(e) => updateDemoLead('centerName', e.target.value)}
              placeholder="예) 행복돌봄센터"
              aria-invalid={Boolean(leadErrors.centerName) || undefined}
              aria-describedby={leadErrors.centerName ? leadCenterErrorId : undefined}
            />
            {leadErrors.centerName ? <p id={leadCenterErrorId}>{leadErrors.centerName}</p> : null}

            <label htmlFor="lead-name">
              담당자 이름
              <small>필수 입력</small>
            </label>
            <input
              id="lead-name"
              name="name"
              value={demoLead.name}
              onChange={(e) => updateDemoLead('name', e.target.value)}
              placeholder="예) 김현지"
              aria-invalid={Boolean(leadErrors.name) || undefined}
              aria-describedby={leadErrors.name ? leadNameErrorId : undefined}
            />
            {leadErrors.name ? <p id={leadNameErrorId}>{leadErrors.name}</p> : null}

            <label htmlFor="lead-email">
              이메일
              <small>필수 입력</small>
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              value={demoLead.email}
              onChange={(e) => updateDemoLead('email', e.target.value)}
              placeholder="name@care.co.kr"
              aria-invalid={Boolean(leadErrors.email) || undefined}
              aria-describedby={leadErrors.email ? leadEmailErrorId : undefined}
            />
            {leadErrors.email ? <p id={leadEmailErrorId}>{leadErrors.email}</p> : null}

            <label htmlFor="lead-phone">
              연락처
              <small>필수 입력</small>
            </label>
            <input
              id="lead-phone"
              name="phone"
              value={demoLead.phone}
              onChange={(e) => updateDemoLead('phone', e.target.value)}
              placeholder="010-0000-0000"
              aria-invalid={Boolean(leadErrors.phone) || undefined}
              aria-describedby={leadErrors.phone ? leadPhoneErrorId : undefined}
            />
            {leadErrors.phone ? <p id={leadPhoneErrorId}>{leadErrors.phone}</p> : null}

            <div className="public-hero-actions">
              <Button type="submit" disabled={hasAnyLeadError}>
                데모 상담 신청
              </Button>
              <Button type="button" variant="secondary" onClick={resetLeadDraft}>
                입력 내용 비우기
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="public-band public-faq" id="faq" aria-labelledby="public-faq-title">
        <div className="public-section-head">
          <p className="page-eyebrow">도입 가이드</p>
          <h2 id="public-faq-title">실제 운영 전 더 잘 이해할 수 있게 정리했습니다</h2>
          <p>
            궁금한 항목을 입력하면 해당 질문만 빠르게 찾아볼 수 있습니다.
            <span className="sr-only">
              FAQ는 중복 답변을 줄여서 같은 문구를 반복적으로 확인할 수 있습니다.
            </span>
          </p>
        </div>
        <input
          className="public-faq-search"
          type="search"
          placeholder="질문 또는 답변 내용으로 검색"
          value={faqSearch}
          onChange={(e) => setFaqSearch(e.target.value)}
          aria-label="FAQ 검색"
        />
        {visibleFaqs.length === 0 ? (
          <p className="public-faq-empty" role="status">
            검색어와 일치하는 FAQ가 없습니다. 검색어를 조금 줄여보세요.
          </p>
        ) : (
          <div className="public-faq-list">
            {visibleFaqs.map((faq) => {
              const isOpen = activeFaqQuestion === faq.question

              return (
                <article className="public-faq-item" key={faq.question}>
                  <button
                    type="button"
                    className="public-faq-question"
                    onClick={() => setActiveFaqQuestion(isOpen ? '' : faq.question)}
                    aria-expanded={isOpen}
                    aria-controls={`public-faq-answer-${faq.question.replaceAll(' ', '-')}`}
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`public-faq-sign ${isOpen ? 'is-open' : ''}`}
                      aria-hidden="true"
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    id={`public-faq-answer-${faq.question.replaceAll(' ', '-')}`}
                    className={`public-faq-answer ${isOpen ? 'is-open' : ''}`}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="public-cta" aria-labelledby="public-cta-title">
        <h2 id="public-cta-title">실제 화면을 바로 둘러보세요</h2>
        <p>로그인 화면에서 데모 계정을 누르면 샘플 운영 데이터로 전체 기능을 확인할 수 있습니다.</p>
        <div className="public-hero-actions">
          <Button onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}>
            <Icon name="arrow-right" size={16} />
            데모 계정으로 둘러보기
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('/register', { source: 'hero', fromLanding: true })}
          >
            회원가입
          </Button>
        </div>
      </section>

      <aside className="public-sticky-cta" aria-label="빠른 시작">
        <Button onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}>
          <Icon name="arrow-right" size={16} />
          데모로 시작
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('/register', { source: 'hero', fromLanding: true })}
        >
          회원가입
        </Button>
      </aside>
    </main>
  )
}
