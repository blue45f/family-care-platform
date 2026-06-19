// 공유 공통 모듈 — desk-platform/apps/web/src/lib/share/ 에서 벤더링한 단일 소스.
// 순수 유틸(shareOrCopy)만 가져오고, 버튼 UI는 이 앱의 디자인 시스템(Button + aria-live 토스트)에
// 맞춰 호출부에서 직접 구성한다(generic ShareButton 미벤더링).
export { shareOrCopy } from './shareOrCopy'
export type { ShareInput, ShareResult } from './shareOrCopy'
