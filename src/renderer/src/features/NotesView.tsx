import { useEffect, useMemo, useState } from 'react'
import './features.css'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: number
  pinned?: boolean
}

const KEY = 'tricass-desk-notes-v2'

function uid(): string {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function load(): Note[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as Note[]
    if (Array.isArray(raw) && raw.length) return raw
  } catch {
    /* ignore */
  }
  return [
    {
      id: uid(),
      title: 'Welcome',
      body: 'Apple Notes–style local notes. Pin, search, and keep thoughts on this machine only.',
      updatedAt: Date.now(),
      pinned: true
    }
  ]
}

/** Multi-note pad — market equivalent: Apple Notes / simple Notion. */
export default function NotesView(): React.JSX.Element {
  const [notes, setNotes] = useState<Note[]>(() => load())
  const [activeId, setActiveId] = useState(() => load()[0]!.id)
  const [q, setQ] = useState('')

  const active = notes.find((n) => n.id === activeId) || notes[0]!

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = [...notes].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt
    )
    if (!query) return list
    return list.filter(
      (n) => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query)
    )
  }, [notes, q])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(notes))
  }, [notes])

  const patch = (partial: Partial<Note>): void => {
    setNotes((list) =>
      list.map((n) => (n.id === active.id ? { ...n, ...partial, updatedAt: Date.now() } : n))
    )
  }

  const create = (): void => {
    const n: Note = { id: uid(), title: 'Untitled', body: '', updatedAt: Date.now() }
    setNotes((list) => [n, ...list])
    setActiveId(n.id)
  }

  const remove = (id: string): void => {
    setNotes((list) => {
      const next = list.filter((n) => n.id !== id)
      if (!next.length) {
        const n: Note = { id: uid(), title: 'Untitled', body: '', updatedAt: Date.now() }
        setActiveId(n.id)
        return [n]
      }
      if (id === activeId) setActiveId(next[0]!.id)
      return next
    })
  }

  return (
    <div className="notes-app">
      <aside className="notes-side">
        <div className="feature-toolbar">
          <button type="button" className="btn" onClick={create}>
            + Note
          </button>
        </div>
        <input
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search notes"
        />
        <div className="notes-list">
          {filtered.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`notes-item ${n.id === active.id ? 'on' : ''}`}
              onClick={() => setActiveId(n.id)}
            >
              <strong>
                {n.pinned ? '📌 ' : ''}
                {n.title || 'Untitled'}
              </strong>
              <span>{n.body.slice(0, 60) || 'Empty note'}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="notes-main">
        <div className="feature-toolbar">
          <input
            className="notes-title"
            value={active.title}
            onChange={(e) => patch({ title: e.target.value })}
            aria-label="Note title"
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => patch({ pinned: !active.pinned })}
          >
            {active.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => remove(active.id)}>
            Delete
          </button>
        </div>
        <textarea
          className="notes-area"
          value={active.body}
          onChange={(e) => patch({ body: e.target.value })}
          aria-label="Note body"
          spellCheck
          placeholder="Start writing…"
        />
        <p className="status-line">
          Updated {new Date(active.updatedAt).toLocaleString()} · saved on this machine only
        </p>
      </div>
    </div>
  )
}
