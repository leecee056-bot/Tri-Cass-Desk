import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Papa from 'papaparse'
import { v4 as uuidv4 } from 'uuid'
import type { EnvironmentState } from '../../../../shared/environment'
import type { ToolEntry } from '../catalog'
import '../../features/features.css'

type Props = {
  tool: ToolEntry
  state: EnvironmentState
}

/** Dedicated engines for HAP-79 Top-20 tools. */
export default function DeepTools({ tool }: Props): React.JSX.Element {
  switch (tool.id) {
    case 'dev-uuid-generator':
      return <UuidEngine />
    case 'dev-hash-checksum':
      return <HashEngine />
    case 'dev-base64-url':
      return <Base64UrlEngine />
    case 'dev-json-studio':
      return <JsonEngine />
    case 'dev-regex-lab':
      return <RegexEngine />
    case 'dev-diff-viewer':
      return <DiffEngine />
    case 'cre-color-tools':
      return <ColorEngine />
    case 'sec-password-generator':
      return <PasswordEngine />
    case 'sys-clipboard-shelf':
      return <ClipboardShelfEngine />
    case 'dev-unix-timestamp':
      return <TimestampEngine />
    case 'kno-markdown-desk':
      return <MarkdownEngine />
    case 'dev-csv-studio':
      return <CsvEngine />
    case 'dev-jwt-decode':
      return <JwtEngine />
    case 'dev-cron-builder':
      return <CronEngine />
    case 'dev-case-converter':
      return <CaseEngine />
    case 'sys-process-monitor':
      return <LiveTableEngine mode="process" />
    case 'sys-port-inspector':
      return <LiveTableEngine mode="port" />
    case 'sys-focus-timer':
      return <FocusTimerEngine />
    case 'dev-word-count':
      return <WordCountEngine />
    case 'dev-slugify':
      return <SlugifyEngine />
    default:
      return (
        <p className="status-line">
          {tool.name} is listed as Top-20 but has no deep engine yet.
        </p>
      )
  }
}

function copyOut(text: string): void {
  void window.desk?.clipboardWrite(text)
}

function UuidEngine(): React.JSX.Element {
  const [list, setList] = useState<string[]>(() => [uuidv4()])
  const regen = (n: number): void => {
    setList(Array.from({ length: n }, () => uuidv4()))
  }
  return (
    <div className="tool-stack">
      <p className="status-line">UUID v4 · local crypto · batch generate</p>
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={() => regen(1)}>
          One
        </button>
        <button type="button" className="btn" onClick={() => regen(5)}>
          5
        </button>
        <button type="button" className="btn" onClick={() => regen(20)}>
          20
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => copyOut(list.join('\n'))}>
          Copy all
        </button>
      </div>
      <pre className="mono-out">{list.join('\n')}</pre>
    </div>
  )
}

function HashEngine(): React.JSX.Element {
  const [text, setText] = useState('Tri-Cass Desk')
  const [algo, setAlgo] = useState<'sha256' | 'sha1' | 'md5'>('sha256')
  const [out, setOut] = useState('')
  const run = (): void => {
    void window.desk?.hashText(text, algo).then(setOut)
  }
  return (
    <div className="tool-stack">
      <p className="status-line">Local hash via Desk IPC (no network)</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="feature-toolbar">
        <select value={algo} onChange={(e) => setAlgo(e.target.value as typeof algo)} aria-label="Algorithm">
          <option value="sha256">SHA-256</option>
          <option value="sha1">SHA-1</option>
          <option value="md5">MD5</option>
        </select>
        <button type="button" className="btn" onClick={run}>
          Hash
        </button>
        <button type="button" className="btn btn-ghost" disabled={!out} onClick={() => copyOut(out)}>
          Copy
        </button>
      </div>
      <pre className="mono-out">{out || '—'}</pre>
    </div>
  )
}

