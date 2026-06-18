/**
 * ChatDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * 형제 앱(family-care 등)이 추가 의존성 없이 그대로 복붙해서 쓰는 REST 전용 버전입니다.
 * 원본 @chatdesk/widget 의 <ChatWidget> 은 socket.io-client 로 실시간(typing·presence·
 * live push) 까지 다루지만, 이 벤더 파일은 호스트 앱에 socket.io-client 를 추가하지 않기 위해
 * **REST 폴백 경로만** 사용합니다. 대화 목록·히스토리·발송·읽음 처리는 동일하게 동작하고,
 * 새 메시지는 가벼운 폴링으로 가져옵니다(실시간 타이핑/접속 표시는 생략).
 *
 * 사용:
 *   import { ChatWidget } from './ChatWidget'
 *   <ChatWidget publishableKey="pk_demo" endpoint="https://chat.example.com" memberId="alice" />
 *
 * 백엔드 계약(헤더 X-Chat-Key: pk_…):
 *   GET  {endpoint}/api/conversations?memberId=…                 → 내 대화 목록 + unread
 *   GET  {endpoint}/api/conversations/{id}/messages?memberId=…   → 히스토리(오래된→최신)
 *   POST {endpoint}/api/conversations/{id}/messages             → 발송(senderMemberId, body)
 *   POST {endpoint}/api/conversations/{id}/read                 → 읽음(memberId, lastReadMessageId?)
 *
 * 접근성/디자인: focus-visible · prefers-reduced-motion · 포커스 트랩 · Esc · 키보드 ·
 * 새 메시지 aria-live · 대비 ≥4.5:1 · 그라디언트/글래스모피즘 없음 · 외부 CSS 프레임워크 0.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react'

/* ============================ 공유 계약(인라인) ============================ */

const DEFAULT_HISTORY_LIMIT = 30
const DEFAULT_POLL_MS = 5000

type ConversationKind = 'dm' | 'group'

interface Attachment {
  name: string
  url: string
  contentType?: string
  size?: number
}
interface MessageDto {
  id: string
  tenantId: string
  conversationId: string
  senderMemberId: string | null
  body: string
  attachments: Attachment[]
  system: boolean
  deleted: boolean
  createdAt: string
}
interface ConversationListItemDto {
  id: string
  tenantId: string
  kind: ConversationKind
  title: string | null
  memberIds: string[]
  createdAt: string
  lastMessage: MessageDto | null
  unreadCount: number
}
interface MyConversationsDto {
  memberId: string
  items: ConversationListItemDto[]
  totalUnread: number
}
interface MessageHistoryDto {
  conversationId: string
  items: MessageDto[]
  hasMore: boolean
}
interface SendResultDto {
  message: MessageDto
  delivered: number
}
interface ReadResultDto {
  conversationId: string
  memberId: string
  lastReadMessageId: string | null
  readAt: string
  unreadCount: number
}

/* ============================ REST 클라이언트(인라인) ============================ */

class ChatDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message)
    this.name = 'ChatDeskError'
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

interface ChatClient {
  readonly memberId: string
  conversations: (signal?: AbortSignal) => Promise<MyConversationsDto>
  history: (conversationId: string, opts?: { limit?: number; before?: string }, signal?: AbortSignal) => Promise<MessageHistoryDto>
  send: (conversationId: string, body: string, attachments?: Attachment[]) => Promise<SendResultDto>
  markRead: (conversationId: string, lastReadMessageId?: string) => Promise<ReadResultDto>
}

interface ChatClientOptions {
  publishableKey: string
  memberId: string
  endpoint: string
  fetch?: typeof fetch
}

