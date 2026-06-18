import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'

import { getPost } from '../lib/api'
import { shareMessage } from '../lib/toss'
import { navigate } from '../router'
import { theme } from '../theme'
import { Badge } from '../ui'

export function PostDetailPage({ id = '' }: { id?: string }) {
  const p = getPost(id)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const x = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(x)
  }, [toast])

  const Header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 8px',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: `color-mix(in oklab, ${theme.bg} 84%, transparent)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate('/')}
        className="pressable"
        style={{
          width: 44,
          height: 44,
          background: 'none',
          border: 'none',
          color: theme.text,
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        ←
      </button>
    </header>
  )
  if (!p)
    return (
      <div style={{ background: theme.bg, minHeight: '100dvh' }}>
        {Header}
        <p style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 40 }}>
          글을 찾을 수 없어요.
        </p>
      </div>
    )

  const share = async () => {
    const r = await shareMessage(`[패밀리케어] ${p.title}`)
    if (r === 'clipboard') setToast('클립보드에 복사했어요.')
  }

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {Header}
      <div className="rise" style={{ padding: '4px 20px 110px' }}>
        <Badge accent>{p.category}</Badge>
        <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.34, margin: '12px 0 0' }}>
          {p.title}
        </h1>
        {p.authorName && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>{p.authorName}</p>
        )}
        <p
          style={{
            fontSize: 15.5,
            lineHeight: 1.85,
            color: theme.text,
            margin: '18px 0 0',
            maxWidth: '72ch',
            whiteSpace: 'pre-line',
          }}
        >
          {p.body}
        </p>

        {p.comments?.length ? (
          <div style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              댓글 {p.comments.length}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.comments.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: theme.radius,
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>
                    {c.author}
                  </div>
                  <p
                    style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.65, color: theme.text }}
                  >
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={share}
            className="pressable"
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            공유하기
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${theme.bg} 72%, transparent)`,
          zIndex: 20,
        }}
      >
        <Button
          style={{ width: '100%' }}
          onClick={() => setToast('글쓰기·댓글은 토스 로그인 연동 시 제공돼요.')}
        >
          이 주제로 질문하기
        </Button>
      </div>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.86)',
            color: theme.text,
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13.5,
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
