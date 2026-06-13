import { zodResolver } from '@hookform/resolvers/zod'
import { type CSSProperties, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  scheduleFormSchema,
  scheduleStatuses,
  type ScheduleFormValues,
} from '../../features/schedule/schema'
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
  PageHeader,
  Select,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
  Textarea,
} from '../ui'

import type { PlatformData } from '../../state/usePlatformData'
import type { CareSchedule, ScheduleStatus } from '../../types'

type SchedulePageProps = {
  data: PlatformData
  onNavigate: (path: AppRoute) => void
}

const STATUS_TONE: Record<ScheduleStatus, BadgeTone> = {
  예정: 'info',
  진행중: 'warn',
  완료: 'success',
  취소: 'neutral',
}

const FORM_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gap: 'var(--space-4)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
}

const FORM_ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
}

const PERSON_CELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
}

const MUTED_TEXT_STYLE: CSSProperties = {
  color: 'var(--fg-muted)',
  fontSize: 'var(--text-sm)',
}

const STATUS_CELL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  alignItems: 'flex-start',
}

const formatShortDate = (date: string) => date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2.$3')

export const SchedulePage = ({ data, onNavigate }: SchedulePageProps) => {
  const routeDef = routeDefs['/schedule']
  const isReadOnly = isReadOnlyErrorMessage(data.errorMessage)
  const isSubmitting = data.isSubmittingSchedule
  const isBusy = isReadOnly || isSubmitting
  const isInitialLoading = data.loading && data.schedules.length === 0
  const [prefilledFrom, setPrefilledFrom] = useState<CareSchedule | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: data.defaultScheduleValues,
    mode: 'onChange',
  })

  const sortedSchedules = useMemo(
    () =>
      [...data.schedules].sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || b.id - a.id,
      ),
    [data.schedules],
  )

  const today = data.defaultScheduleValues.date
  const todayList = useMemo(
    () =>
      sortedSchedules.filter((schedule) => schedule.date === today && schedule.status !== '취소'),
    [sortedSchedules, today],
  )
  const completedCount = useMemo(
    () => data.schedules.filter((schedule) => schedule.status === '완료').length,
    [data.schedules],
  )
  const caregiverCount = useMemo(
    () => new Set(data.schedules.map((schedule) => schedule.caregiver)).size,
    [data.schedules],
  )

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    await data.submitSchedule(values)
    reset(data.defaultScheduleValues)
    setPrefilledFrom(null)
  })

  const handlePrefill = (schedule: CareSchedule) => {
    if (isBusy) {
      return
    }
    reset({
      recipient: schedule.recipient,
      caregiver: schedule.caregiver,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: schedule.status,
      note: schedule.note,
    })
    setPrefilledFrom(schedule)
  }

  const handleResetForm = () => {
    reset(data.defaultScheduleValues)
    setPrefilledFrom(null)
  }

  const columns: TableColumn<CareSchedule>[] = [
    {
      key: 'time',
      header: '일시',
      cell: (schedule) => (
        <div style={PERSON_CELL_STYLE}>
          <strong aria-label={schedule.date}>{formatShortDate(schedule.date)}</strong>
          <span style={{ ...MUTED_TEXT_STYLE, whiteSpace: 'nowrap' }}>
            {schedule.startTime}-{schedule.endTime}
          </span>
        </div>
      ),
    },
    {
      key: 'people',
      header: '대상자 / 담당자',
      cell: (schedule) => (
        <div style={PERSON_CELL_STYLE}>
          <strong>{schedule.recipient}</strong>
          <span style={MUTED_TEXT_STYLE}>담당 {schedule.caregiver}</span>
        </div>
      ),
    },
    {
      key: 'note',
      header: '메모',
      cell: (schedule) => (schedule.note ? schedule.note : <span style={MUTED_TEXT_STYLE}>-</span>),
    },
    {
      key: 'status',
      header: '진행 상태',
      cell: (schedule) => {
        const isUpdating = data.updatingScheduleId === schedule.id
        return (
          <div style={STATUS_CELL_STYLE}>
            <Badge tone={STATUS_TONE[schedule.status]}>{schedule.status}</Badge>
            <label className="sr-only" htmlFor={`schedule-status-${schedule.id}`}>
              {schedule.recipient} 방문 일정 상태 변경
            </label>
            <Select
              id={`schedule-status-${schedule.id}`}
              value={schedule.status}
              disabled={isReadOnly || isUpdating}
              aria-label={`${schedule.recipient} 방문 일정 상태 변경`}
              style={{ minWidth: '5.75rem' }}
              onChange={(event) =>
                void data.updateScheduleStatus(schedule.id, event.target.value as ScheduleStatus)
              }
            >
              {scheduleStatuses.map((status) => (
                <option key={`${schedule.id}-${status}`} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: '작업',
      cell: (schedule) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={() => handlePrefill(schedule)}
          aria-label={`${schedule.date} ${schedule.recipient} 일정을 폼에 복제`}
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
          <Button variant="secondary" onClick={() => onNavigate('/care')}>
            <Icon name="care" size={16} />
            기록으로 이동
          </Button>
        }
      />

      <section aria-label="방문 일정 요약" className="stat-row">
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
              icon="schedule"
              label="전체 일정"
              value={`${data.schedules.length}건`}
              valueLabel={`전체 방문 일정 ${data.schedules.length}건`}
              foot="등록된 방문 일정"
            />
            <Stat
              icon="clock"
              label="오늘 방문"
              value={`${data.todaySchedules}건`}
              valueLabel={`오늘 방문 일정 ${data.todaySchedules}건`}
              foot="취소 일정을 제외한 오늘 일정"
            />
            <Stat
              icon="check"
              label="완료 일정"
              value={`${completedCount}건`}
              valueLabel={`완료된 방문 일정 ${completedCount}건`}
              foot="방문 완료로 표시된 일정"
            />
            <Stat
              icon="care"
              label="담당자"
              value={`${caregiverCount}명`}
              valueLabel={`방문 담당자 ${caregiverCount}명`}
              foot={`진행 전 일정 ${data.pendingSchedules}건`}
            />
          </>
        )}
      </section>

      {isReadOnly ? (
        <p className="feedback feedback-warning" role="note">
          조회 전용 모드입니다. 일정은 확인할 수 있지만 새 일정 저장과 상태 변경은 제한됩니다.
        </p>
      ) : null}

      <div className="grid-2">
        <Card>
          <CardHeader
            title="방문 일정 목록"
            subtitle="가장 가까운 날짜와 시간부터 정렬됩니다."
            action={
              <button
                type="button"
                className="card-link"
                onClick={() => void data.load()}
                disabled={data.loading}
              >
                새로고침
              </button>
            }
          />

          {todayList.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2" aria-label="오늘 방문 순서">
              {todayList.slice(0, 4).map((schedule) => (
                <span
                  className="inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full border border-border-subtle bg-[color-mix(in_oklch,var(--accent-soft)_42%,var(--bg-surface))] px-3 py-1 text-sm leading-snug text-accent-soft-fg"
                  key={`today-${schedule.id}`}
                >
                  <Icon name="clock" size={14} />
                  <strong className="text-fg-strong tabular-nums">{schedule.startTime}</strong>
                  {schedule.recipient}
                </span>
              ))}
            </div>
          ) : null}

          {isInitialLoading ? (
            <div className="stack-sm" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} height="2.75rem" radius="var(--radius-md)" />
              ))}
            </div>
          ) : sortedSchedules.length === 0 ? (
            <EmptyState
              icon="schedule"
              title="아직 등록된 방문 일정이 없습니다"
              description="오른쪽 양식에서 대상자, 담당자, 방문 시간을 정하면 오늘 업무 순서가 만들어집니다."
              action={
                <Button onClick={() => reset(data.defaultScheduleValues)}>
                  <Icon name="plus" size={16} />첫 일정 작성
                </Button>
              }
            />
          ) : (
            <Table
              caption="방문 일정 목록"
              columns={columns}
              rows={sortedSchedules}
              rowKey={(schedule) => String(schedule.id)}
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title={prefilledFrom ? '일정 복제하여 저장' : '새 방문 일정'}
            subtitle={
              prefilledFrom
                ? `${prefilledFrom.recipient} 일정을 불러왔습니다. 날짜와 시간을 다듬어 새 일정으로 저장하세요.`
                : '방문 시간과 담당자를 먼저 정하면 기록, 정산, 청구 순서가 안정됩니다.'
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
            <div style={FORM_GRID_STYLE}>
              <Field label="돌봄 받는 분" required error={errors.recipient?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="예: 김영희"
                    autoComplete="off"
                    disabled={isBusy}
                    {...register('recipient')}
                  />
                )}
              </Field>

              <Field label="방문 담당자" required error={errors.caregiver?.message}>
                {(field) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="예: 박돌봄"
                    autoComplete="off"
                    disabled={isBusy}
                    {...register('caregiver')}
                  />
                )}
              </Field>

              <Field label="방문 날짜" required error={errors.date?.message}>
                {(field) => (
                  <Input {...field} type="date" disabled={isBusy} {...register('date')} />
                )}
              </Field>

              <Field label="시작 시간" required error={errors.startTime?.message}>
                {(field) => (
                  <Input {...field} type="time" disabled={isBusy} {...register('startTime')} />
                )}
              </Field>

              <Field label="종료 시간" required error={errors.endTime?.message}>
                {(field) => (
                  <Input {...field} type="time" disabled={isBusy} {...register('endTime')} />
                )}
              </Field>

              <Field label="현재 상태" error={errors.status?.message}>
                {(field) => (
                  <Select {...field} disabled={isBusy} {...register('status')}>
                    {scheduleStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Field
              label="방문 메모"
              hint="준비물, 보호자 요청, 방문 전 확인할 내용을 적어두세요."
              error={errors.note?.message}
            >
              {(field) => (
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="예: 혈압계 지참, 보호자에게 방문 전 연락"
                  disabled={isBusy}
                  {...register('note')}
                />
              )}
            </Field>

            {!isValid && !isSubmitting ? (
              <p className="field-hint" role="note">
                대상자, 담당자, 방문 날짜와 시작/종료 시간은 필수 입력입니다.
              </p>
            ) : null}

            <div style={FORM_ACTIONS_STYLE}>
              <Button variant="ghost" onClick={handleResetForm} disabled={isBusy}>
                입력 초기화
              </Button>
              <Button type="submit" disabled={!isValid || isBusy}>
                <Icon name="plus" size={16} />
                {isSubmitting ? '저장 중...' : '일정 저장'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
