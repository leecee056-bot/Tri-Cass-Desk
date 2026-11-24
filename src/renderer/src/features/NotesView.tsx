import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import './features.css'

type Note = {
  id: string
  title: string
  body: string
  updatedAt: number
  pinned?: boolean
  folderId: string
}

type Folder = {
  id: string
  name: string
}

const KEY = 'tricass-desk-notes-v3'
const FOLDER_ALL = 'all'
const FOLDER_INBOX = 'inbox'

type Store = {
  folders: Folder[]
  notes: Note[]
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function blankNote(folderId = FOLDER_INBOX, partial?: Partial<Note>): Note {
  return {
    id: uid('n'),
    title: 'Untitled',
    body: '',
    updatedAt: Date.now(),
    folderId,
    ...partial
  }
}

function defaultStore(): Store {
  return {
    folders: [
      { id: FOLDER_INBOX, name: 'Inbox' },
      { id: 'ideas', name: 'Ideas' },
      { id: 'meetings', name: 'Meetings' }
    ],
    notes: [
      blankNote(FOLDER_INBOX, {
        title: 'Welcome',
        body: [
          '# Tri-Cass Notes',
          '',
          'Apple Notes / Notion-lite — local only.',
          '',
          '- [x] Pin important notes',
          '- [ ] Write in Markdown',
          '- [ ] Use folders for Projects'
        ].join('\n'),
        pinned: true
      })
    ]
  }
}

function migrate(raw: unknown): Store {
  const base = defaultStore()
  if (!raw || typeof raw !== 'object') return base
  // v2: Note[] only
  if (Array.isArray(raw)) {
    const notes = (raw as Note[]).map((n) => ({
      ...blankNote(FOLDER_INBOX),
      ...n,
      folderId: n.folderId || FOLDER_INBOX
    }))
    return { folders: base.folders, notes: notes.length ? notes : base.notes }
  }
  const obj = raw as Partial<Store>
  const folders =
    Array.isArray(obj.folders) && obj.folders.length ? obj.folders : base.folders
  const notes =
    Array.isArray(obj.notes) && obj.notes.length
      ? obj.notes.map((n) => ({ ...blankNote(), ...n, folderId: n.folderId || FOLDER_INBOX }))
      : base.notes
  return { folders, notes }
}

function load(): Store {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('tricass-desk-notes-v2') || 'null')
    return migrate(parsed)
  } catch {
    return defaultStore()
  }
}

function wordStats(text: string): { words: number; chars: number } {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return { words, chars }
}

