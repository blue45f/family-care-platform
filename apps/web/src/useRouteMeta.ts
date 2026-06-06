import { useEffect } from 'react'

import type { AppRoute } from './routeConfig'

// 프로덕션 정규 도메인. index.html의 정적 canonical/og:url 기본값과 일치한다.
const SITE_ORIGIN = 'https://family-care-platform.vercel.app'
const SITE_NAME = '가족 돌봄 운영 플랫폼'
const DEFAULT_DESCRIPTION = '돌봄 기록·돌봄비 정산·보험청구를 한 곳에서 간편하게 관리하세요.'

type RouteMeta = {
  /** 문서 타이틀에 들어갈 페이지 이름(사이트명은 자동으로 덧붙는다). */
  title: string
  /** 페이지별 og:description / meta description. */
  description: string
}

// 키 라우트별 per-page 메타. 미정의 라우트는 라우트 title + 기본 설명으로 폴백한다.
const ROUTE_META: Partial<Record<AppRoute, RouteMeta>> = {
  '/': {
    title: '홈',
    description: '돌봄 기록·정산·보험청구를 순서대로 시작하는 가족 돌봄 운영 플랫폼 홈입니다.',
  },
  '/operations': {
    title: '돌봄 운영',
    description: '기록·정산·청구 흐름을 한 화면에서 이어 처리하는 돌봄 운영 화면입니다.',
  },
  '/operations/care': {
    title: '돌봄 기록',
    description: '방문·상담·투약·식사 같은 돌봄 내용을 담당자와 함께 기록합니다.',
  },
  '/operations/settlement': {
    title: '돌봄비 정산',
    description: '돌봄 시간과 기준 금액을 입력해 가족별 정산액을 바로 계산합니다.',
  },
  '/operations/claims': {
    title: '보험청구',
    description: '요청·검토·승인·거절 상태를 기록해 보험청구 진행을 놓치지 않게 관리합니다.',
  },
  '/admin': {
    title: '서비스 관리',
    description: '현황·월별 변화·요금·예상 계산을 한곳에서 확인하는 관리자 화면입니다.',
  },
}

// 지정된 selector의 meta 콘텐츠를 갱신한다. 태그가 없으면 만들지 않는다(정적 기본값 보존).
function setMetaContent(selector: string, content: string): void {
  const element = document.head.querySelector<HTMLMetaElement>(selector)
  if (element) {
    element.setAttribute('content', content)
  }
}

/**
 * 라우트별 문서 타이틀과 OG/Twitter/description/canonical 메타를 동기화하는 네이티브 훅.
 * 별도 라이브러리 없이 useEffect로 head 태그를 직접 갱신하며, 기존 라우팅 컨텍스트
 * (activeRoute, routeTitle)를 그대로 재사용한다. SSR이 아니라 OG 크롤러가 보는 값은
 * index.html의 정적 기본값이지만, 클라이언트 내비게이션 시 탭 타이틀과 공유 메타를
 * 현재 화면에 맞춰 유지한다.
 */
export function useRouteMeta(activeRoute: AppRoute, routeTitle: string): void {
  useEffect(() => {
    const meta = ROUTE_META[activeRoute]
    const pageTitle = meta?.title ?? routeTitle
    const description = meta?.description ?? DEFAULT_DESCRIPTION
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
