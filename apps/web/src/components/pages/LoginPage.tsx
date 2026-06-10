import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation } from 'react-router-dom'

import type { AppRoute, PublicNavigateState } from '../../routeConfig'
import { DEMO_CREDENTIALS, useAuth } from '../../auth/useAuth'
import { Button, Card, Field, Icon, Input } from '../ui'

type LoginPageProps = {
  onNavigate: (path: AppRoute, state?: PublicNavigateState) => void
  /** 로그인 성공 후 이동할 경로(기본: 대시보드). */
  redirectTo?: AppRoute
}

const loginSchema = z.object({
  email: z
    .string({ error: '이메일을 입력해 주세요.' })
    .trim()
    .min(1, '이메일을 입력해 주세요.')
    .pipe(z.email('올바른 이메일 형식이 아닙니다.')),
  password: z.string({ error: '비밀번호를 입력해 주세요.' }).min(1, '비밀번호를 입력해 주세요.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const normalizeMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'API 서버와 연결하지 못했습니다. 서버 실행 상태를 확인한 뒤 다시 시도해 주세요.'
    }
    return error.message || '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export const LoginPage = ({ onNavigate, redirectTo = '/' }: LoginPageProps) => {
  const { login } = useAuth()
  const [formError, setFormError] = useState('')
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const demoCredsId = useId()
  const location = useLocation()
  const locationState = (location.state as PublicNavigateState | null) ?? {}

  const {
    register: registerField,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await login(values.email, values.password)
      onNavigate(redirectTo)
    } catch (error) {
      setFormError(normalizeMessage(error))
    }
  })

  const handleDemoLogin = async () => {
    if (isDemoLoading || isSubmitting) {
      return
    }
    setFormError('')
    setIsDemoLoading(true)
    // 입력란에도 채워 사용자가 어떤 계정으로 들어가는지 확인할 수 있게 한다.
    setValue('email', DEMO_CREDENTIALS.email)
    setValue('password', DEMO_CREDENTIALS.password)
    try {
      await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)
      onNavigate(redirectTo)
    } catch (error) {
      setFormError(normalizeMessage(error))
    } finally {
      setIsDemoLoading(false)
    }
  }

  const busy = isSubmitting || isDemoLoading

  return (
    <main className="auth-page" aria-labelledby="login-title">
      <div className="auth-card-wrap">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="heart" size={20} />
          </span>
          <div>
            <p className="brand-name">가족 돌봄 운영 플랫폼</p>
            <p className="brand-sub">담당자 로그인</p>
          </div>
        </div>

        <Card>
          <div className="stack-sm auth-card-head">
            <h1 id="login-title" className="card-title">
              로그인
            </h1>
            <p className="card-subtitle">
              {locationState.fromLanding
                ? '데모 문의 후 이어진 사용자님이라면, 담당자 계정으로 바로 로그인해 작업 화면을 확인하세요.'
                : locationState.source === 'pricing_button'
                  ? `${locationState.plan ?? ''} 플랜 관심 대상자로서, 담당자 계정 로그인 후 대시보드를 확인하세요.`.trim()
                  : '담당자 계정으로 로그인해 돌봄 기록과 정산을 관리하세요.'}
            </p>
          </div>

          {/* 데모 안내: 자격 증명을 눈에 보이게 노출 + 원클릭 둘러보기 */}
          <section aria-labelledby={`${demoCredsId}-label`} className="auth-demo">
            <p id={`${demoCredsId}-label`} className="auth-demo-label">
              처음이신가요? 데모 계정으로 바로 둘러보세요
            </p>
            <dl>
              <dt>이메일</dt>
              <dd>{DEMO_CREDENTIALS.email}</dd>
              <dt>비밀번호</dt>
              <dd>{DEMO_CREDENTIALS.password}</dd>
            </dl>
            <Button block onClick={handleDemoLogin} disabled={busy} aria-busy={isDemoLoading}>
              <Icon name="arrow-right" size={16} />
              {isDemoLoading ? '데모 계정으로 입장 중…' : '데모 계정으로 둘러보기'}
            </Button>
          </section>

          {formError ? (
            <p className="feedback feedback-error" role="alert" aria-live="assertive">
              {formError}
            </p>
          ) : null}

          <form className="stack-sm" onSubmit={onSubmit} noValidate>
            <Field label="이메일" required error={errors.email?.message}>
              {(fieldProps) => (
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@familycare.app"
                  disabled={busy}
                  {...fieldProps}
                  {...registerField('email')}
                />
              )}
            </Field>

            <Field label="비밀번호" required error={errors.password?.message}>
              {(fieldProps) => (
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  disabled={busy}
                  {...fieldProps}
                  {...registerField('password')}
                />
              )}
            </Field>

            <Button type="submit" block disabled={busy} aria-busy={isSubmitting}>
              {isSubmitting ? '로그인 중…' : '로그인'}
            </Button>
          </form>

          <p className="auth-switch">
            아직 계정이 없으신가요?{' '}
            <button
              type="button"
              className="inline-action"
              onClick={() =>
                onNavigate('/register', {
                  source: locationState.source,
                  fromLanding: locationState.fromLanding,
                  plan: locationState.plan,
                })
              }
            >
              회원가입
            </button>
          </p>
        </Card>
      </div>
    </main>
  )
}
