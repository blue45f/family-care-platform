import { lazy } from 'react'
import type { ComponentType } from 'react'

/**
 * 배포 직후 stale 청크(이전 해시 번들이 서버에서 사라진 상태) 로드 실패를
 * 1회 전체 새로고침으로 복구하기 위한 세션 가드 키.
 */
const CHUNK_RETRY_KEY = 'family-care-chunk-retry'

/**
 * 동적 import 팩토리를 감싸 청크 로드 실패를 복구한다.
 *
 * - 성공 로드 시 가드를 해제한다. 가드는 reload 너머로 유지해야 한다 —
 *   실패 직후 바로 지우면 새로고침 뒤 같은 청크가 또 실패할 때 무한 reload에 빠진다.
 * - 첫 실패: 가드를 기록하고 전체 새로고침. reload가 처리되는 동안 Suspense
 *   fallback을 유지하도록 절대 settle되지 않는 Promise를 반환한다.
 * - 두 번째 실패(가드가 이미 있음): throw로 ErrorBoundary에 노출한다.
 */
export const retryImport = async <TModule>(factory: () => Promise<TModule>): Promise<TModule> => {
  try {
    const mod = await factory()
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
    return mod
  } catch (error) {
    if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
      sessionStorage.setItem(CHUNK_RETRY_KEY, '1')
      window.location.reload()
      return new Promise<never>(() => {})
    }
    throw error
  }
}

/**
 * React.lazy + retryImport. 제네릭으로 페이지 컴포넌트의 props 타입을 보존한다.
 */
export const lazyRetry = <TComponent extends ComponentType<never>>(
  factory: () => Promise<{ default: TComponent }>,
): TComponent =>
  lazy(
    () => retryImport(factory) as unknown as Promise<{ default: ComponentType }>,
  ) as unknown as TComponent
