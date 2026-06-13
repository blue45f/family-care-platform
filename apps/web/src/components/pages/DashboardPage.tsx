import { managementRoutes, routeDefs, type AppRoute } from '../../routeConfig'
import { useState } from 'react'
import type { PlatformData } from '../../state/usePlatformData'
import { claimStatusClass, formatWon } from '../../utils'
import type { ClaimStatus } from '../../types'
import { buildTodayWorkQueue } from './dashboardViewModel'
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Icon,
  Skeleton,
  Stat,
} from '../ui'

const DASHBOARD_ONBOARDING_KEY = 'dashboard-first-onboarding-dismissed-v1'

const isDashboardOnboardingDismissed = () => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(DASHBOARD_ONBOARDING_KEY) === '1'
  } catch {
    return false
  }
}

const dismissDashboardOnboarding = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, '1')
  } catch {
    // storage unavailable: degrade gracefully
  }
}

type DashboardPageProps = {
  data: PlatformData
  onNavigate: (path: AppRoute) => void
}

const STATUS_TONE: Record<ClaimStatus, BadgeTone> = {
  요청: 'info',
  검토중: 'warn',
  승인: 'success',
  거절: 'danger',
}

const formatToday = () =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

const greetByHour = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '늦은 시간까지 수고가 많으세요'
  if (hour < 12) return '좋은 아침입니다'
  if (hour < 18) return '오늘도 수고하세요'
  return '오늘 하루도 고생하셨어요'
}

