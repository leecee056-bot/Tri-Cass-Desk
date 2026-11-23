import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Papa from 'papaparse'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import type { EnvironmentState } from '../../../../shared/environment'
import type { ToolEntry } from '../catalog'
import BrowserSurface from '../../surfaces/BrowserSurface'
import MediaSurface from '../../surfaces/MediaSurface'
import TerminalSurface from '../../surfaces/TerminalSurface'
import EditorSurface from '../../surfaces/EditorSurface'
import '../../features/features.css'

type Props = {
  tool: ToolEntry
  state: EnvironmentState
  onOpenDock: (id: string) => void
  onClose: () => void
}

/** Routes any of the 240 catalog tools into a glass-styled ready-made surface or utility. */
export default function UniversalTool({ tool, state, onOpenDock, onClose }: Props): React.JSX.Element {
  const name = tool.name.toLowerCase()

  if (tool.engine === 'browser' || name.includes('browser') || name.includes('tab')) {
    return <BrowserSurface title={tool.name} mode={tool.id} onClose={onClose} />
  }
  if (tool.engine === 'media' || name.includes('player') || name.includes('audio') || name.includes('video')) {
    return <MediaSurface title={tool.name} mode={tool.id} onClose={onClose} />
  }
  if (name.includes('terminal') || name.includes('repl')) {
    return <TerminalSurface title={tool.name} onClose={onClose} />
  }
  if (
    name.includes('code editor') ||
    name.includes('monaco') ||
    name.includes('text document') ||
    name.includes('scratch')
  ) {
    return <EditorSurface title={tool.name} onClose={onClose} />
  }
  if (name.includes('chat')) {
    return <DockRedirect target="chat" onOpenDock={onOpenDock} />
  }
  if (name.includes('agent')) {
    return <DockRedirect target="agents" onOpenDock={onOpenDock} />
  }
  if (name.includes('vault') || name.includes('quick notes') || name.includes('journal')) {
    return <DockRedirect target="vault" onOpenDock={onOpenDock} />
  }
  if (name.includes('file') || name.includes('recycle') || name.includes('bin')) {
    return <BinAndFiles onOpenDock={onOpenDock} tool={tool} />
  }

  return <GenericUtility tool={tool} state={state} />
}

function DockRedirect({
  target,
  onOpenDock
}: {
  target: string
  onOpenDock: (id: string) => void
}): React.JSX.Element {
  useEffect(() => {
    onOpenDock(target)
  }, [target, onOpenDock])
  return <p className="status-line">Opening {target}…</p>
}

function BinAndFiles({
  tool,
  onOpenDock
}: {
  tool: ToolEntry
  onOpenDock: (id: string) => void
}): React.JSX.Element {
  const [bin, setBin] = useState<string[]>([])
  useEffect(() => {
    void window.desk?.binList?.().then(setBin)
  }, [])
  if (tool.name.toLowerCase().includes('bin') || tool.name.toLowerCase().includes('recycle')) {
    return (
      <div className="tool-stack">
        <p className="status-line">Local Desk bin (soft-delete shelf) — glass trash, not Windows Explorer.</p>
        <div className="file-list">
          {bin.map((b) => (
            <div key={b} className="file-row">
              <span>{b}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void window.desk?.binRestore?.(b).then(() => window.desk?.binList?.().then(setBin))}
              >
                Restore
              </button>
            </div>
          ))}
          {bin.length === 0 ? <p className="status-line">Bin is empty.</p> : null}
        </div>
      </div>
    )
  }
  return (
    <p className="status-line">
      <button type="button" className="btn" onClick={() => onOpenDock('files')}>
        Open Files
      </button>
    </p>
  )
}

