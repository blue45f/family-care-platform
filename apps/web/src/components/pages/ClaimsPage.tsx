import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useMemo, useState, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'

import { claimFormSchema, type ClaimFormValues } from '../../domains/claim/schema'
import { routeDefs } from '../../routeConfig'
import { claimStatusOptions, type PlatformData } from '../../state/usePlatformData'
import { formatRate, formatWon } from '../../utils'
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Icon,
  Input,
  ListToolbar,
  type ListToolbarFilterOption,
  type ListToolbarSortOption,
  Select,
  ShareSummaryButton,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
  PageHeader,
} from '../ui'

import { compareNumbers, compareStrings, filterAndSort } from './listFilters'
import { buildClaimShareText, buildClaimStatusBreakdown } from './operationsBreakdown'

import type { AppRoute } from '../../routeConfig'
import type { Claim, ClaimStatus } from '../../types'

// 청구 목록 필터/정렬 상태. '전체'는 상태 필터 미적용을 뜻한다.
type ClaimStatusFilter = ClaimStatus | '전체'
type ClaimSort = 'latest' | 'amount-desc' | 'recipient'

const CLAIM_STATUS_FILTERS: ReadonlyArray<ListToolbarFilterOption<ClaimStatusFilter>> = [
  { value: '전체', label: '전체' },
  ...claimStatusOptions.map((status) => ({ value: status, label: status })),
]

const CLAIM_SORTS: ReadonlyArray<ListToolbarSortOption<ClaimSort>> = [
  { value: 'latest', label: '최근 접수순' },
  { value: 'amount-desc', label: '청구액 높은순' },
  { value: 'recipient', label: '대상자 이름순' },
]

type ClaimsPageProps = {
  data: PlatformData
  onNavigate?: (path: AppRoute) => void
}

// 청구 상태별 Badge 톤 매핑(대시보드와 동일한 의미 체계 유지).
const STATUS_TONE: Record<ClaimStatus, BadgeTone> = {
  요청: 'info',
  검토중: 'warn',
  승인: 'success',
  거절: 'danger',
}

// 폼 필드를 모바일 1열 → 넓은 화면 다열로 접는 그리드. styles.css 수정 없이
// 자체 완결되도록 인라인 grid(auto-fit)로 구성한다.
const FORM_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-4)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
}

const FORM_ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
}

// 셀 내부 라벨-값 세로 스택(대상자/기관). 전용 CSS 클래스 없이 토큰으로 자체 완결.
const RECIPIENT_CELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const MUTED_TEXT_STYLE: CSSProperties = {
  color: 'var(--fg-muted)',
  fontSize: 'var(--text-sm)',
}

// 상태 배지 + 인라인 변경 셀렉트를 함께 배치.
const STATUS_CELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
}

// 상태 파이프라인 막대 한 칸 스타일(전용 CSS 없이 토큰으로 자체 완결).
const PIPELINE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
}

const PIPELINE_META_STYLE: CSSProperties = {
  color: 'var(--fg-muted)',
  fontSize: 'var(--text-sm)',
  marginLeft: 'auto',
}

