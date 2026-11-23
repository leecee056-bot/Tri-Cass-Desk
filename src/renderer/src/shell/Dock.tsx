import './shell.css'

const ITEMS = [
  { id: 'launcher', label: 'Apps', icon: '▦' },
  { id: 'files', label: 'Files', icon: '▤' },
  { id: 'chat', label: 'Chat', icon: '◎' },
  { id: 'agents', label: 'Agents', icon: '✶' },
  { id: 'vault', label: 'Vault', icon: '◇' },
  { id: 'tools', label: 'Tools', icon: '⬡' },
  { id: 'browse', label: 'Browse', icon: '◉' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
] as const

type Props = {
  activeId: string
  onSelect: (id: string) => void
  dimmed?: boolean
}

export default function Dock({ activeId, onSelect, dimmed }: Props): React.JSX.Element {
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
          <span aria-hidden>{item.icon}</span>
        </button>
      ))}
    </nav>
  )
}
