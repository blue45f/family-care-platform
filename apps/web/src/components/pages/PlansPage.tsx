import { zodResolver } from '@hookform/resolvers/zod'
import { type CSSProperties, type ReactNode, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import {
  revenuePlanFormSchema,
  type RevenuePlanFormValues,
} from '../../features/revenue-plan/schema'
import { formatRate, formatWon, isReadOnlyErrorMessage } from '../../utils'
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
  Skeleton,
  Stat,
} from '../ui'

import type { PlatformData } from '../../state/usePlatformData'
import type { RevenuePlan } from '../../types'

type PlansPageProps = {
  data: PlatformData
}

const PLAN_TARGET_MONTHLY = 5_000_000

// 요금제 카드/시뮬레이터 그리드는 styles.css에 전용 클래스가 없으므로
// 디자인 토큰만 사용한 인라인 그리드로 반응형을 구성한다(320 → 1280 대응).
const planGridStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-4)',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 17rem), 1fr))',
}

const planFieldRowStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-3)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 8rem), 1fr))',
}

const simControlGridStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-4)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
}

const outcomeGridStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-3)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
}

const planFooterStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  marginTop: 'auto',
  paddingTop: 'var(--space-3)',
  borderTop: '1px solid var(--border-subtle)',
}

const controlValueStyle: CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--weight-semibold)',
  color: 'var(--fg-strong)',
  fontVariantNumeric: 'tabular-nums',
}

const progressTrackStyle: CSSProperties = {
  height: '0.5rem',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-sunken)',
  overflow: 'hidden',
}

type PlanCardProps = {
  plan: RevenuePlan
  submitPlan: PlatformData['submitPlan']
  isSaving: boolean
  isReadOnly: boolean
}

