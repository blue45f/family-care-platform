import { useMemo, useState } from 'react'

import { Badge, Button, Card, CardHeader, Icon, PageHeader, Stat } from '../ui'

import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type PublicPlansPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

type PublicPlanOverview = {
  tier: 'Starter' | 'Growth' | 'Enterprise'
  monthlyPrice: number | null
  annualDiscount: number
  note: string
  included: string[]
  ctaLabel: string
  highlight: boolean
}

const publicPlans: PublicPlanOverview[] = [
  {
    tier: 'Starter',
    monthlyPrice: 49000,
    annualDiscount: 0,
    note: '소규모 센터, 시범 운영에 적합합니다.',
    ctaLabel: '데모로 미리보기',
    highlight: false,
    included: ['최대 30건 일정', '기본 돌봄 기록', '월 1회 정산 보고서'],
  },
  {
    tier: 'Growth',
    monthlyPrice: 119000,
    annualDiscount: 0.12,
    note: '운영이 본격화된 센터를 위한 표준 구성입니다.',
    ctaLabel: '상담 신청하기',
    highlight: true,
    included: [
      '최대 200건 일정',
      '보험청구 상태 자동 추적',
      '권한 기반 화면 가드',
      '실시간 분석 대시보드',
    ],
  },
  {
    tier: 'Enterprise',
    monthlyPrice: null,
    annualDiscount: 0,
    note: '센터 다중 운영, 대형 계약은 계약형으로 견적 확정합니다.',
    ctaLabel: '맞춤 견적 받기',
    highlight: false,
    included: ['멀티 센터 운영', '팀 조직과 승인 프로세스 정책', '전담 온보딩 및 SLA', '우선 지원'],
  },
]

const scenarioItems = [
  '센터 규모가 커질수록 월 단가/인력/센터 단위를 분리해 운영합니다.',
  '정기 정산·청구가 동시에 많을수록 Growth 플랜에서 안정성이 커집니다.',
  '요금은 월 정산 또는 연 결제 옵션으로 정산 가능합니다.',
]

const conversionNotes = [
  '월 단가는 플랜별 기본 운영 기준가를 기준으로 산정됩니다.',
  '문의형/계약형 플랜은 대상센터 환경을 기준으로 맞춤 산정됩니다.',
  '도입 단계에서는 데모 계정으로 워크플로우를 확인하고 바로 확정도 가능합니다.',
]

const scenarioStats = [
  { label: '평균 월별 정산 처리시간', value: '18분', tone: '빠른 처리' },
  { label: '운영 데이터 반영 속도', value: '실시간', tone: '업무 연동' },
  { label: '신규 담당자 온보딩 기간', value: '약 1일', tone: '초보자 지원' },
]

const MIN_FAMILY_COUNT = 10
const MAX_FAMILY_COUNT = 800
const STEP_FAMILY_COUNT = 5
const MIN_CLAIM_COUNT = 0
const MAX_CLAIM_COUNT = 300
const STEPS_FOR_STANDARD_ADDON = 10
const STANDARD_ADDON_COST = 14_000
const GROWTH_ADDON_STEP = 25
const GROWTH_ADDON_COST = 8_000

