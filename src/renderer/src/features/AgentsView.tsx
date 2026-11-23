import { useState } from 'react'
import type { AgentRun } from '../../../shared/types'
import './features.css'

export default function AgentsView(): React.JSX.Element {
  const [prompt, setPrompt] = useState('top processes')
  const [run, setRun] = useState<AgentRun | null>(null)
  const [busy, setBusy] = useState(false)

  const go = async (): Promise<void> => {
    if (!window.desk || !prompt.trim() || busy) return
    setBusy(true)
    try {
      setRun(await window.desk.agentRun(prompt.trim()))
      void window.desk.noteActivity()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="feature">
      <p className="status-line">
        Local allowlisted agent — machine inspect only (CPU/RAM, processes, disks, vault, Ollama).
      </p>
      <div className="feature-toolbar">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button type="button" className="btn" disabled={busy} onClick={() => void go()}>
          {busy ? 'Running…' : 'Run agent'}
        </button>
      </div>
      <div className="agent-log">
        {!run ? (
          <p className="status-line">Try: “disk usage”, “list models”, “vault notes”, “cpu load”.</p>
        ) : (
          run.steps.map((s, i) => (
            <div key={`${s.at}-${i}`} className="chat-bubble assistant">
              <strong>{s.kind}</strong>
              {'\n'}
              {s.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