const PlanCard = ({ plan, submitPlan, isSaving, isReadOnly }: PlanCardProps): ReactNode => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
  } = useForm<RevenuePlanFormValues>({
    resolver: zodResolver(revenuePlanFormSchema),
    defaultValues: plan,
    mode: 'onChange',
  })

  // 서버 상태(plan)가 바뀌면(저장 성공·재로딩) 카드 입력을 최신 값으로 동기화한다.
  // 진행 중인 사용자 편집은 갱신 시점에 덮어쓴다(기존 AdminPage 동작과 동일).
  useEffect(() => {
    reset(plan)
  }, [plan, reset])

  const isBusy = isReadOnly || isSaving

  const monthlyPrice = useWatch({ control, name: 'monthlyPrice' })
  const annualDiscountRate = useWatch({ control, name: 'annualDiscountRate' })
  const activeClients = useWatch({ control, name: 'activeClients' })

  const safeMonthly = Number.isFinite(monthlyPrice) ? monthlyPrice : 0
  const safeClients = Number.isFinite(activeClients) ? activeClients : 0
  const safeDiscount = Number.isFinite(annualDiscountRate) ? annualDiscountRate : 0
  const monthlyContribution = safeMonthly * safeClients
  const annualContribution = safeMonthly * 12 * (1 - safeDiscount) * safeClients

  const onSubmit = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    await submitPlan(values)
  })

  return (
    <Card as="article" className="stack-sm">
      <form className="stack-sm" onSubmit={onSubmit} noValidate>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
          }}
        >
          <span className="card-subtitle" style={{ textTransform: 'uppercase' }}>
            {plan.id}
          </span>
          <Badge tone="accent" plain>
            이용 {safeClients}가구
          </Badge>
        </div>

        <Field label="요금제 이름" required error={errors.name?.message}>
          {(field) => (
            <Input
              {...field}
              type="text"
              autoComplete="off"
              disabled={isBusy}
              {...register('name')}
            />
          )}
        </Field>

        <div style={planFieldRowStyle}>
          <Field label="월 요금(원)" required error={errors.monthlyPrice?.message}>
            {(field) => (
              <Input
                {...field}
                type="number"
                min={0}
                step={1000}
                inputMode="numeric"
                disabled={isBusy}
                {...register('monthlyPrice', { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field
            label="연 결제 할인율"
            required
            hint="0 ~ 0.95 (예: 0.1 = 10%)"
            error={errors.annualDiscountRate?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="number"
                min={0}
                max={0.95}
                step={0.01}
                inputMode="decimal"
                disabled={isBusy}
                {...register('annualDiscountRate', { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>

        <Field label="이용 가구 수" required error={errors.activeClients?.message}>
          {(field) => (
            <Input
              {...field}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              disabled={isBusy}
              {...register('activeClients', { valueAsNumber: true })}
            />
          )}
        </Field>

        <Field label="설명" error={errors.description?.message}>
          {(field) => (
            <Input
              {...field}
              type="text"
              autoComplete="off"
              disabled={isBusy}
              {...register('description')}
            />
          )}
        </Field>

        {plan.featureFlags.length > 0 ? (
          <p className="field-hint" style={{ marginTop: 0 }}>
            제공 기능: {plan.featureFlags.join(' · ')}
          </p>
        ) : null}

        <div style={planFooterStyle}>
          <span
            className="stat-foot"
            aria-label={`월 예상 매출 ${formatWon(monthlyContribution)}, 연 예상 매출 ${formatWon(annualContribution)}`}
          >
            월 {formatWon(monthlyContribution)}
            <br />연 {formatWon(annualContribution)}
          </span>
          <Button type="submit" size="sm" disabled={isBusy || !isValid}>
            {isSaving ? '저장 중...' : '요금 반영'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export const PlansPage = ({ data }: PlansPageProps) => {
  // 읽기 전용(권한 부족) 상태에서는 저장을 막는다. App과 동일한 판별 규칙.
  const isReadOnly = isReadOnlyErrorMessage(data.errorMessage)

  const { scenarioRevenue } = data
  const clampedGoalRate = Number.isFinite(scenarioRevenue.goalRate)
    ? Math.max(0, Math.min(100, scenarioRevenue.goalRate))
    : 0
  const isInitialLoading = data.loading && data.plans.length === 0

  return (
    <div className="stack">
      <PageHeader
        eyebrow="서비스 관리"
        title="요금제 관리"
        description="요금제별 단가와 이용 가구를 관리하고, 시나리오 시뮬레이터로 매출 변화를 미리 점검하세요."
        actions={
          <Button variant="secondary" onClick={() => void data.load()} disabled={data.loading}>
            <Icon name="refresh" size={16} />
            {data.loading ? '불러오는 중' : '새로고침'}
          </Button>
        }
      />

      <section aria-label="요금제 요약" className="stat-row">
        {isInitialLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div className="stat" key={i}>
              <Skeleton width="55%" height="0.85rem" />
              <Skeleton width="70%" height="1.4rem" />
            </div>
          ))
        ) : (
          <>
            <Stat
              icon="plans"
              label="현재 월 매출"
              value={formatWon(data.kpiMonthlyRevenue)}
              valueLabel={`현재 월 매출 ${formatWon(data.kpiMonthlyRevenue)}`}
              foot="요금 × 이용 가구 합계"
            />
            <Stat
              icon="settlement"
              label="예상 연 매출"
              value={formatWon(data.kpiAnnualRevenue)}
              valueLabel={`예상 연 매출 ${formatWon(data.kpiAnnualRevenue)}`}
              foot="현재 월 매출 12개월 환산"
            />
            <Stat
              icon="analytics"
              label="연 결제 환산 매출"
              value={formatWon(data.planPotentialAnnual)}
              valueLabel={`연 결제 환산 매출 ${formatWon(data.planPotentialAnnual)}`}
              foot="할인율 적용 후 연 매출"
            />
            <Stat
              icon="care"
              label="이용 가구"
              value={`${data.activeHouseholds}가구`}
              valueLabel={`이용 가구 ${data.activeHouseholds}가구`}
              foot="기록·정산 기준 활성 대상"
            />
          </>
        )}
      </section>

      <Card>
        <CardHeader
          title="요금제 편집"
          subtitle="월 요금·할인율·이용 가구 수를 바꾸면 월·연 예상 매출이 바로 계산됩니다."
        />
        {isInitialLoading ? (
          <div style={planGridStyle}>
            {Array.from({ length: 3 }, (_, i) => (
              <div className="card card-pad stack-sm" key={i}>
                <Skeleton width="40%" height="0.85rem" />
                <Skeleton width="100%" height="2.25rem" />
                <Skeleton width="100%" height="2.25rem" />
                <Skeleton width="60%" height="1.1rem" />
              </div>
            ))}
          </div>
        ) : data.plans.length === 0 ? (
          <EmptyState
            icon="plans"
            title="등록된 요금제가 없습니다"
            description="요금제 데이터를 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요."
            action={
              <Button variant="secondary" onClick={() => void data.load()}>
                <Icon name="refresh" size={16} />
                다시 불러오기
              </Button>
            }
          />
        ) : (
          <div style={planGridStyle}>
            {data.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                submitPlan={data.submitPlan}
                isSaving={data.savingPlanId === plan.id}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="시나리오 시뮬레이터"
          subtitle="요금 변화와 상위 요금제 전환 비율을 조정해 예상 매출을 미리 확인합니다."
        />

        <div className="stack">
          <div style={simControlGridStyle}>
            <div className="field">
              <label className="field-label" htmlFor="plan-sim-price-lift">
                요금 인상폭
              </label>
              <input
                id="plan-sim-price-lift"
                type="range"
                min={0}
                max={20}
                step={1}
                value={data.priceLiftPercent}
                onChange={data.onPriceLiftInput}
                disabled={isReadOnly}
                aria-describedby="plan-sim-price-lift-value"
              />
              <p
                id="plan-sim-price-lift-value"
                className="field-hint"
                style={controlValueStyle}
                aria-live="polite"
              >
                +{data.priceLiftPercent}%
              </p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="plan-sim-upgrade-push">
                상위 요금제 전환
              </label>
              <input
                id="plan-sim-upgrade-push"
                type="range"
                min={0}
                max={20}
                step={1}
                value={data.upgradePushPercent}
                onChange={data.onUpgradePushInput}
                disabled={isReadOnly}
                aria-describedby="plan-sim-upgrade-push-value"
              />
              <p
                id="plan-sim-upgrade-push-value"
                className="field-hint"
                style={controlValueStyle}
                aria-live="polite"
              >
                +{data.upgradePushPercent}%
              </p>
            </div>
          </div>

          <div style={outcomeGridStyle}>
            <Stat
              label="예상 월 매출"
              value={formatWon(scenarioRevenue.scenarioMRR)}
              valueLabel={`예상 월 매출 ${formatWon(scenarioRevenue.scenarioMRR)}`}
              foot={`현재 대비 ${scenarioRevenue.upliftFromCurrent >= 0 ? '+' : ''}${formatWon(scenarioRevenue.upliftFromCurrent)}`}
            />
            <Stat
              label="예상 연 매출"
              value={formatWon(scenarioRevenue.scenarioAnnualMRR)}
              valueLabel={`예상 연 매출 ${formatWon(scenarioRevenue.scenarioAnnualMRR)}`}
              foot="예상 월 매출 12개월 환산"
            />
            <Stat
              label="청구 반영 후 월 매출"
              value={formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}
              valueLabel={`청구 반영 후 월 매출 ${formatWon(scenarioRevenue.expectedMonthlyAfterConversion)}`}
              foot={`승인율 ${formatRate(scenarioRevenue.conversionRate)} 적용`}
            />
            <Stat
              label="목표까지 남은 금액"
              value={formatWon(scenarioRevenue.goalGap)}
              valueLabel={`목표까지 남은 금액 ${formatWon(scenarioRevenue.goalGap)}`}
              foot={`목표 ${formatWon(PLAN_TARGET_MONTHLY)}`}
            />
          </div>

          <div className="stack-sm">
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 'var(--space-2)',
              }}
            >
              <span className="field-label">월 목표 진행률</span>
              <span style={controlValueStyle}>{clampedGoalRate}%</span>
            </div>
            <div
              style={progressTrackStyle}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampedGoalRate}
              aria-label={`월 목표 진행률 ${clampedGoalRate}%`}
            >
              <div
                style={{
                  height: '100%',
                  width: `${clampedGoalRate}%`,
                  background: 'var(--accent)',
                  transition: 'width var(--dur-base, 0.2s) var(--ease-out, ease)',
                }}
              />
            </div>
            <p className="stat-foot">
              예상 시나리오 전환 구성: Starter {scenarioRevenue.scenarioStarterCount}가구 · Pro{' '}
              {scenarioRevenue.scenarioProCount}가구 · Enterprise{' '}
              {scenarioRevenue.scenarioEnterpriseCount}가구
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="확인 가이드"
          subtitle="현재 시나리오에 맞춘 운영 점검 포인트입니다."
          titleAs="h2"
        />
        <ul className="flex flex-col">
          {data.growthRecommendations.map((item) => (
            <li
              className="flex items-start gap-3 border-b border-border-subtle py-3 last:border-b-0"
              key={item}
            >
              <span
                className="mt-[0.1rem] grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-soft text-accent-soft-fg"
                aria-hidden="true"
              >
                <Icon name="check" size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium text-fg-strong">{item}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