function Base64UrlEngine(): React.JSX.Element {
  const [text, setText] = useState('Tri-Cass Desk')
  const [out, setOut] = useState('')
  const encB64 = (): void => {
    try {
      setOut(btoa(unescape(encodeURIComponent(text))))
    } catch (e) {
      setOut(e instanceof Error ? e.message : String(e))
    }
  }
  const decB64 = (): void => {
    try {
      setOut(decodeURIComponent(escape(atob(text))))
    } catch (e) {
      setOut(e instanceof Error ? e.message : String(e))
    }
  }
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={encB64}>
          Base64 encode
        </button>
        <button type="button" className="btn" onClick={decB64}>
          Base64 decode
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOut(encodeURIComponent(text))}>
          URL encode
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            try {
              setOut(decodeURIComponent(text))
            } catch (e) {
              setOut(e instanceof Error ? e.message : String(e))
            }
          }}
        >
          URL decode
        </button>
      </div>
      <pre className="mono-out">{out || '—'}</pre>
    </div>
  )
}

function JsonEngine(): React.JSX.Element {
  const [text, setText] = useState('{"desk":"tri-cass","ok":true}')
  const [out, setOut] = useState('')
  const formatJson = (): void => {
    try {
      setOut(JSON.stringify(JSON.parse(text), null, 2))
    } catch (e) {
      setOut(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  const minify = (): void => {
    try {
      setOut(JSON.stringify(JSON.parse(text)))
    } catch (e) {
      setOut(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={formatJson}>
          Format
        </button>
        <button type="button" className="btn" onClick={minify}>
          Minify
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            try {
              JSON.parse(text)
              setOut('Valid JSON ✓')
            } catch (e) {
              setOut(`Invalid: ${e instanceof Error ? e.message : String(e)}`)
            }
          }}
        >
          Validate
        </button>
      </div>
      <pre className="mono-out">{out || '—'}</pre>
    </div>
  )
}

function RegexEngine(): React.JSX.Element {
  const [pattern, setPattern] = useState('\\w+')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('Tri-Cass living desk tools')
  const result = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags)
      const matches = [...text.matchAll(re)].map((m) => ({
        match: m[0],
        index: m.index,
        groups: m.slice(1)
      }))
      return JSON.stringify({ count: matches.length, matches }, null, 2)
    } catch (e) {
      return e instanceof Error ? e.message : String(e)
    }
  }, [pattern, flags, text])
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="Pattern" placeholder="pattern" />
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          aria-label="Flags"
          placeholder="flags"
          style={{ maxWidth: 72 }}
        />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <pre className="mono-out">{result}</pre>
    </div>
  )
}

function DiffEngine(): React.JSX.Element {
  const [a, setA] = useState('one\ntwo\nthree')
  const [b, setB] = useState('one\ntwo!\nthree\nfour')
  const diff = useMemo(() => {
    const L = a.split('\n')
    const R = b.split('\n')
    const max = Math.max(L.length, R.length)
    const lines: string[] = []
    for (let i = 0; i < max; i++) {
      if ((L[i] ?? '') === (R[i] ?? '')) lines.push(`  ${L[i] ?? ''}`)
      else {
        if (L[i] != null) lines.push(`- ${L[i]}`)
        if (R[i] != null) lines.push(`+ ${R[i]}`)
      }
    }
    return lines.join('\n')
  }, [a, b])
  return (
    <div className="split-2">
      <textarea value={a} onChange={(e) => setA(e.target.value)} aria-label="Left" />
      <textarea value={b} onChange={(e) => setB(e.target.value)} aria-label="Right" />
      <pre className="mono-out" style={{ gridColumn: '1 / -1' }}>
        {diff}
      </pre>
    </div>
  )
}