function createChatClient(options: ChatClientOptions): ChatClient {
  const { publishableKey, memberId } = options
  if (!publishableKey) throw new ChatDeskError('publishableKey 가 필요합니다', 0)
  if (!memberId) throw new ChatDeskError('memberId 가 필요합니다', 0)

  const base = options.endpoint.replace(/\/+$/, '')
  const doFetch = options.fetch ?? globalThis.fetch

  const headers = (): Record<string, string> => ({
    'content-type': 'application/json',
    'x-chat-key': publishableKey,
  })

  async function parse<T>(res: Response): Promise<T> {
    const text = await res.text()
    const json: unknown = text ? (JSON.parse(text) as unknown) : null
    if (!res.ok) {
      const rec = (json ?? {}) as Record<string, unknown>
      const raw = rec.message ?? rec.error ?? `ChatDesk 요청 실패 (${res.status})`
      throw new ChatDeskError(Array.isArray(raw) ? raw.join(', ') : String(raw), res.status, json)
    }
    return json as T
  }
  const get = async <T,>(p: string, signal?: AbortSignal): Promise<T> =>
    parse<T>(await doFetch(`${base}${p}`, { method: 'GET', headers: headers(), signal }))
  const post = async <T,>(p: string, body: unknown): Promise<T> =>
    parse<T>(await doFetch(`${base}${p}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) }))

  return {
    get memberId() {
      return memberId
    },
    conversations: (signal) => get<MyConversationsDto>(`/api/conversations${qs({ memberId })}`, signal),
    history: (conversationId, opts, signal) =>
      get<MessageHistoryDto>(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages${qs({
          memberId,
          limit: opts?.limit ?? DEFAULT_HISTORY_LIMIT,
          before: opts?.before,
        })}`,
        signal
      ),
    send: (conversationId, body, attachments) =>
      post<SendResultDto>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        senderMemberId: memberId,
        body,
        attachments,
      }),
    markRead: (conversationId, lastReadMessageId) =>
      post<ReadResultDto>(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
        memberId,
        lastReadMessageId,
      }),
  }
}

/* ============================ 포매팅(인라인) ============================ */

function conversationName(conv: ConversationListItemDto, me: string): string {
  if (conv.kind === 'group') {
    if (conv.title) return conv.title
    const others = conv.memberIds.filter((m) => m !== me)
    if (others.length === 0) return '그룹'
    if (others.length <= 3) return others.join(', ')
    return `${others.slice(0, 3).join(', ')} 외 ${others.length - 3}명`
  }
  const other = conv.memberIds.find((m) => m !== me)
  return other ?? conv.memberIds[0] ?? '대화'
}
function previewText(conv: ConversationListItemDto): string {
  const m = conv.lastMessage
  if (!m) return '아직 메시지가 없습니다'
  if (m.deleted) return '삭제된 메시지'
  if (m.body) return m.body
  if (m.attachments.length > 0) return `첨부 ${m.attachments.length}개`
  return ''
}
function shortTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
}
function clockTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (d.toDateString() === now.toDateString()) return '오늘'
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return '어제'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
function sameDate(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/* ============================ 스타일(인라인) ============================ */

const DEFAULT_ACCENT = '#2f5fe0'
const DEFAULT_ACCENT_INK = '#ffffff'
const STYLE_ID = 'chatdesk-vendor-styles'

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = WIDGET_CSS
  document.head.appendChild(el)
}

