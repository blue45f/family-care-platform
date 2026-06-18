/**
 * SearchDesk(네이티브) — 전역 ⌘K 검색 팔레트.
 * ──────────────────────────────────────────────────────────────────────────
 * 발행된 SDK(@heejun/deskcloud)의 브라우저 SearchClient 로 질의하고, 결과를 이 앱의
 * 디자인 토큰(OKLCH sage/sand)·컴포넌트 어휘로 렌더한다. 외부 위젯 번들/파란 위젯
 * CSS 를 주입하지 않는다(이전 SearchPalette 위젯 대체).
 *
 * env-gated: VITE_SEARCHDESK_URL 미설정이면 getSearchClient() 가 null 이라 단축키
 * 리스너조차 등록하지 않고 아무것도 렌더하지 않는다(앱에 무영향).
 *
 * 접근성: 모달 셸(포커스 트랩·Esc/바깥클릭 닫기·포커스 복원·aria-modal)은 앱이 이미
 * 쓰는 Radix Dialog 가 보장한다. 그 위에 combobox/listbox/option + aria-activedescendant
 * + 방향키 네비게이션을 얹는다. prefers-reduced-motion 은 전역 모션 리셋이 처리하고,
 * 대비는 앱 토큰(≥4.5:1)을 그대로 쓴다. 결과 하이라이트는 서버가 부여한 <mark> 를
 * 그대로 쓰며, 스타일은 .desk-search-* 클래스로 앱 토큰에 묶는다.
 */
import * as Dialog from '@radix-ui/react-dialog'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Icon } from '../ui'

import { getSearchClient } from './deskClients'

import type { SearchHit } from '@heejun/deskcloud'

type Phase = 'idle' | 'loading' | 'ready' | 'error'

const DEBOUNCE_MS = 160
const RESULT_LIMIT = 12

/** 그룹화된 결과. 각 hit 에 listbox 평면 인덱스(flatIndex)를 미리 부여해 둔다. */
type GroupedHit = { hit: SearchHit; flatIndex: number }
type ResultGroup = { category: string; items: GroupedHit[] }
const UNCATEGORIZED = '기타'

function groupHits(hits: SearchHit[]): ResultGroup[] {
  const order: string[] = []
  const byCategory = new Map<string, GroupedHit[]>()
  hits.forEach((hit, flatIndex) => {
    const category = hit.category ?? UNCATEGORIZED
    const bucket = byCategory.get(category)
    if (bucket) {
      bucket.push({ hit, flatIndex })
    } else {
      byCategory.set(category, [{ hit, flatIndex }])
      order.push(category)
    }
  })
  return order.map((category) => ({ category, items: byCategory.get(category) ?? [] }))
}

