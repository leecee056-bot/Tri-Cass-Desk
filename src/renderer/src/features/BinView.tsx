import { useCallback, useEffect, useState } from 'react'
import './features.css'

type BinEntry = { name: string; displayName: string; size: number; mtimeMs: number }

function formatSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Desk soft-delete shelf — Restore / Empty / permanently delete. */
export default function BinView(): React.JSX.Element {
  const [entries, setEntries] = useState<BinEntry[]>([])
  const [status, setStatus] = useState('Desk Bin — soft-delete shelf')
  const [confirmEmpty, setConfirmEmpty] = useState(false)

  const refresh = useCallback(async (): Promise<void> => {
    if (!window.desk?.binEntries) {
      const names = (await window.desk?.binList()) || []
      setEntries(
        names.map((name) => ({
          name,
          displayName: name.replace(/^\d+-/, ''),
          size: 0,
          mtimeMs: 0
        }))
      )
      return
    }
    setEntries(await window.desk.binEntries())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <div className="feature bin-view">
      <div className="feature-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => void refresh()}>
          Refresh
        </button>
        <button
          type="button"
          className="btn"
          disabled={!entries.length}
          onClick={() => setConfirmEmpty(true)}
        >
          Empty Bin
        </button>
        <span className="status-line">{status}</span>
      </div>

      {confirmEmpty ? (
        <div className="files-dialog" role="dialog">
          <p className="status-line">Permanently delete all {entries.length} items in Bin?</p>
          <div className="feature-toolbar">
            <button
              type="button"
              className="btn"
              onClick={() =>
                void window.desk?.binEmpty().then(async (n) => {
                  setConfirmEmpty(false)
                  setStatus(`Emptied ${n} item(s)`)
                  await refresh()
                })
              }
            >
              Empty
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmEmpty(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p className="status-line">
        Soft-deleted files · Restore returns them to the workspace root · Empty is permanent
      </p>

      <div className="vault-list bin-list">
        {entries.map((e) => (
          <div key={e.name} className="file-row bin-row">
            <div className="bin-row-meta">
              <strong>{e.displayName}</strong>
              <span className="status-line">
                {formatSize(e.size)}
                {e.mtimeMs ? ` · ${new Date(e.mtimeMs).toLocaleString()}` : ''}
              </span>
            </div>
            <div className="feature-toolbar" style={{ gap: 4 }}>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  void window.desk?.binRestore(e.name).then(async () => {
                    setStatus(`Restored ${e.displayName}`)
                    await refresh()
                  })
                }
              >
                Restore
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  void window.desk?.binDelete(e.name).then(async () => {
                    setStatus(`Deleted ${e.displayName}`)
                    await refresh()
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!entries.length ? <p className="status-line">Bin is empty.</p> : null}
      </div>
    </div>
  )
}