const WIDGET_CSS = `
.cdk-root, .cdk-root * { box-sizing: border-box; }
.cdk-root {
  --cdk-accent: ${DEFAULT_ACCENT}; --cdk-accent-ink: ${DEFAULT_ACCENT_INK};
  --cdk-ink: #1a1d23; --cdk-ink-soft: #4a4f57; --cdk-muted: #6b7280;
  --cdk-surface: #fff; --cdk-surface-2: #f4f5f7; --cdk-surface-3: #eceef1;
  --cdk-border: #d7dae0; --cdk-border-strong: #b7bcc6; --cdk-danger: #b42318; --cdk-success: #047857;
  --cdk-radius: 16px; --cdk-radius-sm: 10px;
  --cdk-shadow: 0 1px 2px rgba(16,24,40,.06), 0 12px 32px -8px rgba(16,24,40,.22);
  --cdk-z-launcher: 2147483000; --cdk-z-panel: 2147483600; --cdk-ease: cubic-bezier(.22,1,.36,1);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--cdk-ink); line-height: 1.5;
}
.cdk-launcher {
  position: fixed; z-index: var(--cdk-z-launcher); display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 18px; border: 0; border-radius: 999px; background: var(--cdk-accent);
  color: var(--cdk-accent-ink); font: inherit; font-weight: 600; font-size: 14px; cursor: pointer;
  box-shadow: var(--cdk-shadow); transition: transform .18s var(--cdk-ease), filter .18s var(--cdk-ease);
}
.cdk-launcher:hover { filter: brightness(1.06); transform: translateY(-1px); }
.cdk-launcher svg { width: 18px; height: 18px; display: block; }
.cdk-launcher-badge {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
  background: var(--cdk-accent-ink); color: var(--cdk-accent); font-size: 11px; font-weight: 700;
  line-height: 18px; text-align: center;
}
.cdk-pos-br { right: 20px; bottom: 20px; } .cdk-pos-bl { left: 20px; bottom: 20px; }
.cdk-pos-tr { right: 20px; top: 20px; } .cdk-pos-tl { left: 20px; top: 20px; }
.cdk-panel {
  position: fixed; z-index: var(--cdk-z-panel); width: min(384px, calc(100vw - 32px));
  height: min(620px, calc(100vh - 40px)); display: flex; flex-direction: column;
  background: var(--cdk-surface); color: var(--cdk-ink); border: 1px solid var(--cdk-border);
  border-radius: var(--cdk-radius); box-shadow: var(--cdk-shadow); overflow: hidden;
  animation: cdk-pop .2s var(--cdk-ease);
}
.cdk-panel.cdk-pos-br { right: 20px; bottom: 20px; } .cdk-panel.cdk-pos-bl { left: 20px; bottom: 20px; }
.cdk-panel.cdk-pos-tr { right: 20px; top: 20px; } .cdk-panel.cdk-pos-tl { left: 20px; top: 20px; }
@media (max-width: 480px) {
  .cdk-panel { width: 100vw; height: 100dvh; max-height: 100dvh; inset: 0 !important;
    border-radius: 0; border: 0; animation: cdk-sheet .24s var(--cdk-ease); }
}
.cdk-header {
  display: flex; align-items: center; gap: 10px; padding: 14px 14px 14px 16px;
  border-bottom: 1px solid var(--cdk-border); background: var(--cdk-surface);
}
.cdk-header-title { flex: 1; min-width: 0; }
.cdk-header-title h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cdk-header-sub { margin: 2px 0 0; font-size: 12px; color: var(--cdk-muted); }
.cdk-iconbtn {
  flex: none; width: 34px; height: 34px; display: inline-flex; align-items: center;
  justify-content: center; border: 0; border-radius: 9px; background: transparent;
  color: var(--cdk-muted); cursor: pointer; transition: background .14s var(--cdk-ease), color .14s var(--cdk-ease);
}
.cdk-iconbtn:hover { background: var(--cdk-surface-2); color: var(--cdk-ink); }
.cdk-iconbtn svg { width: 20px; height: 20px; }
.cdk-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 6px; list-style: none; margin: 0; }
.cdk-conv {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border: 0;
  border-radius: var(--cdk-radius-sm); background: transparent; text-align: left; font: inherit;
  cursor: pointer; transition: background .12s var(--cdk-ease);
}
.cdk-conv:hover { background: var(--cdk-surface-2); }
.cdk-avatar { flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--cdk-surface-3);
  color: var(--cdk-ink-soft); display: inline-flex; align-items: center; justify-content: center; }
.cdk-avatar svg { width: 22px; height: 22px; }
.cdk-conv-body { flex: 1; min-width: 0; }
.cdk-conv-top { display: flex; align-items: baseline; gap: 8px; }
.cdk-conv-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.cdk-conv-time { flex: none; font-size: 11px; color: var(--cdk-muted); }
.cdk-conv-preview { margin: 2px 0 0; font-size: 13px; color: var(--cdk-muted); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.cdk-conv-preview.cdk-unread { color: var(--cdk-ink); font-weight: 600; }
.cdk-badge { flex: none; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: var(--cdk-accent); color: var(--cdk-accent-ink); font-size: 11px; font-weight: 700;
  line-height: 20px; text-align: center; }
.cdk-thread { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 16px 14px 8px;
  display: flex; flex-direction: column; gap: 3px; background: var(--cdk-surface-2); }
.cdk-loadmore { align-self: center; margin-bottom: 8px; padding: 6px 14px; border: 1px solid var(--cdk-border);
  border-radius: 999px; background: var(--cdk-surface); color: var(--cdk-ink-soft); font: inherit;
  font-size: 12px; font-weight: 600; cursor: pointer; }
.cdk-day { align-self: center; margin: 10px 0; padding: 3px 12px; border-radius: 999px;
  background: var(--cdk-surface-3); color: var(--cdk-ink-soft); font-size: 11px; font-weight: 600; }
.cdk-msg-row { display: flex; flex-direction: column; max-width: 80%; }
.cdk-msg-row.cdk-mine { align-self: flex-end; align-items: flex-end; }
.cdk-msg-row.cdk-theirs { align-self: flex-start; align-items: flex-start; }
.cdk-msg-row.cdk-system { align-self: center; max-width: 92%; align-items: center; }
.cdk-msg-sender { margin: 8px 4px 2px; font-size: 11px; font-weight: 600; color: var(--cdk-muted); }
.cdk-bubble { padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.45;
  word-break: break-word; white-space: pre-wrap; box-shadow: 0 1px 1px rgba(16,24,40,.04); }
.cdk-mine .cdk-bubble { background: var(--cdk-accent); color: var(--cdk-accent-ink); border-bottom-right-radius: 5px; }
.cdk-theirs .cdk-bubble { background: var(--cdk-surface); color: var(--cdk-ink); border: 1px solid var(--cdk-border);
  border-bottom-left-radius: 5px; }
.cdk-system .cdk-bubble { background: transparent; color: var(--cdk-muted); border: 0; font-size: 12.5px;
  text-align: center; box-shadow: none; padding: 4px 10px; }
.cdk-bubble.cdk-deleted { font-style: italic; opacity: .7; }
.cdk-msg-meta { display: inline-flex; align-items: center; gap: 4px; margin: 2px 4px 0; font-size: 10.5px; color: var(--cdk-muted); }
.cdk-attach { display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12.5px; text-decoration: underline; }
.cdk-mine .cdk-attach { color: var(--cdk-accent-ink); } .cdk-theirs .cdk-attach { color: var(--cdk-accent); }
.cdk-composer { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px;
  border-top: 1px solid var(--cdk-border); background: var(--cdk-surface); }
.cdk-composer textarea { flex: 1; min-height: 40px; max-height: 120px; resize: none; padding: 9px 12px;
  border: 1px solid var(--cdk-border); border-radius: 20px; font: inherit; font-size: 14px; line-height: 1.4;
  color: var(--cdk-ink); background: var(--cdk-surface); transition: border-color .12s var(--cdk-ease); }
.cdk-composer textarea::placeholder { color: var(--cdk-muted); }
.cdk-composer textarea:hover { border-color: var(--cdk-border-strong); }
.cdk-send { flex: none; width: 40px; height: 40px; display: inline-flex; align-items: center;
  justify-content: center; border: 0; border-radius: 50%; background: var(--cdk-accent);
  color: var(--cdk-accent-ink); cursor: pointer; transition: filter .14s var(--cdk-ease); }
.cdk-send:hover:not(:disabled) { filter: brightness(1.06); }
.cdk-send:disabled { opacity: .5; cursor: not-allowed; } .cdk-send svg { width: 20px; height: 20px; }
.cdk-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 28px; text-align: center; }
.cdk-state-icon { width: 52px; height: 52px; margin-bottom: 14px; display: flex; align-items: center;
  justify-content: center; border-radius: 50%; background: var(--cdk-surface-2); color: var(--cdk-muted); }
.cdk-state-icon.cdk-err { background: color-mix(in srgb, var(--cdk-danger) 12%, var(--cdk-surface)); color: var(--cdk-danger); }
.cdk-state-icon svg { width: 28px; height: 28px; }
.cdk-state-title { margin: 0; font-size: 15px; font-weight: 700; }
.cdk-state-text { margin: 8px 0 0; font-size: 13px; color: var(--cdk-ink-soft); max-width: 28ch; }
.cdk-spinner { width: 28px; height: 28px; border: 3px solid var(--cdk-border); border-top-color: var(--cdk-accent);
  border-radius: 50%; animation: cdk-spin .7s linear infinite; }
.cdk-btn { margin-top: 16px; appearance: none; border: 1px solid transparent; border-radius: var(--cdk-radius-sm);
  padding: 9px 18px; font: inherit; font-weight: 600; font-size: 14px; background: var(--cdk-accent);
  color: var(--cdk-accent-ink); cursor: pointer; transition: filter .14s var(--cdk-ease); }
.cdk-btn:hover { filter: brightness(1.06); }
.cdk-sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.cdk-root :focus { outline: none; }
.cdk-root :focus-visible { outline: 2px solid var(--cdk-accent); outline-offset: 2px; border-radius: 8px; }
.cdk-composer textarea:focus-visible { outline-offset: 1px; }
@keyframes cdk-pop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes cdk-sheet { from { transform: translateY(100%); } to { transform: none; } }
@keyframes cdk-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .cdk-root *, .cdk-panel, .cdk-launcher, .cdk-spinner {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  .cdk-spinner { animation: cdk-spin .9s linear infinite !important; }
}
`

