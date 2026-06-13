import { useId, type ReactNode } from 'react'

import * as Dialog from '@radix-ui/react-dialog'

import { Button } from './Button'

type ConfirmTone = 'default' | 'danger'

type ConfirmDialogProps = {
  /** 다이얼로그 노출 여부(제어 컴포넌트). */
  open: boolean
  /** 닫기 요청(Esc·바깥 클릭·취소 버튼). false가 전달된다. */
  onOpenChange: (open: boolean) => void
  /** 제목 — aria-labelledby로 연결된다. */
  title: ReactNode
  /** 본문 설명 — aria-describedby로 연결된다. */
  description: ReactNode
  /** 확인 버튼 라벨. */
  confirmLabel: ReactNode
  /** 취소 버튼 라벨. 기본 "취소". */
  cancelLabel?: ReactNode
  /** 확인 클릭 핸들러. 닫기는 호출부에서 onOpenChange(false)로 처리한다. */
  onConfirm: () => void
  /**
   * 'danger'면 파괴적 동작으로 간주해 경고 톤을 입히고, 안전한 취소 버튼에
   * 초기 포커스를 둔다. 'default'는 확인 버튼에 포커스를 둔다.
   */
  tone?: ConfirmTone
  /** 처리 중이면 두 버튼을 비활성화한다. */
  busy?: boolean
  /** 본문과 푸터 사이에 끼울 추가 콘텐츠(예: 비밀번호 입력). */
  children?: ReactNode
}

/**
 * 기존 디자인 시스템(card/btn/feedback) 위에 Radix Dialog로 만든 접근성 확인
 * 모달. 포커스 트랩·Esc/바깥 클릭 닫기·포커스 복원·aria-modal·labelledby/
 * describedby를 Radix가 보장한다. open=false면 SSR에서 아무것도 렌더하지 않아
 * 기존 정적 마크업 테스트와 충돌하지 않는다.
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  onConfirm,
  tone = 'default',
  busy = false,
  children,
}: ConfirmDialogProps) => {
  const isDanger = tone === 'danger'
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-panel card card-pad"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          // 파괴적 동작은 안전한 취소에 초기 포커스를 둬 오발동을 막는다.
          onOpenAutoFocus={
            isDanger
              ? (event) => {
                  event.preventDefault()
                  const target = event.currentTarget as HTMLElement | null
                  target?.querySelector<HTMLButtonElement>('[data-confirm-cancel]')?.focus()
                }
              : undefined
          }
        >
          <div className="dialog-head">
            <Dialog.Title id={titleId} className="dialog-title">
              {title}
            </Dialog.Title>
            <Dialog.Description id={descriptionId} className="dialog-desc">
              {description}
            </Dialog.Description>
          </div>

          {children ? <div className="dialog-body">{children}</div> : null}

          <div className="dialog-actions">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                data-confirm-cancel
              >
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              className={isDanger ? 'btn-confirm-danger' : ''}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
