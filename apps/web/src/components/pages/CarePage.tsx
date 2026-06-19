import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  careLogFormSchema,
  careLogTypes,
  type CareLogFormValues,
} from '../../domains/care-log/schema'
import { routeDefs, type AppRoute } from '../../routeConfig'
import { isReadOnlyErrorMessage } from '../../utils'
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
  PageHeader,
  Select,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
  Textarea,
} from '../ui'

import { compareStrings, filterAndSort } from './listFilters'

import type { PlatformData } from '../../state/usePlatformData'
import type { CareLog, CareLogType } from '../../types'

type CarePageProps = {
  data: PlatformData
  onNavigate: (path: AppRoute) => void
}

// 돌봄 활동 유형별 배지 톤. 시각적 구분만 담당하고 의미는 라벨 텍스트로 전달한다.
const TYPE_TONE: Record<CareLogType, BadgeTone> = {
  방문: 'accent',
  원격상담: 'info',
  투약: 'warn',
  식사관리: 'success',
  기타: 'neutral',
}

// 기록 목록 필터/정렬. '전체'는 유형 필터 미적용을 뜻한다.
type CareTypeFilter = CareLogType | '전체'
type CareSort = 'latest' | 'oldest' | 'recipient'

const CARE_TYPE_FILTERS: ReadonlyArray<ListToolbarFilterOption<CareTypeFilter>> = [
  { value: '전체', label: '전체' },
  ...careLogTypes.map((type) => ({ value: type, label: type })),
]

const CARE_SORTS: ReadonlyArray<ListToolbarSortOption<CareSort>> = [
  { value: 'latest', label: '최근 기록순' },
  { value: 'oldest', label: '오래된 기록순' },
  { value: 'recipient', label: '대상자 이름순' },
]

