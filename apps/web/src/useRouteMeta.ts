import { useEffect } from 'react'

import { type AppRoute, getRouteDef, SITE_NAME } from './routeConfig'

// 프로덕션 정규 도메인. index.html의 정적 canonical/og:url 기본값과 일치한다.
const SITE_ORIGIN = 'https://family-care-platform.vercel.app'
const DEFAULT_DESCRIPTION = '돌봄 기록·돌봄비 정산·보험청구를 한 곳에서 간편하게 관리하세요.'

// 지정된 selector의 meta 콘텐츠를 갱신한다. 태그가 없으면 만들지 않는다(정적 기본값 보존).
function setMetaContent(selector: string, content: string): void {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) {
    element.setAttribute('content', content)
  }
}

/**
 * 라우트별 문서 타이틀과 OG/Twitter/description/canonical 메타를 동기화하는 네이티브 훅.
 * 별도 라이브러리 없이 useEffect로 head 태그를 직접 갱신하며, 라우트 정의(routeDefs)를
 * 단일 소스로 재사용한다. OG 크롤러가 보는 값은 index.html의 정적 기본값이지만,
 * 클라이언트 내비게이션 시 탭 타이틀과 공유 메타를 현재 화면에 맞춰 유지한다.
 */
export function useRouteMeta(activeRoute: AppRoute, routeTitle: string): void {
  useEffect(() => {
    const def = getRouteDef(activeRoute)
    const pageTitle = def.title ?? routeTitle
    const description = def.description || DEFAULT_DESCRIPTION
    const fullTitle = `${pageTitle} · ${SITE_NAME}`
    const url = activeRoute === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${activeRoute}`

    document.title = fullTitle
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', fullTitle)
    setMetaContent('meta[property="og:description"]', description)
    setMetaContent('meta[property="og:url"]', url)
    setMetaContent('meta[name="twitter:title"]', fullTitle)
    setMetaContent('meta[name="twitter:description"]', description)

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute('href', url)
    }
  }, [activeRoute, routeTitle])
}
