import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FileEntry } from '../../../shared/types'
import { dirname } from './pathUtil'
import './features.css'

type SortKey = 'name' | 'size' | 'mtime'
type ViewMode = 'list' | 'icons'
type Place = 'home' | 'desktop' | 'documents' | 'downloads' | 'workspace' | 'bin'

function joinPath(dir: string, name: string): string {
  if (!dir) return name
  if (dir.endsWith('/') || dir.endsWith('\\')) return `${dir}${name}`
  return dir.includes('\\') ? `${dir}\\${name}` : `${dir}/${name}`
}

function formatSize(bytes: number, isDir: boolean): string {
  if (isDir) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatMtime(ms: number): string {
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return '—'
  }
}

/** Finder/Explorer-class file browser — sidebar, history, sort, views, create/rename/bin. */
export default function FilesView(): React.JSX.Element {
  const [path, setPath] = useState('')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [preview, setPreview] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [place, setPlace] = useState<Place>('workspace')
  const historyRef = useRef<string[]>([])
  const histIdxRef = useRef(-1)
  const [canBack, setCanBack] = useState(false)
  const [canForward, setCanForward] = useState(false)
  const [binMode, setBinMode] = useState(false)
  const [binItems, setBinItems] = useState<string[]>([])
  const [pathEdit, setPathEdit] = useState('')
  const [dialog, setDialog] = useState<null | {
    kind: 'folder' | 'file' | 'rename'
    value: string
  }>(null)

  const crumbs = useMemo(() => {
    if (!path || binMode) return []
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean)
    const out: { label: string; full: string }[] = []
    let acc = ''
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
  }, [path, binMode])

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let list = [...entries]
    list.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return Number(b.isDirectory) - Number(a.isDirectory)
      if (sortKey === 'size') return a.size - b.size || a.name.localeCompare(b.name)
      if (sortKey === 'mtime') return b.mtimeMs - a.mtimeMs || a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    })
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q))
    return list
  }, [entries, filter, sortKey])

  const selectedEntry = useMemo(
    () => entries.find((e) => e.path === selected) || null,
    [entries, selected]
  )

  const syncNav = (idx: number): void => {
    const h = historyRef.current
    histIdxRef.current = idx
    setCanBack(idx > 0)
    setCanForward(idx >= 0 && idx < h.length - 1)
  }

  const load = useCallback(async (dir?: string, opts?: { pushHistory?: boolean }): Promise<void> => {
    if (!window.desk) {
      setError('Files need the Desk desktop app (Electron).')
      return
    }
    setBinMode(false)
    try {
      const res = await window.desk.listDir(dir)
      setPath(res.path)
      setPathEdit(res.path)
      setEntries(res.entries)
      setPreview('')
      setSelected(null)
      setError('')
      if (opts?.pushHistory !== false) {
        const h = historyRef.current
        const idx = histIdxRef.current
        const base = idx >= 0 ? h.slice(0, idx + 1) : h
        const next =
          base[base.length - 1] === res.path ? base : [...base, res.path].slice(-40)
        historyRef.current = next
        syncNav(next.length - 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  const loadBin = async (): Promise<void> => {
    if (!window.desk) return
    setBinMode(true)
    setPlace('bin')
    setPath('Bin')
    setPathEdit('Bin')
    setEntries([])
    setPreview('')
    setSelected(null)
    try {
      const items = await window.desk.binList()
      setBinItems(items)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const goPlace = async (p: Place): Promise<void> => {
    setPlace(p)
    if (!window.desk) return
    if (p === 'bin') {
      await loadBin()
      return
    }
    if (p === 'home') await load(await window.desk.homeDir())
    else if (p === 'workspace') await load()
    else await load(await window.desk.userFolder(p === 'desktop' ? 'Desktop' : p === 'documents' ? 'Documents' : 'Downloads'))
  }

  const goBack = (): void => {
    const idx = histIdxRef.current
    if (idx <= 0) return
    const next = idx - 1
    syncNav(next)
    void load(historyRef.current[next], { pushHistory: false })
  }

  const goForward = (): void => {
    const h = historyRef.current
    const idx = histIdxRef.current
    if (idx < 0 || idx >= h.length - 1) return
    const next = idx + 1
    syncNav(next)
    void load(h[next], { pushHistory: false })
  }

  useEffect(() => {
    void load()
  }, [])

  const selectEntry = (e: FileEntry): void => {
    setSelected(e.path)
    if (e.isDirectory) {
      setPreview('')
      return
    }
    void window.desk
      ?.readTextFile(e.path)
      .then(setPreview)
      .catch((err: Error) => setPreview(err.message))
  }

  const openEntry = (e: FileEntry): void => {
    if (e.isDirectory) void load(e.path)
    else void window.desk?.openPath(e.path)
  }

  const submitDialog = async (): Promise<void> => {
    if (!dialog || !window.desk || binMode) return
    const name = dialog.value.trim()
    if (!name) {
      setDialog(null)
      return
    }
    try {
      if (dialog.kind === 'folder') {
        await window.desk.mkdirDir(joinPath(path, name))
      } else if (dialog.kind === 'file') {
        await window.desk.writeTextFile(joinPath(path, name), '')
      } else if (dialog.kind === 'rename' && selectedEntry) {
        if (name !== selectedEntry.name) await window.desk.renamePath(selectedEntry.path, name)
      }
      setDialog(null)
      await load(path, { pushHistory: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const places: { id: Place; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'documents', label: 'Documents' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'bin', label: 'Bin' }
  ]

  return (
    <div className="feature files-view files-finder">
      <div className="feature-toolbar files-nav">
        <button type="button" className="btn btn-ghost" disabled={!canBack} onClick={goBack}>
          ←
        </button>
        <button type="button" className="btn btn-ghost" disabled={!canForward} onClick={goForward}>
          →
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={binMode}
          onClick={() => void load(dirname(path))}
        >
          ↑ Up
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => (binMode ? void loadBin() : void load(path, { pushHistory: false }))}>
          Refresh
        </button>
        <button
          type="button"
          className="btn"
          disabled={binMode}
          onClick={() => setDialog({ kind: 'folder', value: 'Untitled Folder' })}
        >
          New folder
        </button>
        <button
          type="button"
          className="btn"
          disabled={binMode}
          onClick={() => setDialog({ kind: 'file', value: 'untitled.txt' })}
        >
          New file
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!selectedEntry || binMode}
          onClick={() =>
            selectedEntry && setDialog({ kind: 'rename', value: selectedEntry.name })
          }
        >
          Rename
        </button>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="Sort"
        >
          <option value="name">Sort: Name</option>
          <option value="size">Sort: Size</option>
          <option value="mtime">Sort: Modified</option>
        </select>
        <button
          type="button"
          className={`btn btn-ghost ${viewMode === 'list' ? 'on' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
        <button
          type="button"
          className={`btn btn-ghost ${viewMode === 'icons' ? 'on' : ''}`}
          onClick={() => setViewMode('icons')}
        >
          Icons
        </button>
        <input
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 140 }}
        />
      </div>

      <div className="files-path-bar">
        <form
          className="files-path-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (pathEdit.trim() && pathEdit !== 'Bin') void load(pathEdit.trim())
          }}
        >
          <input
            value={pathEdit}
            onChange={(e) => setPathEdit(e.target.value)}
            aria-label="Path"
            disabled={binMode}
          />
        </form>
        <div className="files-crumbs status-line" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.full}>
              {i > 0 ? ' / ' : ''}
              <button type="button" className="btn btn-ghost" onClick={() => void load(c.full)}>
                {c.label}
              </button>
            </span>
          ))}
          {binMode ? <span>Desk Bin (soft-delete shelf)</span> : null}
        </div>
      </div>

      {error ? <div className="status-line">{error}</div> : null}

      {dialog ? (
        <div className="files-dialog" role="dialog" aria-label="Name item">
          <label className="status-line">
            {dialog.kind === 'folder'
              ? 'New folder name'
              : dialog.kind === 'file'
                ? 'New file name'
                : 'Rename to'}
            <input
              autoFocus
              value={dialog.value}
              onChange={(e) => setDialog({ ...dialog, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitDialog()
                if (e.key === 'Escape') setDialog(null)
              }}
            />
          </label>
          <div className="feature-toolbar">
            <button type="button" className="btn" onClick={() => void submitDialog()}>
              OK
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="files-body">
        <aside className="files-sidebar">
          <p className="status-line">Favorites</p>
          {places.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`files-place ${place === p.id ? 'on' : ''}`}
              onClick={() => void goPlace(p.id)}
            >
              {p.label}
            </button>
          ))}
        </aside>

        <div className="files-main">
          {binMode ? (
            <div className="file-list">
              {binItems.map((b) => (
                <div key={b} className="file-row">
                  <span>{b}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      void window.desk?.binRestore(b).then(() => void loadBin())
                    }
                  >
                    Restore
                  </button>
                </div>
              ))}
              {!binItems.length ? <p className="status-line">Bin is empty.</p> : null}
            </div>
          ) : viewMode === 'icons' ? (
            <div className="files-icons">
              {visible.map((e) => (
                <button
                  key={e.path}
                  type="button"
                  className={`files-icon ${selected === e.path ? 'on' : ''}`}
                  onClick={() => selectEntry(e)}
                  onDoubleClick={() => openEntry(e)}
                >
                  <span className="files-icon-glyph">{e.isDirectory ? '◫' : '▤'}</span>
                  <span className="files-icon-name">{e.name}</span>
                </button>
              ))}
              {!visible.length ? <p className="status-line">Empty folder</p> : null}
            </div>
          ) : (
            <div className="file-list files-table">
              <div className="files-table-head">
                <span>Name</span>
                <span>Size</span>
                <span>Modified</span>
                <span />
              </div>
              {visible.map((e) => (
                <div
                  key={e.path}
                  className={`file-row files-table-row ${selected === e.path ? 'on' : ''}`}
                  onClick={() => selectEntry(e)}
                  onDoubleClick={() => openEntry(e)}
                >
                  <span>
                    {e.isDirectory ? '▸ ' : ''}
                    {e.name}
                  </span>
                  <span className="status-line">{formatSize(e.size, e.isDirectory)}</span>
                  <span className="status-line">{formatMtime(e.mtimeMs)}</span>
                  <span className="feature-toolbar" style={{ gap: 4 }}>
                    {!e.isDirectory ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          void window.desk?.binMove(e.path).then(() => void load(path, { pushHistory: false }))
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
                        if (e.isDirectory) void load(e.path)
                        else void window.desk?.openPath(e.path)
                      }}
                    >
                      Open
                    </button>
                  </span>
                </div>
              ))}
              {!visible.length ? <p className="status-line">Empty folder</p> : null}
            </div>
          )}
        </div>

        <aside className="files-preview">
          <p className="status-line">Preview / info</p>
          {selectedEntry ? (
            <div className="files-meta">
              <strong>{selectedEntry.name}</strong>
              <span className="status-line">{selectedEntry.isDirectory ? 'Folder' : 'File'}</span>
              <span className="status-line">{formatSize(selectedEntry.size, selectedEntry.isDirectory)}</span>
              <span className="status-line">{formatMtime(selectedEntry.mtimeMs)}</span>
              <div className="feature-toolbar">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void window.desk?.clipboardWrite(selectedEntry.path)}
                >
                  Copy path
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void window.desk?.openPath(selectedEntry.path)}
                >
                  Reveal
                </button>
              </div>
            </div>
          ) : (
            <p className="status-line">Select an item</p>
          )}
          <pre className="preview chat-log">{preview || (selectedEntry?.isDirectory ? 'Folder selected.' : 'Select a text file to preview.')}</pre>
        </aside>
      </div>
    </div>
  )
}