export const CarePage = ({ data, onNavigate }: CarePageProps) => {
  const routeDef = routeDefs['/care']
  const isReadOnly = isReadOnlyErrorMessage(data.errorMessage)
  const isSubmitting = data.isSubmittingCareLog
  const isBusy = isReadOnly || isSubmitting

  // 폼에 불러온 기록을 표시하기 위한 라벨(서버 update가 없으므로 "복제 후 새 기록 저장"이 정확한 동작).
  const [prefilledFrom, setPrefilledFrom] = useState<CareLog | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<CareLogFormValues>({
    resolver: standardSchemaResolver(careLogFormSchema),
    defaultValues: data.defaultCareLogValues,
    mode: 'onChange',
  })

  // 목록 검색·유형 필터·정렬 상태(클라이언트 전용).
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<CareTypeFilter>('전체')
  const [sort, setSort] = useState<CareSort>('latest')

  const isFiltering = query.trim() !== '' || typeFilter !== '전체'

  const visibleLogs = useMemo(
    () =>
      filterAndSort(data.careLogs, {
        search: { query, fields: (log) => [log.recipient, log.caregiver, log.note] },
        predicate: typeFilter === '전체' ? undefined : (log) => log.type === typeFilter,
        compare: (a, b) => {
          if (sort === 'oldest') {
            return compareStrings(a.date, b.date, 'asc') || a.id - b.id
          }
          if (sort === 'recipient') {
            return compareStrings(a.recipient, b.recipient) || b.id - a.id
          }
          // latest: 날짜 내림차순 → 동률이면 최신 id 우선(기존 정렬과 동일).
          return compareStrings(a.date, b.date, 'desc') || b.id - a.id
        },
      }),
    [data.careLogs, query, typeFilter, sort]
  )

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('전체')
  }

  // 활동 유형별 건수 요약(상단 지표). 차분한 라벨+값 카드만 사용한다.
  const typeCounts = useMemo(() => {
    const counts = new Map<CareLogType, number>()
    for (const log of data.careLogs) {
      counts.set(log.type, (counts.get(log.type) ?? 0) + 1)
    }
    return counts
  }, [data.careLogs])

  const caregiverCount = useMemo(
    () => new Set(data.careLogs.map((log) => log.caregiver)).size,
    [data.careLogs]
  )
  const recipientCount = useMemo(
    () => new Set(data.careLogs.map((log) => log.recipient)).size,
    [data.careLogs]
  )

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    await data.submitCareLog(values)
    reset(data.defaultCareLogValues)
    setPrefilledFrom(null)
  })

  const handlePrefill = (log: CareLog) => {
    if (isBusy) {
      return
    }
    reset({
      recipient: log.recipient,
      caregiver: log.caregiver,
      type: log.type,
      date: log.date,
      note: log.note,
    })
    setPrefilledFrom(log)
  }

  const handleResetForm = () => {
    reset(data.defaultCareLogValues)
    setPrefilledFrom(null)
  }

  const isInitialLoading = data.loading && data.careLogs.length === 0

  const columns: TableColumn<CareLog>[] = [
    {
      key: 'date',
      header: '날짜',
      cell: (log) => <span className="cell-strong">{log.date}</span>,
    },
    {
      key: 'recipient',
      header: '돌봄 받는 분',
      cell: (log) => log.recipient,
    },
    {
      key: 'caregiver',
      header: '담당자',
      cell: (log) => log.caregiver,
    },
    {
      key: 'type',
      header: '활동 유형',
      cell: (log) => (
        <Badge tone={TYPE_TONE[log.type]} plain>
          {log.type}
        </Badge>
      ),
    },
    {
      key: 'note',
      header: '내용',
      cell: (log) => log.note,
    },
    {
      key: 'actions',
      header: '작업',
      cell: (log) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={() => handlePrefill(log)}
          aria-label={`${log.date} ${log.recipient} 기록을 폼에 복제`}
        >
          <Icon name="plus" size={14} />
          복제
        </Button>
      ),
    },
  ]

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={routeDef.description}
        actions={
          <Button variant="secondary" onClick={() => onNavigate('/settlements')}>
            <Icon name="settlement" size={16} />
            정산으로 이동
          </Button>
        }
      />

      <section aria-label="돌봄 기록 요약" className="stat-row">
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
              icon="care"
              label="전체 기록"
              value={`${data.careLogs.length}건`}
              valueLabel={`전체 돌봄 기록 ${data.careLogs.length}건`}
              foot="누적 입력된 돌봄 활동"
            />
            <Stat
              icon="heart"
              label="돌봄 받는 분"
              value={`${recipientCount}명`}
              valueLabel={`돌봄 받는 분 ${recipientCount}명`}
              foot="기록에 등장한 대상자 수"
            />
            <Stat
              icon="check"
              label="담당자"
              value={`${caregiverCount}명`}
              valueLabel={`돌봄 담당자 ${caregiverCount}명`}
              foot="활동을 남긴 담당자 수"
            />
            <Stat
              icon="clock"
              label="방문 기록"
              value={`${typeCounts.get('방문') ?? 0}건`}
              valueLabel={`방문 기록 ${typeCounts.get('방문') ?? 0}건`}
              foot="활동 유형이 방문인 건수"
            />
          </>
        )}
      </section>

      {isReadOnly ? (
        <p className="feedback feedback-warning" role="note">
          조회 전용 모드입니다. 기록은 확인할 수 있지만 새 기록 저장은 잠시 제한됩니다.
        </p>
      ) : null}

      <div className="grid-2">
        <Card>
          <CardHeader
            title="돌봄 기록"
            subtitle="가장 최근 활동부터 정렬됩니다."
            action={
              <button type="button" className="card-link" onClick={() => onNavigate('/')}>
                대시보드
              </button>
            }
          />

          {isInitialLoading ? (
            <div className="stack-sm" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height="2.75rem" radius="var(--radius-md)" />
              ))}
            </div>
          ) : data.careLogs.length === 0 ? (
            <EmptyState
              icon="care"
              title="아직 돌봄 기록이 없습니다"
              description="오른쪽 양식에서 첫 돌봄 활동을 기록하면 여기에 모여 보입니다."
            />
          ) : (
            <>
              <ListToolbar
                searchLabel="돌봄 기록 검색"
                searchPlaceholder="대상자·담당자·내용으로 검색"
                searchValue={query}
                onSearchChange={setQuery}
                filterLabel="활동 유형 필터"
                filterOptions={CARE_TYPE_FILTERS}
                activeFilter={typeFilter}
                onFilterChange={setTypeFilter}
                sortLabel="돌봄 기록 정렬 기준"
                sortOptions={CARE_SORTS}
                sortValue={sort}
                onSortChange={setSort}
                resultSummary={
                  isFiltering
                    ? `전체 ${data.careLogs.length}건 중 ${visibleLogs.length}건`
                    : undefined
                }
                onClearFilters={isFiltering ? clearFilters : undefined}
              />
              {visibleLogs.length === 0 ? (
                <EmptyState
                  icon="care"
                  title="조건에 맞는 기록이 없습니다"
                  description="검색어나 활동 유형 필터를 바꾸거나 필터를 초기화해 보세요."
                  action={
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      <Icon name="refresh" size={14} />
                      필터 초기화
                    </Button>
                  }
                />
              ) : (
                <Table
                  caption="돌봄 기록 목록"
                  columns={columns}
                  rows={visibleLogs}
                  rowKey={(log) => String(log.id)}
                />
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader
            title={prefilledFrom ? '기록 복제하여 저장' : '새 돌봄 기록'}
            subtitle={
              prefilledFrom
                ? `${prefilledFrom.recipient} 기록을 불러왔습니다. 내용을 다듬어 새 기록으로 저장하세요.`
                : '방문·상담·투약·식사 같은 돌봄 내용을 담당자와 함께 남깁니다.'
            }
            titleAs="h2"
            action={
              prefilledFrom ? (
                <button type="button" className="card-link" onClick={handleResetForm}>
                  새로 작성
                </button>
              ) : undefined
            }
          />

          <form className="stack-sm" onSubmit={onValid} noValidate aria-busy={isSubmitting}>
            <Field label="돌봄 받는 분" required error={errors.recipient?.message}>
              {(field) => (
                <Input
                  type="text"
                  placeholder="예: 김영희"
                  autoComplete="off"
                  disabled={isBusy}
                  {...field}
                  {...register('recipient')}
                />
              )}
            </Field>

            <Field label="돌봄 담당자" required error={errors.caregiver?.message}>
              {(field) => (
                <Input
                  type="text"
                  placeholder="예: 박돌봄"
                  autoComplete="off"
                  disabled={isBusy}
                  {...field}
                  {...register('caregiver')}
                />
              )}
            </Field>

            <Field label="활동 유형" hint="방문·원격상담·투약·식사관리·기타 중 선택">
              {(field) => (
                <Select disabled={isBusy} {...field} {...register('type')}>
                  {careLogTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="돌봄 날짜">
              {(field) => <Input type="date" disabled={isBusy} {...field} {...register('date')} />}
            </Field>

            <Field label="돌봄 내용" required error={errors.note?.message}>
              {(field) => (
                <Textarea
                  rows={3}
                  placeholder="예: 점심 식사 도움, 약 복용 확인"
                  disabled={isBusy}
                  {...field}
                  {...register('note')}
                />
              )}
            </Field>

            <Button type="submit" block disabled={isBusy || !isValid}>
              {isSubmitting ? '저장 중...' : prefilledFrom ? '새 기록으로 저장' : '기록 저장'}
            </Button>

            {!isValid && !isSubmitting ? (
              <p className="field-hint" role="note">
                대상자, 담당자, 내용은 필수 입력입니다.
              </p>
            ) : null}
          </form>
        </Card>
      </div>
    </div>
  )
}
