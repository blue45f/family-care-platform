import { z } from 'zod'

// 프론트 환경 변수 검증(NON-FATAL).
// import.meta.env의 VITE_* 값을 startup에 safeParse 한다. 실패해도 throw 하지 않고
// console.warn으로 경고만 한다 — 잘못된 빌드 환경 변수를 조기에 알리되 앱은 계속 뜬다.

const envSchema = z.object({
  // API 베이스 URL(미설정 시 코드에서 dev/prod 기본값으로 폴백하므로 optional).
  VITE_API_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  // SurveyDesk 피드백 위젯 엔드포인트(미설정 시 위젯을 마운트하지 않으므로 optional).
  VITE_SURVEYDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  // DeskCloud 위젯 엔드포인트 — 각각 설정될 때만 해당 위젯을 마운트(전부 optional).
  // ChangelogDesk: 변경 이력('What's new') 벨.
  VITE_CHANGELOGDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_CHANGELOGDESK_PK: z.string().optional(),
  // NotifyDesk: 알림 인박스 벨.
  VITE_NOTIFYDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_NOTIFYDESK_PK: z.string().optional(),
  // SearchDesk: ⌘K 검색 팔레트.
  VITE_SEARCHDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_SEARCHDESK_PK: z.string().optional(),
  // ChatDesk: 쪽지·채팅 위젯.
  VITE_CHATDESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_CHATDESK_PK: z.string().optional(),
  // MediaDesk: 미디어 업로더·갤러리(플로팅 런처).
  VITE_MEDIADESK_URL: z.string().url('유효한 URL이어야 합니다').optional(),
  VITE_MEDIADESK_PK: z.string().optional(),
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
