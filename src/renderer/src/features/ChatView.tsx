import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage, OllamaModel } from '../../../shared/types'
import {
  DESK_KNOWLEDGE,
  knowledgeAsSystemPrompt,
  modeSystemPrompt,
  searchKnowledge
} from '../knowledge/deskKnowledge'
import './features.css'

type ChatMode = 'chat' | 'code' | 'plan'

type Session = {
  id: string
  title: string
  messages: ChatMessage[]
  model: string
  temperature: number
  system: string
  maxContext?: number
  mode: ChatMode
  useKnowledge: boolean
  updatedAt: number
}

const STORE_KEY = 'tricass-desk-chat-sessions-v2'
const ACTIVE_KEY = 'tricass-desk-chat-active-v2'

function uid(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function blankSession(partial?: Partial<Session>): Session {
  return {
    id: uid(),
    title: 'New chat',
    messages: [],
    model: '',
    temperature: 0.7,
    system: '',
    maxContext: 32,
    mode: 'chat',
    useKnowledge: true,
    updatedAt: Date.now(),
    ...partial
  }
}

function loadSessions(): Session[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') as Session[]
    if (Array.isArray(raw) && raw.length) {
      return raw.map((s) => ({
        ...blankSession(),
        ...s,
        mode: s.mode || 'chat',
        useKnowledge: s.useKnowledge !== false
      }))
    }
  } catch {
    /* ignore */
  }
  return [blankSession()]
}

type Props = {
  onCloseWindow?: () => void
  openApp?: (appId: string, title?: string) => void
}

