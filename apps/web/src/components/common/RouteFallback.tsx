/**
 * 라우트 청크를 받아오는 동안 표시하는 Suspense 폴백.
 * 데이터 로딩 안내(feedback-loading)와 같은 시각 언어를 재사용한다.
 */
export const RouteFallback = () => (
  <p className="feedback feedback-loading" role="status" aria-live="polite">
    화면을 불러오는 중입니다…
  </p>
)