/* ============================ 아이콘(인라인) ============================ */

const ChatIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 4v-4H6.5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CloseIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const BackIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const SendIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4.5 12 19 5l-4 14-3.5-5.5L4.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    <path d="m11.5 13.5 3.5-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const AlertIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 8v5m0 3.5h.01M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const GroupIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)
const PersonIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 19.5a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

/* ============================ 컴포넌트 ============================ */

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export interface ChatWidgetProps {
  publishableKey: string
  endpoint: string
  memberId: string
  memberName?: string
  position?: WidgetPosition
  accent?: string
  accentInk?: string
  label?: string
  title?: string
  defaultOpen?: boolean
  /** 새 메시지/대화 갱신 폴링 주기(ms). 기본 5000. 0 이하면 폴링 끔. */
  pollIntervalMs?: number
  fetch?: typeof fetch
}

const POSITION_CLASS: Record<WidgetPosition, string> = {
  'bottom-right': 'cdk-pos-br',
  'bottom-left': 'cdk-pos-bl',
  'top-right': 'cdk-pos-tr',
  'top-left': 'cdk-pos-tl',
}
const FOCUSABLE =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

type ListPhase = 'idle' | 'loading' | 'ready' | 'error'

export function ChatWidget(props: ChatWidgetProps): ReactElement {
  const {
    publishableKey,
    endpoint,
    memberId,
    memberName,
    position = 'bottom-right',
    accent = DEFAULT_ACCENT,
    accentInk = DEFAULT_ACCENT_INK,
    label = '채팅',
    title = '메시지',
    defaultOpen = false,
    pollIntervalMs = DEFAULT_POLL_MS,
    fetch: customFetch,
  } = props

  const client = useMemo<ChatClient>(
    () => createChatClient({ publishableKey, memberId, endpoint, fetch: customFetch }),
    [publishableKey, memberId, endpoint, customFetch]
  )

  const [open, setOpen] = useState(defaultOpen)
  const [listPhase, setListPhase] = useState<ListPhase>('idle')
  const [conversations, setConversations] = useState<ConversationListItemDto[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ensureStyles()
  }, [])

  const loadConversations = useCallback(
    (signal?: AbortSignal) => {
      setListPhase((p) => (p === 'ready' ? p : 'loading'))
      client
        .conversations(signal)
        .then((res) => {
          if (signal?.aborted) return
          setConversations(res.items)
          setListPhase('ready')
        })
        .catch(() => {
          if (signal?.aborted) return
          setListPhase('error')
        })
    },
    [client]
  )

  useEffect(() => {
    const ctrl = new AbortController()
    loadConversations(ctrl.signal)
    return () => ctrl.abort()
  }, [loadConversations])

  // 대화 목록 가벼운 폴링(배지/미리보기 갱신). 스레드를 보고 있을 땐 ThreadView 가 자체 폴링한다.
  useEffect(() => {
    if (pollIntervalMs <= 0) return
    const timer = setInterval(() => {
      if (activeId) return
      const ctrl = new AbortController()
      client
        .conversations(ctrl.signal)
        .then((res) => setConversations(res.items))
        .catch(() => undefined)
    }, pollIntervalMs)
    return () => clearInterval(timer)
  }, [client, pollIntervalMs, activeId])

  useEffect(() => {
    setTotalUnread(conversations.reduce((s, c) => s + c.unreadCount, 0))
  }, [conversations])

  const openPanel = useCallback(() => {
    setOpen(true)
    if (listPhase === 'idle' || listPhase === 'error') loadConversations()
  }, [listPhase, loadConversations])

  const closePanel = useCallback(() => {
    setOpen(false)
    setActiveId(null)
    launcherRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (activeId) setActiveId(null)
        else closePanel()
        return
      }
      if (e.key !== 'Tab') return
      const root = panelRef.current
      if (!root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, activeId, closePanel])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open, activeId])

  const openConversation = useCallback((id: string) => {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
  }, [])

  const activeConv = activeId ? (conversations.find((c) => c.id === activeId) ?? null) : null
  const rootStyle = { '--cdk-accent': accent, '--cdk-accent-ink': accentInk } as CSSProperties
  const posClass = POSITION_CLASS[position]

  return (
    <div className="cdk-root" style={rootStyle}>
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          className={`cdk-launcher ${posClass}`}
          aria-haspopup="dialog"
          aria-label={totalUnread > 0 ? `${label} — 안 읽은 메시지 ${totalUnread}개` : label}
          onClick={openPanel}
        >
          <ChatIcon />
          {label}
          {totalUnread > 0 ? (
            <span className="cdk-launcher-badge" aria-hidden="true">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          ) : null}
        </button>
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          className={`cdk-panel ${posClass}`}
          role="dialog"
          aria-modal="false"
          aria-label={activeConv ? conversationName(activeConv, memberId) : title}
        >
          {activeConv ? (
            <ThreadView
              key={activeConv.id}
              client={client}
              conversation={activeConv}
              memberId={memberId}
              memberName={memberName}
              pollIntervalMs={pollIntervalMs}
              onBack={() => setActiveId(null)}
              onClose={closePanel}
            />
          ) : (
            <ListView
              title={title}
              phase={listPhase}
              conversations={conversations}
              memberId={memberId}
              onOpen={openConversation}
              onClose={closePanel}
              onRetry={() => loadConversations()}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

interface ListViewProps {
  title: string
  phase: ListPhase
  conversations: ConversationListItemDto[]
  memberId: string
  onOpen: (id: string) => void
  onClose: () => void
  onRetry: () => void
}

function ListView(props: ListViewProps): ReactElement {
  const { title, phase, conversations, memberId, onOpen, onClose, onRetry } = props
  return (
    <>
      <div className="cdk-header">
        <div className="cdk-header-title">
          <h2>{title}</h2>
        </div>
        <button type="button" className="cdk-iconbtn" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {phase === 'loading' && conversations.length === 0 ? (
        <div className="cdk-state" aria-busy="true">
          <div className="cdk-spinner" />
          <p className="cdk-state-text" style={{ marginTop: 14 }}>
            대화를 불러오는 중…
          </p>
        </div>
      ) : phase === 'error' ? (
        <div className="cdk-state">
          <div className="cdk-state-icon cdk-err">
            <AlertIcon />
          </div>
          <h3 className="cdk-state-title">불러오지 못했어요</h3>
          <p className="cdk-state-text">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
          <button type="button" className="cdk-btn" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="cdk-state">
          <div className="cdk-state-icon">
            <ChatIcon />
          </div>
          <h3 className="cdk-state-title">아직 대화가 없어요</h3>
          <p className="cdk-state-text">새 대화가 시작되면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <ul className="cdk-list">
          {conversations.map((c) => {
            const name = conversationName(c, memberId)
            const hasUnread = c.unreadCount > 0
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="cdk-conv"
                  onClick={() => onOpen(c.id)}
                  aria-label={hasUnread ? `${name} — 안 읽은 메시지 ${c.unreadCount}개` : name}
                >
                  <span className="cdk-avatar" aria-hidden="true">
                    {c.kind === 'group' ? <GroupIcon /> : <PersonIcon />}
                  </span>
                  <span className="cdk-conv-body">
                    <span className="cdk-conv-top">
                      <span className="cdk-conv-name">{name}</span>
                      {c.lastMessage ? (
                        <span className="cdk-conv-time">{shortTime(c.lastMessage.createdAt)}</span>
                      ) : null}
                    </span>
                    <span className={`cdk-conv-preview ${hasUnread ? 'cdk-unread' : ''}`}>
                      {previewText(c)}
                    </span>
                  </span>
                  {hasUnread ? (
                    <span className="cdk-badge" aria-hidden="true">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

interface ThreadViewProps {
  client: ChatClient
  conversation: ConversationListItemDto
  memberId: string
  memberName?: string
  pollIntervalMs: number
  onBack: () => void
  onClose: () => void
}
type ThreadPhase = 'loading' | 'ready' | 'error'

function ThreadView(props: ThreadViewProps): ReactElement {
  const { client, conversation, memberId, pollIntervalMs, onBack, onClose } = props
  const conversationId = conversation.id

  const [phase, setPhase] = useState<ThreadPhase>('loading')
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')

  const threadRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<MessageDto[]>([])
  messagesRef.current = messages

  const scrollToBottom = useCallback(() => {
    const el = threadRef.current
    if (el) el.scrollTo({ top: el.scrollHeight })
  }, [])

  // 최초 히스토리 로드.
  useEffect(() => {
    let alive = true
    setPhase('loading')
    client
      .history(conversationId)
      .then((res) => {
        if (!alive) return
        setMessages(res.items)
        setHasMore(res.hasMore)
        setPhase('ready')
        client.markRead(conversationId).catch(() => undefined)
      })
      .catch(() => {
        if (alive) setPhase('error')
      })
    return () => {
      alive = false
    }
  }, [client, conversationId])

  // 새 메시지 폴링(REST). 마지막 메시지 이후를 받아 합친다.
  useEffect(() => {
    if (pollIntervalMs <= 0) return
    const timer = setInterval(() => {
      const ctrl = new AbortController()
      client
        .history(conversationId, undefined, ctrl.signal)
        .then((res) => {
          const known = new Set(messagesRef.current.map((m) => m.id))
          const fresh = res.items.filter((m) => !known.has(m.id))
          if (fresh.length === 0) return
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id))
            return [...prev, ...res.items.filter((m) => !seen.has(m.id))]
          })
          const last = fresh[fresh.length - 1]
          if (last && last.senderMemberId !== memberId) {
            setLiveMsg(`${last.senderMemberId ?? '시스템'}: ${last.body}`)
            client.markRead(conversationId, last.id).catch(() => undefined)
          }
        })
        .catch(() => undefined)
    }, pollIntervalMs)
    return () => clearInterval(timer)
  }, [client, conversationId, memberId, pollIntervalMs])

  useEffect(() => {
    if (phase === 'ready') scrollToBottom()
  }, [messages.length, phase, scrollToBottom])

  const doSend = useCallback(() => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    client
      .send(conversationId, body)
      .then((res) => {
        setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]))
        setDraft('')
      })
      .catch(() => setLiveMsg('메시지 전송에 실패했습니다.'))
      .finally(() => {
        setSending(false)
        composerRef.current?.focus()
      })
  }, [draft, sending, client, conversationId])

  const onComposerKey = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        doSend()
      }
    },
    [doSend]
  )

  const fetchOlder = useCallback(() => {
    const oldest = messagesRef.current[0]
    const el = threadRef.current
    const prevHeight = el?.scrollHeight ?? 0
    client
      .history(conversationId, { before: oldest?.id })
      .then((page) => {
        if (page.items.length === 0) {
          setHasMore(false)
          return
        }
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          return [...page.items.filter((m) => !seen.has(m.id)), ...prev]
        })
        setHasMore(page.hasMore)
        window.setTimeout(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight
        }, 0)
      })
      .catch(() => undefined)
  }, [client, conversationId])

  const headerName = conversationName(conversation, memberId)
  const subtitle =
    conversation.kind === 'group' ? `멤버 ${conversation.memberIds.length}명` : '1:1 대화'

  return (
    <>
      <div className="cdk-header">
        <button type="button" className="cdk-iconbtn" aria-label="대화 목록으로" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="cdk-header-title">
          <h2>{headerName}</h2>
          <p className="cdk-header-sub">{subtitle}</p>
        </div>
        <button type="button" className="cdk-iconbtn" aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {phase === 'error' ? (
        <div className="cdk-state">
          <div className="cdk-state-icon cdk-err">
            <AlertIcon />
          </div>
          <h3 className="cdk-state-title">대화를 열 수 없어요</h3>
          <p className="cdk-state-text">이 대화의 멤버가 아니거나 연결에 문제가 있습니다.</p>
          <button type="button" className="cdk-btn" onClick={onBack}>
            목록으로
          </button>
        </div>
      ) : (
        <>
          <div className="cdk-thread" ref={threadRef}>
            {phase === 'loading' ? (
              <div className="cdk-state" aria-busy="true">
                <div className="cdk-spinner" />
              </div>
            ) : (
              <>
                {hasMore ? (
                  <button type="button" className="cdk-loadmore" onClick={fetchOlder}>
                    이전 메시지 더 보기
                  </button>
                ) : null}
                {messages.map((m, i) => {
                  const prev = messages[i - 1]
                  const showDay = !prev || !sameDate(prev.createdAt, m.createdAt)
                  return (
                    <MessageRow
                      key={m.id}
                      message={m}
                      mine={m.senderMemberId === memberId}
                      showDay={showDay}
                      showSender={conversation.kind === 'group'}
                    />
                  )
                })}
              </>
            )}
          </div>

          <form
            className="cdk-composer"
            onSubmit={(e) => {
              e.preventDefault()
              doSend()
            }}
          >
            <textarea
              ref={composerRef}
              value={draft}
              rows={1}
              placeholder="메시지를 입력하세요"
              aria-label="메시지 입력"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKey}
            />
            <button type="submit" className="cdk-send" aria-label="보내기" disabled={!draft.trim() || sending}>
              <SendIcon />
            </button>
          </form>
        </>
      )}

      <div className="cdk-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveMsg}
      </div>
    </>
  )
}

