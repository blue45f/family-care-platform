import { useState } from 'react'

import { AuthDialog, useAuth } from '../../lib/firebaseAuth'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

/**
 * 헤더 회원 로그인 진입점 — Firebase Auth 기반(통합 로그인 모듈).
 *
 * 이 컨트롤은 기존 담당자(운영 콘솔) 로그인(/login → 대시보드, zustand authStore)과
 * **별개**다. 그 로그인은 그대로 유지하고, 여기서는 통합 Firebase 회원 로그인(이메일/비번
 * + 게스트)을 **추가 옵션**으로 제공한다. 로그아웃 상태면 "로그인" 버튼으로 AuthDialog 를
 * 열고, 로그인 상태면 이메일(또는 "게스트")과 로그아웃을 보여준다.
 */
export function MemberAuthControl({ className }: { className?: string }) {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    // 초기 onAuthStateChanged 해석 전 — 레이아웃 점프 방지용 플레이스홀더.
    return (
      <div
        className={cn('h-9 w-24 animate-pulse rounded-lg bg-bg-sunken', className)}
        aria-hidden="true"
      />
    )
  }

  if (!user) {
    return (
      <div className={cn('inline-flex items-center', className)}>
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Icon name="users" size={16} />
          <span className="hidden sm:inline">회원 로그인</span>
        </Button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const label = user.isAnonymous ? '게스트' : (user.email ?? '회원')

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="hidden max-w-[12rem] items-center gap-1.5 truncate rounded-lg bg-bg-sunken px-2.5 py-1.5 text-sm text-fg-muted sm:inline-flex"
        title={label}
      >
        <Icon name="users" size={15} className="shrink-0 text-fg-subtle" />
        <span className="truncate">{label}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signOut()}
        aria-label={`${label} 로그아웃`}
        title="로그아웃"
      >
        <Icon name="logout" size={16} />
        <span className="hidden sm:inline">로그아웃</span>
      </Button>
    </div>
  )
}
