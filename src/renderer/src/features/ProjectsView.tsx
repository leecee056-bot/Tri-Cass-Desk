import { useEffect, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import './features.css'

/** Compact projects/files list matching the concept composition. */
export default function ProjectsView(): React.JSX.Element {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [path, setPath] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      if (!window.desk) return
      try {
        const res = await window.desk.listDir()
        setPath(res.path)
        setEntries(res.entries.filter((e) => e.isDirectory).slice(0, 8))
        if (res.entries.filter((e) => e.isDirectory).length === 0) {
          setEntries(res.entries.slice(0, 8))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  return (
    <div className="projects-view">
      {error ? <p className="status-line">{error}</p> : null}
      <ul className="projects-list">
        {entries.map((e) => (
          <li key={e.path}>
            <button
              type="button"
              onClick={() => void window.desk?.openPath(e.path)}
              title={e.path}
            >
              <span className="folder-ico" aria-hidden />
              <span>{e.name}</span>
            </button>
          </li>
        ))}
        {entries.length === 0 && !error ? (
          <li className="status-line">Workspace empty — open Files for full browser.</li>
        ) : null}
      </ul>
      <p className="status-line projects-path">{path || '…'}</p>
    </div>
  )
}
