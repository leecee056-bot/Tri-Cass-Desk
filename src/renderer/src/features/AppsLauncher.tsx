import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { TOOL_CATALOG, type ToolEntry } from '../tools/catalog'
import { TOP20_IDS, isTop20 } from '../tools/top20'
import '../features/features.css'

const QUICK_APPS: Array<{ id: string; label: string; hint: string }> = [
  { id: 'files', label: 'Files', hint: 'Finder' },
  { id: 'browse', label: 'Browser', hint: 'Web' },
  { id: 'editor', label: 'Editor', hint: 'Code' },
  { id: 'notes', label: 'Notes', hint: 'Write' },
  { id: 'vault', label: 'Vault', hint: 'Secrets' },
  { id: 'media', label: 'Media', hint: 'Play' },
  { id: 'terminal', label: 'Terminal', hint: 'Shell' },
  { id: 'chat', label: 'Chat', hint: 'LLM' },
  { id: 'projects', label: 'Projects', hint: 'Folders' },
  { id: 'bin', label: 'Bin', hint: 'Trash' },
  { id: 'settings', label: 'Settings', hint: 'Prefs' },
  { id: 'tools', label: 'Tools', hint: 'Utilities' }
]

type Props = {
  state: EnvironmentState
  onOpenApp: (id: string) => void
  onOpenTool?: (tool: ToolEntry) => void
}

/** Start-menu / Apps launcher — quick dock apps + searchable tools. */
export default function AppsLauncher({ state, onOpenApp, onOpenTool }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'apps' | 'tools'>('apps')

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return QUICK_APPS
    return QUICK_APPS.filter(
      (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q) || a.id.includes(q)
    )
  }, [query])

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = TOP20_IDS.map((id) => TOOL_CATALOG.find((t) => t.id === id)).filter(
      (t): t is ToolEntry => Boolean(t)
    )
    if (!q) return list
    return list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.id.includes(q) || t.group.includes(q)
    )
  }, [query])

  void state

  return (
    <div className="feature apps-launcher">
      <div className="feature-toolbar">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps & tools…"
          aria-label="Search apps"
        />
        <button
          type="button"
          className={`btn btn-ghost ${tab === 'apps' ? 'on' : ''}`}
          onClick={() => setTab('apps')}
        >
          Apps
        </button>
        <button
          type="button"
          className={`btn btn-ghost ${tab === 'tools' ? 'on' : ''}`}
          onClick={() => setTab('tools')}
        >
          Top-20 tools
        </button>
      </div>
      <p className="status-line">
        {tab === 'apps'
          ? `${apps.length} desk apps · Start-menu style launcher`
          : `${tools.length} deep tools · opens as floating windows`}
      </p>

      {tab === 'apps' ? (
        <div className="tools-grid launcher-apps">
          {apps.map((a) => (
            <button
              key={a.id}
              type="button"
              className="tool-card live"
              onClick={() => onOpenApp(a.id)}
            >
              <strong>{a.label}</strong>
              <span>{a.hint}</span>
            </button>
          ))}
          {!apps.length ? <p className="status-line">No matching apps</p> : null}
        </div>
      ) : (
        <div className="tools-grid">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tool-card ${t.status} ${isTop20(t) ? 'tool-deep' : ''}`}
              onClick={() => (onOpenTool ? onOpenTool(t) : onOpenApp('tools'))}
            >
              <strong>
                {t.name}
                {isTop20(t) ? <em className="tool-deep-badge"> deep</em> : null}
              </strong>
              <span>
                {t.group} · {t.engine}
              </span>
            </button>
          ))}
          {!tools.length ? <p className="status-line">No matching tools</p> : null}
        </div>
      )}
    </div>
  )
}
