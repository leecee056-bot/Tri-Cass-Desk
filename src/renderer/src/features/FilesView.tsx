import { useEffect, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import { dirname } from './pathUtil'
import './features.css'

export default function FilesView(): React.JSX.Element {
  const [path, setPath] = useState('')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const load = async (dir?: string): Promise<void> => {
    if (!window.desk) return
    try {
      const res = await window.desk.listDir(dir)
      setPath(res.path)
      setEntries(res.entries)
      setPreview('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="feature">
      <div className="feature-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => void load(dirname(path))}>
          Up
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
        <span className="status-line" style={{ flex: 1 }}>
          {path || '…'}
        </span>
      </div>
      {error ? <div className="status-line">{error}</div> : null}
      <div className="split-2">
        <div className="file-list">
          {entries.map((e) => (
            <div
              key={e.path}
              className="file-row"
              onClick={() => {
                if (e.isDirectory) void load(e.path)
                else
                  void window.desk?.readTextFile(e.path).then(setPreview).catch((err: Error) => {
                    setPreview(err.message)
                  })
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
                <span>{e.isDirectory ? 'dir' : `${Math.round(e.size / 1024)} KB`}</span>
              </span>
            </div>
          ))}
        </div>
        <pre className="preview chat-log">{preview || 'Select a text file to preview.'}</pre>
      </div>
    </div>
  )
}
