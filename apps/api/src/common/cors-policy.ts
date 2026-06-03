// CORS 허용 판단을 main.ts에서 분리해 테스트 가능하게 만든 순수 함수 모음.
// 기존 동작(개발 환경에서 localhost/127.0.0.1 자동 허용, 프로덕션은 명시 목록만)을 그대로 유지한다.

const LOCAL_ORIGIN_PATTERNS = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];

// 환경 변수에서 명시적으로 허용된 Origin 목록을 파싱한다.
// CORS_ALLOWED_ORIGINS(콤마 구분)를 우선 사용하고, 없으면 단일 CORS_ALLOWED_ORIGIN을 본다.
export function resolveAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const envValue = env.CORS_ALLOWED_ORIGINS?.trim();
  if (!envValue) {
    const appUrl = env.CORS_ALLOWED_ORIGIN?.trim();
    return appUrl ? [appUrl] : [];
  }

  return envValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLocalOrigin(origin: string): boolean {
  return LOCAL_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

// Origin이 허용되는지 판단한다.
// - Origin 헤더가 없는 요청(서버-서버, 동일 출처 등)은 허용
// - 명시 목록에 포함되면 허용
// - 개발 환경에서는 로컬 Origin도 허용
export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return nodeEnv !== 'production' && isLocalOrigin(origin);
}
