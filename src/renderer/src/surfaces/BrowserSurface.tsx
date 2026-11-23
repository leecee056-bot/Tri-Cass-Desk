import { useEffect, useRef, useState } from 'react'
import GlassFrame from './GlassFrame'
import './surfaces.css'

const DIAL = [
  { label: 'Ollama', url: 'http://127.0.0.1:11434' },
  { label: 'Localhost', url: 'http://127.0.0.1:3000' },
  { label: 'Desk repo', url: 'https://github.com/leecee056-bot/Tri-Cass-Desk' },
  { label: 'MDN', url: 'https://developer.mozilla.org' },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { label: 'Blank', url: 'about:blank' }
]

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

export default function BrowserSurface({
  title = 'Glass Browser',
  initialUrl = 'about:blank',
  mode,
  onClose
}: Props): React.JSX.Element {
  const [url, setUrl] = useState(initialUrl)
  const [draft, setDraft] = useState(initialUrl)
  const [showDial, setShowDial] = useState(initialUrl === 'about:blank')
  const webRef = useRef<WebviewEl | null>(null)
  const inElectron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)

  useEffect(() => {
    const el = webRef.current
    if (!el || !url) return
    try {
      el.src = url
    } catch {
      /* ignore */
    }
  }, [url])

  const go = (next: string): void => {
    const trimmed = next.trim()
    const final =
      /^https?:\/\//i.test(trimmed) || trimmed.startsWith('about:')
        ? trimmed
        : `https://${trimmed}`
    setDraft(final)
    setUrl(final)
    setShowDial(false)
    void window.desk?.noteActivity()
  }

  return (
    <GlassFrame
      title={title}
      subtitle={mode || 'in-desk browser · glass chrome'}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setShowDial(true)}>
            Tabs
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void window.desk?.openExternal(url)}
          >
            System
          </button>
        </>
      }
    >
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
      {showDial ? (
        <div className="speed-dial">
          {DIAL.map((d) => (
            <button key={d.url} type="button" onClick={() => go(d.url)}>
              {d.label}
            </button>
          ))}
        </div>
      ) : inElectron ? (
        <webview
          ref={webRef as unknown as React.RefObject<HTMLWebViewElement>}
          className="browser-webview"
          src={url}
          // @ts-expect-error allowpopups is Electron webview attribute
          allowpopups="true"
        />
      ) : (
        <iframe
          className="browser-webview"
          src={url === 'about:blank' ? undefined : url}
          title="browse"
        />
      )}
    </GlassFrame>
  )
}