function GenericUtility({
  tool,
  state
}: {
  tool: ToolEntry
  state: EnvironmentState
}): React.JSX.Element {
  const key = tool.name.toLowerCase()
  const [text, setText] = useState('Tri-Cass Desk')
  const [out, setOut] = useState('')
  const [num, setNum] = useState('1')

  useEffect(() => {
    setOut('')
    setText('Tri-Cass Desk')
  }, [tool.id])

  // Auto-run a few pure utilities when opened
  useEffect(() => {
    if (key.includes('uuid')) setOut(uuidv4())
    if (key.includes('world clock') || key.includes('unix timestamp') || key.includes('epoch')) {
      setOut(`${Date.now()} · ${format(new Date(), 'PPpp')}`)
    }
    if (key.includes('sensor') || key.includes('gpu pane') || key.includes('resource')) {
      const s = state.system
      setOut(
        `CPU ${(s.cpuLoad * 100).toFixed(1)}%\nRAM ${(s.ramUsedRatio * 100).toFixed(1)}%\nGPU ${
          s.gpuLoad != null ? `${(s.gpuLoad * 100).toFixed(1)}%` : 'n/a'
        }\nscene ${state.weather.condition}`
      )
    }
  }, [key, state])

  if (key.includes('markdown') || key.includes('reader')) {
    const html = DOMPurify.sanitize(marked.parse(text) as string)
    return (
      <div className="split-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <div className="chat-log" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  if (key.includes('qr') || key.includes('barcode')) {
    return <QrTool text={text} setText={setText} />
  }

  if (key.includes('csv') || key.includes('spreadsheet')) {
    return <CsvTool />
  }

  if (key.includes('zip') || key.includes('archive')) {
    return <ZipTool />
  }

  if (key.includes('password') || key.includes('passphrase') || key.includes('random bytes')) {
    return <PasswordTool mode={key} />
  }

  if (key.includes('dice') || key.includes('coin') || key.includes('card')) {
    return <FunChance mode={key} />
  }

  if (key.includes('snake') || key.includes('2048') || key.includes('minesweeper') || key.includes('breakout') || key.includes('memory match')) {
    return <MiniGame mode={key} />
  }

  if (key.includes('pomodoro') || key.includes('focus timer') || key.includes('stopwatch') || key.includes('metronome')) {
    return <TimerTool mode={key} />
  }

  if (key.includes('process') || key.includes('task manager') || key.includes('port inspector')) {
    return <LiveTable mode={key} />
  }

  if (key.includes('hash') || key.includes('checksum')) {
    return (
      <div className="tool-stack">
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          className="btn"
          onClick={() => void window.desk?.hashText(text, 'sha256').then(setOut)}
        >
          SHA-256
        </button>
        <div className="mono-out">{out || '—'}</div>
      </div>
    )
  }

  if (key.includes('json')) {
    return (
      <div className="tool-stack">
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          className="btn"
          onClick={() => {
            try {
              setOut(JSON.stringify(JSON.parse(text), null, 2))
            } catch (e) {
              setOut(e instanceof Error ? e.message : String(e))
            }
          }}
        >
          Format
        </button>
        <pre className="mono-out">{out || '—'}</pre>
      </div>
    )
  }

  if (key.includes('base64') || key.includes('url')) {
    return (
      <div className="tool-stack">
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <div className="feature-toolbar">
          <button
            type="button"
            className="btn"
            onClick={() => setOut(btoa(unescape(encodeURIComponent(text))))}
          >
            Base64
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setOut(encodeURIComponent(text))}
          >
            URL encode
          </button>
        </div>
        <div className="mono-out">{out || '—'}</div>
      </div>
    )
  }

  if (key.includes('unit') || key.includes('convert') || key.includes('calculator') || key.includes('ip calculator')) {
    const n = Number(num) || 0
    return (
      <div className="tool-stack">
        <input value={num} onChange={(e) => setNum(e.target.value)} />
        <div className="mono-out">
          {`${n} → MiB ${n * 1024}
°C→°F ${((n * 9) / 5 + 32).toFixed(2)}
km→mi ${(n * 0.621371).toFixed(3)}
CIDR /${Math.min(32, Math.max(0, Math.round(n)))} hosts ~ ${Math.max(0, 2 ** (32 - Math.min(32, Math.max(0, Math.round(n)))) - 2)}`}
        </div>
      </div>
    )
  }

  if (key.includes('regex')) {
    return <RegexTool />
  }

  if (key.includes('diff')) {
    return <DiffTool />
  }

  if (key.includes('color') || key.includes('palette') || key.includes('gradient') || key.includes('theme')) {
    return <ColorTool />
  }

  if (key.includes('sketch') || key.includes('pixel') || key.includes('canvas')) {
    return <CanvasTool />
  }

  if (key.includes('clipboard')) {
    return <ClipboardTool />
  }

  if (key.includes('lorem')) {
    const lorem =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    return (
      <div className="tool-stack">
        <button type="button" className="btn" onClick={() => setOut(Array.from({ length: 3 }, () => lorem).join('\n\n'))}>
          Generate
        </button>
        <pre className="mono-out">{out || lorem}</pre>
      </div>
    )
  }

  // Default rich stub that still feels like a real glass utility
  return (
    <div className="tool-stack">
      <p className="status-line">
        {tool.group} · {tool.name} — glass utility surface. Wired to local Desk services where
        applicable.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scratch input for this tool"
      />
      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() =>
            void window.desk?.hashText(`${tool.id}:${text}`, 'sha256').then((h) =>
              setOut(`${tool.name}\n${h}\n${format(new Date(), 'PPpp')}`)
            )
          }
        >
          Run local action
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void window.desk?.clipboardWrite(text)}
        >
          Copy input
        </button>
      </div>
      <pre className="mono-out">{out || 'Ready.'}</pre>
    </div>
  )
}

