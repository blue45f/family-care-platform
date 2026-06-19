import { useCallback, useEffect, useRef, useState } from 'react'

import { shareOrCopy, type ShareResult } from '../../lib/share'

import { Button } from './Button'
import { Icon } from './Icon'

import type { ReactNode } from 'react'

type ShareSummaryButtonProps = {
  /** 공유 시트 제목. */
  title: string
  /** 공유 본문(클립보드 폴백 텍스트의 핵심). */
  text: string
  /** 공유 URL. 생략 시 현재 페이지 주소. */
  url?: string
  /** 기본 버튼 라벨. */
  children?: ReactNode
  /** 버튼 변형(기본 secondary). */
  variant?: 'primary' | 'secondary' | 'ghost'
}

const RESULT_MESSAGE: Record<ShareResult, string> = {
  shared: '공유했습니다.',
  copied: '요약을 클립보드에 복사했습니다.',
  dismissed: '',
  unsupported: '이 브라우저에서는 공유를 지원하지 않습니다.',
}

/**
 * 운영 요약(정산/청구)을 네이티브 공유 시트 또는 클립보드로 내보내는 버튼.
 * 디자인 시스템 Button 을 쓰고, 결과는 aria-live 로 잠시 안내한다(toast 폴리시 일관).
 * 공유 로직 자체는 벤더링된 순수 유틸 shareOrCopy 에 위임한다.
 */
export const ShareSummaryButton = ({
  title,
  text,
  url,
  children = '요약 공유',
  variant = 'secondary',
}: ShareSummaryButtonProps) => {
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    },
    []
  )

  const handleClick = useCallback(async () => {
    if (busy) {
      return
    }
    setBusy(true)
    const result = await shareOrCopy({ title, text, url })
    setBusy(false)
    const message = RESULT_MESSAGE[result]
    if (message) {
      setFeedback(message)
      if (timer.current) {
        clearTimeout(timer.current)
      }
      timer.current = setTimeout(() => setFeedback(''), 2400)
    }
  }, [busy, title, text, url])

  return (
    <span className="share-summary">
      <Button
        variant={variant}
        size="sm"
        onClick={() => void handleClick()}
        disabled={busy}
        aria-label={typeof children === 'string' ? children : '요약 공유'}
      >
        <Icon name="send" size={14} />
        {children}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {feedback}
      </span>
    </span>
  )
}
