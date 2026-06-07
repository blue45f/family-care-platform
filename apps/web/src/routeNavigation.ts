import { type AppRoute, resolveRouteResult, type ResolveRouteResult } from './routeConfig'

/**
 * 라우터의 부수효과(History API·스크롤·포커스)를 순수 함수로 묶어
 * React Router 셸에서 재사용하는 모듈. DOM 전역에 직접 의존하지 않고
 * 주입 가능한 어댑터를 받으므로, jsdom 없이(node 환경) 단위 테스트할 수 있다.
 */

/** `window.history`에서 라우터가 실제로 쓰는 부분만 추린 최소 인터페이스. */
export type HistoryLike = {
  pushState: (data: unknown, unused: string, url?: string | null) => void
  replaceState: (data: unknown, unused: string, url?: string | null) => void
}

/**
 * 현재 주소(`location`)를 정규 라우트로 해석하고, 주소창과 정규형이 다르면
 * 어떻게 보정해야 하는지를 함께 계산한다. 부수효과는 일으키지 않는다.
 *
 * @returns 해석 결과 + `nextUrl`(정규화에 사용할, 쿼리/해시를 보존한 URL)
 *          + `shouldReplace`(주소창을 `replaceState`로 보정해야 하는지)
 */
export const canonicalizeLocation = (location: {
  pathname: string
  search?: string
  hash?: string
}): ResolveRouteResult & { nextUrl: string; shouldReplace: boolean } => {
  const result = resolveRouteResult(location.pathname)
  const search = location.search ?? ''
  const hash = location.hash ?? ''
  // 정규 라우트 경로에 기존 쿼리/해시는 그대로 이어 붙여 딥링크 파라미터를 보존한다.
  const nextUrl = `${result.route}${search}${hash}`
  const currentPath = `${location.pathname}${search}${hash}`
  // 폴백되었거나, 트레일링 슬래시 등으로 입력이 정규형과 다르면 주소창을 보정한다.
  const shouldReplace = !result.isCanonical || nextUrl !== currentPath
  return { ...result, nextUrl, shouldReplace }
}

/**
 * 라우트 변경 시 스크롤을 맨 위로 되돌리고, 메인 영역으로 포커스를 옮긴다(a11y).
 * 해당 전역이 없는 환경(SSR/테스트)에서는 조용히 통과한다.
 *
 * @param mainEl 포커스를 받을 라우트 콘텐츠 영역(없으면 포커스는 생략)
 * @param win    스크롤 대상 윈도(테스트 주입용; 기본 전역 `window`)
 */
export const applyRouteEntrySideEffects = (
  mainEl: HTMLElement | null,
  win: Pick<Window, 'scrollTo'> | undefined = typeof window !== 'undefined' ? window : undefined,
): void => {
  if (win && typeof win.scrollTo === 'function') {
    win.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
  if (mainEl) {
    // tabIndex=-1 요소에 프로그램적으로 포커스를 주되, 추가 스크롤은 막는다.
    mainEl.focus({ preventScroll: true })
  }
}

/**
 * 정규화 결과에 따라 주소창을 보정하고, 적용된 정규 라우트를 반환한다.
 * `pushState`가 아니라 `replaceState`를 써서 잘못된 URL이 뒤로가기 히스토리에
 * 남지 않게 한다(딥링크 오류·트레일링 슬래시 정리).
 */
export const reconcileLocationToRoute = (
  history: HistoryLike,
  location: { pathname: string; search?: string; hash?: string },
): AppRoute => {
  const { route, nextUrl, shouldReplace } = canonicalizeLocation(location)
  if (shouldReplace) {
    history.replaceState({}, '', nextUrl)
  }
  return route
}