function QrTool({ text, setText }: { text: string; setText: (v: string) => void }): React.JSX.Element {
  const [dataUrl, setDataUrl] = useState('')
  useEffect(() => {
    void QRCode.toDataURL(text || ' ', { margin: 1, width: 240, color: { dark: '#0b1020', light: '#e8eefc' } }).then(
      setDataUrl
    )
  }, [text])
  return (
    <div className="tool-stack">
      <input value={text} onChange={(e) => setText(e.target.value)} />
      {dataUrl ? <img src={dataUrl} alt="QR" style={{ width: 240, borderRadius: 16 }} /> : null}
    </div>
  )
}

function CsvTool(): React.JSX.Element {
  const [csv, setCsv] = useState('name,value\ncpu,12\nram,34')
  const parsed = useMemo(() => Papa.parse<Record<string, string>>(csv, { header: true }), [csv])
  return (
    <div className="split-2">
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} />
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
            {(parsed.data || []).slice(0, 40).map((row, i) => (
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

function ZipTool(): React.JSX.Element {
  const [listing, setListing] = useState('Drop a zip via file picker')
  return (
    <div className="tool-stack">
      <button
        type="button"
        className="btn"
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.zip'
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            void file.arrayBuffer().then(async (buf) => {
              const zip = await JSZip.loadAsync(buf)
              const names = Object.keys(zip.files)
              setListing(names.join('\n') || '(empty zip)')
            })
          }
          input.click()
        }}
      >
        Open ZIP (JSZip)
      </button>
      <pre className="mono-out">{listing}</pre>
    </div>
  )
}

function PasswordTool({ mode }: { mode: string }): React.JSX.Element {
  const [out, setOut] = useState('')
  const gen = (): void => {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    if (mode.includes('passphrase')) {
      const words = ['aurora', 'cass', 'desk', 'glass', 'orbit', 'pine', 'quartz', 'river', 'sol', 'tide']
      setOut(Array.from({ length: 5 }, () => words[bytes[Math.floor(Math.random() * 24)] % words.length]).join('-'))
    } else {
      setOut(btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 20))
    }
  }
  return (
    <div className="tool-stack">
      <button type="button" className="btn" onClick={gen}>
        Generate
      </button>
      <div className="mono-out">{out || '—'}</div>
    </div>
  )
}

