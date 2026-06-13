import { zodResolver } from '@hookform/resolvers/zod'
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
  PageHeader,
  Select,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
  Textarea,
} from '../ui'

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
    resolver: zodResolver(careLogFormSchema),
    defaultValues: data.defaultCareLogValues,
    mode: 'onChange',
  })

  const sortedLogs = useMemo(
    () => [...data.careLogs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [data.careLogs],
  )

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
    [data.careLogs],
  )
  const recipientCount = useMemo(
    () => new Set(data.careLogs.map((log) => log.recipient)).size,
    [data.careLogs],
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
          ) : sortedLogs.length === 0 ? (
            <EmptyState
              icon="care"
              title="아직 돌봄 기록이 없습니다"
              description="오른쪽 양식에서 첫 돌봄 활동을 기록하면 여기에 모여 보입니다."
            />
          ) : (
            <Table
              caption="돌봄 기록 목록"
              columns={columns}
              rows={sortedLogs}
              rowKey={(log) => String(log.id)}
            />
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