function ColorEngine(): React.JSX.Element {
  const [hex, setHex] = useState('#7ad7ff')
  const rgb = useMemo(() => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return null
    const n = parseInt(m[1]!, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }, [hex])
  return (
    <div className="tool-stack">
      <p className="status-line">Color tools · local preview (does not mutate Desk chrome)</p>
      <div className="feature-toolbar">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Color" />
        <input value={hex} onChange={(e) => setHex(e.target.value)} aria-label="Hex" />
        <button type="button" className="btn btn-ghost" onClick={() => copyOut(hex)}>
          Copy hex
        </button>
      </div>
      <div
        style={{
          height: 96,
          borderRadius: 12,
          background: hex,
          border: '1px solid rgba(255,255,255,0.15)'
        }}
      />
      <pre className="mono-out">
        {rgb
          ? `hex ${hex}\nrgb(${rgb.r}, ${rgb.g}, ${rgb.b})\ncss: color: ${hex};`
          : 'Enter a #RRGGBB value'}
      </pre>
    </div>
  )
}

function PasswordEngine(): React.JSX.Element {
  const [len, setLen] = useState(20)
  const [symbols, setSymbols] = useState(true)
  const [out, setOut] = useState('')
  const gen = (): void => {
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const digits = '23456789'
    const sym = '!@#$%^&*-_=+'
    const alphabet = lower + upper + digits + (symbols ? sym : '')
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    setOut(Array.from(bytes, (b) => alphabet[b % alphabet.length]).join(''))
  }
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <label className="status-line">
          Length{' '}
          <input
            type="number"
            min={8}
            max={64}
            value={len}
            onChange={(e) => setLen(Math.max(8, Math.min(64, Number(e.target.value) || 20)))}
            style={{ width: 64 }}
          />
        </label>
        <label className="status-line">
          <input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} />{' '}
          Symbols
        </label>
        <button type="button" className="btn" onClick={gen}>
          Generate
        </button>
        <button type="button" className="btn btn-ghost" disabled={!out} onClick={() => copyOut(out)}>
          Copy
        </button>
      </div>
      <div className="mono-out" style={{ fontSize: '1.1rem' }}>
        {out || '—'}
      </div>
    </div>
  )
}

function ClipboardShelfEngine(): React.JSX.Element {
  const KEY = 'tricass-desk-clip-shelf-v1'
  const [shelf, setShelf] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]') as string[]
    } catch {
      return []
    }
  })
  const [current, setCurrent] = useState('')
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(shelf.slice(0, 40)))
  }, [shelf])
  const read = async (): Promise<void> => {
    const t = (await window.desk?.clipboardRead()) || ''
    setCurrent(t)
    if (t.trim()) setShelf((s) => [t, ...s.filter((x) => x !== t)].slice(0, 40))
  }
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={() => void read()}>
          Read clipboard
        </button>
        <button type="button" className="btn" onClick={() => void window.desk?.clipboardWrite(current)}>
          Write current
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShelf([])}>
          Clear shelf
        </button>
      </div>
      <textarea value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current clip…" />
      <div className="file-list" style={{ maxHeight: 180 }}>
        {shelf.map((item, i) => (
          <div key={`${i}-${item.slice(0, 12)}`} className="file-row">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => {
                setCurrent(item)
                void window.desk?.clipboardWrite(item)
              }}
            >
              {item.slice(0, 80)}
              {item.length > 80 ? '…' : ''}
            </button>
          </div>
        ))}
        {shelf.length === 0 ? <p className="status-line">Shelf empty — Read clipboard to pin entries.</p> : null}
      </div>
    </div>
  )
}