export function DeskSearchPalette() {
  // env 로 한 번 결정되는 클라이언트(렌더 간 안정) — useState 초기화로 만들어
  // 렌더 중에도 안전하게 읽는다(ref-during-render 회피).
  const [client] = useState(getSearchClient)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const titleId = `${reactId}-title`
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const enabled = Boolean(client)

  // ⌘K / Ctrl+K 로 팔레트를 연다(검색 Desk 가 설정된 경우에만 리스너 등록).
  useEffect(() => {
    if (!enabled) {
      return undefined
    }
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])

  // 디바운스 검색. 상태 변경은 모두 지연 콜백(setTimeout/Promise) 안에서만 일으켜
  // 효과 본문의 동기 setState 를 피한다(레포의 react-hooks 게이트 준수).
  useEffect(() => {
    if (!open) {
      return undefined
    }
    const trimmed = query.trim()
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const timer = window.setTimeout(() => {
      if (controller.signal.aborted) {
        return
      }
      if (!client || trimmed.length === 0) {
        setHits([])
        setActiveIndex(0)
        setPhase('idle')
        return
      }
      setPhase('loading')
      setErrorMessage('')
      client
        .search({ q: trimmed, limit: RESULT_LIMIT })
        .then((response) => {
          if (controller.signal.aborted) {
            return
          }
          setHits(response.hits)
          setActiveIndex(0)
          setPhase('ready')
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) {
            return
          }
          setErrorMessage(cause instanceof Error ? cause.message : '검색에 실패했습니다.')
          setHits([])
          setActiveIndex(0)
          setPhase('error')
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [client, open, query])

  const groups = useMemo(() => groupHits(hits), [hits])

  // Radix Dialog 가 닫힘을 통지하면(Esc·바깥클릭·열기버튼) 검색 상태를 초기화한다.
  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setHits([])
      setActiveIndex(0)
      setPhase('idle')
    }
  }, [])

  const selectHit = useCallback(
    (hit: SearchHit) => {
      onOpenChange(false)
      if (hit.url) {
        window.location.assign(hit.url)
      }
    },
    [onOpenChange]
  )

  const move = useCallback(
    (delta: number) => {
      if (hits.length === 0) {
        return
      }
      setActiveIndex((index) => {
        const next = (index + delta + hits.length) % hits.length
        window.setTimeout(() => {
          listRef.current
            ?.querySelector<HTMLElement>('[aria-selected="true"]')
            ?.scrollIntoView({ block: 'nearest' })
        }, 0)
        return next
      })
    },
    [hits.length]
  )

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        move(1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        move(-1)
      } else if (event.key === 'Enter') {
        const hit = hits[activeIndex]
        if (hit) {
          event.preventDefault()
          selectHit(hit)
        }
      }
    },
    [move, hits, activeIndex, selectHit]
  )

  if (!enabled) {
    return null
  }

  const activeDescendant = hits.length > 0 ? `${reactId}-opt-${activeIndex}` : undefined
  const showEmptyHint = phase === 'idle' && query.trim().length === 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay desk-search-overlay" />
        <Dialog.Content
          className="desk-search-panel"
          aria-labelledby={titleId}
          // 모달이 열리면 콤보박스 입력으로 초기 포커스를 옮긴다(Radix 기본 포커스 대체).
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <Dialog.Title id={titleId} className="sr-only">
            검색
          </Dialog.Title>

          <div className="desk-search-inputbar">
            <span className="desk-search-leading" aria-hidden="true">
              <Icon name="guide" size={18} />
            </span>
            <input
              ref={inputRef}
              className="desk-search-input"
              type="text"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={activeDescendant}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="돌봄 기록, 일정, 가이드 검색…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
            />
            <kbd className="desk-search-kbd" aria-hidden="true">
              Esc
            </kbd>
          </div>

          <div className="desk-search-results">
            {showEmptyHint ? (
              <div className="desk-search-state">
                <p className="desk-search-state-title">무엇을 찾고 계신가요?</p>
                <p className="desk-search-state-text">검색어를 입력하면 결과가 바로 표시됩니다.</p>
              </div>
            ) : phase === 'error' ? (
              <div className="desk-search-state" role="alert">
                <p className="desk-search-state-title">검색에 실패했어요</p>
                <p className="desk-search-state-text">
                  {errorMessage || '네트워크 상태를 확인해 주세요.'}
                </p>
              </div>
            ) : phase === 'loading' && hits.length === 0 ? (
              <div className="desk-search-state" aria-busy="true">
                <p className="desk-search-state-text">검색 중…</p>
              </div>
            ) : hits.length === 0 ? (
              <div className="desk-search-state">
                <p className="desk-search-state-title">결과가 없습니다</p>
                <p className="desk-search-state-text">
                  <strong>{query.trim()}</strong> 에 대한 검색 결과를 찾지 못했어요.
                </p>
              </div>
            ) : (
              <ul
                ref={listRef}
                className="desk-search-list"
                role="listbox"
                id={listboxId}
                aria-label="검색 결과"
              >
                {groups.map((group) => (
                  <li key={group.category} role="presentation">
                    <p className="desk-search-group" role="presentation">
                      {group.category}
                    </p>
                    <ul role="presentation" className="desk-search-group-list">
                      {group.items.map(({ hit, flatIndex }) => {
                        const selected = flatIndex === activeIndex
                        return (
                          <li key={`${hit.index}:${hit.id}`} role="presentation">
                            {/* option 은 네이티브 button 으로 렌더해 키보드/포인터 활성화를
                                모두 보장한다(방향키 네비는 입력의 aria-activedescendant 가
                                주도하고, 포인터/직접 포커스 시 button 이 받아준다). */}
                            <button
                              type="button"
                              id={`${reactId}-opt-${flatIndex}`}
                              role="option"
                              aria-selected={selected}
                              className="desk-search-option"
                              tabIndex={-1}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onClick={() => selectHit(hit)}
                            >
                              <span className="desk-search-option-main">
                                <span
                                  className="desk-search-option-title"
                                  // 서버가 부여한 매치 하이라이트(<mark>). 텍스트만 강조한다.
                                  dangerouslySetInnerHTML={{ __html: hit.titleHighlight }}
                                />
                                {hit.snippet ? (
                                  <span
                                    className="desk-search-option-snippet"
                                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                                  />
                                ) : null}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="desk-search-footer">
            <span className="desk-search-foot-key">
              <kbd className="desk-search-kbd">↑</kbd>
              <kbd className="desk-search-kbd">↓</kbd>
              이동
            </span>
            <span className="desk-search-foot-key">
              <kbd className="desk-search-kbd">Enter</kbd>
              선택
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
