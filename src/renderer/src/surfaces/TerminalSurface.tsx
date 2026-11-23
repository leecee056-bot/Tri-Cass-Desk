import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import GlassFrame from './GlassFrame'
import './surfaces.css'

type Props = {
  title?: string
  onClose?: () => void
}

/** Glass terminal UI (xterm). Commands go through allowlisted Desk IPC — not a raw shell. */
export default function TerminalSurface({
  title = 'Terminal',
  onClose
}: Props): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!hostRef.current || termRef.current) return
    const term = new Terminal({
      convertEol: true,
      fontFamily: 'ui-monospace, Cascadia Code, monospace',
      fontSize: 13,
      theme: {
        background: '#070b16',
        foreground: '#d7e6ff',
        cursor: '#7ad7ff',
        selectionBackground: '#7ad7ff55'
      }
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(hostRef.current)
    fit.fit()
    term.writeln('Tri-Cass Desk · glass terminal')
    term.writeln('Allowlisted commands: help | node -v | npm -v | ollama list | clear')
    term.write('$ ')

    let buffer = ''
    term.onData((data) => {
      for (const ch of data) {
        if (ch === '\r') {
          term.write('\r\n')
          void handleLine(buffer.trim(), term)
          buffer = ''
          term.write('$ ')
        } else if (ch === '\u007f') {
          if (buffer.length) {
            buffer = buffer.slice(0, -1)
            term.write('\b \b')
          }
        } else {
          buffer += ch
          term.write(ch)
        }
      }
    })

    termRef.current = term
    const onResize = (): void => fit.fit()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      term.dispose()
      termRef.current = null
    }
  }, [])

  return (
    <GlassFrame title={title} subtitle="xterm · allowlisted local commands" onClose={onClose} embedded>
      <div className="terminal-host" ref={hostRef} />
    </GlassFrame>
  )
}

async function handleLine(line: string, term: Terminal): Promise<void> {
  if (!line) return
  if (line === 'clear') {
    term.clear()
    return
  }
  if (line === 'help') {
    term.writeln('help, clear, node -v, npm -v, ollama list')
    return
  }
  const map: Record<string, string> = {
    'node -v': 'node-version',
    'npm -v': 'npm-version',
    'ollama list': 'ollama-list'
  }
  const id = map[line]
  if (!id || !window.desk) {
    term.writeln(`unknown or blocked: ${line}`)
    return
  }
  const res = await window.desk.runSafeCommand(id)
  term.writeln(res.output)
}
