import { useEffect, useRef } from 'react'

/**
 * 스크롤 진입 시 자식 [data-reveal] 요소를 한 번씩 드러낸다(엔트런스 모션).
 *
 * 설계 원칙:
 * - **No-JS / SSR 안전**: 마크업은 항상 보이는 상태로 렌더된다. JS가 동작할 때만
 *   루트에 `data-reveal-armed`를 붙여 초기값을 숨김으로 전환하고, 교차 시 다시 드러낸다.
 *   따라서 스크립트가 없거나 정적 렌더(renderToStaticMarkup)에서도 콘텐츠가 사라지지 않는다.
 * - **prefers-reduced-motion 존중**: 모션 비선호 또는 IntersectionObserver 미지원이면
 *   아무 것도 무장하지 않고 즉시 전체 표시 상태로 둔다.
 * - CLS 없음: transform/opacity만 사용하며 레이아웃 속성은 건드리지 않는다.
 */
export const useScrollReveal = <T extends HTMLElement>() => {
  const rootRef = useRef<T | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') {
      return
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      return
    }

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) {
      return
    }

    // JS 활성: 초기 상태를 "숨김"으로 무장한다(CSS가 이 플래그를 보고 시작값을 적용).
    root.setAttribute('data-reveal-armed', 'true')

    const reveal = (target: Element) => {
      target.setAttribute('data-reveal-shown', 'true')
      observer.unobserve(target)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    )

    for (const target of targets) {
      observer.observe(target)
    }

    // 안전망: 관찰자가 어떤 이유로든 발화하지 않아도(인쇄·전체 페이지 캡처·비정상 레이아웃)
    // 콘텐츠가 영구히 숨지 않도록 일정 시간 뒤 남은 요소를 모두 드러낸다.
    const failSafe = globalThis.setTimeout(() => {
      for (const target of targets) {
        reveal(target)
      }
    }, 2200)

    return () => {
      globalThis.clearTimeout(failSafe)
      observer.disconnect()
      root.removeAttribute('data-reveal-armed')
    }
  }, [])

  return rootRef
}
