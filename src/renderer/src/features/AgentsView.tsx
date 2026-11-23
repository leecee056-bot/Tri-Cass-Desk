import { useEffect, useMemo, useState } from 'react'
import type { AgentRun } from '../../../shared/types'
import { DESK_KNOWLEDGE, knowledgeAsSystemPrompt } from '../knowledge/deskKnowledge'
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

/**
 * OpenCode-inspired local agents: inspect / plan / build with knowledge + file tools.
 */
export default function AgentsView(): React.JSX.Element {
  const [mode, setMode] = useState<AgentMode>('inspect')
  const [prompt, setPrompt] = useState('Summarize disk and CPU health')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Local allowlisted tools + Ollama when available')
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

  const runInspect = async (text: string): Promise<AgentRun> => {
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
          }
        ],
        at: Date.now()
      }
    }
    return window.desk.agentRun(text)
  }

  const runPlanOrBuild = async (text: string): Promise<AgentRun> => {
    const steps: AgentRun['steps'] = []
    const at = Date.now()
    steps.push({
      kind: 'plan',
      text: `${mode.toUpperCase()} agent using Tri-Cass knowledge + local tools.`,
      at
    })

    if (window.desk) {
      const lower = text.toLowerCase()
      if (lower.includes('list') || lower.includes('files') || lower.includes('workspace')) {
        const home = await window.desk.homeDir()
        const { path, entries } = await window.desk.listDir(home)
        steps.push({
          kind: 'tool',
          text: `listDir ${path}\n` + entries.slice(0, 30).map((e) => `${e.isDirectory ? 'dir' : 'file'} ${e.name}`).join('\n'),
          at: Date.now()
        })
      }
      if (lower.startsWith('read ') || lower.includes('read file')) {
        const path = text.replace(/^read( file)?\s+/i, '').trim()
        try {
          const body = await window.desk.readTextFile(path)
          steps.push({
            kind: 'tool',
            text: `read ${path}\n${body.slice(0, 4000)}`,
            at: Date.now()
          })
        } catch (e) {
          steps.push({ kind: 'error', text: String(e), at: Date.now() })
        }
      }

      const inspect = await window.desk.agentRun(text)
      steps.push(...inspect.steps)

      if (mode === 'build' && window.desk) {
        const st = await window.desk.ollamaStatus()
        if (st.ok) {
          try {
            const reply = await window.desk.chatGenerate(
              [{ role: 'user', content: text }],
              {
                temperature: 0.3,
                system:
                  knowledgeAsSystemPrompt() +
                  '\nYou are the Build agent. Propose concrete file edits as:\nWRITE path/to/file\n```\ncontent\n```\nOnly when safe.'
              }
            )
            steps.push({ kind: 'llm', text: reply, at: Date.now() })
            const match = reply.match(/WRITE\s+(\S+)\s*```[\w]*\n([\s\S]*?)```/i)
            if (match) {
              setPendingWrite({ path: match[1]!, content: match[2]! })
              steps.push({
                kind: 'permission',
                text: `Proposed write to ${match[1]} — approve below to apply.`,
                at: Date.now()
              })
            }
          } catch (e) {
            steps.push({ kind: 'error', text: `LLM: ${String(e)}`, at: Date.now() })
          }
        } else {
          steps.push({
            kind: 'note',
            text: `Ollama offline (${st.detail}). Inspect tools still ran.`,
            at: Date.now()
          })
        }
      } else if (mode === 'plan') {
        steps.push({
          kind: 'note',
          text: 'Plan mode is read-only — no file writes will be applied.',
          at: Date.now()
        })
      }
    } else {
      steps.push({
        kind: 'note',
        text: 'Preview mode: knowledge base available; file tools need Electron Desk.',
        at: Date.now()
      })
      steps.push({
        kind: 'knowledge',
        text: DESK_KNOWLEDGE.map((d) => d.title).join('\n'),
        at: Date.now()
      })
    }

    return { id: uid(), prompt: text, status: 'done', steps, at: Date.now() }
  }

  const go = async (): Promise<void> => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setPendingWrite(null)
    try {
      const run =
        mode === 'inspect' ? await runInspect(prompt.trim()) : await runPlanOrBuild(prompt.trim())
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
      setStatus(`${mode} finished · ${run.steps.length} steps`)
      void window.desk?.noteActivity()
    } finally {
      setBusy(false)
    }
  }

  const approveWrite = async (): Promise<void> => {
    if (!pendingWrite || !window.desk) return
    await window.desk.writeTextFile(pendingWrite.path, pendingWrite.content)
    setStatus(`Wrote ${pendingWrite.path}`)
    setPendingWrite(null)
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
        OpenCode-style local agents — <strong>inspect</strong> (telemetry), <strong>plan</strong>{' '}
        (read-only), <strong>build</strong> (LLM + approve writes). {status}
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
          placeholder="Ask the agent…"
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
          <button type="button" className="btn" onClick={() => void approveWrite()}>
            Approve write
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
              Tips: “cpu load”, “vault notes”, “list files”, “read ~/path/file.ts”
            </p>
          ) : (
            active.run.steps.map((s, i) => (
              <div key={`${s.at}-${i}`} className="chat-bubble assistant">
                <strong>{s.kind}</strong>
                {'\n'}
                {s.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
