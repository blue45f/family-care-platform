import { z } from 'zod'

// 백엔드 환경 변수 검증(NON-FATAL).
// boot 시 process.env를 safeParse 하여 형식 오류/위험한 기본값을 "경고"만 한다.
// 절대 throw/exit 하지 않는다 — 라이브 부팅을 깨지 않기 위함. 기존 process.env 읽기는
// 각 모듈이 직접 수행하므로 여기서는 검증/경고만 ADD 한다.

// 문자열로 들어오는 정수형 환경 변수(빈 문자열 허용). 형식이 틀리면 issue로 보고.
const optionalIntString = z.string().trim().regex(/^\d+$/, '정수여야 합니다').optional()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  PORT: optionalIntString,
  // CORS — 둘 중 하나(목록/단일)만 있어도 됨. 형식 강제는 하지 않는다.
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  CORS_ALLOWED_ORIGIN: z.string().optional(),
  // DB — 로컬 파일 스토어 대신 필수 사용
  DATABASE_URL: z.string().optional(),
  // 인증 시크릿 — 운영에서는 필수(별도 경고). 형식만 점검.
  JWT_SECRET: z.string().optional(),
  AUTH_TOKEN_TTL_SECONDS: optionalIntString,
  FCP_DATA_DIR: z.string().optional(),
  RATE_LIMIT_MAX: optionalIntString,
  RATE_LIMIT_MAX_REQUESTS: optionalIntString,
  RATE_LIMIT_WINDOW_MS: optionalIntString,
})

// 알려진 안전하지 않은 기본값(시크릿에 그대로 쓰이면 위험).
const UNSAFE_SECRET_DEFAULTS = new Set([
  'dev-only-change-me-please',
  'dev-secret-change-me',
  'mypassword',
  'change-me-in-production',
  'changeme',
  'secret',
])

type WarnFn = (message: string) => void

/**
 * 환경 변수를 검증하고 경고만 출력한다(throw 금지).
 * @param env 검증할 환경 객체(기본 process.env)
 * @param warn 경고 출력 함수(기본 console.warn)
 */
export function validateEnv(
  env: NodeJS.ProcessEnv = process.env,
  warn: WarnFn = (message) => console.warn(message)
): void {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    warn(`[env] 환경 변수 형식 경고(부팅은 계속됩니다):\n${issues}`)
  }

  const isProduction = env.NODE_ENV === 'production'

  if (isProduction) {
    const jwtSecret = env.JWT_SECRET?.trim()
    if (!jwtSecret) {
      warn('[env] ⚠️ 운영 환경인데 JWT_SECRET이 비어 있습니다. 강력한 시크릿을 설정하세요.')
    } else if (UNSAFE_SECRET_DEFAULTS.has(jwtSecret)) {
      warn(
        '[env] 🚨 운영 환경에서 JWT_SECRET이 알려진 안전하지 않은 기본값으로 설정되어 있습니다! ' +
          '즉시 강력한 랜덤 시크릿으로 교체하세요.'
      )
    }

    if (resolveProdCorsOrigins(env).length === 0) {
      warn(
        '[env] ⚠️ 운영 환경인데 CORS 허용 Origin이 비어 있습니다(CORS_ALLOWED_ORIGINS 설정 권장).'
      )
    }
  }

  const isTest = env.NODE_ENV === 'test' || env.VITEST !== undefined
  if (!isTest && !env.DATABASE_URL?.trim()) {
    warn(
      '[env] 🚨 DATABASE_URL이 비어 있습니다. 로컬 JSON 파일 스토어 대신 DB를 사용하므로 DATABASE_URL 설정은 필수입니다.'
    )
  }
}

function resolveProdCorsOrigins(env: NodeJS.ProcessEnv): string[] {
  const list = env.CORS_ALLOWED_ORIGINS?.trim()
  if (list) {
    return list
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  }
  const single = env.CORS_ALLOWED_ORIGIN?.trim()
  return single ? [single] : []
}
