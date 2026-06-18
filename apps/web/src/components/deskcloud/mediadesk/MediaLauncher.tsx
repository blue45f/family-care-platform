/**
 * MediaDesk 플로팅 런처 — 명확히 붙일 페이지가 없을 때 셸에 단독 마운트하는 래퍼.
 * 우하단 FAB → 모달 안에 <MediaUploader> + <MediaGallery>. 위젯 자체는 self-contained
 * (MediaWidgets.tsx, react-only) 이며 이 파일은 가벼운 접근성 모달 셸만 더한다.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactElement } from 'react'

import { MediaGallery, MediaUploader, type MediaGalleryHandle } from './MediaWidgets'

const STYLE_ID = 'mediadesk-launcher-styles'

const LAUNCHER_CSS = `
.mdl-root, .mdl-root * { box-sizing: border-box; }
.mdl-root {
  --mdl-accent: #2f5fe0; --mdl-ink: #1a1d23; --mdl-muted: #6b7280;
  --mdl-surface: #fff; --mdl-border: #d7dae0;
  --mdl-shadow: 0 1px 2px rgba(16,24,40,.06), 0 12px 32px -8px rgba(16,24,40,.22);
  --mdl-ease: cubic-bezier(.22,1,.36,1);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--mdl-ink);
}
.mdl-fab {
  position: fixed; right: 20px; bottom: 88px; z-index: 2147482900;
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border: 0;
  border-radius: 999px; background: var(--mdl-accent); color: #fff; font: inherit; font-weight: 600;
  font-size: 14px; cursor: pointer; box-shadow: var(--mdl-shadow);
  transition: transform .18s var(--mdl-ease), filter .18s var(--mdl-ease);
}
.mdl-fab:hover { filter: brightness(1.06); transform: translateY(-1px); }
.mdl-fab svg { width: 18px; height: 18px; display: block; }
.mdl-backdrop {
  position: fixed; inset: 0; z-index: 2147483500; background: rgba(16,24,40,.42);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: mdl-fade .16s var(--mdl-ease);
}
.mdl-dialog {
  position: relative; width: min(560px, calc(100vw - 32px)); max-height: min(80vh, 720px);
  display: flex; flex-direction: column; background: var(--mdl-surface); border-radius: 16px;
  box-shadow: var(--mdl-shadow); overflow: hidden; animation: mdl-pop .2s var(--mdl-ease);
}
.mdl-head { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--mdl-border); }
.mdl-title { margin: 0; flex: 1; font-size: 15px; font-weight: 700; }
.mdl-close { flex: none; width: 32px; height: 32px; display: inline-flex; align-items: center;
  justify-content: center; border: 0; border-radius: 8px; background: transparent; color: var(--mdl-muted);
  cursor: pointer; transition: background .14s var(--mdl-ease), color .14s var(--mdl-ease); }
.mdl-close:hover { background: #f4f5f7; color: var(--mdl-ink); } .mdl-close svg { width: 18px; height: 18px; }
.mdl-body { padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.mdl-section-label { margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: .04em;
  text-transform: uppercase; color: var(--mdl-muted); }
.mdl-root :focus { outline: none; }
.mdl-root :focus-visible { outline: 2px solid var(--mdl-accent); outline-offset: 2px; border-radius: 6px; }
@keyframes mdl-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mdl-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .mdl-root *, .mdl-backdrop, .mdl-dialog, .mdl-fab {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = LAUNCHER_CSS
  document.head.appendChild(el)
}

const ImageIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m4 17 4.5-4.2a1.6 1.6 0 0 1 2.2 0L15 17m-2-3 2-1.8a1.6 1.6 0 0 1 2.1 0L20 14.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const CloseIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const FOCUSABLE =
  'a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface MediaLauncherProps {
  publishableKey: string
  endpoint: string
  folder?: string
  label?: string
  title?: string
}

export function MediaLauncher(props: MediaLauncherProps): ReactElement {
  const { publishableKey, endpoint, folder = 'family-care', label = '미디어', title = '미디어 보관함' } = props

  const [open, setOpen] = useState(false)
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const galleryRef = useRef<MediaGalleryHandle>(null)

  useEffect(() => {
    ensureStyles()
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    fabRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const root = dialogRef.current
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
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open])

  return (
    <div className="mdl-root">
      {!open ? (
        <button
          ref={fabRef}
          type="button"
          className="mdl-fab"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <ImageIcon />
          {label}
        </button>
      ) : null}

      {open ? (
        <div
          className="mdl-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div ref={dialogRef} className="mdl-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="mdl-head">
              <h2 className="mdl-title" id={titleId}>
                {title}
              </h2>
              <button type="button" className="mdl-close" aria-label="닫기" onClick={close}>
                <CloseIcon />
              </button>
            </div>
            <div className="mdl-body">
              <section>
                <p className="mdl-section-label">업로드</p>
                <MediaUploader
                  publishableKey={publishableKey}
                  endpoint={endpoint}
                  folder={folder}
                  onUploaded={() => galleryRef.current?.refresh()}
                />
              </section>
              <section>
                <p className="mdl-section-label">보관함</p>
                <MediaGallery
                  ref={galleryRef}
                  publishableKey={publishableKey}
                  endpoint={endpoint}
                  folder={folder}
                />
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MediaLauncher
