import { useEffect, useMemo, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import { dirname } from './pathUtil'
import './features.css'

/** Finder/Explorer-class file browser — breadcrumbs, preview, open, bin. */
export default function FilesView(): React.JSX.Element {
  const [path, setPath] = useState('')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [preview, setPreview] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const crumbs = useMemo(() => {
    if (!path) return []
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
    const out: { label: string; full: string }[] = []
    let acc = path.startsWith('/') ? '' : ''
    // Windows drive vs posix
    if (/^[A-Za-z]:/.test(path)) {
      const drive = parts[0]!
      acc = drive
      out.push({ label: drive, full: drive + '\\' })
      for (let i = 1; i < parts.length; i++) {
        acc = `${acc}\\${parts[i]}`
        out.push({ label: parts[i]!, full: acc })
      }
      return out
    }
    out.push({ label: '/', full: '/' })
    for (const p of parts) {
      acc += `/${p}`
      out.push({ label: p, full: acc })
    }
    return out
  }, [path])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const list = [...entries].sort(
      (a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name)
    )
    if (!q) return list
    return list.filter((e) => e.name.toLowerCase().includes(q))
  }, [entries, filter])

  const load = async (dir?: string): Promise<void> => {
    if (!window.desk) {
      setError('Files need the Desk desktop app (Electron).')
      return
    }
    try {
      const res = await window.desk.listDir(dir)
      setPath(res.path)
      setEntries(res.entries)
      setPreview('')
      setSelected(null)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="feature files-view">
      <div className="feature-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => void load(dirname(path))}>
          ↑ Up
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void window.desk?.homeDir().then((h) => load(h))}
        >
          Home
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void load()}>
          Workspace
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void load(path)}>
          Refresh
        </button>
        <input
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 140 }}
        />
      </div>
      <div className="files-path-bar status-line" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.full}>
            {i > 0 ? ' / ' : ''}
            <button type="button" className="btn btn-ghost" onClick={() => void load(c.full)}>
              {c.label}
            </button>
          </span>
        ))}
        {!crumbs.length ? path || '…' : null}
      </div>
      {error ? <div className="status-line">{error}</div> : null}
      <div className="split-2">
        <div className="file-list">
          {visible.map((e) => (
            <div
              key={e.path}
              className={`file-row ${selected === e.path ? 'on' : ''}`}
              onClick={() => {
                setSelected(e.path)
                if (e.isDirectory) void load(e.path)
                else
                  void window.desk
                    ?.readTextFile(e.path)
                    .then(setPreview)
                    .catch((err: Error) => setPreview(err.message))
              }}
              onDoubleClick={() => void window.desk?.openPath(e.path)}
            >
              <span>
                {e.isDirectory ? '▸ ' : ''}
                {e.name}
              </span>
              <span className="feature-toolbar" style={{ gap: 4 }}>
                {!e.isDirectory ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={(ev) => {
                      ev.stopPropagation()
                      void window.desk?.binMove(e.path).then(() => void load(path))
                    }}
                  >
                    Bin
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    void window.desk?.openPath(e.path)
                  }}
                >
                  Open
                </button>
                <span>{e.isDirectory ? 'dir' : `${Math.round(e.size / 1024)} KB`}</span>
              </span>
            </div>
          ))}
          {!visible.length ? <p className="status-line">Empty folder</p> : null}
        </div>
        <pre className="preview chat-log">{preview || 'Select a text file to preview.'}</pre>
      </div>
    </div>
  )
}
