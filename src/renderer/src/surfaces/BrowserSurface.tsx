import { useEffect, useMemo, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Tab = { id: string; title: string; url: string }

const DIAL = [
  { label: 'Ollama', url: 'http://127.0.0.1:11434', tone: '#7ad7ff' },
  { label: 'Local', url: 'http://127.0.0.1:3000', tone: '#ff9a5c' },
  { label: 'Docs', url: 'https://developer.mozilla.org', tone: '#7dffc8' },
  { label: 'Wiki', url: 'https://en.wikipedia.org', tone: '#c9a0ff' },
  { label: 'Desk', url: 'https://github.com/leecee056-bot/Tri-Cass-Desk', tone: '#ffe07a' },
  { label: 'Blank', url: 'about:blank', tone: '#a8b4d0' }
]

const BM_KEY = 'tricass-desk-bookmarks'
const HIST_KEY = 'tricass-desk-history'

type Props = {
  title?: string
  initialUrl?: string
  mode?: string
  onClose?: () => void
}

type WebviewEl = HTMLElement & {
  src: string
  goBack: () => void
  goForward: () => void
  reload: () => void
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T
  } catch {
    return fallback
  }
}

export default function BrowserSurface({
  title = 'Glass Browser',
  initialUrl = 'about:blank',
  mode,
  onClose
}: Props): React.JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 't1', title: 'New Tab', url: initialUrl }
  ])
  const [activeId, setActiveId] = useState('t1')
  const active = tabs.find((t) => t.id === activeId) || tabs[0]!
  const [draft, setDraft] = useState(active.url)
  const [showDial, setShowDial] = useState(active.url === 'about:blank')
  const [bookmarks, setBookmarks] = useState<{ title: string; url: string }[]>(() =>
    loadJson(BM_KEY, [])
  )
  const [history, setHistory] = useState<{ title: string; url: string; at: number }[]>(() =>
    loadJson(HIST_KEY, [])
  )
  const [panel, setPanel] = useState<'none' | 'bookmarks' | 'history'>('none')
  const webRef = useRef<WebviewEl | null>(null)
  const inElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

  useEffect(() => {
    setDraft(active.url)
    setShowDial(active.url === 'about:blank')
  }, [active.url, activeId])

  useEffect(() => {
    localStorage.setItem(BM_KEY, JSON.stringify(bookmarks))
  }, [bookmarks])
  useEffect(() => {
    localStorage.setItem(HIST_KEY, JSON.stringify(history.slice(0, 80)))
  }, [history])

  useEffect(() => {
    const el = webRef.current
    if (!el || !active.url || showDial) return
    try {
      el.src = active.url
    } catch {
      /* ignore */
    }
  }, [active.url, activeId, showDial])

  const go = (next: string): void => {
    const trimmed = next.trim()
    const final =
      /^https?:\/\//i.test(trimmed) || trimmed.startsWith('about:')
        ? trimmed
        : `https://${trimmed}`
    setTabs((list) =>
      list.map((t) =>
        t.id === activeId ? { ...t, url: final, title: final.replace(/^https?:\/\//, '').slice(0, 28) } : t
      )
    )
    setShowDial(false)
    setHistory((h) => [{ title: final, url: final, at: Date.now() }, ...h].slice(0, 80))
    void window.desk?.noteActivity()
  }

  const addTab = (): void => {
    const id = `t${Date.now()}`
    setTabs((t) => [...t, { id, title: 'New Tab', url: 'about:blank' }])
    setActiveId(id)
    setShowDial(true)
  }

  const subtitle = useMemo(() => mode || `${tabs.length} tabs · local bookmarks`, [mode, tabs.length])

  return (
    <GlassFrame
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      embedded
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setPanel((p) => (p === 'bookmarks' ? 'none' : 'bookmarks'))}>
            ★
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPanel((p) => (p === 'history' ? 'none' : 'history'))}>
            Hist
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setBookmarks((b) =>
                b.some((x) => x.url === active.url)
                  ? b
                  : [...b, { title: active.title, url: active.url }]
              )
            }
          >
            Save ★
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void window.desk?.openExternal(active.url)}
          >
            System
          </button>
        </>
      }
    >
      <div className="browser-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`browser-tab ${t.id === activeId ? 'on' : ''}`}
            onClick={() => setActiveId(t.id)}
          >
            {t.title}
            {tabs.length > 1 ? (
              <span
                className="tab-x"
                onClick={(e) => {
                  e.stopPropagation()
                  setTabs((list) => {
                    const next = list.filter((x) => x.id !== t.id)
                    if (t.id === activeId && next[0]) setActiveId(next[0].id)
                    return next
                  })
                }}
              >
                ×
              </span>
            ) : null}
          </button>
        ))}
        <button type="button" className="browser-tab add" onClick={addTab}>
          +
        </button>
      </div>
      <div className="browser-chrome">
        <button type="button" className="btn btn-ghost" onClick={() => webRef.current?.goBack()}>
          ←
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => webRef.current?.goForward()}>
          →
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => webRef.current?.reload()}>
          ↻
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go(draft)
          }}
          placeholder="Search or URL"
        />
        <button type="button" className="btn" onClick={() => go(draft)}>
          Go
        </button>
      </div>
      {panel === 'bookmarks' ? (
        <div className="file-list" style={{ maxHeight: 120 }}>
          {bookmarks.map((item, i) => (
            <div key={`${item.url}-${i}`} className="file-row" onClick={() => go(item.url)}>
              <span>{item.title}</span>
              <span>{item.url.replace(/^https?:\/\//, '').slice(0, 32)}</span>
            </div>
          ))}
          {bookmarks.length === 0 ? <p className="status-line">No bookmarks yet.</p> : null}
        </div>
      ) : null}
      {panel === 'history' ? (
        <div className="file-list" style={{ maxHeight: 120 }}>
          {history.map((item, i) => (
            <div key={`${item.url}-${i}`} className="file-row" onClick={() => go(item.url)}>
              <span>{item.title}</span>
              <span>{item.url.replace(/^https?:\/\//, '').slice(0, 32)}</span>
            </div>
          ))}
          {history.length === 0 ? <p className="status-line">No history yet.</p> : null}
        </div>
      ) : null}
      {showDial ? (
        <div className="speed-dial">
          {DIAL.map((d) => (
            <button
              key={d.url}
              type="button"
              onClick={() => go(d.url)}
              style={{ '--dial-tone': d.tone } as React.CSSProperties}
            >
              <i style={{ background: d.tone }} aria-hidden />
              {d.label}
            </button>
          ))}
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
          src={active.url === 'about:blank' ? undefined : active.url}
          title="browse"
        />
      )}
    </GlassFrame>
  )
}
