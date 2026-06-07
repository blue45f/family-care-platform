import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// node:crypto scryptSync 기반 비밀번호 해싱.
// bcrypt/argon2 같은 네이티브 모듈을 쓰지 않는다(백엔드는 copy-only Docker 이미지라
// 네이티브 빌드 산출물이 깨질 수 있음). 저장 형식은 "salt:hash"(둘 다 hex)다.

const SALT_BYTES = 16
const KEY_LENGTH = 64

/** 평문 비밀번호를 "salt:hash"(hex:hex) 형식으로 해싱한다. */
export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex')
  const derived = scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${derived}`
}

/**
 * 평문 비밀번호가 저장된 "salt:hash"와 일치하는지 상수 시간 비교한다.
 * 형식이 깨졌거나 길이가 다르면 false를 반환한다(throw하지 않음).
 */
export function verifyPassword(plainPassword: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex) {
    return false
  }

  const expected = Buffer.from(expectedHex, 'hex')
  if (expected.length !== KEY_LENGTH) {
    return false
  }

  const derived = scryptSync(plainPassword, salt, KEY_LENGTH)
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
