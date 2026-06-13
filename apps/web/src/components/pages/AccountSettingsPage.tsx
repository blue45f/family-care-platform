import { useState, type FormEvent } from 'react'

import { useAuth } from '../../auth/useAuth'
import type { UpdateProfileInput } from '../../auth/authContext'
import type { ProtectedNavigateState } from '../../appRoutes'
import { normalizeApiErrorMessage } from '../../features/community/view'
import { routeDefs, type AppRoute } from '../../routeConfig'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Field,
  Icon,
  Input,
  PageHeader,
} from '../ui'

type AccountSettingsPageProps = {
  onNavigate: (path: AppRoute, state?: ProtectedNavigateState) => void
}

type ProfileFormState = {
  name: string
  organization: string
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

const initialForm: ProfileFormState = {
  name: '',
  organization: '',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
}

export const AccountSettingsPage = ({ onNavigate }: AccountSettingsPageProps) => {
  const routeDef = routeDefs['/account']
  const auth = useAuth()
  const [form, setForm] = useState<ProfileFormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawArmed, setWithdrawArmed] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [syncedUserId, setSyncedUserId] = useState<string | number | null>(null)

  // Sync the form from the authenticated user during render (guarded to avoid
  // cascading renders) instead of in an effect. Resets only when the user id
  // changes; password fields are cleared by the submit handler itself.
  if (auth.user && auth.user.id !== syncedUserId) {
    setSyncedUserId(auth.user.id)
    setForm((prev) => ({
      ...prev,
      name: auth.user?.name ?? '',
      organization: auth.user?.organization ?? '',
      currentPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    }))
  }

  const updateForm = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auth.user || saving) {
      return
    }

    const name = form.name.trim()
    const organization = form.organization.trim()
    const newPassword = form.newPassword
    const currentPassword = form.currentPassword
    const input: UpdateProfileInput = {}

    if (!name) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (organization.length > 80) {
      setError('기관명은 80자 이내여야 합니다.')
      return
    }
    if (newPassword && newPassword !== form.newPasswordConfirm) {
      setError('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (name !== auth.user.name) {
      input.name = name
    }
    if (organization !== (auth.user.organization ?? '')) {
      input.organization = organization || null
    }
    if (newPassword) {
      input.currentPassword = currentPassword
      input.newPassword = newPassword
    }

    if (Object.keys(input).length === 0) {
      setNotice('변경할 내용이 없습니다.')
      setError('')
      return
    }

    setSaving(true)
    setError('')
    try {
      await auth.updateProfile(input)
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
      }))
      setNotice('프로필을 저장했습니다.')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '프로필 저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  // 탈퇴 확인 모달을 연다(실제 탈퇴는 모달 안에서 비밀번호 확인 후 실행).
  const openWithdrawal = () => {
    setWithdrawArmed(true)
    setError('')
  }

  const confirmWithdrawal = async () => {
    if (withdrawing) {
      return
    }
    if (!withdrawPassword) {
      setError('탈퇴하려면 현재 비밀번호를 입력해 주세요.')
      return
    }

    setWithdrawing(true)
    setError('')
    try {
      await auth.withdrawAccount(withdrawPassword)
      onNavigate('/login')
    } catch (cause) {
      setError(normalizeApiErrorMessage(cause, '계정 탈퇴에 실패했습니다.'))
      setWithdrawing(false)
    }
  }

  if (!auth.user) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow={routeDef.eyebrow}
          title={routeDef.title}
          description={routeDef.description}
        />
        <Card>
          <EmptyState
            icon="shield"
            title="로그인이 필요합니다"
            description="계정 설정은 로그인한 담당자만 변경할 수 있습니다."
            action={
              <Button variant="secondary" size="sm" onClick={() => onNavigate('/login')}>
                로그인으로 이동
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow={routeDef.eyebrow}
        title={routeDef.title}
        description={routeDef.description}
      />

      {notice ? (
        <p className="feedback feedback-loading" role="status" aria-live="polite">
          {notice}
          <button type="button" className="inline-action" onClick={() => setNotice('')}>
            닫기
          </button>
        </p>
      ) : null}
      {error ? (
        <p className="feedback feedback-error" role="alert" aria-live="assertive">
          {error}
          <button type="button" className="inline-action" onClick={() => setError('')}>
            닫기
          </button>
        </p>
      ) : null}

      <section className="grid-2" aria-label="계정 설정">
        <Card>
          <CardHeader
            title="프로필"
            subtitle="이름과 소속 기관은 커뮤니티 작성자 표시와 운영 화면에서 함께 사용됩니다."
          />
          <form className="stack-sm" onSubmit={submitProfile} noValidate aria-busy={saving}>
            <Field label="이름" required>
              {(field) => (
                <Input
                  {...field}
                  value={form.name}
                  maxLength={60}
                  disabled={saving}
                  onChange={(event) => updateForm('name', event.target.value)}
                />
              )}
            </Field>
            <Field label="소속 기관" hint="개인 회원이면 비워 둘 수 있습니다.">
              {(field) => (
                <Input
                  {...field}
                  value={form.organization}
                  maxLength={80}
                  disabled={saving}
                  placeholder="예: 행복요양센터"
                  onChange={(event) => updateForm('organization', event.target.value)}
                />
              )}
            </Field>

            <div className="stack-sm" aria-label="현재 계정 정보">
              <p className="cell-muted">{auth.user.email}</p>
              <p>
                {auth.user.role === 'admin' ? (
                  <Badge tone="accent" plain>
                    관리자
                  </Badge>
                ) : (
                  <Badge tone="neutral" plain>
                    운영자
                  </Badge>
                )}
              </p>
            </div>

            <CardHeader
              title="비밀번호 변경"
              subtitle="비밀번호를 바꾸는 경우에만 현재 비밀번호와 새 비밀번호를 입력하세요."
            />
            <Field label="현재 비밀번호">
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  disabled={saving}
                  onChange={(event) => updateForm('currentPassword', event.target.value)}
                />
              )}
            </Field>
            <Field label="새 비밀번호" hint="8자 이상">
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  disabled={saving}
                  onChange={(event) => updateForm('newPassword', event.target.value)}
                />
              )}
            </Field>
            <Field label="새 비밀번호 확인">
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  value={form.newPasswordConfirm}
                  disabled={saving}
                  onChange={(event) => updateForm('newPasswordConfirm', event.target.value)}
                />
              )}
            </Field>
            <Button type="submit" disabled={saving}>
              <Icon name="check" size={16} />
              {saving ? '저장 중…' : '프로필 저장'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="계정 탈퇴"
            subtitle="탈퇴하면 개인정보가 익명화되고 현재 세션과 기존 토큰이 더 이상 유효하지 않습니다."
          />
          <div className="stack-sm">
            <p className="empty-desc">
              마지막 관리자 계정은 탈퇴할 수 없습니다. 관리자 권한이 필요하면 먼저 다른 관리자에게
              권한을 넘기세요.
            </p>
            <Button type="button" variant="ghost" disabled={withdrawing} onClick={openWithdrawal}>
              <Icon name="trash" size={16} />
              계정 탈퇴
            </Button>
          </div>

          <ConfirmDialog
            open={withdrawArmed}
            onOpenChange={(next) => {
              if (!next) {
                setWithdrawArmed(false)
                setWithdrawPassword('')
              }
            }}
            tone="danger"
            busy={withdrawing}
            title="계정 탈퇴"
            description="정말 탈퇴할까요? 탈퇴 후 같은 이메일로 재가입할 수 있습니다."
            confirmLabel={withdrawing ? '탈퇴 처리 중…' : '탈퇴 확정'}
            onConfirm={() => void confirmWithdrawal()}
          >
            <Field label="현재 비밀번호" required>
              {(field) => (
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  value={withdrawPassword}
                  disabled={withdrawing}
                  onChange={(event) => setWithdrawPassword(event.target.value)}
                />
              )}
            </Field>
          </ConfirmDialog>
        </Card>
      </section>
    </div>
  )
}
