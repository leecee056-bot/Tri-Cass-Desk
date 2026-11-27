import { useEffect, useMemo, useState } from 'react'
import { Preferences } from '@capacitor/preferences'

type Tab = 'chat' | 'vault' | 'settings'
type Msg = { role: 'user' | 'assistant'; text: string }
type Note = { id: string; title: string; body: string; at: number }

const OLLAMA_KEY = 'desk.mobile.ollamaHost'
const NOTES_KEY = 'desk.mobile.notes'

async function loadHost(): Promise<string> {
  const { value } = await Preferences.get({ key: OLLAMA_KEY })
  return value || 'http://127.0.0.1:11434'
}

async function saveHost(host: string): Promise<void> {
  await Preferences.set({ key: OLLAMA_KEY, value: host.replace(/\/$/, '') })
}

async function loadNotes(): Promise<Note[]> {
  const { value } = await Preferences.get({ key: NOTES_KEY })
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as Note[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveNotes(notes: Note[]): Promise<void> {
  await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(notes.slice(0, 80)) })
}

async function ollamaChat(
  host: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const tags = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(4000) })
  if (!tags.ok) throw new Error(`Ollama HTTP ${tags.status}`)
  const data = (await tags.json()) as { models?: Array<{ name: string }> }
  const model = data.models?.[0]?.name
  if (!model) throw new Error('No models pulled on that Ollama host.')

  const res = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are Tri-Cass Desk on mobile/TV — local, offline-first. Be concise. Never claim cloud weather APIs.'
        },
        ...messages
      ]
    }),
    signal: AbortSignal.timeout(180_000)
  })
  if (!res.ok) throw new Error(`Chat failed HTTP ${res.status}`)
  const body = (await res.json()) as { message?: { content?: string } }
  return body.message?.content?.trim() || '(empty)'
}

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('chat')
  const [host, setHost] = useState('http://127.0.0.1:11434')
  const [status, setStatus] = useState('Local Ollama chat · vault on device')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    void (async () => {
      setHost(await loadHost())
      setNotes(await loadNotes())
    })()
  }, [])

  const canSend = useMemo(() => prompt.trim().length > 0 && !busy, [prompt, busy])

  const send = async (): Promise<void> => {
    if (!canSend) return
    const text = prompt.trim()
    setPrompt('')
    setBusy(true)
    setMsgs((m) => [...m, { role: 'user', text }])
    try {
      const reply = await ollamaChat(
        host,
        [...msgs, { role: 'user', text }].map((m) => ({
          role: m.role,
          content: m.text
        }))
      )
      setMsgs((m) => [...m, { role: 'assistant', text: reply }])
      setStatus(`Replied via ${host}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMsgs((m) => [...m, { role: 'assistant', text: `Offline / error: ${msg}` }])
      setStatus(msg)
    } finally {
      setBusy(false)
    }
  }

  const addNote = async (): Promise<void> => {
    if (!title.trim() || !body.trim()) return
    const next: Note[] = [
      { id: `n-${Date.now()}`, title: title.trim(), body: body.trim(), at: Date.now() },
      ...notes
    ]
    setNotes(next)
    await saveNotes(next)
    setTitle('')
    setBody('')
    setStatus('Note saved on device')
  }

  return (
    <div className="app">
      <h1 className="brand">Tri-Cass Desk</h1>
      <p className="lede">
        Mobile / Android TV shell — chat a local Ollama host and keep a small vault on this
        device. Full desktop Desk (Editor, Agents, living world) ships as Windows / Linux /
        Pi AppImage builds.
      </p>

      <div className="tabs" role="tablist">
        {(['chat', 'vault', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? 'on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className="panel">
          <div className="chat-log">
            {msgs.length === 0 ? (
              <p className="status">Ask something once Ollama is reachable from this device.</p>
            ) : (
              msgs.map((m, i) => (
                <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
                  {m.text}
                </div>
              ))
            )}
          </div>
          <label htmlFor="prompt">Message</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Say hello…"
          />
          <div className="row">
            <button type="button" className="btn primary" disabled={!canSend} onClick={() => void send()}>
              {busy ? 'Thinking…' : 'Send'}
            </button>
          </div>
          <p className="status">{status}</p>
        </div>
      ) : null}

      {tab === 'vault' ? (
        <div className="panel">
          <label htmlFor="nt">Title</label>
          <input id="nt" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label htmlFor="nb">Note</label>
          <textarea id="nb" value={body} onChange={(e) => setBody(e.target.value)} />
          <button type="button" className="btn primary" onClick={() => void addNote()}>
            Save note
          </button>
          {notes.map((n) => (
            <div key={n.id} className="note">
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="panel">
          <label htmlFor="host">Ollama base URL</label>
          <input
            id="host"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="http://192.168.1.10:11434"
          />
          <p className="status">
            Phones/TV boxes usually need the LAN IP of a PC running Ollama (not 127.0.0.1).
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() =>
              void saveHost(host).then(() => setStatus(`Saved Ollama host ${host}`))
            }
          >
            Save host
          </button>
          <p className="status">{status}</p>
        </div>
      ) : null}
    </div>
  )
}
