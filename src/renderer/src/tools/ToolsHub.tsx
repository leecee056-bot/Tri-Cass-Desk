import { useEffect, useMemo, useRef, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { DiskPartition, OllamaModel, PortRow, ProcessRow } from '../../../shared/types'
import { TOOL_CATALOG } from './catalog'
import '../features/features.css'

type Props = {
  state: EnvironmentState
  onOpenDock: (id: string) => void
}

export default function ToolsHub({ state, onOpenDock }: Props): React.JSX.Element {
  const [toolId, setToolId] = useState<string | null>(null)
  const tool = TOOL_CATALOG.find((t) => t.id === toolId)

  if (tool) {
    return (
      <div className="feature">
        <div className="feature-toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => setToolId(null)}>
            ← All tools
          </button>
          <strong>{tool.name}</strong>
          <span className="status-line">{tool.group}</span>
        </div>
        <ToolBody id={tool.id} state={state} onOpenDock={onOpenDock} />
      </div>
    )
  }

  return (
    <div className="feature">
      <p className="status-line">
        {TOOL_CATALOG.filter((t) => t.status === 'live').length} live tools · local / offline-first
      </p>
      <div className="tools-grid">
        {TOOL_CATALOG.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-card ${t.status}`}
            onClick={() => {
              if (['chat', 'agents', 'files', 'vault', 'browse'].includes(t.id)) {
                onOpenDock(t.id)
                return
              }
              setToolId(t.id)
            }}
          >
            <strong>{t.name}</strong>
            <span>
              {t.group} · {t.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToolBody({
  id,
  state,
  onOpenDock
}: {
  id: string
  state: EnvironmentState
  onOpenDock: (id: string) => void
}): React.JSX.Element {
  switch (id) {
    case 'monitor':
      return <ProcessMonitor />
    case 'sensors':
      return <SensorMap state={state} />
    case 'disk':
      return <DiskMap />
    case 'gpu':
      return <GpuPane state={state} />
    case 'ports':
      return <PortsTool />
    case 'env':
      return <EnvTool />
    case 'clipboard':
      return <ClipboardTool />
    case 'snapshots':
      return (
        <p className="status-line">
          Snapshots live under Settings.{' '}
          <button type="button" className="btn" onClick={() => onOpenDock('settings')}>
            Open Settings
          </button>
        </p>
      )
    case 'timer':
      return <FocusTimer />
    case 'hash':
      return <HashTool />
    case 'base64':
      return <Base64Tool />
    case 'json':
      return <JsonStudio />
    case 'regex':
      return <RegexLab />
    case 'diff':
      return <DiffViewer />
    case 'terminal':
    case 'logs':
      return <SafeCommands />
    case 'color':
      return <ColorTools />
    case 'canvas':
      return <SketchCanvas />
    case 'pixel':
      return <PixelLab />
    case 'audio':
      return <AudioPad />
    case 'qr':
      return <QrLocal />
    case 'convert':
      return <UnitConvert />
    case 'markdown':
      return <MarkdownDesk />
    case 'notes':
      return (
        <p className="status-line">
          Quick notes use the Vault.{' '}
          <button type="button" className="btn" onClick={() => onOpenDock('vault')}>
            Open Vault
          </button>
        </p>
      )
    case 'reader':
      return <ReaderMode />
    case 'tasks':
      return <TaskBoard />
    case 'calendar':
      return <LocalCalendar />
    case 'models':
      return <LlmBrowser />
    case 'themes':
      return <ThemeStudio />
    case 'plugins':
      return (
        <p className="status-line">
          Plugin slots reserved. Phase 3 will load local plugin manifests from the Desk data
          directory — no remote marketplace.
        </p>
      )
    case 'archive':
      return (
        <p className="status-line">
          Use Files to browse local archives. Full zip peek lands next; open a folder with{' '}
          <button type="button" className="btn" onClick={() => onOpenDock('files')}>
            Files
          </button>
        </p>
      )
    default:
      return <p className="status-line">Tool UI not wired yet.</p>
  }
}

function ProcessMonitor(): React.JSX.Element {
  const [rows, setRows] = useState<ProcessRow[]>([])
  const refresh = (): void => {
    void window.desk?.processes().then(setRows)
  }
  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>PID</th>
            <th>CPU</th>
            <th>Mem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.pid}>
              <td>{r.name}</td>
              <td>{r.pid}</td>
              <td>{r.cpu.toFixed(1)}</td>
              <td>{Math.round(r.mem)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SensorMap({ state }: { state: EnvironmentState }): React.JSX.Element {
  const s = state.system
  return (
    <div className="mono-out">
      {`cpu=${(s.cpuLoad * 100).toFixed(1)}%
ram=${(s.ramUsedRatio * 100).toFixed(1)}%
gpu=${s.gpuLoad != null ? `${(s.gpuLoad * 100).toFixed(1)}%` : 'n/a'}
cpuTemp=${s.cpuTempC ?? 'n/a'}
gpuTemp=${s.gpuTempC ?? 'n/a'}
diskIoMbps=${s.diskIoMbps.toFixed(2)}
processes=${s.processCount}
churn=${s.processChurn.toFixed(3)}
scene=${state.weather.condition} rain=${state.weather.rain.toFixed(2)} aurora=${state.celestial.aurora.toFixed(2)}`}
    </div>
  )
}

function DiskMap(): React.JSX.Element {
  const [disks, setDisks] = useState<DiskPartition[]>([])
  useEffect(() => {
    void window.desk?.disks().then(setDisks)
  }, [])
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Mount</th>
            <th>Use</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {disks.map((d) => (
            <tr key={`${d.fs}-${d.mount}`}>
              <td>{d.mount || d.fs}</td>
              <td>{d.use.toFixed(0)}%</td>
              <td>{d.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GpuPane({ state }: { state: EnvironmentState }): React.JSX.Element {
  return (
    <div className="mono-out">
      {`GPU load: ${state.system.gpuLoad != null ? `${(state.system.gpuLoad * 100).toFixed(1)}%` : 'sensor unavailable'}
GPU temp: ${state.system.gpuTempC ?? 'n/a'}
Artistic aurora intensity: ${(state.celestial.aurora * 100).toFixed(0)}%
Milky Way art: ${(state.celestial.milkyWay * 100).toFixed(0)}%`}
    </div>
  )
}

function PortsTool(): React.JSX.Element {
  const [rows, setRows] = useState<PortRow[]>([])
  useEffect(() => {
    void window.desk?.ports().then(setRows)
  }, [])
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Proto</th>
            <th>Local</th>
            <th>State</th>
            <th>Process</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.localAddress}-${r.localPort}-${i}`}>
              <td>{r.protocol}</td>
              <td>
                {r.localAddress}:{r.localPort}
              </td>
              <td>{r.state}</td>
              <td>{r.process || r.pid || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EnvTool(): React.JSX.Element {
  const [env, setEnv] = useState<Record<string, string>>({})
  useEffect(() => {
    void window.desk?.envVars().then(setEnv)
  }, [])
  return (
    <div className="mono-out">
      {Object.entries(env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') || 'No allowlisted env vars.'}
    </div>
  )
}

function ClipboardTool(): React.JSX.Element {
  const [text, setText] = useState('')
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() => void window.desk?.clipboardRead().then(setText)}
        >
          Read clipboard
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => void window.desk?.clipboardWrite(text)}
        >
          Write clipboard
        </button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  )
}

function FocusTimer(): React.JSX.Element {
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
      <div className="clock-time" style={{ fontSize: '2.8rem' }}>
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
          Reset 25m
        </button>
      </div>
    </div>
  )
}

function HashTool(): React.JSX.Element {
  const [text, setText] = useState('tri-cass')
  const [algo, setAlgo] = useState<'sha256' | 'sha1' | 'md5'>('sha256')
  const [out, setOut] = useState('')
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="feature-toolbar">
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value as typeof algo)}
        >
          <option value="sha256">sha256</option>
          <option value="sha1">sha1</option>
          <option value="md5">md5</option>
        </select>
        <button
          type="button"
          className="btn"
          onClick={() => void window.desk?.hashText(text, algo).then(setOut)}
        >
          Hash
        </button>
      </div>
      <div className="mono-out">{out || '—'}</div>
    </div>
  )
}

