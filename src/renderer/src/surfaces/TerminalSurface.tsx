import { useCallback, useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Props = {
  title?: string
  onClose?: () => void
}

type SafeCmd = { id: string; label: string; hint: string }

type Session = {
  id: string
  title: string
  history: string[]
}

const SCROLLBACK = 5000
const FALLBACK_CMDS: SafeCmd[] = [
  { id: 'node-version', label: 'node -v', hint: 'Node.js version' },
  { id: 'npm-version', label: 'npm -v', hint: 'npm version' },
  { id: 'ollama-list', label: 'ollama list', hint: 'Local Ollama models' },
  { id: 'desk-info', label: 'desk-info', hint: 'Desk process info' }
]

function uid(): string {
  return `term-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
}

function labelToId(line: string, cmds: SafeCmd[]): string | null {
  const hit = cmds.find((c) => c.label === line || c.id === line)
  return hit?.id ?? null
}

type TermBundle = {
  term: Terminal
  fit: FitAddon
  buffer: string
  historyIndex: number
  disposed: boolean
}

/**
 * iTerm / Windows Terminal–style glass terminal.
 * Multi-session tabs, xterm scrollback, allowlisted commands only (not a raw shell).
 */
export default function TerminalSurface({
  title = 'Terminal',
  onClose
}: Props): React.JSX.Element {
  const firstId = useRef(uid()).current
  const [sessions, setSessions] = useState<Session[]>([
    { id: firstId, title: 'Session 1', history: [] }
  ])
  const [activeId, setActiveId] = useState(firstId)
  const [cmds, setCmds] = useState<SafeCmd[]>(FALLBACK_CMDS)
  const [status, setStatus] = useState('Allowlisted local commands · not a raw shell')
  const hostRef = useRef<HTMLDivElement>(null)
  const bundles = useRef<Map<string, TermBundle>>(new Map())
  const sessionsRef = useRef(sessions)
  const activeRef = useRef(activeId)
  const cmdsRef = useRef(cmds)

  sessionsRef.current = sessions
  activeRef.current = activeId
  cmdsRef.current = cmds

  useEffect(() => {
    void (async () => {
      if (!window.desk?.safeCommandsList) return
      try {
        const list = await window.desk.safeCommandsList()
        if (list?.length) setCmds(list)
      } catch {
        /* keep fallback */
      }
    })()
  }, [])

  const pushHistory = useCallback((sessionId: string, line: string): void => {
    if (!line) return
    setSessions((list) =>
      list.map((s) =>
        s.id === sessionId
          ? { ...s, history: [...s.history.filter((h) => h !== line), line].slice(-80) }
          : s
      )
    )
  }, [])

  const runLine = useCallback(
    async (sessionId: string, line: string, term: Terminal): Promise<void> => {
      const trimmed = line.trim()
      if (!trimmed) return
      pushHistory(sessionId, trimmed)

      if (trimmed === 'clear') {
        term.clear()
        return
      }
      if (trimmed === 'help' || trimmed === '?') {
        term.writeln('Built-ins: help · clear · history')
        term.writeln('Allowlisted (click chips or type exactly):')
        for (const c of cmdsRef.current) {
          term.writeln(`  ${c.label.padEnd(14)} ${c.hint}`)
        }
        term.writeln('↑/↓ command history · scrollback 5000 lines · Ctrl+Shift+C copy selection')
        return
      }
      if (trimmed === 'history') {
        const sess = sessionsRef.current.find((s) => s.id === sessionId)
        const hist = sess?.history ?? []
        if (!hist.length) term.writeln('(empty history)')
        else hist.forEach((h, i) => term.writeln(` ${i + 1}  ${h}`))
        return
      }

      const id = labelToId(trimmed, cmdsRef.current)
      if (!id) {
        term.writeln(`\x1b[31mblocked\x1b[0m: ${trimmed}`)
        term.writeln('Only allowlisted commands run. Type help or use the chips below.')
        setStatus(`Blocked: ${trimmed}`)
        return
      }
      if (!window.desk?.runSafeCommand) {
        term.writeln('Desk Electron APIs unavailable')
        return
      }
      setStatus(`Running ${trimmed}…`)
      const res = await window.desk.runSafeCommand(id)
      const color = res.ok ? '\x1b[32m' : '\x1b[31m'
      for (const outLine of (res.output || '').split('\n')) {
        term.writeln(`${color}${outLine}\x1b[0m`)
      }
      setStatus(res.ok ? `ok · ${trimmed}` : `failed · ${trimmed}`)
      void window.desk.noteActivity()
    },
    [pushHistory]
  )

  const mountSession = useCallback(
    (sessionId: string): void => {
      const host = hostRef.current
      if (!host) return
      // Hide other terminals
      for (const [id, b] of bundles.current) {
        if (b.disposed) continue
        const el = b.term.element
        if (el) el.style.display = id === sessionId ? '' : 'none'
      }

      let bundle = bundles.current.get(sessionId)
      if (!bundle || bundle.disposed) {
        const term = new Terminal({
          convertEol: true,
          scrollback: SCROLLBACK,
          cursorBlink: true,
          fontFamily: 'ui-monospace, Cascadia Code, Consolas, monospace',
          fontSize: 13,
          theme: {
            background: '#070b16',
            foreground: '#d7e6ff',
            cursor: '#7ad7ff',
            selectionBackground: '#7ad7ff55',
            black: '#0a1020',
            brightBlack: '#5a6a88',
            green: '#7dffc8',
            red: '#ff8aa0',
            yellow: '#ffe07a',
            blue: '#7ad7ff'
          }
        })
        const fit = new FitAddon()
        term.loadAddon(fit)
        term.open(host)
        fit.fit()
        term.writeln('\x1b[36mTri-Cass Desk\x1b[0m · glass terminal (allowlisted)')
        term.writeln(`Scrollback ${SCROLLBACK} · type \x1b[33mhelp\x1b[0m or click a chip`)
        term.write('$ ')

        const state: TermBundle = {
          term,
          fit,
          buffer: '',
          historyIndex: -1,
          disposed: false
        }

        term.onData((data) => {
          const sess = sessionsRef.current.find((s) => s.id === sessionId)
          const eraseLine = (): void => {
            while (state.buffer.length) {
              state.buffer = state.buffer.slice(0, -1)
              term.write('\b \b')
            }
          }
          if (data === '\r') {
            term.write('\r\n')
            const line = state.buffer
            state.buffer = ''
            state.historyIndex = -1
            void runLine(sessionId, line, term).then(() => {
              if (!state.disposed) term.write('$ ')
            })
            return
          }
          if (data === '\u007f') {
            if (state.buffer.length) {
              state.buffer = state.buffer.slice(0, -1)
              term.write('\b \b')
            }
            return
          }
          if (data === '\u001b[A') {
            const hist = sess?.history ?? []
            if (!hist.length) return
            const next =
              state.historyIndex < 0 ? hist.length - 1 : Math.max(0, state.historyIndex - 1)
            eraseLine()
            state.historyIndex = next
            state.buffer = hist[next] || ''
            term.write(state.buffer)
            return
          }
          if (data === '\u001b[B') {
            const hist = sess?.history ?? []
            if (state.historyIndex < 0) return
            const next = state.historyIndex + 1
            eraseLine()
            if (next >= hist.length) {
              state.historyIndex = -1
              state.buffer = ''
            } else {
              state.historyIndex = next
              state.buffer = hist[next] || ''
              term.write(state.buffer)
            }
            return
          }
          if (data === '\u0003') {
            term.write('^C\r\n$ ')
            state.buffer = ''
            state.historyIndex = -1
            return
          }
          // Printable paste / typing (may be multi-char)
          if (data.startsWith('\u001b')) return
          for (const ch of data) {
            if (ch === '\r') continue
            if (ch === '\u007f') continue
            if (ch >= ' ' || ch === '\t') {
              state.buffer += ch
              term.write(ch)
            }
          }
        })

        term.attachCustomKeyEventHandler((ev) => {
          if (ev.type === 'keydown' && ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === 'c') {
            const sel = term.getSelection()
            if (sel) void window.desk?.clipboardWrite(sel)
            return false
          }
          return true
        })

        bundles.current.set(sessionId, state)
        bundle = state
      } else if (bundle.term.element) {
        bundle.term.element.style.display = ''
        bundle.fit.fit()
        bundle.term.focus()
      }
    },
    [runLine]
  )

  useEffect(() => {
    mountSession(activeId)
  }, [activeId, mountSession])

  useEffect(() => {
    const onResize = (): void => {
      const b = bundles.current.get(activeRef.current)
      b?.fit.fit()
    }
    window.addEventListener('resize', onResize)
    const ro = hostRef.current ? new ResizeObserver(onResize) : null
    if (hostRef.current && ro) ro.observe(hostRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const b of bundles.current.values()) {
        b.disposed = true
        b.term.dispose()
      }
      bundles.current.clear()
    }
  }, [])

  const addSession = (): void => {
    const id = uid()
    const n = sessions.length + 1
    setSessions((list) => [...list, { id, title: `Session ${n}`, history: [] }])
    setActiveId(id)
    setStatus(`Opened Session ${n}`)
  }

  const closeSession = (id: string): void => {
    const bundle = bundles.current.get(id)
    if (bundle) {
      bundle.disposed = true
      bundle.term.dispose()
      bundles.current.delete(id)
    }
    setSessions((list) => {
      if (list.length <= 1) {
        const fresh = uid()
        setActiveId(fresh)
        return [{ id: fresh, title: 'Session 1', history: [] }]
      }
      const next = list.filter((s) => s.id !== id)
      if (id === activeId) {
        const idx = list.findIndex((s) => s.id === id)
        setActiveId((next[Math.max(0, idx - 1)] || next[0]!).id)
      }
      return next
    })
  }

  const clearActive = (): void => {
    bundles.current.get(activeId)?.term.clear()
    setStatus('Cleared scrollback view')
  }

  const runChip = (cmd: SafeCmd): void => {
    const bundle = bundles.current.get(activeId)
    if (!bundle || bundle.disposed) return
    // Simulate typing the label
    while (bundle.buffer.length) {
      bundle.buffer = bundle.buffer.slice(0, -1)
      bundle.term.write('\b \b')
    }
    bundle.term.write(cmd.label)
    bundle.term.write('\r\n')
    bundle.buffer = ''
    void runLine(activeId, cmd.label, bundle.term).then(() => {
      if (!bundle.disposed) bundle.term.write('$ ')
    })
  }

  const active = sessions.find((s) => s.id === activeId) || sessions[0]!

  return (
    <GlassFrame
      title={title}
      subtitle={`${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${status}`}
      onClose={onClose}
      embedded
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={clearActive} title="Clear view">
            Clear
          </button>
          <button type="button" className="btn" onClick={addSession}>
            + Session
          </button>
        </>
      }
    >
      <div className="terminal-shell">
        <div className="terminal-tabs" role="tablist" aria-label="Terminal sessions">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === activeId}
              className={`terminal-tab ${s.id === activeId ? 'on' : ''}`}
              onClick={() => setActiveId(s.id)}
              onDoubleClick={() => {
                const name = window.prompt('Rename session', s.title)
                if (!name?.trim()) return
                setSessions((list) =>
                  list.map((x) => (x.id === s.id ? { ...x, title: name.trim() } : x))
                )
              }}
            >
              <span>{s.title}</span>
              <span
                className="tab-x"
                role="button"
                tabIndex={0}
                aria-label={`Close ${s.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  closeSession(s.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    closeSession(s.id)
                  }
                }}
              >
                ×
              </span>
            </button>
          ))}
          <button type="button" className="terminal-tab add" onClick={addSession} title="New session">
            +
          </button>
        </div>

        <div className="terminal-host" ref={hostRef} aria-label={active.title} />

        <div className="terminal-chips" role="toolbar" aria-label="Safe commands">
          <span className="terminal-chips-label">Safe cmds</span>
          {cmds.map((c) => (
            <button
              key={c.id}
              type="button"
              className="terminal-chip"
              title={c.hint}
              onClick={() => runChip(c)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </GlassFrame>
  )
}
