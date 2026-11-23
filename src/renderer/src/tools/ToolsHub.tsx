import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { TOOL_CATALOG, TOOL_GROUPS, type ToolEntry, type ToolGroup } from './catalog'
import '../features/features.css'

type Props = {
  state: EnvironmentState
  onOpenDock: (id: string) => void
  onOpenTool?: (tool: ToolEntry) => void
  initialToolId?: string | null
}

export default function ToolsHub({
  state,
  onOpenDock,
  onOpenTool
}: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ToolGroup | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOOL_CATALOG.filter((t) => {
      if (group !== 'all' && t.group !== group) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.id.includes(q) || t.group.includes(q)
    })
  }, [query, group])

  void state

  return (
    <div className="feature">
      <div className="feature-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TOOL_CATALOG.length} tools…`}
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as ToolGroup | 'all')}
          aria-label="Group"
        >
          <option value="all">All groups</option>
          {TOOL_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <p className="status-line">
        {filtered.length} shown · opens as floating glass windows · local / offline-first
      </p>
      <div className="tools-grid" style={{ overflow: 'auto' }}>
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-card ${t.status}`}
            onClick={() => {
              if (['chat', 'agents', 'files', 'vault', 'browse'].includes(t.id.split('-')[0]!)) {
                /* fall through */
              }
              if (onOpenTool) onOpenTool(t)
              else onOpenDock('tools')
            }}
          >
            <strong>{t.name}</strong>
            <span>
              {t.group} · {t.engine}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
