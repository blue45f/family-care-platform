import { z } from 'zod'

// 프론트 환경 변수 검증(NON-FATAL).
// import.meta.env의 VITE_* 값을 startup에 safeParse 한다. 실패해도 throw 하지 않고
// console.warn으로 경고만 한다 — 잘못된 빌드 환경 변수를 조기에 알리되 앱은 계속 뜬다.

const envSchema = z.object({
  // API 베이스 URL(미설정 시 코드에서 dev/prod 기본값으로 폴백하므로 optional).
  VITE_API_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  // SurveyDesk 피드백 런처 엔드포인트(미설정 시 런처를 마운트하지 않으므로 optional).
  VITE_SURVEYDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  // DeskCloud 네이티브 연동(@heejun/deskcloud pk_ SDK) — 각 URL 이 설정될 때만 해당
  // Desk 데이터를 이 앱의 컴포넌트로 렌더한다. 미설정이면 1차 기능으로 폴백(전부 optional).
  // ChangelogDesk: 가이드 페이지의 '서비스 업데이트' 카드(getWall).
  VITE_CHANGELOGDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_CHANGELOGDESK_PK: z.string().optional(),
  // NotifyDesk: 대시보드의 '최근 알림' 카드(getInbox/markRead, 로그인 한정).
  VITE_NOTIFYDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_NOTIFYDESK_PK: z.string().optional(),
  // SearchDesk: 네이티브 ⌘K 검색 팔레트(search).
  VITE_SEARCHDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_SEARCHDESK_PK: z.string().optional(),
})

export function validateWebEnv(env: ImportMetaEnv = import.meta.env): void {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    console.warn(`[env] VITE 환경 변수 형식 경고(앱은 계속 동작합니다):\n${issues}`)
  }
}
