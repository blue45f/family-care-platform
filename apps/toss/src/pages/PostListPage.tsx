import { Top } from '@toss/tds-mobile'
import { useMemo, useState } from 'react'

import { getPosts, type Post } from '../lib/api'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { SearchBar, Chips, Badge } from '../ui'

const ALL = '전체'
const EMOJI: Record<string, string> = { 정보공유: '📋', 질문: '💬', 간병후기: '💚' }

export function PostListPage() {
  const items = getPosts()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(ALL)

  const cats = useMemo(() => [ALL, ...[...new Set(items.map((p) => p.category))]], [items])
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((p) => {
      const okC = cat === ALL || p.category === cat
      const okQ = !query || [p.title, p.body, p.category].join(' ').toLowerCase().includes(query)
      return okC && okQ
    })
  }, [items, q, cat])

  const open = (p: Post) => navigate(`/post/${encodeURIComponent(p.id)}`)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>💚 패밀리케어</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            보호자·간병인을 위한 돌봄 정보 커뮤니티
          </Top.SubtitleParagraph>
        }
      />
      <div style={pageShell}>
        <div className="rise" style={{ marginBottom: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="돌봄 정보 검색" />
        </div>
        <div className="rise" style={{ animationDelay: '60ms', marginBottom: 18 }}>
          <Chips items={cats} active={cat} onPick={setCat} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open(p)}
              className="pressable rise"
              style={{
                animationDelay: `${90 + i * 28}ms`,
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                padding: 16,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Badge accent>
                  {EMOJI[p.category] || ''} {p.category}
                </Badge>
                {p.authorName && (
                  <span style={{ fontSize: 12, color: theme.textMuted, marginLeft: 'auto' }}>
                    {p.authorName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{p.title}</div>
              <div
                style={{
                  fontSize: 13.5,
                  color: theme.textMuted,
                  marginTop: 6,
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {p.body}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
              ‘{q || cat}’ 결과가 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
