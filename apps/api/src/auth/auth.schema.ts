import { z } from 'zod'

import { userRoles, userStatuses } from './auth.model'

import type {
  AdminUserUpdateInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  WithdrawAccountInput,
} from './auth.model'

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

const nameField = z
  .string({ error: NAME_MESSAGE })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: NAME_MESSAGE })

const organizationField = z
  .string({ error: '기관명은 문자열이어야 합니다.' })
  .transform((value) => value.trim())
  .refine((value) => value.length <= 80, { message: '기관명은 80자 이내여야 합니다.' })
  .transform((value) => (value.length > 0 ? value : undefined))

export const registerInputSchema = z.object({
  email: emailField,
  name: nameField,
  password: passwordField,
  // role 은 공개 가입 입력에서 받지 않는다 — 권한 자기 지정(권한 상승) 차단.
  // 내부 시드/관리자 경로만 insertUser 호출 시 role 을 지정할 수 있다.
  // 기업/기관 회원의 소속 기관명(선택). trim 후 비어 있으면 미지정으로 정규화한다.
  organization: organizationField.optional(),
}) satisfies z.ZodType<RegisterInput>

export const loginInputSchema = z.object({
  email: emailField,
  // 로그인은 비밀번호 길이 정책 변경에 영향받지 않도록 비어 있지 않은지만 본다.
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
}) satisfies z.ZodType<LoginInput>

export const withdrawAccountInputSchema = z.object({
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
}) satisfies z.ZodType<WithdrawAccountInput>

export const updateProfileInputSchema = z
  .object({
    name: nameField.optional(),
    organization: organizationField.nullable().optional(),
    currentPassword: z
      .string({ error: '현재 비밀번호를 입력해 주세요.' })
      .min(1, '현재 비밀번호를 입력해 주세요.')
      .optional(),
    newPassword: passwordField.optional(),
  })
  .refine((value) => !value.newPassword || Boolean(value.currentPassword), {
    message: '비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.',
    path: ['currentPassword'],
  }) satisfies z.ZodType<UpdateProfileInput>

export const adminUserUpdateInputSchema = z
  .object({
    role: z.enum(userRoles, { error: '유효하지 않은 역할입니다.' }).optional(),
    status: z.enum(userStatuses, { error: '유효하지 않은 회원 상태입니다.' }).optional(),
  })
  .refine((value) => value.role !== undefined || value.status !== undefined, {
    message: '변경할 역할 또는 상태를 입력해 주세요.',
  }) satisfies z.ZodType<AdminUserUpdateInput>

// 어드민 회원 관리: 이용 정지/해제 입력.
export const suspensionInputSchema = z.object({
  suspended: z.boolean({ error: 'suspended는 true/false여야 합니다.' }),
}) satisfies z.ZodType<{ suspended: boolean }>

export type RegisterInputParsed = z.infer<typeof registerInputSchema>
export type LoginInputParsed = z.infer<typeof loginInputSchema>
export type WithdrawAccountInputParsed = z.infer<typeof withdrawAccountInputSchema>
export type UpdateProfileInputParsed = z.infer<typeof updateProfileInputSchema>
export type AdminUserUpdateInputParsed = z.infer<typeof adminUserUpdateInputSchema>
export type SuspensionInputParsed = z.infer<typeof suspensionInputSchema>
