import type { CSSProperties } from 'react'

import type { AppRoute } from '../../routeConfig'
import type { AdminMonthlyTrendWithDelta, PlatformData } from '../../state/usePlatformData'
import {
  formatMonthLabel,
  formatRate,
  formatSignedRate,
  formatSignedRatePoint,
  formatSignedWon,
  formatWon,
  trendDirectionLabel,
  type TrendDeltaDirection,
} from '../../utils'
import {
  Badge,
  type BadgeTone,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
} from '../ui'

type AnalyticsPageProps = {
  data: PlatformData
  onNavigate: (path: AppRoute) => void
}

const DIRECTION_TONE: Record<TrendDeltaDirection, BadgeTone> = {
  up: 'success',
  down: 'danger',
  flat: 'neutral',
}

// styles.css에 차트 전용 클래스가 없어, 막대/레이아웃은 디자인 토큰을 참조하는
// 인라인 스타일로 직접 그린다(차트 라이브러리 미사용). 색·간격은 모두 CSS 변수 기반.
const barsWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
}
const barRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '3rem 1fr auto',
  alignItems: 'center',
  gap: 'var(--space-3)',
}
const barLabel: CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--fg-subtle)',
}
const barTrack: CSSProperties = {
  position: 'relative',
  height: '0.6rem',
  borderRadius: 'var(--radius-full)',
  background: 'var(--accent-soft)',
  overflow: 'hidden',
}
const barValue: CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  color: 'var(--fg-strong)',
  whiteSpace: 'nowrap',
}
const trendCell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.2rem',
}
const noteStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--fg-subtle)',
}

// 막대 길이: 음수/NaN 방지 + 최댓값 0이면 0% 처리.
const barWidth = (value: number, max: number) => {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) {
    return 0
  }
  return Math.min(100, Math.round((value / max) * 100))
}

// hero-metric을 피하고 라벨+값+막대만 절제해서 보여주는 추이 한 줄.
const TrendBar = ({
  label,
  valueText,
  valueLabel,
  width,
  fill,
}: {
  label: string
  valueText: string
  valueLabel: string
  width: number
  fill: string
}) => (
  <div style={barRow}>
    <span style={barLabel}>{label}</span>
    <span style={barTrack} aria-hidden="true">
      <span
        style={{
          position: 'absolute',
          inset: 0,
          width: `${width}%`,
          background: fill,
          borderRadius: 'var(--radius-full)',
        }}
      />
    </span>
    <span style={barValue} aria-label={valueLabel}>
      <span aria-hidden="true">{valueText}</span>
    </span>
  </div>
)

const deltaText = (
  entry: AdminMonthlyTrendWithDelta,
  kind: 'settlement' | 'claim' | 'approval'
) => {
  if (kind === 'settlement') {
    return `${formatSignedWon(entry.settlementDelta)} (${formatSignedRate(entry.settlementDeltaRate)})`
  }
  if (kind === 'claim') {
    return `${entry.claimCountDelta > 0 ? '+' : ''}${entry.claimCountDelta}건 (${formatSignedRate(entry.claimCountDeltaRate)})`
  }
  return `${formatSignedRatePoint(entry.approvalRateDelta)} (${formatSignedRate(entry.approvalRateDeltaRate)})`
}

const DeltaBadge = ({
  direction,
  text,
  metricLabel,
  hasPrevious,
}: {
  direction: TrendDeltaDirection
  text: string
  metricLabel: string
  hasPrevious: boolean
}) =>
  hasPrevious ? (
    <Badge tone={DIRECTION_TONE[direction]} plain>
      <span aria-label={`${metricLabel} 전월 대비 ${trendDirectionLabel(direction)} ${text}`}>
        <span aria-hidden="true">{text}</span>
      </span>
    </Badge>
  ) : (
    <span style={noteStyle}>비교 데이터 없음</span>
  )