function TimestampEngine(): React.JSX.Element {
  const [ms, setMs] = useState(() => String(Date.now()))
  const [iso, setIso] = useState(() => new Date().toISOString())
  const fromMs = (): void => {
    const n = Number(ms)
    if (!Number.isFinite(n)) return
    const d = new Date(n < 1e12 ? n * 1000 : n)
    setIso(d.toISOString())
  }
  const fromIso = (): void => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return
    setMs(String(d.getTime()))
  }
  const now = (): void => {
    const d = new Date()
    setMs(String(d.getTime()))
    setIso(d.toISOString())
  }
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={now}>
          Now
        </button>
        <button type="button" className="btn btn-ghost" onClick={fromMs}>
          ms → ISO
        </button>
        <button type="button" className="btn btn-ghost" onClick={fromIso}>
          ISO → ms
        </button>
      </div>
      <label className="status-line">
        Epoch ms
        <input value={ms} onChange={(e) => setMs(e.target.value)} />
      </label>
      <label className="status-line">
        ISO
        <input value={iso} onChange={(e) => setIso(e.target.value)} />
      </label>
      <pre className="mono-out">
        {(() => {
          const n = Number(ms)
          if (!Number.isFinite(n)) return '—'
          const d = new Date(n < 1e12 ? n * 1000 : n)
          return Number.isNaN(d.getTime()) ? 'Invalid' : format(d, 'PPpp')
        })()}
      </pre>
    </div>
  )
}

