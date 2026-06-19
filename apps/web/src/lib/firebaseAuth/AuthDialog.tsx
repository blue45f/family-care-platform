import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'

import { useAuth } from './useAuth'

type Mode = 'signin' | 'signup'

const COPY: Record<Mode, { title: string; desc: string; submit: string; toggle: string }> = {
  signin: {
    title: '회원 로그인',
    desc: '이메일과 비밀번호로 로그인하세요. 계정이 없다면 가입하거나 게스트로 시작할 수 있습니다.',
    submit: '로그인',
    toggle: '계정이 없나요? 가입하기',
  },
  signup: {
    title: '회원가입',
    desc: '이메일과 비밀번호로 새 계정을 만드세요. 비밀번호는 6자 이상이어야 합니다.',
    submit: '가입하기',
    toggle: '이미 계정이 있나요? 로그인',
  },
}

/**
 * Firebase 이메일/비밀번호 + 게스트 로그인 다이얼로그 — 접근성 우선.
 * - 로그인 ⇄ 가입 토글, "게스트로 시작하기"(익명 인증)
 * - 로딩/비활성 상태, aria-live 에러(feedback-error · role="alert")
 * - 포커스: Radix Dialog 가 트랩, 열릴 때 이메일 입력에 초기 포커스
 *
 * 이 앱의 디자인 시스템(Radix Dialog + .dialog-* · card · Field/Input · Button · Icon)으로
 * 맞췄다. useAuth API 와 한국어 에러 매핑(context.ts)은 캐노니컬 모듈과 동일하게 유지한다.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn, signUp, signInAsGuest, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)

  // 로그인 성공 시 자동으로 닫힌다(prop 콜백 호출 — setState 아님).
  useEffect(() => {
    if (open && user) onOpenChange(false)
  }, [open, user, onOpenChange])

  /**
   * 닫힘 전이를 가로채 폼/에러를 초기화한다 — 다음 열림이 항상 깨끗한 상태로 시작.
   * (effect 내 동기 setState 를 피하려는 의도. Radix 는 외부 open prop 변경 시
   * onOpenChange 를 호출하지 않으므로, 닫을 때 정리하는 편이 신뢰성 있다.)
   */
  function handleOpenChange(next: boolean) {
    if (!next) {
      setMode('signin')
      setBusy(null)
      setEmail('')
      setPassword('')
      clearError()
    }
    onOpenChange(next)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy('form')
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch {
      // 에러는 컨텍스트 state(error)로 노출 — 여기선 무시.
    } finally {
      setBusy(null)
    }
  }

  async function onGuest() {
    if (busy) return
    setBusy('guest')
    try {
      await signInAsGuest()
    } catch {
      // 위와 동일.
    } finally {
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const formBusy = busy === 'form'
  const guestBusy = busy === 'guest'
  const anyBusy = busy !== null

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-panel card card-pad"
          onOpenAutoFocus={(event) => {
            // 기본 포커스(닫기 버튼) 대신 이메일 입력으로. 앱의 Input 은 ref 를 포워드하지
            // 않으므로(ConfirmDialog 와 동일) 다이얼로그 콘텐츠에서 직접 쿼리해 포커스한다.
            event.preventDefault()
            const content = event.currentTarget as HTMLElement | null
            content?.querySelector<HTMLInputElement>('input[type="email"]')?.focus()
          }}
        >
          <div className="dialog-head">
            <Dialog.Title className="dialog-title">
              <span className="inline-flex items-center gap-2">
                <span className="brand-mark" aria-hidden="true">
                  <Icon name={mode === 'signup' ? 'users' : 'shield'} size={18} />
                </span>
                {copy.title}
              </span>
            </Dialog.Title>
            <Dialog.Description className="dialog-desc">{copy.desc}</Dialog.Description>
          </div>

          <div className="dialog-body">
            {/* 에러는 항상 같은 위치에 두어 aria-live 가 안정적으로 announce 한다. */}
            {error ? (
              <p className="feedback feedback-error" role="alert" aria-live="assertive">
                {error}
              </p>
            ) : null}

            <form className="stack-sm" onSubmit={onSubmit} noValidate>
              <Field label="이메일" required>
                {(fieldProps) => (
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={anyBusy}
                    {...fieldProps}
                  />
                )}
              </Field>

              <Field label="비밀번호" required>
                {(fieldProps) => (
                  <Input
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    disabled={anyBusy}
                    {...fieldProps}
                  />
                )}
              </Field>

              <Button
                type="submit"
                block
                disabled={anyBusy || !email || !password}
                aria-busy={formBusy || undefined}
              >
                {formBusy ? '처리 중…' : copy.submit}
              </Button>
            </form>

            <button
              type="button"
              className="inline-action mt-3 w-full text-center"
              onClick={switchMode}
              disabled={anyBusy}
            >
              {copy.toggle}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-fg-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-border-subtle" />
              <span>또는</span>
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <Button
              type="button"
              variant="secondary"
              block
              onClick={onGuest}
              disabled={anyBusy}
              aria-busy={guestBusy || undefined}
            >
              <Icon name="arrow-right" size={16} />
              {guestBusy ? '게스트 입장 중…' : '게스트로 시작하기'}
            </Button>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="icon-btn absolute right-3 top-3"
              aria-label="닫기"
              disabled={anyBusy}
            >
              <Icon name="close" size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