export const AnalyticsPage = ({ data, onNavigate }: AnalyticsPageProps) => {
  const {
    loading,
    monthlyTrendWithDelta: trend,
    trendSourceMeta,
    isUsingServerTrend,
    activeHouseholds,
    totalSettlement,
    approvalRate,
    approvedClaims,
    claims,
    kpiMonthlyRevenue,
    kpiAnnualRevenue,
    scenarioRevenue,
  } = data

  const isFirstLoad = loading && trend.length === 0 && claims.length === 0

  const averageSettlement =
    activeHouseholds > 0 ? Math.round(totalSettlement / activeHouseholds) : 0
  const maxSettlement = trend.reduce((max, entry) => Math.max(max, entry.settlementTotal), 0)

  // 최신 월(배열 선두) 기준 핵심 지표. 트렌드가 비면 누적 값으로 대체.
  const latest = trend[0]

  const kpiRows = [
    {
      key: 'avg-settlement',
      label: '가구당 평균 정산액',
      value: formatWon(averageSettlement),
      meaning: '가구별 평균 돌봄비',
    },
    {
      key: 'plan-take',
      label: '요금제 이용률',
      value: formatRate(scenarioRevenue.conversionRate),
      meaning: '요금제 이용 비율',
    },
    {
      key: 'annual',
      label: '예상 연 금액',
      value: formatWon(kpiAnnualRevenue),
      meaning: '현재 월 금액 기준 연 환산치',
    },
  ]

  const trendColumns: TableColumn<AdminMonthlyTrendWithDelta>[] = [
    {
      key: 'month',
      header: '월',
      cell: (row) => <strong>{formatMonthLabel(row.month)}</strong>,
    },
    {
      key: 'settlement',
      header: '정산 합계',
      numeric: true,
      cell: (row) => (
        <span style={trendCell}>
          <span aria-label={`정산 합계 ${formatWon(row.settlementTotal)}`}>
            <span aria-hidden="true">{formatWon(row.settlementTotal)}</span>
          </span>
          <DeltaBadge
            direction={row.settlementDeltaDirection}
            text={deltaText(row, 'settlement')}
            metricLabel="정산액"
            hasPrevious={row.hasPreviousMonth}
          />
        </span>
      ),
    },
    {
      key: 'claims',
      header: '청구 건수',
      numeric: true,
      cell: (row) => (
        <span style={trendCell}>
          <span>
            {row.claimCount}건 (승인 {row.approvedClaimCount})
          </span>
          <DeltaBadge
            direction={row.claimCountDeltaDirection}
            text={deltaText(row, 'claim')}
            metricLabel="청구 건수"
            hasPrevious={row.hasPreviousMonth}
          />
        </span>
      ),
    },
    {
      key: 'approval',
      header: '승인률',
      numeric: true,
      cell: (row) => (
        <span style={trendCell}>
          <span aria-label={`승인률 ${formatRate(row.approvalRate)}`}>
            <span aria-hidden="true">{formatRate(row.approvalRate)}</span>
          </span>
          <DeltaBadge
            direction={row.approvalRateDeltaDirection}
            text={deltaText(row, 'approval')}
            metricLabel="승인률"
            hasPrevious={row.hasPreviousMonth}
          />
        </span>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow="서비스 관리"
        title="운영 분석"
        description="월별 정산·청구 추이와 핵심 지표로 서비스 운영 상태를 점검합니다."
      />

      {/* 차분한 월별 KPI — hero-metric 대신 라벨+값 카드 */}
      <section aria-label="이번 달 핵심 지표" className="stat-row">
        {isFirstLoad ? (
          Array.from({ length: 4 }, (_, index) => (
            <div className="stat" key={index}>
              <Skeleton width="55%" height="0.85rem" />
              <Skeleton width="70%" height="1.4rem" />
            </div>
          ))
        ) : (
          <>
            <Stat
              icon="care"
              label="돌봄 가구"
              value={`${activeHouseholds}개`}
              valueLabel={`돌봄 가구 ${activeHouseholds}개`}
              foot="현재 관리 중인 가구 수"
            />
            <Stat
              icon="settlement"
              label="이번 달 정산액"
              value={formatWon(latest ? latest.settlementTotal : totalSettlement)}
              valueLabel={`이번 달 정산액 ${formatWon(latest ? latest.settlementTotal : totalSettlement)}`}
              foot="돌봄비 월 합계"
            />
            <Stat
              icon="claims"
              label="보험청구 승인률"
              value={formatRate(latest ? latest.approvalRate : approvalRate)}
              valueLabel={`보험청구 승인률 ${formatRate(latest ? latest.approvalRate : approvalRate)}`}
              foot={`승인 ${latest ? latest.approvedClaimCount : approvedClaims}건 / 청구 ${latest ? latest.claimCount : claims.length}건`}
            />
            <Stat
              icon="analytics"
              label="월 관리 금액"
              value={formatWon(kpiMonthlyRevenue)}
              valueLabel={`월 관리 금액 ${formatWon(kpiMonthlyRevenue)}`}
              foot="요금제 기반 수익 기준"
            />
          </>
        )}
      </section>

      <div className="grid-2">
        <Card>
          <CardHeader
            title="월별 정산 추이"
            subtitle="최근 월별 돌봄비 정산 합계입니다."
            action={
              <button
                type="button"
                className="card-link"
                onClick={() => onNavigate('/settlements')}
              >
                정산 보기
              </button>
            }
          />

          <p
            style={noteStyle}
            role="note"
            aria-label={`월별 추세 데이터 출처는 ${trendSourceMeta.sourceText}입니다.`}
          >
            {trendSourceMeta.sourceLabel}
          </p>

          {!isUsingServerTrend && trend.length > 0 ? (
            <p style={noteStyle} role="note" aria-live="polite">
              서버 월별 집계를 불러오지 못해 최근 입력 데이터 기반으로 계산했습니다.
            </p>
          ) : null}

          {trend.length === 0 ? (
            <EmptyState
              icon="analytics"
              title="추이를 그리려면 데이터가 더 필요해요"
              description="정산과 청구를 입력할수록 월별 변화가 또렷한 그래프로 채워집니다."
            />
          ) : (
            <div style={barsWrap} role="img" aria-label="월별 정산 합계 막대 그래프">
              {trend.map((entry) => (
                <TrendBar
                  key={entry.month}
                  label={formatMonthLabel(entry.month)}
                  valueText={formatWon(entry.settlementTotal)}
                  valueLabel={`${formatMonthLabel(entry.month)} 정산 합계 ${formatWon(entry.settlementTotal)}`}
                  width={barWidth(entry.settlementTotal, maxSettlement)}
                  fill="var(--accent)"
                />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="월별 승인률"
            subtitle="보험청구가 승인된 비율의 흐름입니다."
            titleAs="h2"
            action={
              <button type="button" className="card-link" onClick={() => onNavigate('/claims')}>
                청구 보기
              </button>
            }
          />

          {trend.length === 0 ? (
            <EmptyState
              icon="check"
              title="아직 승인률을 계산할 청구가 없어요"
              description="보험청구를 등록하면 월별 승인률 흐름을 볼 수 있습니다."
            />
          ) : (
            <div style={barsWrap} role="img" aria-label="월별 승인률 막대 그래프">
              {trend.map((entry) => (
                <TrendBar
                  key={entry.month}
                  label={formatMonthLabel(entry.month)}
                  valueText={formatRate(entry.approvalRate)}
                  valueLabel={`${formatMonthLabel(entry.month)} 승인률 ${formatRate(entry.approvalRate)}`}
                  width={barWidth(entry.approvalRate, 100)}
                  fill="var(--accent-soft-fg)"
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="월별 지표 상세"
          subtitle="정산·청구·승인률을 전월 대비 증감과 함께 정리했습니다."
          titleAs="h2"
        />
        {trend.length === 0 ? (
          <EmptyState
            icon="analytics"
            title="표시할 월별 지표가 없어요"
            description="정산과 청구 데이터가 쌓이면 월 단위 변화를 표로 비교할 수 있습니다."
          />
        ) : (
          <Table
            columns={trendColumns}
            rows={trend}
            rowKey={(row) => row.month}
            caption="월별 정산·청구·승인률 추이 표"
          />
        )}
      </Card>

      <Card>
        <CardHeader
          title="운영 지표 요약"
          subtitle="오늘 운영 판단에 바로 쓰는 지표만 정리했습니다."
          titleAs="h2"
        />
        <Table
          columns={[
            {
              key: 'label',
              header: '항목',
              cell: (row) => <strong>{row.label}</strong>,
            },
            {
              key: 'value',
              header: '현재 값',
              numeric: true,
              cell: (row) => row.value,
            },
            {
              key: 'meaning',
              header: '의미',
              cell: (row) => <span style={noteStyle}>{row.meaning}</span>,
            },
          ]}
          rows={kpiRows}
          rowKey={(row) => row.key}
          caption="서비스 운영 지표 요약 표"
        />
      </Card>
    </div>
  )
}
