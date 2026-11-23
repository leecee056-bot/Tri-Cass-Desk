import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { TOOL_CATALOG, TOOL_GROUPS, type ToolEntry, type ToolGroup } from './catalog'
import { TOP20_IDS, isTop20 } from './top20'
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
  const [group, setGroup] = useState<ToolGroup | 'all' | 'top20'>('top20')

  const top20Tools = useMemo(
    () =>
      TOP20_IDS.map((id) => TOOL_CATALOG.find((t) => t.id === id)).filter(
        (t): t is ToolEntry => Boolean(t)
      ),
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (group === 'top20') {
      return top20Tools.filter((t) => {
        if (!q) return true
        return t.name.toLowerCase().includes(q) || t.id.includes(q) || t.group.includes(q)
      })
    }
    return TOOL_CATALOG.filter((t) => {
      if (group !== 'all' && t.group !== group) return false
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.id.includes(q) || t.group.includes(q)
    })
  }, [query, group, top20Tools])

  void state

  const open = (t: ToolEntry): void => {
    if (onOpenTool) onOpenTool(t)
    else onOpenDock('tools')
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
          onChange={(e) => setGroup(e.target.value as ToolGroup | 'all' | 'top20')}
          aria-label="Group"
        >
          <option value="top20">Top-20 deep engines</option>
          <option value="all">All groups</option>
          {TOOL_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <p className="status-line">
        {group === 'top20'
          ? `${filtered.length} Top-20 Raycast-class tools with real local engines · rest of catalog still thin`
          : `${filtered.length} shown · ${TOP20_IDS.length} marked deep · opens as floating glass windows`}
      </p>
      <div className="tools-grid" style={{ overflow: 'auto' }}>
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-card ${t.status} ${isTop20(t) ? 'tool-deep' : ''}`}
            onClick={() => open(t)}
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
      </div>
    </div>
  )
}
