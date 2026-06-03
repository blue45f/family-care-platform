import { type RefObject, useEffect, useRef, useState } from 'react'

import {
  type AppRoute,
  getRouteContext,
  resolveRouteResult,
  type RouteContext,
} from './routeConfig'
import { applyRouteEntrySideEffects, reconcileLocationToRoute } from './routeNavigation'

type UseRouteStateResult<TMain extends HTMLElement = HTMLElement> = {
  /** 현재 활성 라우트(항상 등록된 정규 `AppRoute`). */
  activeRoute: AppRoute
  /** 활성 라우트의 파생 컨텍스트(네비/브레드크럼/플로우 등). */
  routeContext: RouteContext
  /** 타입 안전한 네비게이션. 인자는 `AppRoute`로 제한되어 잘못된 경로는 컴파일 에러다. */
  navigate: (path: AppRoute) => void
  /** 현재 URL이 알 수 없어 폴백 라우트로 떨어졌는지 여부(not-found 안내용). */
  isFallback: boolean
  /** 라우트 변경 시 포커스를 받을 메인 콘텐츠 영역 ref(부착할 요소 타입에 맞춰 추론). */
  mainRef: RefObject<TMain | null>
}

const readInitialRoute = (): AppRoute => {
  if (typeof window === 'undefined') {
    return '/'
  }
  return resolveRouteResult(window.location.pathname).route
}

const useRouteState = <TMain extends HTMLElement = HTMLElement>(): UseRouteStateResult<TMain> => {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(readInitialRoute)
  const [isFallback, setIsFallback] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return resolveRouteResult(window.location.pathname).isFallback
  })
  const routeContext = getRouteContext(activeRoute)
  const mainRef = useRef<TMain | null>(null)
  // 첫 렌더(초기 진입)에는 스크롤/포커스 부수효과를 건너뛰기 위한 가드.
  const hasEnteredRef = useRef(false)

  // 마운트 시 1회: 주소창을 정규 라우트로 보정한다(딥링크/트레일링 슬래시/미등록 경로).
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const result = resolveRouteResult(window.location.pathname)
    setActiveRoute(result.route)
    setIsFallback(result.isFallback)
    reconcileLocationToRoute(window.history, window.location)
  }, [])

  // 브라우저 뒤로/앞으로(popstate) 시 주소창과 상태를 다시 동기화한다.
  useEffect(() => {
    const syncRoute = () => {
      const result = resolveRouteResult(window.location.pathname)
      reconcileLocationToRoute(window.history, window.location)
      setIsFallback(result.isFallback)
      setActiveRoute((prev) => (prev === result.route ? prev : result.route))
    }

    window.addEventListener('popstate', syncRoute)
    return () => {
      window.removeEventListener('popstate', syncRoute)
    }
  }, [])

  // 라우트가 바뀔 때마다 스크롤을 맨 위로 되돌리고 메인으로 포커스를 옮긴다(a11y).
  // 초기 진입에는 적용하지 않아 사용자가 직접 연 스크롤 위치/포커스를 빼앗지 않는다.
  useEffect(() => {
    if (!hasEnteredRef.current) {
      hasEnteredRef.current = true
      return
    }
    applyRouteEntrySideEffects(mainRef.current)
  }, [activeRoute])

  const navigate = (path: AppRoute) => {
    const result = resolveRouteResult(path)
    if (result.route === activeRoute && !isFallback) {
      return
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', result.route)
    }
    setIsFallback(result.isFallback)
    setActiveRoute(result.route)
  }

  return {
    activeRoute,
    routeContext,
    navigate,
    isFallback,
    mainRef,
  }
}

export { useRouteState }
