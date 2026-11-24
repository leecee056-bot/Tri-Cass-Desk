import { useEffect, useMemo, useState } from 'react'
import type { AgentRun } from '../../../shared/types'
import { DESK_KNOWLEDGE } from '../knowledge/deskKnowledge'
import './features.css'

type AgentMode = 'inspect' | 'plan' | 'build'
type AgentSession = {
  id: string
  title: string
  mode: AgentMode
  prompt: string
  run: AgentRun | null
  at: number
}

const KEY = 'tricass-desk-agent-sessions-v1'

function uid(): string {
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function parsePermission(text: string): { path: string; content: string } | null {
  try {
    const parsed = JSON.parse(text) as { path?: string; content?: string }
    if (parsed.path && typeof parsed.content === 'string') {
      return { path: parsed.path, content: parsed.content }
    }
  } catch {
    /* legacy plain text */
  }
  return null
}

type Props = {
  openApp?: (appId: string, title?: string, payload?: Record<string, string>) => void
}

/**
 * OpenCode inspect/plan + Cline-slim grammar build (workspace checkpoints, sandbox run, Editor).
 */
export default function AgentsView({ openApp }: Props = {}): React.JSX.Element {
  const [mode, setMode] = useState<AgentMode>('inspect')
  const [prompt, setPrompt] = useState('Summarize disk and CPU health')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(
    'Cline grammar on build · checkpoints · sandbox run · local Ollama'
  )
  const [sessions, setSessions] = useState<AgentSession[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]') as AgentSession[]
    } catch {
      return []
    }
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showKb, setShowKb] = useState(false)
  const [pendingWrite, setPendingWrite] = useState<{ path: string; content: string } | null>(null)

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) || sessions[0] || null,
    [sessions, activeId]
  )

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 40)))
  }, [sessions])

  const runAgent = async (text: string): Promise<AgentRun> => {
    if (!window.desk) {
      return {
        id: uid(),
        prompt: text,
        status: 'done',
        steps: [
          {
            kind: 'note',
            text: 'Electron Desk APIs unavailable in browser preview.',
            at: Date.now()
          },
          {
            kind: 'knowledge',
            text: DESK_KNOWLEDGE.map((d) => d.title).join('\n'),
            at: Date.now()
          }
        ],
        at: Date.now()
      }
    }

    if (window.desk.agentLoop) {
      return window.desk.agentLoop(text, { mode })
    }

    // Fallback for older preload: inspect via agentRun, plan/build lightweight
    if (mode === 'inspect') return window.desk.agentRun(text)

    const steps: AgentRun['steps'] = [
      {
        kind: 'plan',
        text: `${mode} fallback without agentLoop IPC.`,
        at: Date.now()
      }
    ]
    const inspect = await window.desk.agentRun(text)
    steps.push(...inspect.steps)
    return { id: uid(), prompt: text, status: 'done', steps, at: Date.now() }
  }

  const go = async (): Promise<void> => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setPendingWrite(null)
    try {
      const run = await runAgent(prompt.trim())
      const perm = [...run.steps].reverse().find((s) => s.kind === 'permission')
      if (perm) {
        const parsed = parsePermission(perm.text)
        if (parsed) setPendingWrite(parsed)
      }
      const session: AgentSession = {
        id: uid(),
        title: prompt.trim().slice(0, 48),
        mode,
        prompt: prompt.trim(),
        run,
        at: Date.now()
      }
      setSessions((list) => [session, ...list])
      setActiveId(session.id)
      setStatus(
        `${mode} finished · ${run.steps.length} steps · ${run.status || 'done'}${
          perm ? ' · write pending approval' : ''
        }`
      )
      void window.desk?.noteActivity()
    } finally {
      setBusy(false)
    }
  }

  const approveWrite = async (): Promise<void> => {
    if (!pendingWrite || !window.desk) return
    await window.desk.writeTextFile(pendingWrite.path, pendingWrite.content)
    setStatus(`Wrote ${pendingWrite.path}`)
    openApp?.('editor', pendingWrite.path.split(/[/\\]/).pop() || 'Editor', {
      path: pendingWrite.path,
      content: pendingWrite.content
    })
    setPendingWrite(null)
  }

  const openInEditor = (): void => {
    if (!pendingWrite) return
    openApp?.('editor', pendingWrite.path.split(/[/\\]/).pop() || 'Editor', {
      path: pendingWrite.path,
      content: pendingWrite.content
    })
  }

  return (
    <div className="feature agents-view">
      <div className="chat-mode-switch" role="tablist" aria-label="Agent mode">
        {(['inspect', 'plan', 'build'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`btn btn-ghost ${mode === m ? 'on' : ''}`}
            aria-selected={mode === m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setShowKb((v) => !v)}>
          {showKb ? 'Hide AGENTS.md' : 'AGENTS.md / KB'}
        </button>
      </div>

      <p className="status-line">
        <strong>inspect</strong> (tools), <strong>plan</strong> (checklist → .tri-cass/plan.md),{' '}
        <strong>build</strong> (Cline JSON grammar · checkpoints · stuck×3 · sandbox python/node).{' '}
        {status}
      </p>

      {showKb ? (
        <div className="chat-kb">
          {DESK_KNOWLEDGE.map((d) => (
            <details key={d.id} open={d.id === 'agents-desk'}>
              <summary>{d.title}</summary>
              <pre>{d.body}</pre>
            </details>
          ))}
        </div>
      ) : null}

      <div className="feature-toolbar">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the agent… (tools: list_dir, read_file, disks, processes…)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void go()
          }}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void go()}>
          {busy ? 'Running…' : 'Run'}
        </button>
      </div>

      {pendingWrite ? (
        <div className="agent-permission">
          <p>
            Approve write to <code>{pendingWrite.path}</code>?
          </p>
          <pre className="agent-write-preview">{pendingWrite.content.slice(0, 800)}</pre>
          <button type="button" className="btn" onClick={() => void approveWrite()}>
            Approve + open Editor
          </button>
          <button type="button" className="btn btn-ghost" onClick={openInEditor}>
            Preview in Editor
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPendingWrite(null)}>
            Reject
          </button>
        </div>
      ) : null}

      <div className="agents-layout">
        <div className="agent-sessions">
          {sessions.length === 0 ? (
            <p className="status-line">No runs yet. Try “disk usage” or “list models”.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chat-session ${s.id === active?.id ? 'on' : ''}`}
                onClick={() => setActiveId(s.id)}
              >
                <em className="chat-mode-tag">{s.mode}</em> {s.title}
              </button>
            ))
          )}
        </div>
        <div className="agent-log">
          {!active?.run ? (
            <p className="status-line">
              Tips: inspect “cpu load”; plan a multi-file app; build writes under workspace/projects/
              with grammar JSON, checkpoints, and Editor review.
            </p>
          ) : (
            active.run.steps.map((s, i) => {
              const perm = s.kind === 'permission' ? parsePermission(s.text) : null
              return (
                <div key={`${s.at}-${i}`} className={`chat-bubble assistant agent-step-${s.kind}`}>
                  <strong>{s.kind}</strong>
                  {'\n'}
                  {perm
                    ? `Proposed write → ${perm.path}\n${perm.content.slice(0, 500)}`
                    : s.text}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
