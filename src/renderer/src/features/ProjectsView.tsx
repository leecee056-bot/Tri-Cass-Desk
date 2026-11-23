import { useEffect, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import './features.css'

/** Project launcher — market intent: Finder favorites / VS Code recent folders. */
export default function ProjectsView(): React.JSX.Element {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [path, setPath] = useState('')
  const [error, setError] = useState('')

  const load = async (): Promise<void> => {
    if (!window.desk) {
      setError('Projects need the Desk desktop app.')
      return
    }
    try {
      const res = await window.desk.listDir()
      setPath(res.path)
      const dirs = res.entries.filter((e) => e.isDirectory)
      setEntries((dirs.length ? dirs : res.entries).slice(0, 12))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="projects-view">
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
          Open folder
        </button>
      </div>
      {error ? <p className="status-line">{error}</p> : null}
      <ul className="projects-list">
        {entries.map((e) => (
          <li key={e.path}>
            <button type="button" onClick={() => void window.desk?.openPath(e.path)} title={e.path}>
              <span className="folder-ico" aria-hidden />
              <span>{e.name}</span>
            </button>
          </li>
        ))}
        {entries.length === 0 && !error ? (
          <li className="status-line">Workspace empty — open Files for the full browser.</li>
        ) : null}
      </ul>
      <p className="status-line projects-path">{path || '…'}</p>
    </div>
  )
}
