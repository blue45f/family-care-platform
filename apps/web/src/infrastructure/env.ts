import { z } from 'zod'

// 프론트 환경 변수 검증(NON-FATAL).
// import.meta.env의 VITE_* 값을 startup에 safeParse 한다. 실패해도 throw 하지 않고
// console.warn으로 경고만 한다 — 잘못된 빌드 환경 변수를 조기에 알리되 앱은 계속 뜬다.

const envSchema = z.object({
  // API 베이스 URL(미설정 시 코드에서 dev/prod 기본값으로 폴백하므로 optional).
  VITE_API_URL: z.string().url('유효한 URL이어야 합니다').optional(),
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
