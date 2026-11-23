import { useEffect, useState } from 'react'
import type { VaultNote } from '../../../shared/types'
import './features.css'

export default function VaultView(): React.JSX.Element {
  const [notes, setNotes] = useState<VaultNote[]>([])
  const [active, setActive] = useState<VaultNote | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const refresh = async (): Promise<void> => {
    if (!window.desk) return
    setNotes(await window.desk.vaultList())
  }

  useEffect(() => {
    void refresh()
  }, [])

  const save = async (): Promise<void> => {
    if (!window.desk) return
    const note = await window.desk.vaultSave({
      id: active?.id,
      title: title || 'Untitled',
      body
    })
    setActive(note)
    setTitle(note.title)
    setBody(note.body)
    await refresh()
  }

  return (
    <div className="feature">
      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setActive(null)
            setTitle('New note')
            setBody('')
          }}
        >
          New
        </button>
        <button type="button" className="btn" onClick={() => void save()}>
          Save
        </button>
        {active ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              void window.desk?.vaultDelete(active.id).then(async () => {
                setActive(null)
                setTitle('')
                setBody('')
                await refresh()
              })
            }
          >
            Delete
          </button>
        ) : null}
      </div>
      <div className="split-2">
        <div className="vault-list">
          {notes.map((n) => (
            <div
              key={n.id}
              className={`vault-row ${active?.id === n.id ? 'on' : ''}`}
              onClick={() => {
                setActive(n)
                setTitle(n.title)
                setBody(n.body)
              }}
            >
              <span>{n.title}</span>
              <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
            </div>
          ))}
          {notes.length === 0 ? <p className="status-line">No notes yet.</p> : null}
        </div>
        <div className="tool-stack">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write locally — stored on this machine."
            style={{ minHeight: 200 }}
          />
        </div>
      </div>
    </div>
  )
}
