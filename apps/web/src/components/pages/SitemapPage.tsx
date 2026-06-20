import { routeMap } from '../../routeConfig'
import { Icon } from '../ui'

const links = [
  ...routeMap.map((route) => ({
    path: route.path,
    title: route.title,
    description: route.description,
  })),
  {
    path: '/design',
    title: '디자인 시스템',
    description: '컬러 토큰, 타이포그래피, 컴포넌트 상태를 확인하는 공개 스타일가이드입니다.',
  },
] as const

export const SitemapPage = () => {
  const goHome = () => {
    if (typeof window !== 'undefined') {
      globalThis.location.assign('/')
    }
  }

  return (
    <main className="public-page" aria-labelledby="sitemap-title">
      <header className="public-nav" aria-label="사이트맵 내비게이션">
        <button type="button" className="public-brand" onClick={goHome}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={18} />
          </span>
          <span>
            <strong>
              가족 돌봄 운영 플랫폼 <span className="beta-badge">BETA</span>
            </strong>
            <small>SITEMAP</small>
          </span>
        </button>
        <nav className="public-nav-actions" aria-label="사이트맵 빠른 이동">
          <a className="public-anchor-link" href="/">
            홈
          </a>
          <a className="public-anchor-link" href="/design">
            디자인 시스템
          </a>
        </nav>
      </header>

      <section className="public-hero public-hero-compact">
        <p className="public-eyebrow">BETA Sitemap</p>
        <h1 id="sitemap-title">가족 돌봄 운영 플랫폼 사이트맵</h1>
        <p>
          공개 소개, 운영 콘솔, 계정, 커뮤니티, 디자인 시스템까지 주요 경로를 한 화면에
          정리했습니다.
        </p>
      </section>

      <section className="public-section" aria-label="전체 경로">
        <div className="public-card-grid">
          {links.map((link) => (
            <a key={link.path} className="public-card public-card-link" href={link.path}>
              <span>
                <strong>{link.title}</strong>
                <small>{link.description}</small>
              </span>
              <code>{link.path}</code>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
