import { useEffect, useMemo, useState } from 'react'
import type { DeskThemeId, EnvironmentState } from '../../../shared/environment'
import type { WorkspaceSnapshot } from '../../../shared/types'
import { DESK_THEMES } from '../scene/themes'
import './features.css'

type Props = {
  state: EnvironmentState
  activeDock: string
  onChange: (prefs: Partial<EnvironmentState['userPreferences']>) => void
  onRestoreDock: (id: string) => void
}

type PaneId = 'general' | 'living' | 'appearance' | 'workspace' | 'privacy' | 'about'

const PANES: Array<{ id: PaneId; label: string; hint: string }> = [
  { id: 'general', label: 'General', hint: 'Motion & adaptation' },
  { id: 'living', label: 'Living world', hint: 'Weather & sky' },
  { id: 'appearance', label: 'Appearance', hint: 'Themes & glass' },
  { id: 'workspace', label: 'Workspace', hint: 'Snapshots' },
  { id: 'privacy', label: 'Privacy', hint: 'Local-only' },
  { id: 'about', label: 'About', hint: 'Desk info' }
]

function Toggle({
  label,
  detail,
  checked,
  onChange
}: {
  label: string
  detail?: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <label className="settings-row">
      <span>
        <strong>{label}</strong>
        {detail ? <em>{detail}</em> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

/** System Settings–style preferences with sidebar categories. */
export default function SettingsView({
  state,
  activeDock,
  onChange,
  onRestoreDock
}: Props): React.JSX.Element {
  const p = state.userPreferences
  const [pane, setPane] = useState<PaneId>('general')
  const [query, setQuery] = useState('')
  const [snaps, setSnaps] = useState<WorkspaceSnapshot[]>([])
  const [snapLabel, setSnapLabel] = useState('')
  const [aboutLines, setAboutLines] = useState<string[]>([])
  const [status, setStatus] = useState('')

  const refreshSnaps = async (): Promise<void> => {
    if (!window.desk) return
    setSnaps(await window.desk.snapshotsList())
  }

  useEffect(() => {
    void refreshSnaps()
  }, [])

  useEffect(() => {
    if (pane !== 'about') return
    void (async () => {
      if (!window.desk) {
        setAboutLines(['Desk APIs unavailable (browser fallback)'])
        return
      }
      const info = await window.desk.runSafeCommand('desk-info')
      const env = await window.desk.envVars()
      setAboutLines([
        ...(info.ok ? info.output.split('\n') : [info.output]),
        `USER: ${env.USER || env.USERNAME || '—'}`,
        `HOME: ${env.HOME || env.USERPROFILE || '—'}`,
        `OS: ${env.OS || '—'} · arch ${env.PROCESSOR_ARCHITECTURE || '—'}`
      ])
    })()
  }, [pane])

  const visiblePanes = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PANES
    return PANES.filter(
      (x) =>
        x.label.toLowerCase().includes(q) ||
        x.hint.toLowerCase().includes(q) ||
        x.id.includes(q)
    )
  }, [query])

  useEffect(() => {
    if (!visiblePanes.find((x) => x.id === pane) && visiblePanes[0]) {
      setPane(visiblePanes[0].id)
    }
  }, [visiblePanes, pane])

  return (
    <div className="feature settings-system" aria-label="System Settings">
      <aside className="settings-side">
        <input
          className="settings-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search settings…"
          aria-label="Search settings"
        />
        <nav className="settings-nav" aria-label="Settings categories">
          {visiblePanes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-btn ${pane === item.id ? 'on' : ''}`}
              onClick={() => setPane(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
          {!visiblePanes.length ? <p className="status-line">No matching panes</p> : null}
        </nav>
      </aside>

      <section className="settings-main">
        <header className="settings-main-head">
          <h2>{PANES.find((x) => x.id === pane)?.label ?? 'Settings'}</h2>
          {status ? <p className="status-line">{status}</p> : null}
        </header>

        {pane === 'general' ? (
          <div className="settings-group">
            <label className="settings-row">
              <span>
                <strong>Motion</strong>
                <em>Full / reduced / off for living-world animation</em>
              </span>
              <select
                value={p.motion}
                onChange={(e) =>
                  onChange({
                    motion: e.target.value as EnvironmentState['userPreferences']['motion']
                  })
                }
              >
                <option value="full">Full</option>
                <option value="reduced">Reduced</option>
                <option value="off">Off</option>
              </select>
            </label>
            <Toggle
              label="Pause environment adaptation"
              detail="Freeze weather & celestial mapping from live telemetry"
              checked={p.pauseAdaptation}
              onChange={(v) => onChange({ pauseAdaptation: v })}
            />
            <div className="settings-actions">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void window.desk?.wakeWorkspace()
                  setStatus('Workspace woken')
                }}
              >
                Wake workspace
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  void (async () => {
                    if (!window.desk?.resetPreferences) {
                      onChange({
                        motion: 'reduced',
                        celestialEffects: false,
                        weatherEffects: false,
                        pauseAdaptation: false,
                        reduceTransparency: false,
                        compactDock: false,
                        clock24h: false,
                        deskTheme: 'nature',
                        livingWorld3d: true
                      })
                      setStatus('Defaults applied (local)')
                      return
                    }
                    await window.desk.resetPreferences()
                    setStatus('Preferences reset to defaults')
                  })()
                }}
              >
                Reset all defaults
              </button>
            </div>
          </div>
        ) : null}

        {pane === 'living' ? (
          <div className="settings-group">
            <Toggle
              label="Interactive living world (3D)"
              detail="Three.js lakeside. Turn off to use wallpaper themes only if it feels heavy."
              checked={p.livingWorld3d !== false}
              onChange={(v) => onChange({ livingWorld3d: v })}
            />
            <Toggle
              label="Telemetry weather layers"
              detail="Rain / cloud / fog mapped from light CPU/RAM samples — not outdoor APIs"
              checked={p.weatherEffects}
              onChange={(v) => onChange({ weatherEffects: v })}
            />
            <Toggle
              label="Celestial art"
              detail="Stars, aurora, moon glow (GPU-driven, artistic)"
              checked={p.celestialEffects}
              onChange={(v) => onChange({ celestialEffects: v })}
            />
            <p className="settings-help">
              Defaults to reduced motion / low-power GPU. Prefer Motion → Off or disable 3D if the
              desk feels laggy. Wallpaper themes still apply when 3D is off.
            </p>
          </div>
        ) : null}

        {pane === 'appearance' ? (
          <div className="settings-group">
            <div className="settings-theme-block">
              <strong className="settings-theme-title">Desk theme</strong>
              <em className="settings-theme-hint">Wallpaper + matching wash · four presets</em>
              <div className="settings-theme-grid" role="listbox" aria-label="Desk theme">
                {DESK_THEMES.map((theme) => {
                  const active = (p.deskTheme ?? 'nature') === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`settings-theme-card ${active ? 'is-active' : ''}`}
                      onClick={() => onChange({ deskTheme: theme.id as DeskThemeId })}
                    >
                      <img src={theme.image} alt="" draggable={false} />
                      <span>
                        <strong>{theme.label}</strong>
                        <em>{theme.hint}</em>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <Toggle
              label="Reduce transparency"
              detail="Raise panel opacity for clearer reading"
              checked={p.reduceTransparency}
              onChange={(v) => onChange({ reduceTransparency: v })}
            />
            <Toggle
              label="Compact dock"
              detail="Tighter dock icon spacing"
              checked={p.compactDock}
              onChange={(v) => onChange({ compactDock: v })}
            />
            <Toggle
              label="24-hour clock"
              detail="Prefer 24h labels in Atmosphere and Clock"
              checked={p.clock24h}
              onChange={(v) => onChange({ clock24h: v })}
            />
          </div>
        ) : null}

        {pane === 'workspace' ? (
          <div className="settings-group">
            <div className="settings-actions">
              <input
                value={snapLabel}
                onChange={(e) => setSnapLabel(e.target.value)}
                placeholder="Snapshot label (optional)"
                aria-label="Snapshot label"
              />
              <button
                type="button"
                className="btn"
                onClick={() =>
                  void window.desk?.snapshotsSave(activeDock, snapLabel || undefined).then(async () => {
                    setSnapLabel('')
                    await refreshSnaps()
                    setStatus('Snapshot saved')
                  })
                }
              >
                Save workspace snapshot
              </button>
            </div>
            <p className="settings-help">
              Saves active dock id + label locally under desk userData. Restore re-opens that app.
            </p>
            <div className="file-list settings-snaps">
              {snaps.map((s) => (
                <div key={s.id} className="file-row">
                  <span>
                    {s.label} · {s.activeDock}
                    <em className="settings-snap-meta">
                      {new Date(s.createdAt).toLocaleString()}
                    </em>
                  </span>
                  <span className="settings-snap-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        onRestoreDock(s.activeDock)
                        setStatus(`Restored ${s.activeDock}`)
                      }}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() =>
                        void window.desk?.snapshotsDelete(s.id).then(async () => {
                          await refreshSnaps()
                          setStatus('Snapshot deleted')
                        })
                      }
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
              {snaps.length === 0 ? (
                <p className="status-line">No snapshots yet.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {pane === 'privacy' ? (
          <div className="settings-group">
            <p className="settings-help">
              Tri-Cass Desk is local-first. Atmosphere is machine telemetry (CPU/RAM/processes), never
              outdoor weather APIs. Chat/agents use your local Ollama when available. Vault notes stay
              in desk userData.
            </p>
            <ul className="settings-bullets">
              <li>No cloud weather or location requests</li>
              <li>Preferences persist under local userData</li>
              <li>Workspace snapshots stay on this machine</li>
            </ul>
            <p className="status-line">
              Freshness: {state.freshness} · activity: {state.activity.workspaceState}
            </p>
          </div>
        ) : null}

        {pane === 'about' ? (
          <div className="settings-group">
            <div className="settings-meters">
              <div>
                <span>CPU</span>
                <strong>{Math.round(state.system.cpuLoad * 100)}%</strong>
              </div>
              <div>
                <span>RAM</span>
                <strong>{Math.round(state.system.ramUsedRatio * 100)}%</strong>
              </div>
              <div>
                <span>Phase</span>
                <strong className="cap">{state.solar.phase.replaceAll('_', ' ')}</strong>
              </div>
              <div>
                <span>Mood</span>
                <strong className="cap">{state.health.band}</strong>
              </div>
            </div>
            <pre className="settings-about">{aboutLines.join('\n') || 'Loading…'}</pre>
            <p className="status-line">Tri-Cass OS · Desk · v0.2.2</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
