import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { TOOL_CATALOG, TOOL_GROUPS, type ToolEntry, type ToolGroup } from './catalog'
import UniversalTool from './engines/UniversalTool'
import '../features/features.css'

type Props = {
  state: EnvironmentState
  onOpenDock: (id: string) => void
  initialToolId?: string | null
}

export default function ToolsHub({ state, onOpenDock, initialToolId = null }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ToolGroup | 'all'>('all')
  const [toolId, setToolId] = useState<string | null>(initialToolId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TOOL_CATALOG.filter((t) => {
      if (group !== 'all' && t.group !== group) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.id.includes(q) || t.group.includes(q)
    })
  }, [query, group])

  const active: ToolEntry | undefined = TOOL_CATALOG.find((t) => t.id === toolId)

  if (active) {
    return (
      <div className="feature">
        <div className="feature-toolbar">
          <button type="button" className="btn btn-ghost" onClick={() => setToolId(null)}>
            ← Catalog ({TOOL_CATALOG.length})
          </button>
          <strong>{active.name}</strong>
          <span className="status-line">
            {active.group} · {active.engine}
          </span>
        </div>
        <UniversalTool
          tool={active}
          state={state}
          onOpenDock={onOpenDock}
          onClose={() => setToolId(null)}
        />
      </div>
    )
  }

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
        {filtered.length} shown · glass UI · ready-made engines (browser, media, terminal, editor,
        jszip, qrcode, marked, xterm, monaco…)
      </p>
      <div className="tools-grid" style={{ overflow: 'auto' }}>
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-card ${t.status}`}
            onClick={() => setToolId(t.id)}
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
