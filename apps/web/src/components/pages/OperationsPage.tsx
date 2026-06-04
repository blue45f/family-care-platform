import { type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { claimStatusClass, formatRate, formatWon } from '../../utils'
import { claimStatusOptions, type PlatformData } from '../../state/usePlatformData'
import {
  careLogFormSchema,
  careLogTypes,
  type CareLogFormValues,
} from '../../features/care-log/schema'
import { settlementFormSchema, type SettlementFormValues } from '../../features/settlement/schema'
import { claimFormSchema, type ClaimFormValues } from '../../features/claim/schema'
import {
  operationsModuleMeta,
  operationsModuleSequence,
  operationsModuleRoute,
  type RouteCompositionMeta,
} from '../../routeConfig'
import type { OperationsRouteModule, NonHomeRoutePath } from '../../routeConfig'
import type { ClaimStatus } from '../../types'
import { RouteField } from '../common/RouteField'

type OperationsPageProps = {
  modules: readonly OperationsRouteModule[]
  compositionMeta: RouteCompositionMeta
  data: PlatformData
  onNavigate: (path: NonHomeRoutePath) => void
  activeRoutePath: NonHomeRoutePath
  isReadOnly: boolean
}

const renderOverview = ({
  activeHouseholds,
  pendingClaims,
  totalSettlement,
  approvalRate,
  claims,
  totalClaimExpected,
  onNavigate,
  isReadOnly,
  nextRoutePath,
}: {
  activeHouseholds: number
  pendingClaims: number
  totalSettlement: number
  approvalRate: number
  claims: PlatformData['claims']
  totalClaimExpected: number
  onNavigate: (path: NonHomeRoutePath) => void
  isReadOnly: boolean
  nextRoutePath: NonHomeRoutePath | null
}): ReactNode => {
  const pendingNotice =
    pendingClaims > 0
      ? `미처리 청구가 ${pendingClaims}건 있습니다. 먼저 상태를 점검하면 마감이 빨라집니다.`
      : '미처리 청구가 없습니다. 먼저 돌봄 기록을 입력하면 정산과 청구가 바로 이어집니다.'

  const nextActions = [
    {
      title: '돌봄 기록',
      value: `${claims.length}건`,
      path: '/operations/care' as const,
      action: '새로 입력',
      helper: '돌봄 내용이 있어야 정산과 청구 흐름이 정확해집니다.',
    },
    {
      title: '확인할 청구',
      value: `${pendingClaims}건`,
      path: '/operations/claims' as const,
      action: '상태 확인',
      helper: '요청·검토·승인 흐름을 먼저 점검하세요.',
    },
    {
      title: '예상 정산액',
      value: formatWon(totalClaimExpected),
      path: '/operations/settlement' as const,
      action: '정산 계산',
      helper: '시간·금액 기준 합계를 점검해 마감 속도를 높이세요.',
    },
  ]

  return (
    <section className="panel panel-ops panel-overview">
      <div className="panel-head">
        <div className="panel-title-wrap">
          <span className="panel-chip">운영 개요</span>
          <h2>오늘 처리 우선순위</h2>
        </div>
        <p className="subtle">{pendingNotice}</p>
      </div>

      <div className="kpi-ribbons">
        <article className="kpi-ribbon">
          <p>돌봄 가구</p>
          <strong>{activeHouseholds}개</strong>
        </article>
        <article className="kpi-ribbon">
          <p>확인할 청구</p>
          <strong>{pendingClaims}건</strong>
        </article>
        <article className="kpi-ribbon">
          <p>이번 달 정산</p>
          <strong>{formatWon(totalSettlement)}</strong>
        </article>
        <article className="kpi-ribbon">
          <p>청구 승인률</p>
          <strong>{formatRate(approvalRate)}</strong>
        </article>
      </div>

      <div className="ops-overview-actions">
        {nextActions.map((item, index) => (
          <article key={item.title} className="control-card operation-overview-action">
            <div>
              <p>{item.title}</p>
              <strong>{item.value}</strong>
              <span className="small-note">{item.helper}</span>
            </div>
            <button
              type="button"
              className={`route-tab route-tab-subtle ${index === 0 ? 'operation-overview-action-primary' : ''}`}
              disabled={isReadOnly}
              title={
                isReadOnly
                  ? '조회 전용 모드에서는 이동만 가능합니다.'
                  : `${item.action} 화면으로 이동`
              }
              onClick={() => {
                if (isReadOnly) {
                  return
                }
                onNavigate(item.path)
              }}
            >
              {item.action}
            </button>
          </article>
        ))}
      </div>

      {isReadOnly ? (
        <p className="small-note" role="note">
          조회 전용 모드입니다. 화면 이동은 가능하지만 기록·정산·청구 편집은 잠시 제한됩니다.
        </p>
      ) : null}

      {nextRoutePath ? (
        <button
          type="button"
          className="route-tab route-tab-subtle"
          onClick={() => onNavigate(nextRoutePath)}
          disabled={isReadOnly}
        >
          다음 단계로 이동
        </button>
      ) : null}
    </section>
  )
}

type CareLogFormProps = {
  module: 'care'
  data: PlatformData
  isSubmitting: boolean
  isReadOnly: boolean
}

const CareLogForm = ({ module, data, isSubmitting, isReadOnly }: CareLogFormProps): ReactNode => {
  const moduleMeta = operationsModuleMeta[module]
  const isBusy = isReadOnly || isSubmitting

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

  const canSubmit = isValid

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    await data.submitCareLog(values)
    reset(data.defaultCareLogValues)
  })

  return (
    <section key={module} className={`panel panel-ops ${moduleMeta.panelClass}`}>
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
        <p className="small-note" role="note">
          대상자, 담당자, 내용이 모두 입력되면 저장 가능해집니다.
        </p>
      </div>

      <form className="row" onSubmit={onValid}>
        <RouteField
          id={`care-recipient-${module}`}
          label="돌봄 받는 분"
          error={errors.recipient?.message}
        >
          <input
            id={`care-recipient-${module}`}
            type="text"
            placeholder="예: 김영희"
            required
            disabled={isBusy}
            aria-invalid={errors.recipient ? true : undefined}
            aria-describedby={errors.recipient ? `care-recipient-${module}-error` : undefined}
            {...register('recipient')}
          />
        </RouteField>

        <RouteField
          id={`caregiver-${module}`}
          label="돌봄 담당자"
          error={errors.caregiver?.message}
        >
          <input
            id={`caregiver-${module}`}
            type="text"
            placeholder="예: 박돌봄"
            required
            disabled={isBusy}
            aria-invalid={errors.caregiver ? true : undefined}
            aria-describedby={errors.caregiver ? `caregiver-${module}-error` : undefined}
            {...register('caregiver')}
          />
        </RouteField>

        <RouteField id={`care-type-${module}`} label="돌봄 종류">
          <select id={`care-type-${module}`} disabled={isBusy} {...register('type')}>
            {careLogTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </RouteField>

        <RouteField id={`care-date-${module}`} label="돌봄 날짜">
          <input id={`care-date-${module}`} type="date" disabled={isBusy} {...register('date')} />
        </RouteField>

        <RouteField id={`care-note-${module}`} label="돌봄 내용" error={errors.note?.message}>
          <textarea
            id={`care-note-${module}`}
            placeholder="예: 점심 식사 도움, 약 복용 확인"
            required
            rows={3}
            disabled={isBusy}
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={errors.note ? `care-note-${module}-error` : undefined}
            {...register('note')}
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isBusy || !canSubmit}>
          {isSubmitting ? '저장 중...' : '기록 저장'}
        </button>
      </form>

      {!canSubmit && !isSubmitting ? (
        <p className="small-note" role="note">
          대상자, 담당자, 내용은 필수 입력입니다.
        </p>
      ) : null}

      {data.careLogs.length > 0 ? (
        <ul className="list" aria-label="돌봄 기록 목록">
          {data.careLogs.slice(0, 3).map((log) => (
            <li key={log.id}>
              <div className="list-title">
                <strong>{log.recipient}</strong>
                <span className="muted">{log.caregiver}</span>
              </div>
              <p>
                [{log.type}] {log.date} · {log.note}
              </p>
              <p className="subtle">최근 입력: {log.date}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty" role="note">
          <strong>첫 돌봄 기록을 남겨보세요</strong>
          <span>대상자·담당자·내용을 입력하면 정산과 보험청구 흐름이 자동으로 이어집니다.</span>
        </p>
      )}
    </section>
  )
}

type SettlementFormProps = {
  module: 'settlement'
  data: PlatformData
  isSubmitting: boolean
  isReadOnly: boolean
}

const SettlementForm = ({
  module,
  data,
  isSubmitting,
  isReadOnly,
}: SettlementFormProps): ReactNode => {
  const moduleMeta = operationsModuleMeta[module]
  const isBusy = isReadOnly || isSubmitting

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: data.defaultSettlementValues,
    mode: 'onChange',
  })

  const canSubmit = isValid

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    // 정산 폼은 제출 후에도 입력값을 유지한다(기존 동작과 동일하게 reset 없음).
    await data.submitSettlement(values)
  })

  return (
    <section key={module} className={`panel panel-ops ${moduleMeta.panelClass}`}>
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
        <p className="small-note" role="note">
          시간 × 금액이 자동 계산되어 정산액이 즉시 표시됩니다.
        </p>
      </div>

      <form className="row" onSubmit={onValid}>
        <RouteField id={`settlement-recipient-${module}`} label="돌봄 받는 분">
          <input
            id={`settlement-recipient-${module}`}
            type="text"
            placeholder="예: 김영희"
            required
            disabled={isBusy}
            {...register('recipient')}
          />
        </RouteField>

        <RouteField id={`settlement-date-${module}`} label="정산 날짜">
          <input
            id={`settlement-date-${module}`}
            type="date"
            disabled={isBusy}
            {...register('date')}
          />
        </RouteField>

        <RouteField id={`settlement-hours-${module}`} label="돌봄 시간(시간)">
          <input
            id={`settlement-hours-${module}`}
            type="number"
            min={1}
            disabled={isBusy}
            {...register('careHours', { valueAsNumber: true })}
          />
        </RouteField>

        <RouteField id={`settlement-rate-${module}`} label="시간당 금액">
          <input
            id={`settlement-rate-${module}`}
            type="number"
            min={1}
            disabled={isBusy}
            {...register('baseRate', { valueAsNumber: true })}
          />
        </RouteField>

        <RouteField id={`settlement-note-${module}`} label="메모">
          <input
            id={`settlement-note-${module}`}
            placeholder="예: 야간 돌봄 포함"
            disabled={isBusy}
            {...register('note')}
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isBusy || !canSubmit}>
          {isSubmitting ? '저장 중...' : '정산 저장'}
        </button>
      </form>

      {!canSubmit && !isSubmitting ? (
        <p className="small-note" role="note">
          대상자명, 돌봄 시간, 시간당 금액은 필수 입력입니다.
        </p>
      ) : null}

      {data.settlements.length > 0 ? (
        <ul className="list" aria-label="정산 목록">
          {data.settlements.slice(0, 3).map((settlement) => (
            <li key={settlement.id}>
              <div className="list-title">
                <strong>{settlement.recipient}</strong>
                <span>{settlement.date}</span>
              </div>
              <p>
                {settlement.careHours}h × {formatWon(settlement.baseRate)} ={' '}
                <strong aria-label={`정산 합계 ${formatWon(settlement.totalAmount)}`}>
                  {formatWon(settlement.totalAmount)}
                </strong>
              </p>
              {settlement.note ? <p className="subtle">{settlement.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty" role="note">
          <strong>정산 내역이 쌓이기 전입니다</strong>
          <span>돌봄 시간과 시간당 금액을 입력하면 합계가 바로 계산되어 여기에 모입니다.</span>
        </p>
      )}
    </section>
  )
}

type ClaimsFormProps = {
  module: 'claims'
  data: PlatformData
  isSubmitting: boolean
  isReadOnly: boolean
}

const ClaimsForm = ({ module, data, isSubmitting, isReadOnly }: ClaimsFormProps): ReactNode => {
  const moduleMeta = operationsModuleMeta[module]
  const isBusy = isReadOnly || isSubmitting

  const {
    register,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    // claimType은 UI에 노출하지 않지만 API 검증을 위해 기본값으로 유지한다.
    defaultValues: data.defaultClaimValues,
    mode: 'onChange',
  })

  const canSubmit = isValid

  const onValid = handleSubmit(async (values) => {
    if (isBusy) {
      return
    }
    await data.submitClaim(values)
    reset(data.defaultClaimValues)
  })

  return (
    <section key={module} className={`panel panel-ops ${moduleMeta.panelClass}`}>
      <div className="panel-head">
        <span className="panel-chip">{moduleMeta.panelChip}</span>
        <h2>{moduleMeta.panelTitle}</h2>
        <p className="subtle">{moduleMeta.panelDescription}</p>
        <p className="small-note" role="note">
          청구 대상자·기관·금액을 남기면 승인 흐름 추적이 쉬워집니다.
        </p>
      </div>

      <form className="row" onSubmit={onValid}>
        <RouteField id={`claim-recipient-${module}`} label="돌봄 받는 분">
          <input
            id={`claim-recipient-${module}`}
            type="text"
            placeholder="예: 김영희"
            required
            disabled={isBusy}
            {...register('recipient')}
          />
        </RouteField>

        <RouteField id={`claim-hospital-${module}`} label="기관/병원">
          <input
            id={`claim-hospital-${module}`}
            type="text"
            placeholder="예: 희망요양병원"
            required
            disabled={isBusy}
            {...register('hospitalName')}
          />
        </RouteField>

        <RouteField id={`claim-amount-${module}`} label="청구 예상 금액">
          <input
            id={`claim-amount-${module}`}
            type="number"
            min={1}
            required
            disabled={isBusy}
            {...register('expectedAmount', { valueAsNumber: true })}
          />
        </RouteField>

        <RouteField id={`claim-date-${module}`} label="접수 날짜">
          <input
            id={`claim-date-${module}`}
            type="date"
            disabled={isBusy}
            {...register('issueDate')}
          />
        </RouteField>

        <RouteField id={`claim-status-${module}`} label="현재 상태">
          <select id={`claim-status-${module}`} disabled={isBusy} {...register('status')}>
            {claimStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </RouteField>

        <RouteField id={`claim-note-${module}`} label="메모">
          <input
            id={`claim-note-${module}`}
            type="text"
            placeholder="예: 영수증 확인 필요"
            disabled={isBusy}
            {...register('note')}
          />
        </RouteField>

        <button type="submit" className="btn btn-primary" disabled={isBusy || !canSubmit}>
          {isSubmitting ? '저장 중...' : '청구 저장'}
        </button>
      </form>

      {!canSubmit && !isSubmitting ? (
        <p className="small-note" role="note">
          대상자명, 병원명, 청구액은 필수 입력입니다.
        </p>
      ) : null}

      {data.claims.length > 0 ? (
        <ul className="list" aria-label="보험청구 목록">
          {data.claims.slice(0, 3).map((claim) => (
            <li key={claim.id} className="claim-row">
              <div className="claim-title">
                <div>
                  <strong>{claim.recipient}</strong> · {claim.hospitalName}
                </div>
                <span className={`status-pill ${claimStatusClass(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
              <p
                aria-label={`보험청구 금액 ${formatWon(claim.expectedAmount)}, 접수일 ${claim.issueDate}`}
              >
                청구액 {formatWon(claim.expectedAmount)} · 접수일 {claim.issueDate}
              </p>

              <label className="inline-label">
                진행 상태
                <select
                  value={claim.status}
                  className={`status-select ${claimStatusClass(claim.status)}`}
                  onChange={(event) =>
                    void data.updateClaimStatus(claim.id, event.target.value as ClaimStatus)
                  }
                  disabled={isReadOnly || data.updatingClaimId === claim.id}
                  aria-label={`${claim.recipient} 청구 상태 변경`}
                >
                  {claimStatusOptions.map((status) => (
                    <option key={`${claim.id}-${status}`} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty" role="note">
          <strong>보험청구를 시작할 수 있어요</strong>
          <span>기관·병원과 청구 금액을 입력하면 요청부터 승인까지 상태를 한눈에 추적합니다.</span>
        </p>
      )}
    </section>
  )
}

const renderSectionGuide = ({
  approvalRate,
  nextAction,
  nextRoutePath,
  onNavigate,
}: {
  approvalRate: number
  nextAction: string
  nextRoutePath: NonHomeRoutePath | null
  onNavigate: (path: NonHomeRoutePath) => void
}): ReactNode => (
  <section className="panel panel-summary">
    <div className="panel-head">
      <h2>다음에 확인할 일</h2>
      <p className="subtle">지금은 이 순서로 점검하면 일이 빨라집니다.</p>
    </div>
    <div className="kpi-ribbons">
      <article className="kpi-ribbon">
        <p>추천</p>
        <strong>{nextAction}</strong>
        <span className="small-note">이 순서를 따라가면 승인 보류·누락을 줄일 수 있습니다.</span>
      </article>
      <article className="kpi-ribbon">
        <p>현재</p>
        <strong>청구 승인률 {formatRate(approvalRate)}</strong>
        <span className="small-note">목표: 상태 정합성 유지</span>
      </article>
      {nextRoutePath ? (
        <article className="kpi-ribbon">
          <p>바로가기</p>
          <strong>다음 단계 진행</strong>
          <button
            type="button"
            className="route-tab route-tab-subtle"
            onClick={() => onNavigate(nextRoutePath)}
          >
            {nextAction}
          </button>
        </article>
      ) : null}
    </div>
  </section>
)

const getOperationsNextRoutePath = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): NonHomeRoutePath | null => {
  if (activeRoutePath === '/operations') {
    return '/operations/care'
  }

  const ordered = modules.length > 0 ? modules : operationsModuleSequence
  const activeModule = getOperationsActiveModule(ordered, activeRoutePath)
  const activeIndex = ordered.indexOf(activeModule)
  const next = activeIndex >= 0 ? ordered[activeIndex + 1] : undefined

  if (!next) {
    return null
  }

  return operationsModuleRoute[next]
}

const getOperationsActiveModule = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): OperationsRouteModule => {
  if (activeRoutePath === '/operations') {
    return 'overview'
  }

  return (
    modules.find((moduleName) => operationsModuleRoute[moduleName] === activeRoutePath) ??
    'overview'
  )
}

const getOperationsFocusModules = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): OperationsRouteModule[] => {
  const ordered = modules.length > 0 ? modules : operationsModuleSequence

  if (activeRoutePath === '/operations') {
    return ordered.includes('care') ? ['overview', 'care'] : ['overview']
  }

  const activeModule = getOperationsActiveModule(ordered, activeRoutePath)
  const activeIndex = ordered.indexOf(activeModule)

  if (activeIndex < 0) {
    return ['overview', 'care', 'settlement']
  }

  const previous = ordered[activeIndex - 1]
  const next = ordered[activeIndex + 1]

  return Array.from(
    new Set([previous, activeModule, next].filter(Boolean) as OperationsRouteModule[]),
  )
}

const getOperationsNextAction = (
  modules: readonly OperationsRouteModule[],
  activeRoutePath: NonHomeRoutePath,
): string => {
  if (activeRoutePath === '/operations') {
    return '돌봄 기록 입력'
  }

  const ordered = modules.length > 0 ? modules : operationsModuleSequence
  const activeModule = getOperationsActiveModule(ordered, activeRoutePath)
  const activeIndex = ordered.indexOf(activeModule)
  const next = activeIndex >= 0 ? ordered[activeIndex + 1] : undefined

  if (!next) {
    return '목록에서 미처리 항목을 점검'
  }

  return `${operationsModuleMeta[next].title}로 이동`
}

const OperationsPage = ({
  modules,
  compositionMeta,
  data,
  onNavigate,
  activeRoutePath,
  isReadOnly,
}: OperationsPageProps) => {
  const moduleRenderers: Record<OperationsRouteModule, () => ReactNode> = {
    overview: () =>
      renderOverview({
        activeHouseholds: data.activeHouseholds,
        pendingClaims: data.pendingClaims,
        totalSettlement: data.totalSettlement,
        approvalRate: data.approvalRate,
        claims: data.claims,
        totalClaimExpected: data.totalClaimExpected,
        onNavigate,
        isReadOnly,
        nextRoutePath: getOperationsNextRoutePath(modules, activeRoutePath),
      }),
    care: () => (
      <CareLogForm
        module="care"
        data={data}
        isSubmitting={data.isSubmittingCareLog}
        isReadOnly={isReadOnly}
      />
    ),
    settlement: () => (
      <SettlementForm
        module="settlement"
        data={data}
        isSubmitting={data.isSubmittingSettlement}
        isReadOnly={isReadOnly}
      />
    ),
    claims: () => (
      <ClaimsForm
        module="claims"
        data={data}
        isSubmitting={data.isSubmittingClaim}
        isReadOnly={isReadOnly}
      />
    ),
  }

  const visibleModules = getOperationsFocusModules(modules, activeRoutePath)
  const nextAction = getOperationsNextAction(modules, activeRoutePath)
  const nextRoutePath = getOperationsNextRoutePath(modules, activeRoutePath)

  return (
    <section className="view-stack">
      <section className={`panel panel-overview ${compositionMeta.compositionPanelClass}`}>
        <div className="panel-head">
          <div className="panel-title-wrap">
            <span className="panel-chip">{compositionMeta.compositionChip}</span>
            <h2>{compositionMeta.compositionTitle}</h2>
          </div>
          <p className="subtle">{compositionMeta.compositionDescription}</p>
        </div>

        <div className="module-composition" role="list" aria-label="현재 페이지 구성요소">
          {modules.map((moduleName) => {
            const config = operationsModuleMeta[moduleName]
            const path = operationsModuleRoute[moduleName]
            const isActiveModule = path === activeRoutePath
            const index = modules.indexOf(moduleName) + 1
            return (
              <button
                type="button"
                role="listitem"
                key={moduleName}
                className={`module-composition-item ${isActiveModule ? 'module-composition-item-current' : ''}`}
                onClick={() => onNavigate(path)}
                aria-label={`${config.title}로 ${isActiveModule ? '현재 보기' : '이동'}`}
                aria-current={isActiveModule ? 'page' : undefined}
                title={config.note}
              >
                <p className="small-note" aria-hidden="true">
                  {index}. {config.chip}
                </p>
                <strong>{config.title}</strong>
                <p>{config.note}</p>
              </button>
            )
          })}
        </div>
      </section>

      {modules.map((moduleName) => {
        if (!visibleModules.includes(moduleName)) {
          return null
        }

        return (
          <div className="panel-stack-item" key={moduleName}>
            {moduleRenderers[moduleName]()}
          </div>
        )
      })}

      {renderSectionGuide({
        approvalRate: data.approvalRate,
        nextAction,
        nextRoutePath,
        onNavigate,
      })}
    </section>
  )
}

export { OperationsPage }