function Base64Tool(): React.JSX.Element {
  const [text, setText] = useState('hello desk')
  const [out, setOut] = useState('')
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() => setOut(btoa(unescape(encodeURIComponent(text))))}
        >
          Encode
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            try {
              setOut(decodeURIComponent(escape(atob(text))))
            } catch {
              setOut('Invalid base64')
            }
          }}
        >
          Decode
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setOut(encodeURIComponent(text))}
        >
          URL encode
        </button>
      </div>
      <div className="mono-out">{out || '—'}</div>
    </div>
  )
}

function JsonStudio(): React.JSX.Element {
  const [text, setText] = useState('{"triCass":true}')
  const [out, setOut] = useState('')
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button
        type="button"
        className="btn"
        onClick={() => {
          try {
            setOut(JSON.stringify(JSON.parse(text), null, 2))
          } catch (err) {
            setOut(err instanceof Error ? err.message : String(err))
          }
        }}
      >
        Format / validate
      </button>
      <pre className="mono-out">{out || '—'}</pre>
    </div>
  )
}

function RegexLab(): React.JSX.Element {
  const [pattern, setPattern] = useState('\\w+')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('Tri-Cass Desk living shell')
  const result = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags)
      return JSON.stringify(text.match(re), null, 2)
    } catch (err) {
      return err instanceof Error ? err.message : String(err)
    }
  }, [pattern, flags, text])
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="pattern" />
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          style={{ maxWidth: 80 }}
        />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <pre className="mono-out">{result}</pre>
    </div>
  )
}

