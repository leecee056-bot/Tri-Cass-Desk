import { useEffect, useMemo, useState } from 'react'
import type { VaultItemKind, VaultNote } from '../../../shared/types'
import './features.css'

const PIN_KEY = 'tricass-desk-vault-pin-hash-v1'
const UNLOCK_KEY = 'tricass-desk-vault-unlocked-v1'

const FOLDERS = ['Personal', 'Work', 'Shared'] as const

async function hashPin(pin: string): Promise<string> {
  if (window.desk?.hashText) return window.desk.hashText(pin, 'sha256')
  const data = new TextEncoder().encode(pin)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function genPassword(len = 20): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_=+'
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

function blankDraft(kind: VaultItemKind = 'note'): {
  title: string
  body: string
  kind: VaultItemKind
  username: string
  password: string
  url: string
  folder: string
  favorite: boolean
} {
  return {
    title: kind === 'login' ? 'New login' : 'New secure note',
    body: '',
    kind,
    username: '',
    password: '',
    url: '',
    folder: 'Personal',
    favorite: false
  }
}

/** Bitwarden-lite local vault — unlock gate, logins + notes, copy/reveal/generate. */
export default function VaultView(): React.JSX.Element {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === '1')
  const [hasPin, setHasPin] = useState(() => Boolean(localStorage.getItem(PIN_KEY)))
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  const [notes, setNotes] = useState<VaultNote[]>([])
  const [active, setActive] = useState<VaultNote | null>(null)
  const [draft, setDraft] = useState(blankDraft())
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | VaultItemKind | 'fav'>('all')
  const [folder, setFolder] = useState<'all' | string>('all')
  const [showSecret, setShowSecret] = useState(false)
  const [status, setStatus] = useState('Local vault — secrets stay on this machine')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const refresh = async (): Promise<void> => {
    if (!window.desk) return
    setNotes(await window.desk.vaultList())
  }

  useEffect(() => {
    if (unlocked) void refresh()
  }, [unlocked])

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase()
    return notes
      .filter((n) => {
        const kind = n.kind || 'note'
        if (filter === 'fav' && !n.favorite) return false
        if (filter === 'login' && kind !== 'login') return false
        if (filter === 'note' && kind !== 'note') return false
        if (folder !== 'all' && (n.folder || 'Personal') !== folder) return false
        if (!query) return true
        return (
          n.title.toLowerCase().includes(query) ||
          n.body.toLowerCase().includes(query) ||
          (n.username || '').toLowerCase().includes(query) ||
          (n.url || '').toLowerCase().includes(query)
        )
      })
      .sort(
        (a, b) =>
          Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt
      )
  }, [notes, q, filter, folder])

  const setupPin = async (): Promise<void> => {
    if (pinInput.trim().length < 4) {
      setPinError('PIN must be at least 4 characters')
      return
    }
    const h = await hashPin(pinInput.trim())
    localStorage.setItem(PIN_KEY, h)
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setHasPin(true)
    setUnlocked(true)
    setPinInput('')
    setPinError('')
    setStatus('Vault unlocked')
  }

  const unlock = async (): Promise<void> => {
    const stored = localStorage.getItem(PIN_KEY)
    if (!stored) {
      await setupPin()
      return
    }
    const h = await hashPin(pinInput.trim())
    if (h !== stored) {
      setPinError('Wrong PIN')
      return
    }
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setUnlocked(true)
    setPinInput('')
    setPinError('')
    setStatus('Vault unlocked')
  }

  const lock = (): void => {
    sessionStorage.removeItem(UNLOCK_KEY)
    setUnlocked(false)
    setActive(null)
    setShowSecret(false)
    setStatus('Vault locked')
  }

  const loadItem = (n: VaultNote): void => {
    setActive(n)
    setDraft({
      title: n.title,
      body: n.body,
      kind: n.kind || 'note',
      username: n.username || '',
      password: n.password || '',
      url: n.url || '',
      folder: n.folder || 'Personal',
      favorite: Boolean(n.favorite)
    })
    setShowSecret(false)
    setConfirmDelete(false)
  }

  const save = async (): Promise<void> => {
    if (!window.desk) return
    const note = await window.desk.vaultSave({
      id: active?.id,
      title: draft.title || 'Untitled',
      body: draft.body,
      kind: draft.kind,
      username: draft.username,
      password: draft.password,
      url: draft.url,
      folder: draft.folder,
      favorite: draft.favorite
    })
    loadItem(note)
    await refresh()
    setStatus(`Saved “${note.title}”`)
  }

  const copy = async (text: string, label: string): Promise<void> => {
    if (!text) return
    await window.desk?.clipboardWrite(text)
    setStatus(`Copied ${label}`)
  }

  if (!unlocked) {
    return (
      <div className="feature vault-lock">
        <h2 className="vault-lock-title">Vault</h2>
        <p className="status-line">
          {hasPin
            ? 'Enter your local PIN to unlock secrets on this machine.'
            : 'Set a local PIN (4+) to lock this vault. Not cloud-synced.'}
        </p>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder={hasPin ? 'PIN' : 'Create PIN'}
          aria-label="Vault PIN"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void (hasPin ? unlock() : setupPin())
          }}
        />
        {pinError ? <p className="status-line">{pinError}</p> : null}
        <div className="feature-toolbar">
          <button type="button" className="btn" onClick={() => void (hasPin ? unlock() : setupPin())}>
            {hasPin ? 'Unlock' : 'Set PIN & unlock'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feature vault-app">
      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setActive(null)
            setDraft(blankDraft('login'))
            setShowSecret(true)
          }}
        >
          + Login
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setActive(null)
            setDraft(blankDraft('note'))
            setShowSecret(false)
          }}
        >
          + Note
        </button>
        <button type="button" className="btn" onClick={() => void save()}>
          Save
        </button>
        {active ? (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={lock}>
          Lock
        </button>
        <span className="status-line">{status}</span>
      </div>

      {confirmDelete && active ? (
        <div className="files-dialog" role="dialog">
          <p className="status-line">Delete “{active.title}” from local vault?</p>
          <div className="feature-toolbar">
            <button
              type="button"
              className="btn"
              onClick={() =>
                void window.desk?.vaultDelete(active.id).then(async () => {
                  setActive(null)
                  setDraft(blankDraft())
                  setConfirmDelete(false)
                  await refresh()
                  setStatus('Deleted')
                })
              }
            >
              Delete
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="vault-body">
        <aside className="vault-side">
          <p className="status-line">Folders</p>
          <button
            type="button"
            className={`notes-place ${folder === 'all' ? 'on' : ''}`}
            onClick={() => setFolder('all')}
          >
            All items
          </button>
          {FOLDERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`notes-place ${folder === f ? 'on' : ''}`}
              onClick={() => setFolder(f)}
            >
              {f}
            </button>
          ))}
          <p className="status-line" style={{ marginTop: 10 }}>
            Type
          </p>
          {(
            [
              ['all', 'All'],
              ['login', 'Logins'],
              ['note', 'Notes'],
              ['fav', 'Favorites']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`notes-place ${filter === id ? 'on' : ''}`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </aside>

        <div className="vault-list-col">
          <input
            placeholder="Search vault…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search vault"
          />
          <div className="vault-list">
            {visible.map((n) => (
              <div
                key={n.id}
                className={`vault-row ${active?.id === n.id ? 'on' : ''}`}
                onClick={() => loadItem(n)}
              >
                <span>
                  {n.favorite ? '★ ' : ''}
                  {(n.kind || 'note') === 'login' ? '🔑 ' : '✎ '}
                  {n.title}
                </span>
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
            {!visible.length ? <p className="status-line">No items</p> : null}
          </div>
        </div>

        <div className="vault-editor tool-stack">
          <div className="feature-toolbar">
            <select
              value={draft.kind}
              onChange={(e) => setDraft({ ...draft, kind: e.target.value as VaultItemKind })}
              aria-label="Item type"
            >
              <option value="login">Login</option>
              <option value="note">Secure note</option>
            </select>
            <select
              value={draft.folder}
              onChange={(e) => setDraft({ ...draft, folder: e.target.value })}
              aria-label="Folder"
            >
              {FOLDERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDraft({ ...draft, favorite: !draft.favorite })}
            >
              {draft.favorite ? 'Unfavorite' : 'Favorite'}
            </button>
          </div>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Name"
            aria-label="Title"
          />

          {draft.kind === 'login' ? (
            <>
              <label className="vault-field">
                Username
                <div className="feature-toolbar">
                  <input
                    value={draft.username}
                    onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void copy(draft.username, 'username')}
                  >
                    Copy
                  </button>
                </div>
              </label>
              <label className="vault-field">
                Password
                <div className="feature-toolbar">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowSecret((s) => !s)}
                  >
                    {showSecret ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void copy(draft.password, 'password')}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setDraft({ ...draft, password: genPassword() })}
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label className="vault-field">
                URL
                <input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://"
                />
              </label>
              <label className="vault-field">
                Notes
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Extra notes…"
                />
              </label>
            </>
          ) : (
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Secure note body — stored locally."
              style={{ minHeight: 220 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
