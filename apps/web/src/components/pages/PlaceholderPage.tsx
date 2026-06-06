import type { AppRoute, RouteDef } from '../../routeConfig'
import { Badge, Button, Icon, PageHeader } from '../ui'

type PlaceholderPageProps = {
  def: RouteDef
  onNavigate: (path: AppRoute) => void
}

/**
 * Phase 2에서 본 콘텐츠가 채워질 라우트의 임시 화면.
 * 빈 화면 대신 페이지 정체성(제목·설명)과 대시보드 복귀 경로를 제공해
 * 셸·라우팅이 정상 동작함을 보여준다.
 */
export const PlaceholderPage = ({ def, onNavigate }: PlaceholderPageProps) => (
  <div className="stack">
    <PageHeader eyebrow={def.eyebrow} title={def.title} description={def.description} />

    <div className="placeholder">
      <span className="placeholder-icon" aria-hidden="true">
        <Icon name={def.icon} size={28} />
      </span>
      <p className="placeholder-title">화면을 준비하고 있어요</p>
      <p className="placeholder-desc">
        {def.title} 화면은 다음 단계에서 새 디자인으로 완성됩니다. 지금은 대시보드에서 핵심 현황을
        확인하실 수 있어요.
      </p>
      <div className="placeholder-list">
        <Badge tone="accent">곧 제공</Badge>
        <Badge plain>Phase 2</Badge>
      </div>
      <Button variant="secondary" onClick={() => onNavigate('/')}>
        <Icon name="home" size={16} />
        대시보드로 돌아가기
      </Button>
    </div>
  </div>
)