const normalizeNumberInput = (value: string, fallback: number, min: number, max: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

const calcStarter = (familyCount: number) => {
  if (familyCount <= 30) {
    return 49_000
  }
  const extra = Math.ceil((familyCount - 30) / STEPS_FOR_STANDARD_ADDON)
  return 49_000 + extra * STANDARD_ADDON_COST
}

const calcGrowth = (familyCount: number) => {
  const extra = Math.max(0, Math.ceil((familyCount - 200) / GROWTH_ADDON_STEP))
  return 119_000 + extra * GROWTH_ADDON_COST
}

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`

const renderPrice = (plan: PublicPlanOverview) => {
  if (plan.monthlyPrice === null) {
    return '별도 문의'
  }

  const annualPrice = Math.round(plan.monthlyPrice * 12 * (1 - plan.annualDiscount))
  const perYear = plan.annualDiscount > 0 ? `, 연 ${annualPrice.toLocaleString('ko-KR')}원` : ''

  return `${plan.monthlyPrice.toLocaleString('ko-KR')}원/월${perYear}`
}

export const PublicPlansPage = ({ onNavigate }: PublicPlansPageProps) => {
  const toLogin = () => onNavigate('/login', { source: 'hero', fromLanding: true })
  const toRegister = () => onNavigate('/register', { source: 'pricing_button', fromLanding: true })
  const [familyCount, setFamilyCount] = useState(60)
  const [claimCount, setClaimCount] = useState(12)
  const [includeClaims, setIncludeClaims] = useState(true)

  const starterEstimate = useMemo(() => calcStarter(familyCount), [familyCount])
  const growthEstimate = useMemo(() => calcGrowth(familyCount), [familyCount])
  const recommendation = useMemo(() => {
    if (familyCount <= 30 && !includeClaims) {
      return 'Starter'
    }

    if (includeClaims && familyCount >= 130) {
      return 'Growth'
    }

    if (familyCount <= 200 && growthEstimate <= starterEstimate + 50_000) {
      return 'Growth'
    }

    return 'Starter'
  }, [familyCount, includeClaims, growthEstimate, starterEstimate])

  const estimatedRange = useMemo(() => {
    if (recommendation === 'Starter' && familyCount <= 200) {
      return `${toWon(starterEstimate)}~`
    }
    if (recommendation === 'Growth') {
      return `${toWon(growthEstimate)}~`
    }
    return '별도 문의'
  }, [recommendation, familyCount, growthEstimate, starterEstimate])

  const handleFamilyChange = (value: string) =>
    setFamilyCount(normalizeNumberInput(value, familyCount, MIN_FAMILY_COUNT, MAX_FAMILY_COUNT))
  const handleClaimChange = (value: string) =>
    setClaimCount(normalizeNumberInput(value, claimCount, MIN_CLAIM_COUNT, MAX_CLAIM_COUNT))

  const claimImpact =
    claimCount > 80
      ? '보험청구 건수가 높아 상태 흐름 자동화가 중요합니다.'
      : '보험청구량은 초기 가시성에 유리한 범위입니다.'

  return (
    <div className="stack">
      <PageHeader
        eyebrow="요금제 / 도입 안내"
        title="요금제와 도입 단계를 한 번에 보여줍니다"
        description="규모와 운영 방식이 다르면 최적 구성이 달라집니다. 먼저 시범 운영부터 시작해서, 확장 단계에 맞춰 플랜을 바꿔가세요."
      />

      <Card>
        <CardHeader
          title="요금제 미리 계산"
          subtitle="도입 전 시나리오를 넣고 추천 플랜을 확인해보세요."
        />
        <div className="public-pricing-calculator">
          <div className="public-pricing-field">
            <label htmlFor="family-count">월 대상자 수(예측)</label>
            <div className="public-pricing-input-group">
              <input
                id="family-count"
                type="range"
                min={MIN_FAMILY_COUNT}
                max={MAX_FAMILY_COUNT}
                step={STEP_FAMILY_COUNT}
                value={familyCount}
                onChange={(event) => setFamilyCount(Number(event.target.value))}
              />
              <input
                type="number"
                min={MIN_FAMILY_COUNT}
                max={MAX_FAMILY_COUNT}
                value={familyCount}
                onChange={(event) => handleFamilyChange(event.target.value)}
              />
            </div>
          </div>
          <div className="public-pricing-field">
            <label htmlFor="claim-count">월 보험청구 건수(예측)</label>
            <div className="public-pricing-input-group">
              <input
                id="claim-count"
                type="range"
                min={MIN_CLAIM_COUNT}
                max={MAX_CLAIM_COUNT}
                value={claimCount}
                onChange={(event) => setClaimCount(Number(event.target.value))}
              />
              <input
                type="number"
                min={MIN_CLAIM_COUNT}
                max={MAX_CLAIM_COUNT}
                value={claimCount}
                onChange={(event) => handleClaimChange(event.target.value)}
              />
            </div>
          </div>
          <label className="public-plan-check">
            <input
              type="checkbox"
              checked={includeClaims}
              onChange={(event) => setIncludeClaims(event.currentTarget.checked)}
            />
            보험청구를 정기적으로 운영할 계획이 있나요?
          </label>
        </div>
        <div className="public-pricing-estimate" aria-live="polite" aria-atomic="true">
          <p>
            추천 플랜: <strong>{recommendation}</strong>
          </p>
          <p>예상 월 비용: {estimatedRange}</p>
          <p>{claimImpact}</p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="도입 전 이렇게 체크하세요"
          subtitle="요금 정책을 선택할 때 운영 데이터의 신호가 무엇을 말하는지 먼저 봅니다."
        />
        <ul className="guide-bullets">
          {scenarioItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <div className="grid-2">
        {scenarioStats.map((stat) => (
          <Stat
            key={stat.label}
            icon="analytics"
            label={stat.label}
            value={stat.value}
            valueLabel={stat.tone}
            foot="온보딩 초반 기준 가이드"
          />
        ))}
      </div>

      <section className="public-pricing" aria-labelledby="plan-grid-title">
        <div className="public-section-head" style={{ marginBottom: 'var(--space-5)' }}>
          <p className="page-eyebrow">요금제 구성</p>
          <h2 id="plan-grid-title" style={{ maxWidth: 'unset' }}>
            사용량이 늘어도 운영 루틴은 계속 같습니다
          </h2>
          <p>아래는 운영 기준별 예시입니다. 실제 계약은 센터 특성에 따라 변경될 수 있습니다.</p>
        </div>

        <div className="public-pricing-list" style={{ marginBottom: 'var(--space-5)' }}>
          {publicPlans.map((plan) => (
            <article
              className={plan.highlight ? 'public-pricing-item--highlight' : ''}
              style={{
                position: 'relative',
                display: 'grid',
                gap: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: plan.highlight
                  ? '1px solid color-mix(in oklch, var(--accent) 42%, var(--border-subtle))'
                  : '1px solid var(--border-subtle)',
                background: plan.highlight
                  ? 'color-mix(in oklch, var(--accent-soft) 28%, var(--bg-surface-raised))'
                  : 'var(--bg-surface)',
                padding: 'var(--space-5)',
              }}
              key={plan.tier}
            >
              <Badge tone={plan.highlight ? 'accent' : 'neutral'} plain>
                {plan.highlight ? '추천' : '표준'}
              </Badge>
              <h3 style={{ marginTop: 'var(--space-2)' }}>{plan.tier}</h3>
              <p style={{ fontSize: 'var(--text-2xl)', color: 'var(--fg-strong)' }}>
                {renderPrice(plan)}
              </p>
              <p style={{ color: 'var(--fg-muted)' }}>{plan.note}</p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {plan.included.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    <Icon name="check" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? 'primary' : 'secondary'}
                onClick={() => {
                  if (plan.tier === 'Starter') {
                    toLogin()
                    return
                  }
                  if (plan.tier === 'Growth') {
                    toRegister()
                    return
                  }
                  toRegister()
                }}
              >
                {plan.ctaLabel}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="public-band public-faq">
        <div className="public-section-head" style={{ marginBottom: 'var(--space-5)' }}>
          <p className="page-eyebrow">요금제 변경 안내</p>
          <h2>오해를 줄이는 변환 방식</h2>
          <p>시작 플랜에서 Growth로 옮길 때는 대상 수와 월 사용 건수를 같이 점검하면 됩니다.</p>
        </div>
        <div className="public-faq-list">
          {conversionNotes.map((item, index) => (
            <div className="public-faq-item" key={item}>
              <div className="public-faq-question is-open" aria-hidden="true">
                <span>포인트 {index + 1}</span>
                <span className="public-faq-sign is-open">✓</span>
              </div>
              <div className="public-faq-answer is-open">
                <p>{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader
          title="계산식 이해 도움말"
          subtitle="요금 계산은 실제 계약 시점의 세부 할인/부가서비스 조건에 맞춰 확정됩니다."
        />
        <div className="guide-bullets">
          <ul className="guide-bullets" style={{ margin: 0, padding: 0 }}>
            {[
              '예시는 월 이용 가구 수, 활성 대상자 수, 월 단가 기준으로 산출됩니다.',
              '연 결제 시 운영 연장 혜택이 적용돼 연 단가가 조정될 수 있습니다.',
              '센터별 규정/검수/문서 보관 방식은 도입 단계에서 맞춤 설계를 진행합니다.',
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
          <Button onClick={toLogin}>데모 계정으로 바로 시작</Button>
          <Button variant="secondary" onClick={toRegister}>
            센터 계정 개설하기
          </Button>
        </div>
      </Card>
    </div>
  )
}