function DiffViewer(): React.JSX.Element {
  const [a, setA] = useState('alpha\nbeta\ngamma')
  const [b, setB] = useState('alpha\nbeta2\ngamma\ndelta')
  const lines = useMemo(() => {
    const left = a.split('\n')
    const right = b.split('\n')
    const max = Math.max(left.length, right.length)
    const out: string[] = []
    for (let i = 0; i < max; i++) {
      const L = left[i] ?? ''
      const R = right[i] ?? ''
      if (L === R) out.push(`  ${L}`)
      else {
        if (L) out.push(`- ${L}`)
        if (R) out.push(`+ ${R}`)
      }
    }
    return out.join('\n')
  }, [a, b])
  return (
    <div className="split-2">
      <textarea value={a} onChange={(e) => setA(e.target.value)} />
      <textarea value={b} onChange={(e) => setB(e.target.value)} />
      <pre className="mono-out" style={{ gridColumn: '1 / -1' }}>
        {lines}
      </pre>
    </div>
  )
}

function SafeCommands(): React.JSX.Element {
  const [out, setOut] = useState('')
  const run = (id: string): void => {
    void window.desk?.runSafeCommand(id).then((r) => setOut(r.output))
  }
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={() => run('node-version')}>
          node -v
        </button>
        <button type="button" className="btn" onClick={() => run('npm-version')}>
          npm -v
        </button>
        <button type="button" className="btn" onClick={() => run('ollama-list')}>
          ollama list
        </button>
      </div>
      <pre className="mono-out">{out || 'Allowlisted local commands only.'}</pre>
    </div>
  )
}

function ColorTools(): React.JSX.Element {
  const [hex, setHex] = useState('#7ad7ff')
  const rgb = useMemo(() => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return 'Invalid hex'
    const n = parseInt(m[1], 16)
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
  }, [hex])
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <input value={hex} onChange={(e) => setHex(e.target.value)} />
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: hex,
            border: '1px solid var(--rim)'
          }}
        />
      </div>
      <div className="mono-out">{rgb}</div>
    </div>
  )
}

function SketchCanvas(): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, c.width, c.height)
    let drawing = false
    const pos = (e: MouseEvent): [number, number] => {
      const r = c.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height]
    }
    const down = (e: MouseEvent): void => {
      drawing = true
      const [x, y] = pos(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    const move = (e: MouseEvent): void => {
      if (!drawing) return
      const [x, y] = pos(e)
      ctx.strokeStyle = '#7ad7ff'
      ctx.lineWidth = 2
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    const up = (): void => {
      drawing = false
    }
    c.addEventListener('mousedown', down)
    c.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      c.removeEventListener('mousedown', down)
      c.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])
  return <canvas ref={ref} width={640} height={280} style={{ width: '100%', borderRadius: 12 }} />
}

function PixelLab(): React.JSX.Element {
  const [color, setColor] = useState('#b28cff')
  const [grid, setGrid] = useState(() => Array.from({ length: 16 * 16 }, () => '#0b1020'))
  return (
    <div className="tool-stack">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(16, 1fr)',
          gap: 2,
          maxWidth: 320
        }}
      >
        {grid.map((c, i) => (
          <button
            key={i}
            type="button"
            style={{ aspectRatio: '1', background: c, border: 'none', borderRadius: 2 }}
            onClick={() =>
              setGrid((g) => {
                const n = [...g]
                n[i] = color
                return n
              })
            }
          />
        ))}
      </div>
    </div>
  )
}

function AudioPad(): React.JSX.Element {
  const ctxRef = useRef<AudioContext | null>(null)
  const beep = (freq: number): void => {
    const ctx = ctxRef.current || new AudioContext()
    ctxRef.current = ctx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = freq
    o.type = 'sine'
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.2)
  }
  return (
    <div className="feature-toolbar">
      {[220, 262, 294, 330, 392, 440].map((f) => (
        <button key={f} type="button" className="btn" onClick={() => beep(f)}>
          {f}Hz
        </button>
      ))}
    </div>
  )
}