export default function ChatView({ onCloseWindow, openApp }: Props): React.JSX.Element {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [activeId, setActiveId] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || loadSessions()[0]!.id
  )
  const [models, setModels] = useState<OllamaModel[]>([])
  const [status, setStatus] = useState('Checking Ollama…')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showKb, setShowKb] = useState(false)
  const [sidebar, setSidebar] = useState(true)
  const [query, setQuery] = useState('')
  const [kbQuery, setKbQuery] = useState('')
  const [attached, setAttached] = useState<{ path: string; excerpt: string } | null>(null)
  const cancelRef = useRef(false)
  const logRef = useRef<HTMLDivElement>(null)

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) || sessions[0]!,
    [sessions, activeId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    )
  }, [sessions, query])

  const kbHits = useMemo(() => searchKnowledge(kbQuery), [kbQuery])

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  useEffect(() => {
    void refreshModels()
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [active.messages.length, busy])

  const patchActive = (partial: Partial<Session>): void => {
    setSessions((list) =>
      list.map((s) => (s.id === active.id ? { ...s, ...partial, updatedAt: Date.now() } : s))
    )
  }

  const refreshModels = async (): Promise<void> => {
    if (!window.desk) {
      setStatus('Browser preview — start Desk (Electron) + Ollama for live models')
      return
    }
    const st = await window.desk.ollamaStatus()
    setStatus(st.detail)
    if (!st.ok) return
    try {
      const list = await window.desk.ollamaModels()
      setModels(list)
      if (list[0] && !active.model) patchActive({ model: list[0].name })
    } catch {
      /* ignore */
    }
  }

  const contextWindow = (msgs: ChatMessage[]): ChatMessage[] => {
    const n = active.maxContext ?? 32
    return msgs.length > n ? msgs.slice(-n) : msgs
  }

  const buildSystem = (): string => {
    const parts = [
      modeSystemPrompt(active.mode),
      active.system.trim(),
      active.useKnowledge ? knowledgeAsSystemPrompt() : '',
      attached
        ? `Attached file ${attached.path}:\n\`\`\`\n${attached.excerpt.slice(0, 6000)}\n\`\`\``
        : ''
    ]
    return parts.filter(Boolean).join('\n\n')
  }

  const newChat = (mode: ChatMode = active.mode): void => {
    const s = blankSession({
      model: active.model || models[0]?.name || '',
      system: active.system,
      maxContext: active.maxContext ?? 32,
      mode,
      useKnowledge: active.useKnowledge
    })
    setSessions((list) => [s, ...list])
    setActiveId(s.id)
    setAttached(null)
  }

  const deleteChat = (id: string): void => {
    setSessions((list) => {
      const next = list.filter((s) => s.id !== id)
      if (!next.length) {
        const s = blankSession()
        setActiveId(s.id)
        return [s]
      }
      if (id === activeId) setActiveId(next[0]!.id)
      return next
    })
  }

  const renameChat = (id: string): void => {
    const title = window.prompt('Rename chat', sessions.find((s) => s.id === id)?.title || '')
    if (!title?.trim()) return
    setSessions((list) =>
      list.map((s) => (s.id === id ? { ...s, title: title.trim(), updatedAt: Date.now() } : s))
    )
  }

  const exportChat = async (format: 'md' | 'json'): Promise<void> => {
    const body =
      format === 'json'
        ? JSON.stringify(active, null, 2)
        : `# ${active.title}\n\n` +
          active.messages.map((m) => `**${m.role}**: ${m.content}`).join('\n\n')
    if (window.desk) {
      await window.desk.clipboardWrite(body)
      setStatus(`Copied ${format.toUpperCase()} to clipboard`)
    } else {
      await navigator.clipboard?.writeText(body)
      setStatus(`Copied ${format.toUpperCase()}`)
    }
  }

  const attachFile = async (): Promise<void> => {
    if (!window.desk) {
      setStatus('Attach requires Desk Electron APIs')
      return
    }
    const home = await window.desk.homeDir()
    const path = window.prompt('Path to attach (text file)', `${home}/`)
    if (!path) return
    try {
      const text = await window.desk.readTextFile(path)
      setAttached({ path, excerpt: text.slice(0, 12000) })
      setStatus(`Attached ${path}`)
    } catch (e) {
      setStatus(`Attach failed: ${String(e)}`)
    }
  }

  const runCodeTools = async (prompt: string): Promise<string | null> => {
    if (!window.desk || active.mode === 'chat') return null
    const lower = prompt.toLowerCase()
    if (lower.includes('list files') || lower.startsWith('/ls') || lower.includes('list dir')) {
      const home = await window.desk.homeDir()
      const { path, entries } = await window.desk.listDir(home)
      return `Workspace listing for ${path}:\n` + entries.slice(0, 40).map((e) => `${e.isDirectory ? '📁' : '📄'} ${e.name}`).join('\n')
    }
    if (lower.startsWith('/read ') || lower.startsWith('read file ')) {
      const path = prompt.replace(/^\/read\s+/i, '').replace(/^read file\s+/i, '').trim()
      try {
        const text = await window.desk.readTextFile(path)
        return `Contents of ${path} (truncated):\n\`\`\`\n${text.slice(0, 5000)}\n\`\`\``
      } catch (e) {
        return `Could not read ${path}: ${String(e)}`
      }
    }
    if (active.mode !== 'plan' && (lower.startsWith('/agent ') || lower.includes('run agent'))) {
      const p = prompt.replace(/^\/agent\s+/i, '').replace(/run agent/i, '').trim() || prompt
      const run = await window.desk.agentRun(p)
      return run.steps.map((s) => `[${s.kind}] ${s.text}`).join('\n\n')
    }
    return null
  }

  const handleSlash = (raw: string): boolean => {
    const t = raw.trim()
    if (t === '/new') {
      newChat()
      return true
    }
    if (t === '/clear') {
      patchActive({ messages: [] })
      return true
    }
    if (t === '/code') {
      patchActive({ mode: 'code' })
      setStatus('Code mode — OpenCode-style local coding agent')
      return true
    }
    if (t === '/plan') {
      patchActive({ mode: 'plan' })
      setStatus('Plan mode — read-only analysis')
      return true
    }
    if (t === '/chat') {
      patchActive({ mode: 'chat' })
      return true
    }
    if (t === '/kb' || t.startsWith('/kb ')) {
      setShowKb(true)
      setKbQuery(t.slice(3).trim())
      setStatus('Knowledge base open')
      return true
    }
    if (t.startsWith('/model ')) {
      patchActive({ model: t.slice(7).trim() })
      return true
    }
    return false
  }

  const send = async (): Promise<void> => {
    if (!input.trim() || busy) return
    const text = input.trim()
    setInput('')
    if (handleSlash(text)) return

    setBusy(true)
    cancelRef.current = false
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, at: Date.now() }
    const prior = [...active.messages, userMsg]
    const title =
      active.title === 'New chat' ? text.slice(0, 42) + (text.length > 42 ? '…' : '') : active.title
    patchActive({ messages: prior, title })

    try {
      const toolOut = await runCodeTools(text)
      if (toolOut) {
        if (cancelRef.current) return
        const assistant: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: toolOut,
          at: Date.now()
        }
        setSessions((list) =>
          list.map((s) =>
            s.id === active.id
              ? { ...s, messages: [...prior, assistant], title, updatedAt: Date.now() }
              : s
          )
        )
        void window.desk?.noteActivity()
        return
      }

      if (!window.desk) {
        const kb = active.useKnowledge
          ? `\n\n_(Knowledge: ${DESK_KNOWLEDGE.map((d) => d.title).join('; ')})_`
          : ''
        const assistant: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: `Desk Electron + Ollama aren’t connected in this preview, so I can’t generate a live model reply yet.\n\nYour message was saved in session **${title}** (${active.mode} mode).${kb}\n\nStart the desktop app with Ollama running, or use /ls and /read in Code mode once Desk APIs are available.`,
          at: Date.now()
        }
        setSessions((list) =>
          list.map((s) =>
            s.id === active.id
              ? { ...s, messages: [...prior, assistant], title, updatedAt: Date.now() }
              : s
          )
        )
        return
      }

      const reply = await window.desk.chatGenerate(
        contextWindow(prior).map((m) => ({ role: m.role, content: m.content })),
        {
          model: active.model || undefined,
          temperature: active.temperature,
          system: buildSystem()
        }
      )
      if (cancelRef.current) return
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

  const stop = (): void => {
    cancelRef.current = true
    setBusy(false)
    setStatus('Stopped')
  }

  const regenerate = async (): Promise<void> => {
    if (busy || active.messages.length < 1) return
    const trimmed = [...active.messages]
    while (trimmed.length && trimmed[trimmed.length - 1]?.role === 'assistant') trimmed.pop()
    const last = trimmed[trimmed.length - 1]
    if (!last || last.role !== 'user') return
    setInput(last.content)
    patchActive({ messages: trimmed.slice(0, -1) })
  }

  const suggestions =
    active.mode === 'code'
      ? ['/ls list home files', 'Explain this project structure', '/agent disk usage']
      : active.mode === 'plan'
        ? ['Plan a Windows pack:win release', 'What should HAP-76 ship next?']
        : ['What can Tri-Cass Desk do?', 'How does the living scene react?', '/kb']

  return (
    <div className={`chat-view ${sidebar ? 'with-side' : ''}`}>
      {sidebar ? (
        <aside className="chat-side">
          <button type="button" className="btn" onClick={() => newChat()}>
            + New chat
          </button>
          <input
            className="chat-search"
            placeholder="Search chats…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search chats"
          />
          <div className="chat-session-list">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`chat-session ${s.id === active.id ? 'on' : ''}`}
                onClick={() => setActiveId(s.id)}
                onDoubleClick={() => renameChat(s.id)}
              >
                <span>
                  <em className="chat-mode-tag">{s.mode}</em> {s.title}
                </span>
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
          <button type="button" className="btn btn-ghost" onClick={() => setSidebar((v) => !v)}>
            ☰
          </button>
          <div className="chat-mode-switch" role="tablist" aria-label="Chat mode">
            {(['chat', 'code', 'plan'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active.mode === m}
                className={`btn btn-ghost ${active.mode === m ? 'on' : ''}`}
                onClick={() => patchActive({ mode: m })}
              >
                {m}
              </button>
            ))}
          </div>
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
            className={`btn btn-ghost ${showSettings ? 'on' : ''}`}
            aria-expanded={showSettings}
            onClick={() => setShowSettings((v) => !v)}
          >
            {showSettings ? 'Hide settings' : 'Settings'}
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${showKb ? 'on' : ''}`}
            onClick={() => setShowKb((v) => !v)}
          >
            Knowledge
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void attachFile()}>
            Attach
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void exportChat('md')}>
            Export
          </button>
          {openApp ? (
            <button type="button" className="btn btn-ghost" onClick={() => openApp('agents', 'Agents')}>
              Agents
            </button>
          ) : null}
          <span className="chat-toolbar-spacer" />
          {onCloseWindow ? (
            <button type="button" className="btn btn-ghost" onClick={onCloseWindow}>
              Close window
            </button>
          ) : null}
        </div>

        {showSettings ? (
          <div id="chat-settings-panel" className="chat-settings" role="region">
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
              Max context messages
              <input
                type="number"
                min={4}
                max={64}
                value={active.maxContext ?? 32}
                onChange={(e) =>
                  patchActive({ maxContext: Math.max(4, Math.min(64, Number(e.target.value) || 32)) })
                }
              />
            </label>
            <label className="chat-check">
              <input
                type="checkbox"
                checked={active.useKnowledge}
                onChange={(e) => patchActive({ useKnowledge: e.target.checked })}
              />
              Inject Tri-Cass knowledge base into system prompt
            </label>
            <label>
              Custom system prompt
              <textarea
                value={active.system}
                placeholder="Optional per-chat instructions…"
                onChange={(e) => patchActive({ system: e.target.value })}
              />
            </label>
          </div>
        ) : null}

        {showKb ? (
          <div className="chat-kb" role="region" aria-label="Knowledge base">
            <input
              placeholder="Search knowledge…"
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
            />
            <div className="chat-kb-list">
              {kbHits.map((d) => (
                <details key={d.id}>
                  <summary>
                    {d.title}{' '}
                    <em>{d.tags.join(', ')}</em>
                  </summary>
                  <pre>{d.body}</pre>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        <div className="status-line">
          {status}
          {attached ? ` · Attached ${attached.path}` : ''}
        </div>

        <div className="chat-log" ref={logRef}>
          {active.messages.length === 0 ? (
            <div className="chat-empty">
              <p>
                Local {active.mode} via Ollama — sessions, knowledge, attach, export, slash commands
                (/new /code /plan /kb /ls /read).
              </p>
              <div className="chat-suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="btn btn-ghost" onClick={() => setInput(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {active.messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {busy ? <div className="chat-bubble assistant thinking">Thinking…</div> : null}
        </div>

        <div className="chat-actions">
          {busy ? (
            <button type="button" className="btn" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => void regenerate()}>
              Edit last / regenerate
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const last = [...active.messages].reverse().find((m) => m.role === 'assistant')
              if (last) void window.desk?.clipboardWrite(last.content)
            }}
          >
            Copy last
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => patchActive({ messages: [] })}>
            Clear thread
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void exportChat('json')}>
            Export JSON
          </button>
          {attached ? (
            <button type="button" className="btn btn-ghost" onClick={() => setAttached(null)}>
              Detach file
            </button>
          ) : null}
        </div>

        <div className="feature-toolbar chat-compose">
          <textarea
            value={input}
            placeholder={
              active.mode === 'code'
                ? 'Code agent — ask, /ls, /read path, /agent …'
                : 'Message Tri-Cass Desk… (/ for commands)'
            }
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
            {busy ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