export const ClaimsPage = ({ data, onNavigate }: ClaimsPageProps) => {
  const def = routeDefs['/claims']
  const isInitialLoading = data.loading && data.claims.length === 0

  // 목록 검색·상태 필터·정렬 상태(클라이언트 전용 — 서버 재요청 없음).
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>('전체')
  const [sort, setSort] = useState<ClaimSort>('latest')

  const isFiltering = query.trim() !== '' || statusFilter !== '전체'

  const visibleClaims = useMemo(
    () =>
      filterAndSort(data.claims, {
        search: { query, fields: (claim) => [claim.recipient, claim.hospitalName, claim.note] },
        predicate: statusFilter === '전체' ? undefined : (claim) => claim.status === statusFilter,
        compare: (a, b) => {
          if (sort === 'amount-desc') {
            return compareNumbers(a.expectedAmount, b.expectedAmount, 'desc') || b.id - a.id
          }
          if (sort === 'recipient') {
            return compareStrings(a.recipient, b.recipient) || b.id - a.id
          }
          // latest: 접수일 내림차순 → 동률이면 최신 id 우선.
          return compareStrings(a.issueDate, b.issueDate, 'desc') || b.id - a.id
        },
      }),
    [data.claims, query, statusFilter, sort]
  )

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('전체')
  }

  // 상태별 청구 파이프라인(요청→검토중→승인→거절). 항상 4개 상태를 보여준다.
  const statusBreakdown = useMemo(() => buildClaimStatusBreakdown(data.claims), [data.claims])

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<ClaimFormValues>({
    resolver: standardSchemaResolver(claimFormSchema),
    // claimType은 화면에 노출하지 않지만 API 검증을 위해 기본값으로 유지한다(기존 동작 보존).
    defaultValues: data.defaultClaimValues,
    mode: 'onChange',
  })

  const isSubmitting = data.isSubmittingClaim
  const canSubmit = isValid && !isSubmitting

  const onValid = handleSubmit(async (values) => {
    if (isSubmitting) {
      return
    }
    await data.submitClaim(values)
    // 등록 성공 후 입력값을 기본값으로 되돌린다(기존 ClaimsForm 동작과 동일).
    reset(data.defaultClaimValues)
  })

  const columns: TableColumn<Claim>[] = [
    {
      key: 'recipient',
      header: '대상자 / 기관',
      cell: (claim) => (
        <div style={RECIPIENT_CELL_STYLE}>
          <strong>{claim.recipient}</strong>
          <span style={MUTED_TEXT_STYLE}>{claim.hospitalName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: '청구액',
      numeric: true,
      cell: (claim) => (
        <span aria-label={`청구액 ${formatWon(claim.expectedAmount)}`}>
          {formatWon(claim.expectedAmount)}
        </span>
      ),
    },
    {
      key: 'issueDate',
      header: '접수일',
      cell: (claim) => claim.issueDate,
    },
    {
      key: 'note',
      header: '메모',
      cell: (claim) => (claim.note ? claim.note : <span style={MUTED_TEXT_STYLE}>-</span>),
    },
    {
      key: 'status',
      header: '진행 상태',
      cell: (claim) => {
        const isUpdating = data.updatingClaimId === claim.id
        return (
          <div style={STATUS_CELL_STYLE}>
            <Badge tone={STATUS_TONE[claim.status]}>{claim.status}</Badge>
            <label className="sr-only" htmlFor={`claim-status-${claim.id}`}>
              {claim.recipient} 청구 상태 변경
            </label>
            <Select
              id={`claim-status-${claim.id}`}
              value={claim.status}
              disabled={isUpdating}
              aria-label={`${claim.recipient} 청구 상태 변경`}
              onChange={(event) =>
                void data.updateClaimStatus(claim.id, event.target.value as ClaimStatus)
              }
            >
              {claimStatusOptions.map((status) => (
                <option key={`${claim.id}-${status}`} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        )
      },
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow={def.eyebrow}
        title={def.title}
        description={def.description}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void data.load()}
            disabled={data.loading}
          >
            <Icon name="refresh" size={16} />
            새로고침
          </Button>
        }
      />

      <section aria-label="보험청구 현황" className="stat-row">
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
              icon="claims"
              label="전체 청구"
              value={`${data.claims.length}건`}
              valueLabel={`전체 청구 ${data.claims.length}건`}
              foot="등록된 보험청구 전체"
            />
            <Stat
              icon="clock"
              label="확인할 청구"
              value={`${data.pendingClaims}건`}
              valueLabel={`확인할 청구 ${data.pendingClaims}건`}
              foot="요청·검토·거절 포함"
            />
            <Stat
              icon="check"
              label="승인 완료"
              value={`${data.approvedClaims}건`}
              valueLabel={`승인 완료 ${data.approvedClaims}건`}
              foot={`승인률 ${data.approvalRate.toFixed(1)}%`}
            />
            <Stat
              icon="settlement"
              label="청구 예상 합계"
              value={formatWon(data.totalClaimExpected)}
              valueLabel={`청구 예상 합계 ${formatWon(data.totalClaimExpected)}`}
              foot="전체 청구 예상 금액"
            />
          </>
        )}
      </section>

      {!isInitialLoading && data.claims.length > 0 ? (
        <Card>
          <CardHeader
            title="청구 상태 파이프라인"
            subtitle="요청부터 승인·거절까지 상태별 건수와 예상 금액을 한눈에 봅니다."
            action={
              <ShareSummaryButton title="보험청구 현황" text={buildClaimShareText(data.claims)}>
                현황 공유
              </ShareSummaryButton>
            }
          />
          <div className="stack-sm">
            {statusBreakdown.map((row) => (
              <div key={row.status} style={PIPELINE_ROW_STYLE}>
                <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                <strong aria-label={`${row.status} ${row.count}건`}>{row.count}건</strong>
                <span style={PIPELINE_META_STYLE}>
                  {formatRate(row.share)} · {formatWon(row.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid-2">
        <Card>
          <CardHeader
            title="청구 목록"
            subtitle="상태를 바로 바꾸며 요청부터 승인까지 진행을 추적합니다."
          />
          {isInitialLoading ? (
            <div className="stack-sm" aria-hidden="true">
              <Skeleton height="2.5rem" />
              <Skeleton height="2.5rem" />
              <Skeleton height="2.5rem" />
            </div>
          ) : data.claims.length === 0 ? (
            <EmptyState
              icon="claims"
              title="아직 등록된 보험청구가 없어요"
              description="오른쪽 양식에서 대상자·기관·청구액을 입력하면 요청부터 승인까지 상태를 한눈에 추적할 수 있습니다."
            />
          ) : (
            <>
              <ListToolbar
                searchLabel="청구 검색"
                searchPlaceholder="대상자·기관·메모로 검색"
                searchValue={query}
                onSearchChange={setQuery}
                filterLabel="청구 상태 필터"
                filterOptions={CLAIM_STATUS_FILTERS}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
                sortLabel="청구 정렬 기준"
                sortOptions={CLAIM_SORTS}
                sortValue={sort}
                onSortChange={setSort}
                resultSummary={
                  isFiltering
                    ? `전체 ${data.claims.length}건 중 ${visibleClaims.length}건`
                    : undefined
                }
                onClearFilters={isFiltering ? clearFilters : undefined}
              />
              {visibleClaims.length === 0 ? (
                <EmptyState
                  icon="claims"
                  title="조건에 맞는 청구가 없습니다"
                  description="검색어나 상태 필터를 바꾸거나 필터를 초기화해 보세요."
                  action={
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      <Icon name="refresh" size={14} />
                      필터 초기화
                    </Button>
                  }
                />
              ) : (
                <Table
                  caption="보험청구 목록"
                  columns={columns}
                  rows={visibleClaims}
                  rowKey={(claim) => String(claim.id)}
                />
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader
            title="새 청구 등록"
            subtitle="대상자·기관·청구액을 남기면 승인 흐름을 추적할 수 있어요."
            titleAs="h2"
          />
          <form className="stack-sm" onSubmit={onValid} noValidate>
            <div style={FORM_GRID_STYLE}>
              <Field label="돌봄 받는 분" required error={errors.recipient?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="예: 김영희"
                    disabled={isSubmitting}
                    {...register('recipient')}
                  />
                )}
              </Field>

              <Field label="기관 / 병원" required error={errors.hospitalName?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="예: 희망요양병원"
                    disabled={isSubmitting}
                    {...register('hospitalName')}
                  />
                )}
              </Field>

              <Field label="청구 예상 금액" required error={errors.expectedAmount?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    placeholder="예: 320000"
                    disabled={isSubmitting}
                    {...register('expectedAmount', { valueAsNumber: true })}
                  />
                )}
              </Field>

              <Field label="접수 날짜" error={errors.issueDate?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="date"
                    disabled={isSubmitting}
                    {...register('issueDate')}
                  />
                )}
              </Field>

              <Field label="현재 상태" error={errors.status?.message}>
                {(field) => (
                  <Select {...field} disabled={isSubmitting} {...register('status')}>
                    {claimStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="메모" error={errors.note?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="예: 영수증 확인 필요"
                    disabled={isSubmitting}
                    {...register('note')}
                  />
                )}
              </Field>
            </div>

            {!canSubmit && !isSubmitting ? (
              <p className="field-hint" role="note">
                대상자명, 병원명, 청구액은 필수 입력입니다.
              </p>
            ) : null}

            <div style={FORM_ACTIONS_STYLE}>
              <Button type="submit" disabled={!canSubmit}>
                <Icon name="plus" size={16} />
                {isSubmitting ? '저장 중...' : '청구 저장'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {onNavigate ? (
        <div>
          <button type="button" className="card-link" onClick={() => onNavigate('/')}>
            대시보드로 돌아가기
          </button>
        </div>
      ) : null}
    </div>
  )
}