/** Apple Notes / Notion-lite — folders, markdown preview, checklists, pin/search. */
export default function NotesView(): React.JSX.Element {
  const [store] = useState(() => load())
  const [folders, setFolders] = useState<Folder[]>(store.folders)
  const [notes, setNotes] = useState<Note[]>(store.notes)
  const [folderId, setFolderId] = useState<string>(FOLDER_ALL)
  const [activeId, setActiveId] = useState(() => store.notes[0]?.id || '')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'updated' | 'title'>('updated')
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [dialog, setDialog] = useState<null | { kind: 'folder' | 'delete'; value: string }>(null)

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) || notes[0] || null,
    [notes, activeId]
  )

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = notes.filter((n) => folderId === FOLDER_ALL || n.folderId === folderId)
    list = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned)
      if (sort === 'title') return (a.title || '').localeCompare(b.title || '')
      return b.updatedAt - a.updatedAt
    })
    if (!query) return list
    return list.filter(
      (n) => n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query)
    )
  }, [notes, q, folderId, sort])

  const previewHtml = useMemo(() => {
    if (!active) return ''
    return DOMPurify.sanitize(marked.parse(active.body || '') as string)
  }, [active])

  const stats = useMemo(() => wordStats(active?.body || ''), [active?.body])

  useEffect(() => {
    const payload: Store = { folders, notes }
    localStorage.setItem(KEY, JSON.stringify(payload))
  }, [folders, notes])

  useEffect(() => {
    if (!notes.length) {
      const n = blankNote(folderId === FOLDER_ALL ? FOLDER_INBOX : folderId)
      setNotes([n])
      setActiveId(n.id)
      return
    }
    if (!notes.some((n) => n.id === activeId)) setActiveId(notes[0]!.id)
  }, [notes, activeId, folderId])

  const patch = (partial: Partial<Note>): void => {
    if (!active) return
    setNotes((list) =>
      list.map((n) => (n.id === active.id ? { ...n, ...partial, updatedAt: Date.now() } : n))
    )
  }

  const create = (): void => {
    const target = folderId === FOLDER_ALL ? FOLDER_INBOX : folderId
    const n = blankNote(target)
    setNotes((list) => [n, ...list])
    setActiveId(n.id)
    setMode('edit')
  }

  const duplicate = (): void => {
    if (!active) return
    const n = blankNote(active.folderId, {
      title: `${active.title || 'Untitled'} (copy)`,
      body: active.body,
      pinned: false
    })
    setNotes((list) => [n, ...list])
    setActiveId(n.id)
  }

  const insertChecklist = (): void => {
    if (!active) return
    const add = (active.body.endsWith('\n') || !active.body ? '' : '\n') + '- [ ] '
    patch({ body: active.body + add })
  }

  const toggleChecklistLine = (): void => {
    if (!active) return
    const lines = active.body.split('\n')
    let done = false
    const mapped = lines.map((line) => {
      if (done) return line
      if (/^\s*- \[ \]/.test(line)) {
        done = true
        return line.replace(/^\s*- \[ \]/, '- [x]')
      }
      if (/^\s*- \[x\]/i.test(line)) {
        done = true
        return line.replace(/^\s*- \[x\]/i, '- [ ]')
      }
      return line
    })
    patch({ body: mapped.join('\n') })
  }

  const submitDialog = (): void => {
    if (!dialog) return
    if (dialog.kind === 'folder') {
      const name = dialog.value.trim()
      if (name) {
        const id = uid('f')
        setFolders((f) => [...f, { id, name }])
        setFolderId(id)
      }
      setDialog(null)
      return
    }
    if (dialog.kind === 'delete' && active) {
      setNotes((list) => {
        const next = list.filter((n) => n.id !== active.id)
        return next.length ? next : [blankNote(FOLDER_INBOX)]
      })
      setDialog(null)
    }
  }

  const moveToFolder = (fid: string): void => {
    patch({ folderId: fid })
  }

  if (!active) {
    return (
      <div className="notes-app">
        <p className="status-line">No notes yet.</p>
        <button type="button" className="btn" onClick={create}>
          + Note
        </button>
      </div>
    )
  }

  return (
    <div className="notes-app notes-notion">
      <aside className="notes-folders">
        <p className="status-line">Folders</p>
        <button
          type="button"
          className={`notes-place ${folderId === FOLDER_ALL ? 'on' : ''}`}
          onClick={() => setFolderId(FOLDER_ALL)}
        >
          All Notes
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`notes-place ${folderId === f.id ? 'on' : ''}`}
            onClick={() => setFolderId(f.id)}
          >
            {f.name}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setDialog({ kind: 'folder', value: 'New Folder' })}
        >
          + Folder
        </button>
      </aside>

      <aside className="notes-side">
        <div className="feature-toolbar">
          <button type="button" className="btn" onClick={create}>
            + Note
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'updated' | 'title')} aria-label="Sort">
            <option value="updated">Recent</option>
            <option value="title">Title</option>
          </select>
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
                {n.pinned ? '★ ' : ''}
                {n.title || 'Untitled'}
              </strong>
              <span>{n.body.replace(/^#+\s*/, '').slice(0, 72) || 'Empty note'}</span>
              <span className="notes-item-meta">{new Date(n.updatedAt).toLocaleDateString()}</span>
            </button>
          ))}
          {!filtered.length ? <p className="status-line">No matches</p> : null}
        </div>
      </aside>

      <div className="notes-main">
        {dialog ? (
          <div className="files-dialog" role="dialog">
            <label className="status-line">
              {dialog.kind === 'folder' ? 'Folder name' : 'Delete this note?'}
              {dialog.kind === 'folder' ? (
                <input
                  autoFocus
                  value={dialog.value}
                  onChange={(e) => setDialog({ ...dialog, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitDialog()
                    if (e.key === 'Escape') setDialog(null)
                  }}
                />
              ) : (
                <span>{active.title || 'Untitled'}</span>
              )}
            </label>
            <div className="feature-toolbar">
              <button type="button" className="btn" onClick={submitDialog}>
                {dialog.kind === 'delete' ? 'Delete' : 'OK'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="feature-toolbar">
          <input
            className="notes-title"
            value={active.title}
            onChange={(e) => patch({ title: e.target.value })}
            aria-label="Note title"
          />
          <select
            value={active.folderId}
            onChange={(e) => moveToFolder(e.target.value)}
            aria-label="Move to folder"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => patch({ pinned: !active.pinned })}
          >
            {active.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={duplicate}>
            Duplicate
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDialog({ kind: 'delete', value: '' })}
          >
            Delete
          </button>
        </div>

        <div className="feature-toolbar">
          <button
            type="button"
            className={`btn btn-ghost ${mode === 'edit' ? 'on' : ''}`}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${mode === 'preview' ? 'on' : ''}`}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
          <button
            type="button"
            className={`btn btn-ghost ${mode === 'split' ? 'on' : ''}`}
            onClick={() => setMode('split')}
          >
            Split
          </button>
          <button type="button" className="btn btn-ghost" onClick={insertChecklist}>
            + Checklist
          </button>
          <button type="button" className="btn btn-ghost" onClick={toggleChecklistLine}>
            Toggle ☐
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void window.desk?.clipboardWrite(`${active.title}\n\n${active.body}`)}
          >
            Copy
          </button>
        </div>

        <div className={`notes-editor-pane mode-${mode}`}>
          {mode !== 'preview' ? (
            <textarea
              className="notes-area"
              value={active.body}
              onChange={(e) => patch({ body: e.target.value })}
              aria-label="Note body"
              spellCheck
              placeholder="Start writing… Markdown + - [ ] checklists supported"
            />
          ) : null}
          {mode !== 'edit' ? (
            <div className="notes-preview chat-log" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : null}
        </div>

        <p className="status-line">
          Updated {new Date(active.updatedAt).toLocaleString()} · {stats.words} words · {stats.chars}{' '}
          chars · local only
        </p>
      </div>
    </div>
  )
}