function MarkdownEngine(): React.JSX.Element {
  const [text, setText] = useState('# Tri-Cass Desk\n\nLocal **markdown** preview.')
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(text) as string), [text])
  return (
    <div className="split-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Markdown" />
      <div className="chat-log" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function CsvEngine(): React.JSX.Element {
  const [csv, setCsv] = useState('name,value\ncpu,12\nram,34\ngpu,8')
  const parsed = useMemo(() => Papa.parse<Record<string, string>>(csv, { header: true }), [csv])
  return (
    <div className="split-2">
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} aria-label="CSV" />
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {(parsed.meta.fields || []).map((f) => (
                <th key={f}>{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(parsed.data || []).slice(0, 60).map((row, i) => (
              <tr key={i}>
                {(parsed.meta.fields || []).map((f) => (
                  <td key={f}>{row[f]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function JwtEngine(): React.JSX.Element {
  const [token, setToken] = useState(
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJkZXNrIiwibmFtZSI6IlRyaS1DYXNzIn0.'
  )
  const decoded = useMemo(() => {
    try {
      const parts = token.trim().split('.')
      if (parts.length < 2) return { error: 'Need header.payload[.sig]' }
      const decode = (p: string): unknown => {
        const pad = p.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
          escape(atob(pad.padEnd(pad.length + ((4 - (pad.length % 4)) % 4), '=')))
        )
        return JSON.parse(json)
      }
      return {
        header: decode(parts[0]!),
        payload: decode(parts[1]!),
        signature: parts[2] || '(none)'
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [token])
  return (
    <div className="tool-stack">
      <p className="status-line">JWT decode only · no signature verify · offline</p>
      <textarea value={token} onChange={(e) => setToken(e.target.value)} rows={4} />
      <pre className="mono-out">{JSON.stringify(decoded, null, 2)}</pre>
    </div>
  )
}

function CronEngine(): React.JSX.Element {
  const [expr, setExpr] = useState('*/5 * * * *')
  const parts = expr.trim().split(/\s+/)
  const labels = ['minute', 'hour', 'day-of-month', 'month', 'day-of-week']
  const explain = useMemo(() => {
    if (parts.length < 5) return 'Cron needs 5 fields: m h dom mon dow'
    return parts
      .slice(0, 5)
      .map((p, i) => `${labels[i]}: ${p === '*' ? 'every' : p}`)
      .join('\n')
  }, [expr])
  const presets = [
    { label: 'Every 5 min', value: '*/5 * * * *' },
    { label: 'Hourly', value: '0 * * * *' },
    { label: 'Daily 9am', value: '0 9 * * *' },
    { label: 'Weekdays 9am', value: '0 9 * * 1-5' }
  ]
  return (
    <div className="tool-stack">
      <p className="status-line">Cron builder · 5-field explain (local helper)</p>
      <input value={expr} onChange={(e) => setExpr(e.target.value)} aria-label="Cron expression" />
      <div className="feature-toolbar">
        {presets.map((p) => (
          <button key={p.value} type="button" className="btn btn-ghost" onClick={() => setExpr(p.value)}>
            {p.label}
          </button>
        ))}
      </div>
      <pre className="mono-out">{explain}</pre>
    </div>
  )
}

function CaseEngine(): React.JSX.Element {
  const [text, setText] = useState('Tri Cass Desk Living Companion')
  const camel = text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => (i === 0 ? c.toLowerCase() : c.toUpperCase()))
    .replace(/\s+/g, '')
  const snake = text.trim().toLowerCase().replace(/\s+/g, '_')
  const kebab = text.trim().toLowerCase().replace(/\s+/g, '-')
  const constant = text.trim().toUpperCase().replace(/\s+/g, '_')
  const title = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <pre className="mono-out">
        {`camelCase: ${camel}
snake_case: ${snake}
kebab-case: ${kebab}
CONSTANT: ${constant}
Title Case: ${title}
lower: ${text.toLowerCase()}
UPPER: ${text.toUpperCase()}`}
      </pre>
    </div>
  )
}

function WordCountEngine(): React.JSX.Element {
  const [text, setText] = useState('Tri-Cass Desk — local companion tools.')
  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.length ? text.split('\n').length : 0
    const sentences = (text.match(/[.!?]+/g) || []).length
    return { chars, charsNoSpace, words, lines, sentences }
  }, [text])
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
      <pre className="mono-out">
        {`words: ${stats.words}
characters: ${stats.chars}
characters (no spaces): ${stats.charsNoSpace}
lines: ${stats.lines}
sentences ≈ ${stats.sentences}`}
      </pre>
    </div>
  )
}

function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function SlugifyEngine(): React.JSX.Element {
  const [text, setText] = useState('Tri-Cass Desk Living Companion!')
  const out = slugify(text)
  return (
    <div className="tool-stack">
      <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Input" />
      <pre className="mono-out">{out || '—'}</pre>
      <button type="button" className="btn" onClick={() => copyOut(out)}>
        Copy slug
      </button>
    </div>
  )
}

function LiveTableEngine({ mode }: { mode: 'process' | 'port' }): React.JSX.Element {
  const [rows, setRows] = useState<Array<Record<string, string | number>>>([])
  const [status, setStatus] = useState('Loading…')
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.desk) {
        setStatus('Desk APIs unavailable')
        return
      }
      if (mode === 'port') {
        const ports = await window.desk.ports()
        setRows(
          ports.slice(0, 60).map((p) => ({
            proto: p.protocol,
            local: `${p.localAddress}:${p.localPort}`,
            state: p.state,
            proc: p.process || p.pid || ''
          }))
        )
        setStatus(`${ports.length} ports`)
      } else {
        const procs = await window.desk.processes()
        setRows(
          procs.slice(0, 60).map((p) => ({
            name: p.name,
            pid: p.pid,
            cpu: p.cpu.toFixed(1),
            mem: Math.round(p.mem)
          }))
        )
        setStatus(`${procs.length} processes`)
      }
    }
    void load()
    const t = setInterval(() => void load(), 4000)
    return () => clearInterval(t)
  }, [mode])
  const cols = rows[0] ? Object.keys(rows[0]) : []
  return (
    <div className="tool-stack">
      <p className="status-line">
        Live {mode === 'port' ? 'ports' : 'processes'} · {status} · refreshes ~4s
      </p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c}>{r[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FocusTimerEngine(): React.JSX.Element {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [running])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return (
    <div className="tool-stack">
      <p className="status-line">Focus timer · 25:00 default (Pomodoro-class)</p>
      <div className="clock-time" style={{ fontSize: '2.6rem' }}>
        {mm}:{ss}
      </div>
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setRunning(false)
            setSeconds(25 * 60)
          }}
        >
          Reset 25
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setRunning(false)
            setSeconds(5 * 60)
          }}
        >
          Break 5
        </button>
      </div>
    </div>
  )
}
