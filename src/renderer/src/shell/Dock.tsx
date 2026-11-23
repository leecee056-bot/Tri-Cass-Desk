import './shell.css'

const ITEMS = [
  { id: 'launcher', label: 'Apps', color: '#a8b4d0', path: 'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z' },
  { id: 'files', label: 'Files', color: '#ffd27a', path: 'M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2h7.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11z' },
  { id: 'browse', label: 'Browser', color: '#6ec8ff', path: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0c2.5 2.8 4 6 4 9s-1.5 6.2-4 9c-2.5-2.8-4-6-4-9s1.5-6.2 4-9zm-8.5 8.5h17M3.5 15.5h17' },
  { id: 'editor', label: 'Editor', color: '#7dffc8', path: 'M4 19.5V5a2 2 0 0 1 2-2h8l6 6v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM14 3v5h5' },
  { id: 'notes', label: 'Notes', color: '#c9a0ff', path: 'M6 3h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm8 1v4h4M8 12h8M8 16h6' },
  { id: 'media', label: 'Media', color: '#ff7a9a', path: 'M9 18V6l12-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { id: 'terminal', label: 'Terminal', color: '#7dffb0', path: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3 4 3 3-3 3m5 0h5' },
  { id: 'chat', label: 'Chat', color: '#7ad7ff', path: 'M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-5 3v-3.5A3 3 0 0 1 4 14V6z' },
  { id: 'settings', label: 'Settings', color: '#d0d6e8', path: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' },
  { id: 'bin', label: 'Bin', color: '#9aa3b8', path: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12' }
] as const

type Props = {
  activeId?: string
  onSelect: (id: string) => void
  dimmed?: boolean
}

export default function Dock({ activeId = '', onSelect, dimmed }: Props): React.JSX.Element {
  return (
    <nav className={`dock glass ${dimmed ? 'dock-dim' : ''}`} aria-label="Desk dock">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`dock-item ${activeId === item.id ? 'active' : ''}`}
          title={item.label}
          aria-label={item.label}
          onClick={() => onSelect(item.id)}
        >
          <span className="dock-ico" style={{ background: `${item.color}22`, color: item.color }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={item.path} />
            </svg>
          </span>
        </button>
      ))}
    </nav>
  )
}
