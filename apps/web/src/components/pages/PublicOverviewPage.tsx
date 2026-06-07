import { routeDefs, type AppRoute, type PublicNavigateState } from '../../routeConfig'
import { Badge, Button, Card, CardHeader, Icon, PageHeader } from '../ui'

type PublicOverviewPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
}

type PublicOverviewAudience = {
  role: string
  needs: string[]
  pain: string
}

type PublicOverviewUseCase = {
  title: string
  description: string
}

const whatItSolves: PublicOverviewAudience[] = [
  {
    role: '센터 운영자',
    pain: '출근 전/퇴근 후에 누락되는 업무가 생겨 실수가 누적됩니다.',
    needs: [
      '오늘 처리해야 할 일정과 청구 상태를 한 번에 확인',
      '돌봄 기록 누락을 줄이고 다음 담당자에게 정확히 이관',
      '정산·청구 리드타임을 관리할 기준 수립',
    ],
  },
  {
    role: '행정·회계 담당자',
    pain: '정산액 산정과 청구 진행 상태를 별도 엑셀에서 다시 정리해야 합니다.',
    needs: [
      '방문 기록 기반으로 정산을 즉시 집계',
      '요청/검토/승인 상태를 한 곳에서 추적',
      '월간 매출·승인률 지표를 월말 보고서로 변환',
    ],
  },
  {
    role: '센터장',
    pain: '센터 규모가 커지면 화면이 늘어나도 운영 리듬은 복잡해집니다.',
    needs: [
      '팀 역할별 화면으로 운영 책임 범위를 명확화',
      '이슈 발생 시 조치 히스토리를 시간순으로 확인',
      '요금제 변경과 운영 정책을 수치로 판단',
    ],
  },
]

const usageScenarios: PublicOverviewUseCase[] = [
  {
    title: '1일 시작',
    description: '대시보드에서 오늘 일정과 처리 대상 건을 확인하고, 핵심 작업부터 수행합니다.',
  },
  {
    title: '업무 수행',
    description: '일정·돌봄·정산·청구로 이동하면서 같은 대상의 상태 맥락이 끊기지 않게 유지합니다.',
  },
  {
    title: '마감 및 점검',
    description:
      '월말에는 승인률/정산 추이/미처리 건을 운영 분석으로 점검해 다음달 운영에 반영합니다.',
  },
]

const scaleCards = [
  {
    label: '소규모 센터',
    desc: '직원 1~3명, 1개 시설로 시작한다면 데모로 운영 패턴을 빠르게 학습합니다.',
  },
  {
    label: '성장형 센터',
    desc: '일정 100~300건 운영에서 권한·상태·알림 규칙을 고정해 업무 표준화를 도입합니다.',
  },
  {
    label: '멀티 센터',
    desc: '운영단위별 가중치와 승인 흐름을 분리해 장기 계약 운영으로 확장합니다.',
  },
]

const faqMini = [
  {
    q: '타 시스템에서 전환할 때 가장 먼저 무엇을 준비해야 하나요?',
    a: '기록 템플릿(방문 대상자, 담당자, 수납/청구 항목)만 먼저 통일하면 전환이 가장 안정적입니다.',
  },
  {
    q: '모든 기능을 다 써야 하나요?',
    a: '필수는 아니고, 운영 흐름에서 사용하지 않는 기능은 비노출 모드로 진행할 수 있는 구조를 권장합니다.',
  },
]

export const PublicOverviewPage = ({ onNavigate }: PublicOverviewPageProps) => {
  const def = routeDefs['/overview']

  return (
    <div className="stack">
      <PageHeader eyebrow={def.eyebrow} title={def.title} description={def.description} />

      <section className="public-band public-overview-hero" aria-labelledby="overview-intro-title">
        <div className="public-section-head">
          <p className="page-eyebrow">서비스 소개</p>
          <h2 id="overview-intro-title">돌봄 운영을 반복 가능한 루틴으로 바꾸는 구조</h2>
          <p>
            일정, 기록, 정산, 보험청구를 각 파트가 번갈아 관리하던 흐름을 하나의 운영선으로 연결해
            새로 합류한 담당자도 바로 적응할 수 있게 설계합니다.
          </p>
        </div>
        <div className="public-overview-grid">
          {usageScenarios.map((item) => (
            <article className="public-overview-card" key={item.title}>
              <Badge tone="accent" plain>
                {item.title}
              </Badge>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid-2">
        {whatItSolves.map((audience) => (
          <Card key={audience.role}>
            <CardHeader title={audience.role} subtitle={audience.pain} />
            <ul className="guide-bullets" style={{ marginTop: 'var(--space-4)' }}>
              {audience.needs.map((need) => (
                <li key={need}>{need}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <section
        className="public-band public-overview-card-section"
        aria-labelledby="overview-scale-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">확장형 도입</p>
          <h2 id="overview-scale-title">센터 규모에 맞춰 단계적으로 확장합니다</h2>
          <p>고객사마다 시작점은 다르지만 공통 운영 루틴은 동일합니다.</p>
        </div>
        <div className="public-overview-grid">
          {scaleCards.map((card) => (
            <article className="public-overview-card" key={card.label}>
              <h3>{card.label}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-band">
        <div className="public-section-head">
          <p className="page-eyebrow">도입 전 체크</p>
          <h2>지금 바로 판단할 수 있는 기준</h2>
        </div>
        <div className="public-metric-list">
          <article className="public-metric-item">
            <Icon name="check" size={18} />
            <strong>시범 1주</strong>
            <p>하루 업무를 실제 데이터로 한 번 돌려 실패 지점을 찾습니다.</p>
          </article>
          <article className="public-metric-item">
            <Icon name="check" size={18} />
            <strong>운영 규칙 정의</strong>
            <p>담당자 역할, 상태명, 검토 단계, 정산 정책을 문서화해 팀 규칙을 고정합니다.</p>
          </article>
          <article className="public-metric-item">
            <Icon name="check" size={18} />
            <strong>확대/보완</strong>
            <p>요금제와 조직 구조에 맞춰 실제 사용량 기준으로 다음 단계를 정합니다.</p>
          </article>
        </div>
      </section>

      <section className="public-band public-overview-faq" aria-labelledby="overview-faq-title">
        <div className="public-section-head">
          <p className="page-eyebrow">빠른 FAQ</p>
          <h2 id="overview-faq-title">도입을 시작할 때 자주 묻는 질문</h2>
        </div>
        <div className="public-faq-list">
          {faqMini.map((item) => (
            <div className="public-faq-item" key={item.q}>
              <article className="public-faq-question is-open">
                <span>{item.q}</span>
                <span className="public-faq-sign is-open" aria-hidden="true">
                  ✓
                </span>
              </article>
              <div className="public-faq-answer is-open">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="public-cta">
        <h2>먼저 전체 흐름을 보고 싶다면</h2>
        <p>시작 가이드에서 실제 흐름을 따라오면, 10분 안에 핵심 동선을 파악할 수 있습니다.</p>
        <div className="public-hero-actions">
          <Button onClick={() => onNavigate('/guide', { source: 'hero', fromLanding: true })}>
            <Icon name="arrow-right" size={16} />
            사용 가이드 보기
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('/login', { source: 'hero', fromLanding: true })}
          >
            데모로 시작하기
          </Button>
        </div>
      </section>
    </div>
  )
}