export const DashboardPage = ({ data, onNavigate }: DashboardPageProps) => {
  const [showOnboarding, setShowOnboarding] = useState(!isDashboardOnboardingDismissed())
  const recentCare = data.careLogs.slice(0, 5)
  const pendingClaimList = data.claims.filter((claim) => claim.status !== '승인').slice(0, 4)
  const todayTasks = buildTodayWorkQueue({
    scheduleCount: data.schedules.length,
    careLogCount: data.careLogs.length,
    settlementCount: data.settlements.length,
    pendingClaims: data.pendingClaims,
  })
  const managementLinks = managementRoutes.map((path) => routeDefs[path])

  const shouldShowOnboarding =
    showOnboarding &&
    data.schedules.length === 0 &&
    data.careLogs.length === 0 &&
    data.settlements.length === 0 &&
    data.claims.length === 0

  const starterChecklist: { route: AppRoute; label: string; detail: string; action: string }[] = [
    {
      route: '/schedule',
      label: '방문 일정 입력',
      detail: '오늘부터 운영할 대상과 일정을 먼저 등록해 흐름을 시작하세요.',
      action: '일정 등록으로 이동',
    },
    {
      route: '/care',
      label: '돌봄 기록 남기기',
      detail: '첫 방문 이후 활동 이력을 기록해 정산 및 청구가 이어지게 만듭니다.',
      action: '기록 화면으로 이동',
    },
    {
      route: '/settlements',
      label: '돌봄비 정산 확인',
      detail: '돌봄 시간과 단가 입력으로 정산액 계산 흐름을 확인하세요.',
      action: '정산 화면으로 이동',
    },
    {
      route: '/claims',
      label: '보험청구 상태 설정',
      detail: '요청·검토·승인 상태를 입력하면 대시보드 알림이 정리됩니다.',
      action: '청구 화면으로 이동',
    },
  ]

  const hideOnboarding = () => {
    dismissDashboardOnboarding()
    setShowOnboarding(false)
  }

  return (
    <div className="stack">
      {shouldShowOnboarding ? (
        <Card>
          <CardHeader
            title="처음 시작 10분 가이드"
            subtitle="아직 데이터가 비어있다면 아래 순서부터 시작하면 운영 흐름을 빠르게 연결할 수 있습니다."
            action={
              <button type="button" className="card-link" onClick={() => onNavigate('/guide')}>
                상세 가이드 보기
              </button>
            }
          />
          <ul className="guide-checklist">
            {starterChecklist.map((step) => (
              <li key={step.route}>
                <span>{step.route.replace('/', '')}</span>
                <p>
                  <strong>{step.label}</strong>
                  {` ${step.detail}`}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate(step.route)}
                    style={{ marginLeft: 'var(--space-3)' }}
                  >
                    {step.action}
                    <Icon name="arrow-right" size={14} />
                  </Button>
                </p>
              </li>
            ))}
          </ul>
          <div className="public-hero-actions" style={{ marginTop: 'var(--space-4)' }}>
            <button type="button" className="card-link" onClick={hideOnboarding}>
              지금은 안 볼래요
            </button>
          </div>
        </Card>
      ) : null}

      <section
        aria-labelledby="today-panel-title"
        className="grid gap-5 rounded-lg border border-border-subtle p-5 shadow-sm md:p-6 bg-[linear-gradient(135deg,oklch(0.992_0.004_85),oklch(0.956_0.018_98))]"
      >
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-fg-muted">{formatToday()}</p>
            <h1 id="today-panel-title" className="text-xl md:text-2xl">
              {greetByHour()}
            </h1>
            <p className="max-w-[58ch] text-sm text-fg-muted">
              방문 일정, 돌봄 기록, 정산, 보험청구 순서로 오늘 놓치기 쉬운 일을 확인하세요.
            </p>
          </div>
          <Badge tone={data.pendingClaims > 0 ? 'warn' : 'success'}>
            {data.pendingClaims > 0 ? `청구 ${data.pendingClaims}건 확인` : '청구 정리됨'}
          </Badge>
        </div>

        <ol className="grid gap-3" aria-label="오늘 처리할 일">
          {todayTasks.map((task, index) => (
            <li
              key={task.route}
              data-tone={task.tone}
              className="group/task grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-border-subtle bg-bg-surface p-3 data-[tone=primary]:border-[color-mix(in_oklch,var(--accent)_28%,var(--border-subtle))] data-[tone=primary]:bg-[color-mix(in_oklch,var(--accent-soft)_36%,var(--bg-surface))] md:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
            >
              <span
                aria-hidden="true"
                className="grid h-[1.65rem] w-[1.65rem] place-items-center rounded-full bg-bg-sunken text-xs font-semibold tabular-nums text-fg-muted max-md:hidden group-data-[tone=primary]/task:bg-accent group-data-[tone=primary]/task:text-fg-on-accent"
              >
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-md bg-accent-soft text-accent-soft-fg"
              >
                <Icon name={task.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-col gap-[0.1rem]">
                <span className="text-sm font-semibold text-fg-strong">{task.title}</span>
                <span className="text-xs text-fg-muted">{task.description}</span>
              </span>
              <Button
                variant={task.tone === 'primary' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onNavigate(task.route)}
                className="max-md:col-span-full max-md:w-full"
              >
                {task.actionLabel}
                <Icon name="arrow-right" size={15} />
              </Button>
            </li>
          ))}
        </ol>
      </section>

      {/* 차분한 지표: hero-metric 클리셰 대신 절제된 라벨+값 카드 */}
      <section aria-label="오늘의 현황" className="stat-row">
        {data.loading && data.careLogs.length === 0 ? (
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
              label="오늘 일정"
              value={`${data.todaySchedules}건`}
              valueLabel={`오늘 방문 일정 ${data.todaySchedules}건`}
              foot={`진행 전 일정 ${data.pendingSchedules}건`}
            />
            <Stat
              icon="settlement"
              label="이번 달 정산"
              value={formatWon(data.totalSettlement)}
              valueLabel={`이번 달 정산 ${formatWon(data.totalSettlement)}`}
              foot="기록된 돌봄비 합계"
            />
            <Stat
              icon="claims"
              label="확인할 청구"
              value={`${data.pendingClaims}건`}
              valueLabel={`확인할 청구 ${data.pendingClaims}건`}
              foot="요청·검토·거절 포함"
            />
            <Stat
              icon="analytics"
              label="청구 승인률"
              value={`${data.approvalRate.toFixed(1)}%`}
              valueLabel={`청구 승인률 ${data.approvalRate.toFixed(1)}퍼센트`}
              foot={`승인 ${data.approvedClaims}건 / 전체 ${data.claims.length}건`}
            />
          </>
        )}
      </section>

      <div className="grid-2">
        <Card>
          <CardHeader
            title="최근 돌봄 기록"
            subtitle="가장 최근에 남긴 돌봄 활동입니다."
            action={
              <button type="button" className="card-link" onClick={() => onNavigate('/care')}>
                전체 보기
              </button>
            }
          />
          {recentCare.length === 0 ? (
            <EmptyState
              icon="care"
              title="아직 돌봄 기록이 없습니다"
              description="첫 돌봄 활동을 기록하면 여기에서 최근 내역을 모아 볼 수 있습니다."
              action={
                <Button onClick={() => onNavigate('/care')}>
                  돌봄 기록 시작
                  <Icon name="arrow-right" size={16} />
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {recentCare.map((log) => (
                <li
                  className="flex items-start gap-3 border-b border-border-subtle py-3 last:border-b-0"
                  key={log.id}
                >
                  <span
                    className="mt-[0.1rem] grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-soft text-accent-soft-fg"
                    aria-hidden="true"
                  >
                    <Icon name="care" size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-fg-strong">
                      {log.recipient} · {log.type}
                    </span>
                    <span className="mt-[0.1rem] text-xs text-fg-subtle">
                      {log.date} · 담당 {log.caregiver}
                    </span>
                  </span>
                  <Badge tone="accent" plain>
                    {log.type}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="stack">
          <Card>
            <CardHeader
              title="확인할 보험청구"
              subtitle="승인 전 단계의 청구입니다."
              titleAs="h2"
              action={
                <button type="button" className="card-link" onClick={() => onNavigate('/claims')}>
                  전체 보기
                </button>
              }
            />
            {pendingClaimList.length === 0 ? (
              <EmptyState
                icon="check"
                title="확인할 청구가 없어요"
                description="요청·검토 중인 청구가 모두 처리되었습니다."
              />
            ) : (
              <ul className="flex flex-col">
                {pendingClaimList.map((claim) => (
                  <li
                    className="flex items-start gap-3 border-b border-border-subtle py-3 last:border-b-0"
                    key={claim.id}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-fg-strong">{claim.recipient}</span>
                      <span className="mt-[0.1rem] text-xs text-fg-subtle">
                        {claim.claimType} · {formatWon(claim.expectedAmount)}
                      </span>
                    </span>
                    <Badge
                      tone={STATUS_TONE[claim.status]}
                      className={claimStatusClass(claim.status)}
                    >
                      {claim.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="바로가기" subtitle="자주 쓰는 업무로 이동합니다." titleAs="h2" />
            <div className="grid grid-cols-1 gap-2 min-[30rem]:grid-cols-2">
              {managementLinks.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  className="flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-md border border-border-subtle bg-bg-surface p-3 text-left text-sm font-medium! text-fg-strong transition duration-150 ease-out hover:-translate-y-px hover:border-accent hover:bg-bg-surface-raised"
                  onClick={() => onNavigate(link.path)}
                >
                  <span
                    className="grid h-9 w-9 flex-none place-items-center rounded-md bg-accent-soft text-accent-soft-fg"
                    aria-hidden="true"
                  >
                    <Icon name={link.icon} size={18} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-[0.1rem]">
                    <span>{link.title}</span>
                    <span className="text-xs font-normal text-fg-subtle">{link.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
