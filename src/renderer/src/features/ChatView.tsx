import { useEffect, useState } from 'react'
import type { ChatMessage, OllamaModel } from '../../../shared/types'
import './features.css'

export default function ChatView(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [models, setModels] = useState<OllamaModel[]>([])
  const [model, setModel] = useState('')
  const [status, setStatus] = useState('Checking Ollama…')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      if (!window.desk) return
      setMessages(await window.desk.chatHistory())
      const st = await window.desk.ollamaStatus()
      setStatus(st.detail)
      if (st.ok) {
        try {
          const list = await window.desk.ollamaModels()
          setModels(list)
          if (list[0]) setModel(list[0].name)
        } catch {
          /* ignore */
        }
      }
    })()
  }, [])

  const send = async (): Promise<void> => {
    if (!window.desk || !input.trim() || busy) return
    setBusy(true)
    try {
      const next = await window.desk.chatSend(input.trim(), model || undefined)
      setMessages(next)
      setInput('')
      void window.desk.noteActivity()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="feature">
      <div className="feature-toolbar">
        <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
          {models.length === 0 ? <option value="">No local models</option> : null}
          {models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void window.desk?.chatClear().then(() => setMessages([]))
          }}
        >
          Clear
        </button>
      </div>
      <div className="status-line">{status}</div>
      <div className="chat-log">
        {messages.length === 0 ? (
          <p className="status-line">Local chat via Ollama. Offline-first — no cloud required.</p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="feature-toolbar">
        <input
          value={input}
          placeholder="Message Tri-Cass Desk…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send()
          }}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void send()}>
          {busy ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
