import { z } from 'zod'

import type { LoginInput, RegisterInput } from './auth.model'
import { userRoles } from './auth.model'

// 회원가입/로그인 입력 검증. 다른 컬렉션과 동일하게 zod로 trim/필수/형식을 처리하고,
// 실패 시 parseWithSchema가 BadRequestException(첫 메시지)로 변환한다.

const EMAIL_MESSAGE = '올바른 이메일 주소를 입력해 주세요.'
const NAME_MESSAGE = '이름을 입력해 주세요.'
const PASSWORD_MESSAGE = '비밀번호는 8자 이상이어야 합니다.'

// 이메일은 소문자/trim으로 정규화한다(중복 판정과 로그인 조회를 대소문자 무관하게).
const emailField = z
  .string({ error: EMAIL_MESSAGE })
  .trim()
  .toLowerCase()
  .pipe(z.email(EMAIL_MESSAGE))

const passwordField = z.string({ error: PASSWORD_MESSAGE }).min(8, PASSWORD_MESSAGE)

export const registerInputSchema = z.object({
  email: emailField,
  name: z
    .string({ error: NAME_MESSAGE })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: NAME_MESSAGE }),
  password: passwordField,
  role: z.enum(userRoles).optional(),
}) satisfies z.ZodType<RegisterInput>

export const loginInputSchema = z.object({
  email: emailField,
  // 로그인은 비밀번호 길이 정책 변경에 영향받지 않도록 비어 있지 않은지만 본다.
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
}) satisfies z.ZodType<LoginInput>

export type RegisterInputParsed = z.infer<typeof registerInputSchema>
export type LoginInputParsed = z.infer<typeof loginInputSchema>
