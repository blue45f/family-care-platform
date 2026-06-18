/**
 * DeskCloud — 네이티브(API-only) 연동 클라이언트 팩토리.
 * ──────────────────────────────────────────────────────────────────────────
 * 발행된 npm SDK `@heejun/deskcloud` 의 브라우저(`pk_`) 클라이언트만 사용한다.
 * 위젯 번들/외부 CSS 를 붙이지 않고, 데이터만 가져와 이 앱 고유 컴포넌트로 렌더한다
 * (TermsDesk 패턴). 서버 전용 `@heejun/deskcloud/server`(`sk_`)는 절대 import 하지 않는다.
 *
 * 각 Desk 는 자기 `VITE_*DESK_URL` 이 설정된 경우에만 활성화되고(env-gated),
 * 미설정이면 `null` 을 반환해 호출부가 앱의 기존 1차(first-party) 기능으로 폴백한다.
 * publishable 키는 `VITE_*DESK_PK` 가 있으면 쓰고, 없으면 'pk_demo' 로 폴백한다.
 *
 * pk_ 키는 브라우저 노출이 안전한 공개 키다. secret(`sk_`) 키는 여기에 절대 두지 않는다.
 */
import {
  createChangelogClient,
  createNotifyClient,
  createSearchClient,
  type ChangelogClient,
  type NotifyClient,
  type SearchClient,
} from '@heejun/deskcloud'

const DEMO_PK = 'pk_demo'

const env = import.meta.env

/** URL 문자열을 정리한다(빈 문자열 → undefined). 미설정 Desk 를 비활성으로 본다. */
function cleanUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** pk 가 없으면 데모 키로 폴백한다(공개 키 — 브라우저 노출 안전). */
function pk(value: string | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : DEMO_PK
}

/**
 * ChangelogDesk — 발행된 변경 이력('서비스 업데이트')을 읽는다.
 * `VITE_CHANGELOGDESK_URL` 미설정이면 null(가이드 페이지에서 섹션을 숨김).
 */
export function getChangelogClient(): ChangelogClient | null {
  const endpoint = cleanUrl(env.VITE_CHANGELOGDESK_URL)
  if (!endpoint) {
    return null
  }
  return createChangelogClient({ endpoint, publishableKey: pk(env.VITE_CHANGELOGDESK_PK) })
}

/**
 * NotifyDesk — 로그인 사용자의 인앱 알림 인박스 + 읽음 처리.
 * `VITE_NOTIFYDESK_URL` 미설정이면 null(대시보드에서 알림 카드를 숨김).
 */
export function getNotifyClient(): NotifyClient | null {
  const endpoint = cleanUrl(env.VITE_NOTIFYDESK_URL)
  if (!endpoint) {
    return null
  }
  return createNotifyClient({ endpoint, publishableKey: pk(env.VITE_NOTIFYDESK_PK) })
}

/**
 * SearchDesk — 전역 검색 질의.
 * `VITE_SEARCHDESK_URL` 미설정이면 null(검색 팔레트를 마운트하지 않음).
 */
export function getSearchClient(): SearchClient | null {
  const endpoint = cleanUrl(env.VITE_SEARCHDESK_URL)
  if (!endpoint) {
    return null
  }
  return createSearchClient({ endpoint, publishableKey: pk(env.VITE_SEARCHDESK_PK) })
}

/** 각 Desk 의 활성 여부(URL 설정 여부)만 노출하는 헬퍼 — 마운트 게이트용. */
export const deskEnabled = {
  changelog: (): boolean => Boolean(cleanUrl(env.VITE_CHANGELOGDESK_URL)),
  notify: (): boolean => Boolean(cleanUrl(env.VITE_NOTIFYDESK_URL)),
  search: (): boolean => Boolean(cleanUrl(env.VITE_SEARCHDESK_URL)),
} as const
