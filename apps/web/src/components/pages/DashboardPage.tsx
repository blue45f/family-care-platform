import type { AppRoute } from '../../routeConfig'
import type { PlatformData } from '../../state/usePlatformData'
import { claimStatusClass, formatWon } from '../../utils'
import type { ClaimStatus } from '../../types'
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
  const recentCare = data.careLogs.slice(0, 5)
  const pendingClaimList = data.claims.filter((claim) => claim.status !== '승인').slice(0, 4)

  const quickLinks: {
    path: AppRoute
    label: string
    sub: string
    icon: 'care' | 'settlement' | 'claims'
  }[] = [
    { path: '/care', label: '돌봄 기록 남기기', sub: '방문·상담·투약 기록', icon: 'care' },
    {
      path: '/settlements',
      label: '돌봄비 정산',
      sub: '시간·단가로 합계 계산',
      icon: 'settlement',
    },
    { path: '/claims', label: '보험청구 점검', sub: '요청·검토 상태 확인', icon: 'claims' },
  ]

  return (
    <div className="stack">
      <div className="greeting">
        <p className="greeting-date">{formatToday()}</p>
        <h1 className="greeting-title">{greetByHour()}</h1>
      </div>

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
              icon="care"
              label="돌봄 가구"
              value={`${data.activeHouseholds}개`}
              valueLabel={`돌봄 가구 ${data.activeHouseholds}개`}
              foot="기록·정산 기준 활성 대상"
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
              {quickLinks.map((link) => (
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
                    <span>{link.label}</span>
                    <span className="quicklink-sub">{link.sub}</span>
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
