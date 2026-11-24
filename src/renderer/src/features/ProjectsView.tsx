import { useEffect, useMemo, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import './features.css'

const RECENTS_KEY = 'tricass-desk-project-recents-v1'

type Recent = {
  path: string
  name: string
  pinned?: boolean
  openedAt: number
}

type Props = {
  onOpenFiles?: () => void
  onOpenEditor?: () => void
}

function loadRecents(): Recent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') as Recent[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/** Project launcher — workspace folders + pinned/recent opens. */
export default function ProjectsView({ onOpenFiles, onOpenEditor }: Props): React.JSX.Element {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [path, setPath] = useState('')
  const [error, setError] = useState('')
  const [recents, setRecents] = useState<Recent[]>(() => loadRecents())
  const [status, setStatus] = useState('Projects · workspace folders')

  const load = async (): Promise<void> => {
    if (!window.desk) {
      setError('Projects need the Desk desktop app.')
      return
    }
    try {
      const res = await window.desk.listDir()
      setPath(res.path)
      setEntries(res.entries.filter((e) => e.isDirectory))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, 24)))
  }, [recents])

  const remember = (e: { path: string; name: string }): void => {
    setRecents((list) => {
      const pinned = list.find((r) => r.path === e.path)?.pinned
      const next = [
        { path: e.path, name: e.name, pinned, openedAt: Date.now() },
        ...list.filter((r) => r.path !== e.path)
      ]
      return next.slice(0, 24)
    })
  }

  const togglePin = (p: string): void => {
    setRecents((list) =>
      list.map((r) => (r.path === p ? { ...r, pinned: !r.pinned } : r))
    )
  }

  const sortedRecents = useMemo(
    () =>
      [...recents].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.openedAt - a.openedAt
      ),
    [recents]
  )

  const openFolder = async (target: string, name: string): Promise<void> => {
    remember({ path: target, name })
    await window.desk?.openPath(target)
    setStatus(`Opened ${name}`)
  }

  return (
    <div className="projects-view projects-shell">
      <div className="feature-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => void load()}>
          Refresh
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void window.desk?.openPath(path)}
          disabled={!path}
        >
          Open workspace
        </button>
        {onOpenFiles ? (
          <button type="button" className="btn" onClick={onOpenFiles}>
            Open Files
          </button>
        ) : null}
        {onOpenEditor ? (
          <button type="button" className="btn btn-ghost" onClick={onOpenEditor}>
            Open Editor
          </button>
        ) : null}
      </div>
      {error ? <p className="status-line">{error}</p> : null}
      <p className="status-line">{status}</p>

      {sortedRecents.length ? (
        <div className="projects-section">
          <p className="status-line">Pinned & recent</p>
          <ul className="projects-list">
            {sortedRecents.map((r) => (
              <li key={r.path} className="projects-row">
                <button type="button" onClick={() => void openFolder(r.path, r.name)} title={r.path}>
                  <span className="folder-ico" aria-hidden />
                  <span>
                    {r.pinned ? '★ ' : ''}
                    {r.name}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost projects-pin"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    togglePin(r.path)
                  }}
                >
                  {r.pinned ? 'Unpin' : 'Pin'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="projects-section">
        <p className="status-line">Workspace folders</p>
        <ul className="projects-list">
          {entries.map((e) => (
            <li key={e.path}>
              <button
                type="button"
                onClick={() => void openFolder(e.path, e.name)}
                title={e.path}
              >
                <span className="folder-ico" aria-hidden />
                <span>{e.name}</span>
              </button>
            </li>
          ))}
          {entries.length === 0 && !error ? (
            <li className="status-line">Workspace empty — open Files for the full browser.</li>
          ) : null}
        </ul>
      </div>
      <p className="status-line projects-path">{path || '…'}</p>
    </div>
  )
}
