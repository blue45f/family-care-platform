import type { AppRoute } from '../../routeConfig'
import { Button, Icon } from '../ui'

type PublicHomePageProps = {
  onNavigate: (path: AppRoute) => void
}

const publicWorkflow = [
  {
    step: '1',
    title: '방문 일정',
    desc: '오늘 방문할 대상자와 담당자를 먼저 정합니다.',
    icon: 'schedule',
  },
  {
    step: '2',
    title: '돌봄 기록',
    desc: '방문, 상담, 투약, 식사관리 내용을 바로 남깁니다.',
    icon: 'care',
  },
  {
    step: '3',
    title: '정산·청구',
    desc: '돌봄비와 보험청구 상태를 같은 흐름에서 확인합니다.',
    icon: 'claims',
  },
] as const

const publicHighlights = [
  '오늘 처리할 일을 먼저 보여주는 대시보드',
  '방문 일정, 담당자, 상태 변경을 한 화면에서 관리',
  '정산 금액 자동 계산과 보험청구 진행 상태 추적',
  '처음 쓰는 담당자를 위한 사용 가이드와 역할별 체크포인트',
]

const productPreviewRows = [
  ['09:00', '이은정', '방문 예정', '예정'],
  ['11:30', '김민수', '복약 확인', '진행중'],
  ['14:00', '최성수', '정산 확인', '완료'],
]

export const PublicHomePage = ({ onNavigate }: PublicHomePageProps) => {
  return (
    <main className="public-page" aria-labelledby="public-home-title">
      <header className="public-nav" aria-label="공개 사이트 내비게이션">
        <button type="button" className="public-brand" onClick={() => onNavigate('/')}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={18} />
          </span>
          <span>
            <strong>가족 돌봄 운영 플랫폼</strong>
            <small>CARE OPERATIONS</small>
          </span>
        </button>
        <nav className="public-nav-actions" aria-label="계정">
          <button type="button" className="public-text-link" onClick={() => onNavigate('/login')}>
            로그인
          </button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/register')}>
            회원가입
          </Button>
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="page-eyebrow">돌봄 센터 운영자를 위한 업무 플랫폼</p>
          <h1 id="public-home-title">가족 돌봄 운영 플랫폼</h1>
          <p>방문 일정부터 보험청구까지, 센터 담당자가 오늘 해야 할 일을 놓치지 않게 정리합니다.</p>
          <div className="public-hero-actions">
            <Button onClick={() => onNavigate('/login')}>
              <Icon name="arrow-right" size={16} />
              데모 계정으로 둘러보기
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('/register')}>
              센터 계정 만들기
            </Button>
          </div>
        </div>
      </section>

      <section className="public-band public-workflow" aria-labelledby="public-workflow-title">
        <div className="public-section-head">
          <p className="page-eyebrow">운영 흐름</p>
          <h2 id="public-workflow-title">하루 업무가 같은 순서로 정리됩니다</h2>
        </div>
        <div className="public-workflow-list">
          {publicWorkflow.map((item) => (
            <article className="public-workflow-item" key={item.title}>
              <span className="public-step">{item.step}</span>
              <span className="guide-step-icon" aria-hidden="true">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="public-band public-preview-section"
        aria-labelledby="public-preview-title"
      >
        <div className="public-section-head">
          <p className="page-eyebrow">제품 미리보기</p>
          <h2 id="public-preview-title">로그인하면 이런 운영 화면을 사용합니다</h2>
          <p>데모 계정으로 실제 일정, 기록, 정산, 청구 흐름을 눌러볼 수 있습니다.</p>
        </div>
        <div className="public-preview">
          <div className="public-preview-bar">
            <span>오늘 방문</span>
            <strong>3건</strong>
          </div>
          <div className="public-preview-grid">
            <div>
              <span>확인할 청구</span>
              <strong>2건</strong>
            </div>
            <div>
              <span>이번 달 정산</span>
              <strong>1,280,000원</strong>
            </div>
          </div>
          <table className="public-preview-table">
            <caption className="sr-only">공개 홈페이지 제품 미리보기 일정 표</caption>
            <thead>
              <tr>
                <th>시간</th>
                <th>대상자</th>
                <th>업무</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {productPreviewRows.map((row) => (
                <tr key={row.join('-')}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="public-band public-split" aria-labelledby="public-feature-title">
        <div>
          <p className="page-eyebrow">왜 필요한가요</p>
          <h2 id="public-feature-title">스프레드시트와 기억에 흩어진 일을 한곳으로 모읍니다</h2>
        </div>
        <ul className="public-check-list">
          {publicHighlights.map((item) => (
            <li key={item}>
              <Icon name="check" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="public-cta" aria-labelledby="public-cta-title">
        <h2 id="public-cta-title">실제 화면을 바로 둘러보세요</h2>
        <p>로그인 화면에서 데모 계정을 누르면 샘플 운영 데이터로 전체 기능을 확인할 수 있습니다.</p>
        <div className="public-hero-actions">
          <Button onClick={() => onNavigate('/login')}>
            <Icon name="arrow-right" size={16} />
            데모 계정으로 둘러보기
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('/register')}>
            회원가입
          </Button>
        </div>
      </section>
    </main>
  )
}
