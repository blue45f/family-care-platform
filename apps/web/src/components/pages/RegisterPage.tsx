import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../../auth/useAuth'
import { Button, Card, Field, Icon, Input } from '../ui'

import type { AppRoute, PublicNavigateState } from '../../routeConfig'

type RegisterPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
  /** 가입 성공 후 이동할 경로(기본: 대시보드). */
  redirectTo?: AppRoute
}

const registerSchema = z
  .object({
    name: z
      .string({ error: '이름을 입력해 주세요.' })
      .trim()
      .min(1, '이름을 입력해 주세요.')
      .max(40, '이름은 40자 이하로 입력해 주세요.'),
    email: z
      .string({ error: '이메일을 입력해 주세요.' })
      .trim()
      .min(1, '이메일을 입력해 주세요.')
      .pipe(z.email('올바른 이메일 형식이 아닙니다.')),
    password: z
      .string({ error: '비밀번호를 입력해 주세요.' })
      .min(8, '비밀번호는 8자 이상이어야 합니다.'),
    confirmPassword: z.string({ error: '비밀번호를 한 번 더 입력해 주세요.' }),
    // 기업/기관 회원만 입력하는 선택 필드(빈 값 허용).
    organization: z.string().trim().max(80, '기관명은 80자 이하로 입력해 주세요.').optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const normalizeMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'API 서버와 연결하지 못했습니다. 서버 실행 상태를 확인한 뒤 다시 시도해 주세요.'
    }
    return error.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export const RegisterPage = ({ onNavigate, redirectTo = '/' }: RegisterPageProps) => {
  const { register: registerAccount } = useAuth()
  const [formError, setFormError] = useState('')
  const location = useLocation()
  const locationState = (location.state as PublicNavigateState | null) ?? {}

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', organization: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await registerAccount(values.email, values.password, values.name, values.organization)
      onNavigate(redirectTo)
    } catch (error) {
      setFormError(normalizeMessage(error))
    }
  })

  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-bg-app px-4 py-5"
      aria-labelledby="register-title"
    >
      <div className="w-full max-w-[26rem]">
        <div className="mb-5 flex items-center justify-center gap-3">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={20} />
          </span>
          <div>
            <p className="brand-name">가족 돌봄 운영 플랫폼</p>
            <p className="brand-sub">새 계정 만들기</p>
          </div>
        </div>

        <Card>
          <div className="mb-5 flex flex-col gap-3">
            <h1 id="register-title" className="text-xl">
              회원가입
            </h1>
            <p className="text-sm text-fg-muted">
              {locationState.fromLanding
                ? '데모 문의 흐름으로 왔더라도, 담당자 전용 계정은 바로 만들 수 있습니다.'
                : locationState.source === 'pricing_button'
                  ? `${locationState.plan ?? ''} 플랜으로 시작할 예정이라면, 새 계정 생성 후 바로 비교 가능한 화면으로 이동하세요.`.trim()
                  : '담당자 정보를 입력해 새 계정을 만드세요.'}
            </p>
          </div>

          {formError ? (
            <p className="feedback feedback-error" role="alert" aria-live="assertive">
              {formError}
            </p>
          ) : null}

          <form className="stack-sm" onSubmit={onSubmit} noValidate>
            <Field label="이름" required error={errors.name?.message}>
              {(fieldProps) => (
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="홍길동"
                  disabled={isSubmitting}
                  {...fieldProps}
                  {...registerField('name')}
                />
              )}
            </Field>

            <Field label="이메일" required error={errors.email?.message}>
              {(fieldProps) => (
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@familycare.app"
                  disabled={isSubmitting}
                  {...fieldProps}
                  {...registerField('email')}
                />
              )}
            </Field>

            <Field
              label="비밀번호"
              required
              hint="8자 이상 입력해 주세요."
              error={errors.password?.message}
            >
              {(fieldProps) => (
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호"
                  disabled={isSubmitting}
                  {...fieldProps}
                  {...registerField('password')}
                />
              )}
            </Field>

            <Field label="비밀번호 확인" required error={errors.confirmPassword?.message}>
              {(fieldProps) => (
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력"
                  disabled={isSubmitting}
                  {...fieldProps}
                  {...registerField('confirmPassword')}
                />
              )}
            </Field>

            <Field
              label="소속 기관 (선택)"
              hint="기업/기관 회원이라면 센터·기관명을 남겨 주세요. 회원 관리 화면에 표시됩니다."
              error={errors.organization?.message}
            >
              {(fieldProps) => (
                <Input
                  type="text"
                  autoComplete="organization"
                  placeholder="예: 행복요양센터"
                  disabled={isSubmitting}
                  {...fieldProps}
                  {...registerField('organization')}
                />
              )}
            </Field>

            <Button type="submit" block disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? '계정 생성 중…' : '회원가입'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-fg-muted">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              className="inline-action"
              onClick={() =>
                onNavigate('/login', {
                  source: locationState.source,
                  fromLanding: locationState.fromLanding,
                  plan: locationState.plan,
                })
              }
            >
              로그인
            </button>
          </div>
        </Card>
      </div>
    </main>
  )
}
