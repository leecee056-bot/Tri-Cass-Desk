import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Tab = {
  id: string
  title: string
  url: string
  loading?: boolean
  canBack?: boolean
  canForward?: boolean
  error?: string
}

type Bookmark = { id: string; title: string; url: string }
type HistoryEntry = { id: string; title: string; url: string; at: number }

const DIAL = [
  { label: 'Ollama', url: 'http://127.0.0.1:11434', tone: '#7ad7ff' },
  { label: 'Local', url: 'http://127.0.0.1:3000', tone: '#ff9a5c' },
  { label: 'MDN', url: 'https://developer.mozilla.org', tone: '#7dffc8' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org', tone: '#c9a0ff' },
  { label: 'Desk repo', url: 'https://github.com/leecee056-bot/Tri-Cass-Desk', tone: '#ffe07a' },
  { label: 'DuckDuckGo', url: 'https://duckduckgo.com', tone: '#a8b4d0' }
]

const BM_KEY = 'tricass-desk-bookmarks-v2'
const HIST_KEY = 'tricass-desk-history-v2'
const HOME_URL = 'about:blank'

type Props = {
  title?: string
  initialUrl?: string
  mode?: string
  onClose?: () => void
}

type WebviewEl = HTMLElement & {
  src: string
  getURL?: () => string
  getTitle?: () => string
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  stop: () => void
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return HOME_URL
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('about:')) return trimmed
  // Looks like a host/path → URL; otherwise search.
  const looksLikeHost =
    /^localhost(:\d+)?(\/|$)/i.test(trimmed) ||
    /^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed)
  if (looksLikeHost) return `https://${trimmed}`
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`
}

function hostLabel(url: string): string {
  if (url === 'about:blank' || !url) return 'New Tab'
  try {
    return new URL(url).hostname.replace(/^www\./, '') || url.slice(0, 28)
  } catch {
    return url.replace(/^https?:\/\//, '').slice(0, 28)
  }
}

function formatWhen(at: number): string {
  const mins = Math.round((Date.now() - at) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(at).toLocaleString()
}

export default function BrowserSurface({
  title = 'Browser',
  initialUrl = HOME_URL,
  mode,
  onClose
}: Props): React.JSX.Element {
  const firstId = useRef(uid('t')).current
  const [tabs, setTabs] = useState<Tab[]>([
    { id: firstId, title: hostLabel(initialUrl), url: initialUrl }
  ])
  const [activeId, setActiveId] = useState(firstId)
  const active = tabs.find((t) => t.id === activeId) || tabs[0]!
  const [draft, setDraft] = useState(active.url === HOME_URL ? '' : active.url)
  const [showDial, setShowDial] = useState(active.url === HOME_URL)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const v2 = loadJson<Bookmark[]>(BM_KEY, [])
    if (v2.length) return v2
    // migrate v1 shape
    const v1 = loadJson<{ title: string; url: string }[]>('tricass-desk-bookmarks', [])
    return v1.map((b) => ({ id: uid('bm'), title: b.title, url: b.url }))
  })
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const v2 = loadJson<HistoryEntry[]>(HIST_KEY, [])
    if (v2.length) return v2
    const v1 = loadJson<{ title: string; url: string; at: number }[]>('tricass-desk-history', [])
    return v1.map((h) => ({ id: uid('h'), title: h.title, url: h.url, at: h.at }))
  })
  const [panel, setPanel] = useState<'none' | 'bookmarks' | 'history'>('none')
  const [histQuery, setHistQuery] = useState('')
  const [status, setStatus] = useState('Ready')
  const omniboxRef = useRef<HTMLInputElement>(null)
  const webRef = useRef<WebviewEl | null>(null)
  const inElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

  const isBookmarked = bookmarks.some((b) => b.url === active.url && active.url !== HOME_URL)

  const patchTab = useCallback((id: string, partial: Partial<Tab>): void => {
    setTabs((list) => list.map((t) => (t.id === id ? { ...t, ...partial } : t)))
  }, [])

  useEffect(() => {
    setDraft(active.url === HOME_URL ? '' : active.url)
    setShowDial(active.url === HOME_URL)
  }, [active.url, activeId])

  useEffect(() => {
    localStorage.setItem(BM_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])
  useEffect(() => {
    localStorage.setItem(HIST_KEY, JSON.stringify(history.slice(0, 120)))
  }, [history])

  useEffect(() => {
    const el = webRef.current
    if (!el || !inElectron || showDial) return

    const onStart = (): void => {
      patchTab(activeId, { loading: true, error: undefined })
      setStatus('Loading…')
    }
    const onStop = (): void => {
      patchTab(activeId, {
        loading: false,
        canBack: el.canGoBack?.() ?? false,
        canForward: el.canGoForward?.() ?? false
      })
      setStatus('Ready')
    }
    const onNavigate = (e: Event): void => {
      const url = (e as unknown as { url?: string }).url || el.getURL?.() || active.url
      if (!url || url === 'about:blank') return
      patchTab(activeId, {
        url,
        title: hostLabel(url),
        canBack: el.canGoBack?.() ?? false,
        canForward: el.canGoForward?.() ?? false
      })
      setDraft(url)
      setHistory((h) => {
        if (h[0]?.url === url) return h
        return [
          { id: uid('h'), title: hostLabel(url), url, at: Date.now() },
          ...h.filter((x) => x.url !== url)
        ].slice(0, 120)
      })
    }
    const onTitle = (e: Event): void => {
      const titleText = (e as unknown as { title?: string }).title || el.getTitle?.()
      if (titleText) patchTab(activeId, { title: titleText.slice(0, 48) })
    }
    const onFail = (e: Event): void => {
      const err = (e as unknown as { errorDescription?: string; validatedURL?: string })
        .errorDescription
      patchTab(activeId, {
        loading: false,
        error: err || 'Failed to load page'
      })
      setStatus(err || 'Load failed')
    }

    el.addEventListener('did-start-loading', onStart)
    el.addEventListener('did-stop-loading', onStop)
    el.addEventListener('did-navigate', onNavigate)
    el.addEventListener('did-navigate-in-page', onNavigate)
    el.addEventListener('page-title-updated', onTitle)
    el.addEventListener('did-fail-load', onFail)
    try {
      if (el.src !== active.url) el.src = active.url
    } catch {
      /* ignore */
    }

    return () => {
      el.removeEventListener('did-start-loading', onStart)
      el.removeEventListener('did-stop-loading', onStop)
      el.removeEventListener('did-navigate', onNavigate)
      el.removeEventListener('did-navigate-in-page', onNavigate)
      el.removeEventListener('page-title-updated', onTitle)
      el.removeEventListener('did-fail-load', onFail)
    }
  }, [active.url, activeId, showDial, inElectron, patchTab])

  const go = (next: string, opts?: { fromDial?: boolean }): void => {
    const final = normalizeUrl(next)
    const titleText = final === HOME_URL ? 'New Tab' : hostLabel(final)
    setTabs((list) =>
      list.map((t) =>
        t.id === activeId
          ? { ...t, url: final, title: titleText, loading: final !== HOME_URL, error: undefined }
          : t
      )
    )
    setShowDial(final === HOME_URL)
    setDraft(final === HOME_URL ? '' : final)
    if (final !== HOME_URL) {
      setHistory((h) =>
        [
          { id: uid('h'), title: titleText, url: final, at: Date.now() },
          ...h.filter((x) => x.url !== final)
        ].slice(0, 120)
      )
    }
    setStatus(opts?.fromDial ? `Opening ${titleText}` : 'Navigating…')
    void window.desk?.noteActivity()
  }

  const addTab = (): void => {
    const id = uid('t')
    setTabs((t) => [...t, { id, title: 'New Tab', url: HOME_URL }])
    setActiveId(id)
    setShowDial(true)
    setPanel('none')
    setStatus('New tab')
  }

  const closeTab = (id: string): void => {
    setTabs((list) => {
      if (list.length <= 1) {
        const fresh = uid('t')
        setActiveId(fresh)
        setShowDial(true)
        return [{ id: fresh, title: 'New Tab', url: HOME_URL }]
      }
      const next = list.filter((x) => x.id !== id)
      if (id === activeId) {
        const idx = list.findIndex((x) => x.id === id)
        const fallback = next[Math.max(0, idx - 1)] || next[0]!
        setActiveId(fallback.id)
      }
      return next
    })
  }

  const toggleBookmark = (): void => {
    if (active.url === HOME_URL) return
    setBookmarks((list) => {
      if (list.some((b) => b.url === active.url)) {
        setStatus('Bookmark removed')
        return list.filter((b) => b.url !== active.url)
      }
      setStatus('Bookmark saved')
      return [
        ...list,
        { id: uid('bm'), title: active.title || hostLabel(active.url), url: active.url }
      ]
    })
  }

  const removeBookmark = (id: string): void => {
    setBookmarks((list) => list.filter((b) => b.id !== id))
  }

  const clearHistory = (): void => {
    setHistory([])
    setStatus('History cleared')
  }

  const filteredHistory = useMemo(() => {
    const q = histQuery.trim().toLowerCase()
    if (!q) return history
    return history.filter(
      (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
    )
  }, [history, histQuery])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 't') {
        e.preventDefault()
        addTab()
      } else if (meta && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        closeTab(activeId)
      } else if (meta && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        omniboxRef.current?.focus()
        omniboxRef.current?.select()
      } else if (meta && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        if (active.loading) webRef.current?.stop()
        else webRef.current?.reload()
      } else if (meta && e.key === 'd') {
        e.preventDefault()
        toggleBookmark()
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        webRef.current?.goBack()
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        webRef.current?.goForward()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, active.loading, active.url, active.title])

  const subtitle = useMemo(
    () => mode || `${tabs.length} tab${tabs.length === 1 ? '' : 's'} · ${status}`,
    [mode, tabs.length, status]
  )

  return (
    <GlassFrame
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      embedded
      actions={
        <>
          <button
            type="button"
            className={`btn btn-ghost ${panel === 'bookmarks' ? 'on' : ''}`}
            aria-pressed={panel === 'bookmarks'}
            title="Manage bookmarks"
            onClick={() => setPanel((p) => (p === 'bookmarks' ? 'none' : 'bookmarks'))}
          >
            Bookmarks
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${panel === 'history' ? 'on' : ''}`}
            aria-pressed={panel === 'history'}
            title="History"
            onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}
          >
            History
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            title="Open in system browser"
            disabled={active.url === HOME_URL}
            onClick={() => void window.desk?.openExternal(active.url)}
          >
            System
          </button>
        </>
      }
    >
      <div className="browser-tabs" role="tablist" aria-label="Browser tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === activeId}
            className={`browser-tab ${t.id === activeId ? 'on' : ''} ${t.loading ? 'loading' : ''}`}
            onClick={() => setActiveId(t.id)}
            title={t.url}
          >
            <span className="browser-tab-title">{t.loading ? '… ' : ''}{t.title}</span>
            <span
              className="tab-x"
              role="button"
              tabIndex={0}
              aria-label={`Close ${t.title}`}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(t.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  closeTab(t.id)
                }
              }}
            >
              ×
            </span>
          </button>
        ))}
        <button type="button" className="browser-tab add" onClick={addTab} title="New tab (Ctrl+T)">
          +
        </button>
      </div>

      <div className="browser-chrome" role="navigation" aria-label="Browser navigation">
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Back"
          disabled={!active.canBack}
          onClick={() => webRef.current?.goBack()}
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Forward"
          disabled={!active.canForward}
          onClick={() => webRef.current?.goForward()}
        >
          →
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label={active.loading ? 'Stop' : 'Reload'}
          onClick={() => {
            if (active.loading) webRef.current?.stop()
            else if (showDial) go(active.url === HOME_URL ? DIAL[0]!.url : active.url)
            else webRef.current?.reload()
          }}
        >
          {active.loading ? '■' : '↻'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          aria-label="Home"
          onClick={() => go(HOME_URL)}
        >
          ⌂
        </button>
        <div className="browser-omnibox">
          <span className="browser-omnibox-scheme" aria-hidden>
            {active.url.startsWith('https://') ? '🔒' : active.url.startsWith('http://') ? 'ⓘ' : '◇'}
          </span>
          <input
            ref={omniboxRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go(draft)
            }}
            placeholder="Search or enter address"
            aria-label="Address bar"
            spellCheck={false}
          />
          <button
            type="button"
            className={`btn btn-ghost browser-star ${isBookmarked ? 'on' : ''}`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            aria-pressed={isBookmarked}
            disabled={active.url === HOME_URL}
            onClick={toggleBookmark}
            title="Bookmark (Ctrl+D)"
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </div>
        <button type="button" className="btn" onClick={() => go(draft)}>
          Go
        </button>
      </div>

      {bookmarks.length > 0 ? (
        <div className="browser-bookmark-bar" aria-label="Bookmarks bar">
          {bookmarks.slice(0, 12).map((b) => (
            <button
              key={b.id}
              type="button"
              className="browser-bm-chip"
              title={b.url}
              onClick={() => go(b.url)}
            >
              {b.title || hostLabel(b.url)}
            </button>
          ))}
          {bookmarks.length > 12 ? (
            <button
              type="button"
              className="browser-bm-chip more"
              onClick={() => setPanel('bookmarks')}
            >
              +{bookmarks.length - 12} more
            </button>
          ) : null}
        </div>
      ) : null}

      {active.loading ? <div className="browser-progress" aria-hidden /> : null}

      {panel === 'bookmarks' ? (
        <div className="browser-panel" role="region" aria-label="Bookmarks">
          <div className="browser-panel-head">
            <strong>Bookmarks</strong>
            <span className="status-line">{bookmarks.length} saved</span>
          </div>
          {bookmarks.length === 0 ? (
            <p className="status-line">No bookmarks yet — star a page or press Ctrl+D.</p>
          ) : (
            bookmarks.map((item) => (
              <div key={item.id} className="browser-panel-row">
                <button type="button" className="browser-panel-open" onClick={() => go(item.url)}>
                  <strong>{item.title}</strong>
                  <span>{item.url}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Remove bookmark"
                  onClick={() => removeBookmark(item.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      {panel === 'history' ? (
        <div className="browser-panel" role="region" aria-label="History">
          <div className="browser-panel-head">
            <strong>History</strong>
            <input
              className="browser-hist-search"
              placeholder="Search history…"
              value={histQuery}
              onChange={(e) => setHistQuery(e.target.value)}
              aria-label="Search history"
            />
            <button type="button" className="btn btn-ghost" onClick={clearHistory}>
              Clear
            </button>
          </div>
          {filteredHistory.length === 0 ? (
            <p className="status-line">No history yet.</p>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="browser-panel-row">
                <button type="button" className="browser-panel-open" onClick={() => go(item.url)}>
                  <strong>{item.title}</strong>
                  <span>
                    {item.url} · {formatWhen(item.at)}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Remove from history"
                  onClick={() => setHistory((h) => h.filter((x) => x.id !== item.id))}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      {showDial ? (
        <div className="speed-dial" aria-label="New tab speed dial">
          <p className="speed-dial-hint">New Tab — pick a destination or type in the address bar</p>
          {DIAL.map((d) => (
            <button
              key={d.url}
              type="button"
              onClick={() => go(d.url, { fromDial: true })}
              style={{ '--dial-tone': d.tone } as React.CSSProperties}
            >
              <i style={{ background: d.tone }} aria-hidden />
              {d.label}
            </button>
          ))}
        </div>
      ) : active.error ? (
        <div className="browser-error">
          <strong>Couldn’t load this page</strong>
          <p>{active.error}</p>
          <button type="button" className="btn" onClick={() => go(active.url)}>
            Retry
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => go(HOME_URL)}>
            Home
          </button>
        </div>
      ) : inElectron ? (
        <webview
          ref={webRef as unknown as React.RefObject<HTMLWebViewElement>}
          className="browser-webview"
          src={active.url}
          // @ts-expect-error Electron attr
          allowpopups="true"
        />
      ) : (
        <iframe
          className="browser-webview"
          src={active.url === HOME_URL ? undefined : active.url}
          title="browse"
        />
      )}
    </GlassFrame>
  )
}
