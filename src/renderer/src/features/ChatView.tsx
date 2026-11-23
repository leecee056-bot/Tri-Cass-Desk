import { useEffect, useMemo, useState } from 'react'
import type { ChatMessage, OllamaModel } from '../../../shared/types'
import './features.css'

type Session = {
  id: string
  title: string
  messages: ChatMessage[]
  model: string
  temperature: number
  system: string
  updatedAt: number
}

const STORE_KEY = 'tricass-desk-chat-sessions-v1'
const ACTIVE_KEY = 'tricass-desk-chat-active'

function uid(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadSessions(): Session[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') as Session[]
    return Array.isArray(raw) && raw.length
      ? raw
      : [
          {
            id: uid(),
            title: 'New chat',
            messages: [],
            model: '',
            temperature: 0.7,
            system: '',
            updatedAt: Date.now()
          }
        ]
  } catch {
    return [
      {
        id: uid(),
        title: 'New chat',
        messages: [],
        model: '',
        temperature: 0.7,
        system: '',
        updatedAt: Date.now()
      }
    ]
  }
}

type Props = {
  onCloseWindow?: () => void
}

export default function ChatView({ onCloseWindow }: Props): React.JSX.Element {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [activeId, setActiveId] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || loadSessions()[0]!.id
  )
  const [models, setModels] = useState<OllamaModel[]>([])
  const [status, setStatus] = useState('Checking Ollama…')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sidebar, setSidebar] = useState(true)

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) || sessions[0]!,
    [sessions, activeId]
  )

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  useEffect(() => {
    void refreshModels()
  }, [])

  const refreshModels = async (): Promise<void> => {
    if (!window.desk) return
    const st = await window.desk.ollamaStatus()
    setStatus(st.detail)
    if (!st.ok) return
    try {
      const list = await window.desk.ollamaModels()
      setModels(list)
      if (list[0] && !active.model) {
        patchActive({ model: list[0].name })
      }
    } catch {
      /* ignore */
    }
  }

  const patchActive = ( partial: Partial<Session>): void => {
    setSessions((list) =>
      list.map((s) => (s.id === active.id ? { ...s, ...partial, updatedAt: Date.now() } : s))
    )
  }

  const newChat = (): void => {
    const s: Session = {
      id: uid(),
      title: 'New chat',
      messages: [],
      model: active.model || models[0]?.name || '',
      temperature: 0.7,
      system: active.system,
      updatedAt: Date.now()
    }
    setSessions((list) => [s, ...list])
    setActiveId(s.id)
  }

  const deleteChat = (id: string): void => {
    setSessions((list) => {
      const next = list.filter((s) => s.id !== id)
      if (!next.length) {
        const s: Session = {
          id: uid(),
          title: 'New chat',
          messages: [],
          model: '',
          temperature: 0.7,
          system: '',
          updatedAt: Date.now()
        }
        setActiveId(s.id)
        return [s]
      }
      if (id === activeId) setActiveId(next[0]!.id)
      return next
    })
  }

  const send = async (): Promise<void> => {
    if (!window.desk || !input.trim() || busy) return
    const text = input.trim()
    setInput('')
    setBusy(true)
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      at: Date.now()
    }
    const prior = [...active.messages, userMsg]
    const title =
      active.title === 'New chat' ? text.slice(0, 42) + (text.length > 42 ? '…' : '') : active.title
    patchActive({ messages: prior, title })

    try {
      const reply = await window.desk.chatGenerate(
        prior.map((m) => ({ role: m.role, content: m.content })),
        {
          model: active.model || undefined,
          temperature: active.temperature,
          system: active.system || undefined
        }
      )
      const assistant: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: reply,
        at: Date.now()
      }
      setSessions((list) =>
        list.map((s) =>
          s.id === active.id
            ? { ...s, messages: [...prior, assistant], title, updatedAt: Date.now() }
            : s
        )
      )
      void window.desk.noteActivity()
    } finally {
      setBusy(false)
    }
  }

  const regenerate = async (): Promise<void> => {
    if (!window.desk || busy || active.messages.length < 1) return
    const trimmed = [...active.messages]
    while (trimmed.length && trimmed[trimmed.length - 1]?.role === 'assistant') trimmed.pop()
    if (!trimmed.length || trimmed[trimmed.length - 1]?.role !== 'user') return
    setBusy(true)
    patchActive({ messages: trimmed })
    try {
      const reply = await window.desk.chatGenerate(
        trimmed.map((m) => ({ role: m.role, content: m.content })),
        {
          model: active.model || undefined,
          temperature: active.temperature,
          system: active.system || undefined
        }
      )
      const assistant: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: reply,
        at: Date.now()
      }
      setSessions((list) =>
        list.map((s) =>
          s.id === active.id
            ? { ...s, messages: [...trimmed, assistant], updatedAt: Date.now() }
            : s
        )
      )
    } finally {
      setBusy(false)
    }
  }

  const copyLast = async (): Promise<void> => {
    const last = [...active.messages].reverse().find((m) => m.role === 'assistant')
    if (!last) return
    await window.desk?.clipboardWrite(last.content)
  }

  return (
    <div className={`chat-app ${sidebar ? 'with-side' : ''}`}>
      {sidebar ? (
        <aside className="chat-side">
          <button type="button" className="btn" onClick={newChat}>
            + New chat
          </button>
          <div className="chat-session-list">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`chat-session ${s.id === active.id ? 'on' : ''}`}
                onClick={() => setActiveId(s.id)}
              >
                <span>{s.title}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteChat(s.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="chat-main">
        <div className="chat-toolbar">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSidebar((v) => !v)}
            title="Toggle chats"
          >
            ☰
          </button>
          <button type="button" className="btn btn-ghost" onClick={newChat}>
            New
          </button>
          <select
            value={active.model}
            onChange={(e) => patchActive({ model: e.target.value })}
            aria-label="Model"
          >
            {models.length === 0 ? <option value="">No local models</option> : null}
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => void refreshModels()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowSettings((v) => !v)}
          >
            Settings
          </button>
          <span className="chat-toolbar-spacer" />
          {onCloseWindow ? (
            <button type="button" className="btn btn-ghost" onClick={onCloseWindow}>
              Close window
            </button>
          ) : null}
        </div>

        {showSettings ? (
          <div className="chat-settings">
            <label>
              Temperature {active.temperature.toFixed(1)}
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.1}
                value={active.temperature}
                onChange={(e) => patchActive({ temperature: Number(e.target.value) })}
              />
            </label>
            <label>
              System prompt
              <textarea
                value={active.system}
                placeholder="Optional instructions for this chat…"
                onChange={(e) => patchActive({ system: e.target.value })}
              />
            </label>
          </div>
        ) : null}

        <div className="status-line">{status}</div>

        <div className="chat-log">
          {active.messages.length === 0 ? (
            <p className="status-line">
              Local chat via Ollama — new chats, history, temperature, and system prompt. Offline-first.
            </p>
          ) : null}
          {active.messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
        </div>

        <div className="chat-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void regenerate()}>
            Regenerate
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void copyLast()}>
            Copy last
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => patchActive({ messages: [] })}
          >
            Clear thread
          </button>
        </div>

        <div className="feature-toolbar chat-compose">
          <textarea
            value={input}
            placeholder="Message Tri-Cass Desk…"
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <button type="button" className="btn" disabled={busy} onClick={() => void send()}>
            {busy ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
