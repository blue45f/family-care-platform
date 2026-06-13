import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { settlementFormSchema, type SettlementFormValues } from '../../domains/settlement/schema'
import { formatWon, roundMoney } from '../../utils'
import { RouteField } from '../common/RouteField'
import {
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

import type { AppRoute } from '../../routeConfig'
import type { PlatformData } from '../../state/usePlatformData'
import type { Settlement } from '../../types'

type SettlementsPageProps = {
  data: PlatformData
  onNavigate: (path: AppRoute) => void
}

// 미리보기 합계: 시간 × 단가. 음수/NaN 입력은 0으로 눌러 안내가 깨지지 않게 한다.
const previewTotal = (careHours: number, baseRate: number) => {
  const hours = Number.isFinite(careHours) && careHours > 0 ? careHours : 0
  const rate = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 0
  return roundMoney(hours * rate)
}

export const SettlementsPage = ({ data, onNavigate }: SettlementsPageProps) => {
  const { settlements, isSubmittingSettlement, submitSettlement, defaultSettlementValues } = data

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, errors },
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: defaultSettlementValues,
    mode: 'onChange',
  })

  const isBusy = isSubmittingSettlement
  const canSubmit = isValid

  // 실시간 미리보기: 입력 중인 시간·단가로 합계를 즉시 보여준다.
  const watchedHours = useWatch({ control, name: 'careHours' })
  const watchedRate = useWatch({ control, name: 'baseRate' })
  const livePreview = previewTotal(watchedHours, watchedRate)

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    // 기존 동작 보존: 정산 폼은 제출 후에도 입력값을 유지한다(reset 없음).
    await submitSettlement(values)
  })

  const totalSettlement = useMemo(
    () => settlements.reduce((sum, item) => sum + item.totalAmount, 0),
    [settlements],
  )

  const averageSettlement = useMemo(
    () => (settlements.length > 0 ? roundMoney(totalSettlement / settlements.length) : 0),
    [settlements.length, totalSettlement],
  )

  const isInitialLoading = data.loading && settlements.length === 0

  const columns: TableColumn<Settlement>[] = [
    {
      key: 'recipient',
      header: '대상자',
      cell: (row) => <span className="cell-strong">{row.recipient}</span>,
    },
    {
      key: 'date',
      header: '정산 날짜',
      cell: (row) => row.date,
    },
    {
      key: 'breakdown',
      header: '시간 × 단가',
      cell: (row) => `${row.careHours}시간 × ${formatWon(row.baseRate)}`,
    },
    {
      key: 'note',
      header: '메모',
      cell: (row) => (row.note ? row.note : '-'),
    },
    {
      key: 'total',
      header: '정산액',
      numeric: true,
      cell: (row) => (
        <strong aria-label={`정산 합계 ${formatWon(row.totalAmount)}`}>
          {formatWon(row.totalAmount)}
        </strong>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow="돌봄 운영"
        title="돌봄비 정산"
        description="돌봄 시간과 시간당 금액을 입력하면 가족별 정산액이 바로 계산됩니다."
      />

      <section aria-label="정산 현황" className="stat-row">
        {isInitialLoading ? (
          Array.from({ length: 3 }, (_, index) => (
            <div className="stat" key={index}>
              <Skeleton width="55%" height="0.85rem" />
              <Skeleton width="70%" height="1.4rem" />
            </div>
          ))
        ) : (
          <>
            <Stat
              icon="settlement"
              label="정산 합계"
              value={formatWon(totalSettlement)}
              valueLabel={`정산 합계 ${formatWon(totalSettlement)}`}
              foot="기록된 모든 정산의 총합"
            />
            <Stat
              icon="analytics"
              label="건당 평균"
              value={formatWon(averageSettlement)}
              valueLabel={`건당 평균 ${formatWon(averageSettlement)}`}
              foot={`정산 ${settlements.length}건 기준`}
            />
            <Stat
              icon="clock"
              label="정산 건수"
              value={`${settlements.length}건`}
              valueLabel={`정산 건수 ${settlements.length}건`}
              foot="지금까지 계산한 정산"
            />
          </>
        )}
      </section>

      <div className="grid-2">
        <Card>
          <CardHeader title="정산 계산" subtitle="시간 × 단가로 합계가 자동 계산됩니다." />

          <form className="stack-sm" onSubmit={onValid} noValidate>
            <RouteField
              id="settlement-recipient"
              label="돌봄 받는 분"
              error={errors.recipient?.message}
            >
              <input
                id="settlement-recipient"
                className="input"
                type="text"
                placeholder="예: 김영희"
                disabled={isBusy}
                aria-invalid={errors.recipient ? true : undefined}
                aria-describedby={errors.recipient ? 'settlement-recipient-error' : undefined}
                {...register('recipient')}
              />
            </RouteField>

            <RouteField id="settlement-date" label="정산 날짜">
              <input
                id="settlement-date"
                className="input"
                type="date"
                disabled={isBusy}
                {...register('date')}
              />
            </RouteField>

            <RouteField
              id="settlement-hours"
              label="돌봄 시간(시간)"
              error={errors.careHours?.message}
            >
              <input
                id="settlement-hours"
                className="input"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                disabled={isBusy}
                aria-invalid={errors.careHours ? true : undefined}
                aria-describedby={errors.careHours ? 'settlement-hours-error' : undefined}
                {...register('careHours', { valueAsNumber: true })}
              />
            </RouteField>

            <RouteField
              id="settlement-rate"
              label="시간당 금액(원)"
              error={errors.baseRate?.message}
            >
              <input
                id="settlement-rate"
                className="input"
                type="number"
                min={1}
                step={1000}
                inputMode="numeric"
                disabled={isBusy}
                aria-invalid={errors.baseRate ? true : undefined}
                aria-describedby={errors.baseRate ? 'settlement-rate-error' : undefined}
                {...register('baseRate', { valueAsNumber: true })}
              />
            </RouteField>

            <RouteField id="settlement-note" label="메모">
              <input
                id="settlement-note"
                className="input"
                type="text"
                placeholder="예: 야간 돌봄 포함"
                disabled={isBusy}
                {...register('note')}
              />
            </RouteField>

            <div aria-live="polite">
              <Stat
                icon="settlement"
                label="예상 정산액"
                value={formatWon(livePreview)}
                valueLabel={`예상 정산액 ${formatWon(livePreview)}`}
                foot="시간 × 단가로 계산된 합계입니다."
              />
            </div>

            <Button type="submit" block disabled={isBusy || !canSubmit}>
              {isSubmittingSettlement ? '저장 중...' : '정산 저장'}
              {!isSubmittingSettlement ? <Icon name="check" size={16} /> : null}
            </Button>

            {!canSubmit && !isSubmittingSettlement ? (
              <p className="field-hint" role="note">
                대상자명, 돌봄 시간, 시간당 금액은 필수 입력입니다.
              </p>
            ) : null}
          </form>
        </Card>

        <Card>
          <CardHeader
            title="정산 내역"
            subtitle="계산해 저장한 정산 기록입니다."
            action={
              <button type="button" className="card-link" onClick={() => onNavigate('/claims')}>
                보험청구로 이동
              </button>
            }
          />

          {isInitialLoading ? (
            <div className="stack" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} height="2.5rem" />
              ))}
            </div>
          ) : settlements.length === 0 ? (
            <EmptyState
              icon="settlement"
              title="정산 내역이 쌓이기 전입니다"
              description="돌봄 시간과 시간당 금액을 입력하면 합계가 바로 계산되어 여기에 모입니다."
            />
          ) : (
            <Table
              caption="정산 내역 목록"
              columns={columns}
              rows={settlements}
              rowKey={(row) => String(row.id)}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
