import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// 의존성 없는 JWT(HS256) 구현.
// @nestjs/jwt는 백엔드 의존성에 없고(네이티브/추가 deps 금지), 토큰 서명은 표준
// node:crypto HMAC-SHA256만으로 충분하다. 형식은 표준 JWT(header.payload.signature,
// base64url)를 따르므로 클라이언트/디버깅 도구에서 일반 JWT로 다룰 수 있다.

const TOKEN_TYPE = 'JWT'
const TOKEN_ALG = 'HS256'

// 토큰 유효기간(초). 기본 7일. AUTH_TOKEN_TTL_SECONDS로 덮어쓸 수 있다.
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7

export interface AuthTokenPayload {
  // subject = user id(문자열). 표준 JWT 클레임명을 따른다.
  sub: string
  email: string
  role: string
  // 발급/만료 시각(Unix epoch seconds). sign 시 자동으로 채운다.
  iat: number
  exp: number
}

export type AuthTokenClaims = Pick<AuthTokenPayload, 'sub' | 'email' | 'role'>

/**
 * JWT 서명 시크릿을 환경 변수에서 읽는다.
 * - 운영(NODE_ENV=production)에서는 JWT_SECRET 미설정 시 부팅을 막아(throw) 약한 토큰을 방지한다.
 * - 개발/테스트에서는 프로세스 1회용 임의 시크릿으로 폴백한다(재시작 시 토큰 무효화는 의도된 동작).
 */
let developmentFallbackSecret: string | undefined

export function resolveJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.JWT_SECRET?.trim()
  if (configured) {
    return configured
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET 환경 변수가 필요합니다(운영 환경에서는 필수).')
  }

  // 개발/테스트: 프로세스 수명 동안 일관된 임의 시크릿을 1회 생성해 재사용한다.
  developmentFallbackSecret ??= randomBytes(32).toString('hex')
  return developmentFallbackSecret
}

function resolveTtlSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.AUTH_TOKEN_TTL_SECONDS)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TTL_SECONDS
  }
  return Math.floor(parsed)
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function base64UrlDecodeToString(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function sign(content: string, secret: string): string {
  return createHmac('sha256', secret).update(content).digest('base64url')
}

/** 클레임으로 서명된 JWT 문자열을 만든다. iat/exp는 현재 시각 기준으로 채운다. */
export function signAuthToken(
  claims: AuthTokenClaims,
  secret: string = resolveJwtSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000)
): string {
  const header = { alg: TOKEN_ALG, typ: TOKEN_TYPE }
  const payload: AuthTokenPayload = {
    ...claims,
    iat: nowSeconds,
    exp: nowSeconds + resolveTtlSeconds(),
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = sign(signingInput, secret)
  return `${signingInput}.${signature}`
}

// 서명/만료가 모두 유효할 때만 payload를 반환하고, 그 외에는 null을 반환한다.
export function verifyAuthToken(
  token: string,
  secret: string = resolveJwtSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000)
): AuthTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [encodedHeader, encodedPayload, providedSignature] = parts
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = sign(signingInput, secret)

  // 길이가 다르면 timingSafeEqual이 throw하므로 먼저 비교한다(타이밍 누출 없음).
  const provided = Buffer.from(providedSignature, 'utf8')
  const expected = Buffer.from(expectedSignature, 'utf8')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null
  }

  let payload: AuthTokenPayload
  try {
    payload = JSON.parse(base64UrlDecodeToString(encodedPayload)) as AuthTokenPayload
  } catch {
    return null
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.sub !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return null
  }

  if (payload.exp <= nowSeconds) {
    return null
  }

  return payload
}