interface MessageRowProps {
  message: MessageDto
  mine: boolean
  showDay: boolean
  showSender: boolean
}

function MessageRow(props: MessageRowProps): ReactElement {
  const { message: m, mine, showDay, showSender } = props
  const rowClass = m.system ? 'cdk-system' : mine ? 'cdk-mine' : 'cdk-theirs'
  return (
    <>
      {showDay ? <div className="cdk-day">{dayLabel(m.createdAt)}</div> : null}
      <div className={`cdk-msg-row ${rowClass}`}>
        {!m.system && !mine && showSender ? <span className="cdk-msg-sender">{m.senderMemberId}</span> : null}
        <div className={`cdk-bubble ${m.deleted ? 'cdk-deleted' : ''}`}>
          {m.deleted ? '삭제된 메시지입니다' : m.body}
          {!m.deleted && m.attachments.length > 0
            ? m.attachments.map((a, idx) => (
                <a key={`${a.url}-${idx}`} className="cdk-attach" href={a.url} target="_blank" rel="noreferrer noopener">
                  📎 {a.name}
                </a>
              ))
            : null}
        </div>
        {!m.system ? <span className="cdk-msg-meta">{clockTime(m.createdAt)}</span> : null}
      </div>
    </>
  )
}

export default ChatWidget
export { createChatClient, ChatDeskError, type ChatClient, type ChatClientOptions }