function QrLocal(): React.JSX.Element {
  const [text, setText] = useState('tri-cass-desk')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Tiny deterministic QR-like glyph grid (not a full QR encoder — local pattern art + copy)
    const size = 21
    const cell = canvas.width / size
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    let h = 0
    for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) >>> 0
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const finder =
          (x < 7 && y < 7) || (x > size - 8 && y < 7) || (x < 7 && y > size - 8)
        const bit = finder || ((h + x * 17 + y * 31) & 3) === 0
        ctx.fillStyle = bit ? '#111' : '#fff'
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
  }, [text])
  return (
    <div className="tool-stack">
      <p className="status-line">
        Local pattern preview (artistic). Copy text / use a future full encoder plugin if you need
        scannable codes.
      </p>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <canvas ref={canvasRef} width={210} height={210} style={{ borderRadius: 8 }} />
    </div>
  )
}

function UnitConvert(): React.JSX.Element {
  const [value, setValue] = useState('1')
  const n = Number(value) || 0
  return (
    <div className="tool-stack">
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="mono-out">
        {`${n} GiB = ${(n * 1024).toFixed(2)} MiB
${n} °C = ${((n * 9) / 5 + 32).toFixed(2)} °F
${n} km = ${(n * 0.621371).toFixed(3)} mi
${n} kg = ${(n * 2.20462).toFixed(3)} lb`}
      </div>
    </div>
  )
}

function MarkdownDesk(): React.JSX.Element {
  const [md, setMd] = useState('# Tri-Cass\n\nLocal **markdown** preview.')
  const html = useMemo(() => {
    return md
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }, [md])
  return (
    <div className="split-2">
      <textarea value={md} onChange={(e) => setMd(e.target.value)} />
      <div className="chat-log" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function ReaderMode(): React.JSX.Element {
  const [text, setText] = useState('Paste text here for a calm local reader view.')
  return (
    <div className="tool-stack">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <article className="chat-log" style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
        {text}
      </article>
    </div>
  )
}

function TaskBoard(): React.JSX.Element {
  const key = 'tricass-desk-tasks'
  const [tasks, setTasks] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]') as string[]
    } catch {
      return []
    }
  })
  const [draft, setDraft] = useState('')
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(tasks))
  }, [tasks])
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New task" />
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (!draft.trim()) return
            setTasks((t) => [...t, draft.trim()])
            setDraft('')
          }}
        >
          Add
        </button>
      </div>
      <div className="file-list">
        {tasks.map((t, i) => (
          <div key={`${t}-${i}`} className="file-row">
            <span>{t}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setTasks((list) => list.filter((_, j) => j !== i))}
            >
              Done
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function LocalCalendar(): React.JSX.Element {
  const now = new Date()
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  return (
    <div className="tool-stack">
      <div className="status-line">
        {now.toLocaleString(undefined, { month: 'long', year: 'numeric' })} (local clock)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {days.map((d) => (
          <div
            key={d}
            className="placeholder-tile"
            style={{
              padding: 8,
              outline: d === now.getDate() ? '1px solid var(--accent)' : undefined
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

function LlmBrowser(): React.JSX.Element {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [status, setStatus] = useState('')
  useEffect(() => {
    void (async () => {
      if (!window.desk) return
      const st = await window.desk.ollamaStatus()
      setStatus(st.detail)
      if (st.ok) {
        try {
          setModels(await window.desk.ollamaModels())
        } catch (err) {
          setStatus(err instanceof Error ? err.message : String(err))
        }
      }
    })()
  }, [])
  return (
    <div className="tool-stack">
      <div className="status-line">{status}</div>
      <div className="file-list">
        {models.map((m) => (
          <div key={m.name} className="file-row">
            <span>{m.name}</span>
            <span>{m.size ? `${(m.size / 1e9).toFixed(2)} GB` : ''}</span>
          </div>
        ))}
        {models.length === 0 ? <p className="status-line">No models listed.</p> : null}
      </div>
    </div>
  )
}

function ThemeStudio(): React.JSX.Element {
  const [accent, setAccent] = useState('#7ad7ff')
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])
  return (
    <div className="tool-stack">
      <label className="status-line">
        Accent{' '}
        <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
      </label>
      <p className="status-line">Tweaks live CSS variables for this session (not a theme picker for the landscape).</p>
    </div>
  )
}
