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

      <section className="today-panel" aria-labelledby="today-panel-title">
        <div className="today-panel-head">
          <div className="greeting">
            <p className="greeting-date">{formatToday()}</p>
            <h1 id="today-panel-title" className="greeting-title">
              {greetByHour()}
            </h1>
            <p className="today-panel-copy">
              방문 일정, 돌봄 기록, 정산, 보험청구 순서로 오늘 놓치기 쉬운 일을 확인하세요.
            </p>
          </div>
          <Badge tone={data.pendingClaims > 0 ? 'warn' : 'success'}>
            {data.pendingClaims > 0 ? `청구 ${data.pendingClaims}건 확인` : '청구 정리됨'}
          </Badge>
        </div>

        <ol className="today-task-list" aria-label="오늘 처리할 일">
          {todayTasks.map((task, index) => (
            <li className="today-task" data-tone={task.tone} key={task.route}>
              <span className="today-task-step" aria-hidden="true">
                {index + 1}
              </span>
              <span className="today-task-icon" aria-hidden="true">
                <Icon name={task.icon} size={20} />
              </span>
              <span className="today-task-body">
                <span className="today-task-title">{task.title}</span>
                <span className="today-task-desc">{task.description}</span>
              </span>
              <Button
                variant={task.tone === 'primary' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onNavigate(task.route)}
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
            <ul className="activity">
              {recentCare.map((log) => (
                <li className="activity-item" key={log.id}>
                  <span className="activity-dot" aria-hidden="true">
                    <Icon name="care" size={16} />
                  </span>
                  <span className="activity-body">
                    <span className="activity-title">
                      {log.recipient} · {log.type}
                    </span>
                    <span className="activity-meta">
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
              <ul className="activity">
                {pendingClaimList.map((claim) => (
                  <li className="activity-item" key={claim.id}>
                    <span className="activity-body">
                      <span className="activity-title">{claim.recipient}</span>
                      <span className="activity-meta">
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
            <div className="quicklinks">
              {managementLinks.map((link) => (
                <button
                  key={link.path}
                  type="button"
                  className="quicklink"
                  onClick={() => onNavigate(link.path)}
                >
                  <span className="quicklink-icon" aria-hidden="true">
                    <Icon name={link.icon} size={18} />
                  </span>
                  <span className="quicklink-text">
                    <span>{link.title}</span>
                    <span className="quicklink-sub">{link.description}</span>
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