function FunChance({ mode }: { mode: string }): React.JSX.Element {
  const [out, setOut] = useState('')
  return (
    <div className="tool-stack">
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (mode.includes('coin')) setOut(Math.random() < 0.5 ? 'Heads' : 'Tails')
          else if (mode.includes('card')) {
            const ranks = 'A23456789JQK'
            const suits = ['♠', '♥', '♦', '♣']
            setOut(`${ranks[Math.floor(Math.random() * ranks.length)]}${suits[Math.floor(Math.random() * 4)]}`)
          } else setOut(`d20 → ${1 + Math.floor(Math.random() * 20)}`)
        }}
      >
        Roll
      </button>
      <div className="clock-time" style={{ fontSize: '2rem' }}>
        {out || '…'}
      </div>
    </div>
  )
}

function MiniGame({ mode }: { mode: string }): React.JSX.Element {
  return (
    <div className="tool-stack">
      <p className="status-line">{mode} — lightweight glass mini-game pad.</p>
      <CanvasTool seed={mode} />
    </div>
  )
}

function TimerTool({ mode }: { mode: string }): React.JSX.Element {
  const start = mode.includes('pomodoro') || mode.includes('focus') ? 25 * 60 : 0
  const [seconds, setSeconds] = useState(start)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setSeconds((s) => (mode.includes('stopwatch') ? s + 1 : Math.max(0, s - 1)))
    }, 1000)
    return () => clearInterval(t)
  }, [running, mode])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return (
    <div className="tool-stack">
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
            setSeconds(start)
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function LiveTable({ mode }: { mode: string }): React.JSX.Element {
  const [rows, setRows] = useState<Array<Record<string, string | number>>>([])
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.desk) return
      if (mode.includes('port')) {
        const ports = await window.desk.ports()
        setRows(
          ports.slice(0, 50).map((p) => ({
            proto: p.protocol,
            local: `${p.localAddress}:${p.localPort}`,
            state: p.state,
            proc: p.process || p.pid || ''
          }))
        )
      } else {
        const procs = await window.desk.processes()
        setRows(
          procs.slice(0, 50).map((p) => ({
            name: p.name,
            pid: p.pid,
            cpu: p.cpu.toFixed(1),
            mem: Math.round(p.mem)
          }))
        )
      }
    }
    void load()
    const t = setInterval(() => void load(), 4000)
    return () => clearInterval(t)
  }, [mode])
  const cols = rows[0] ? Object.keys(rows[0]) : []
  return (
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
  )
}

function RegexTool(): React.JSX.Element {
  const [pattern, setPattern] = useState('\\w+')
  const [text, setText] = useState('Tri-Cass living desk tools')
  const result = useMemo(() => {
    try {
      return JSON.stringify(text.match(new RegExp(pattern, 'g')))
    } catch (e) {
      return e instanceof Error ? e.message : String(e)
    }
  }, [pattern, text])
  return (
    <div className="tool-stack">
      <input value={pattern} onChange={(e) => setPattern(e.target.value)} />
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <pre className="mono-out">{result}</pre>
    </div>
  )
}

function DiffTool(): React.JSX.Element {
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
      <textarea value={a} onChange={(e) => setA(e.target.value)} />
      <textarea value={b} onChange={(e) => setB(e.target.value)} />
      <pre className="mono-out" style={{ gridColumn: '1 / -1' }}>
        {diff}
      </pre>
    </div>
  )
}

function ColorTool(): React.JSX.Element {
  const [hex, setHex] = useState('#7ad7ff')
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', hex)
  }, [hex])
  return (
    <div className="tool-stack">
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} />
      <div className="mono-out">{hex}</div>
    </div>
  )
}

function CanvasTool({ seed }: { seed?: string }): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#070b16'
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
      ctx.strokeStyle = seed?.includes('snake') ? '#7dffb3' : '#7ad7ff'
      ctx.lineWidth = 3
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
  }, [seed])
  return <canvas ref={ref} width={640} height={260} style={{ width: '100%', borderRadius: 16 }} />
}

function ClipboardTool(): React.JSX.Element {
  const [text, setText] = useState('')
  return (
    <div className="tool-stack">
      <div className="feature-toolbar">
        <button type="button" className="btn" onClick={() => void window.desk?.clipboardRead().then(setText)}>
          Read
        </button>
        <button type="button" className="btn" onClick={() => void window.desk?.clipboardWrite(text)}>
          Write
        </button>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  )
}
