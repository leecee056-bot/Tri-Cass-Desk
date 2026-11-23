import { useEffect, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { WorkspaceSnapshot } from '../../../shared/types'
import './features.css'

type Props = {
  state: EnvironmentState
  activeDock: string
  onChange: (prefs: Partial<EnvironmentState['userPreferences']>) => void
  onRestoreDock: (id: string) => void
}

export default function SettingsView({
  state,
  activeDock,
  onChange,
  onRestoreDock
}: Props): React.JSX.Element {
  const p = state.userPreferences
  const [snaps, setSnaps] = useState<WorkspaceSnapshot[]>([])

  useEffect(() => {
    void window.desk?.snapshotsList().then(setSnaps)
  }, [])

  return (
    <div className="feature">
      <div className="tool-stack">
        <label className="status-line">
          <input
            type="checkbox"
            checked={p.weatherEffects}
            onChange={(e) => onChange({ weatherEffects: e.target.checked })}
          />{' '}
          Telemetry weather layers
        </label>
        <label className="status-line">
          <input
            type="checkbox"
            checked={p.celestialEffects}
            onChange={(e) => onChange({ celestialEffects: e.target.checked })}
          />{' '}
          Celestial art (GPU-driven, artistic)
        </label>
        <label className="status-line">
          <input
            type="checkbox"
            checked={p.pauseAdaptation}
            onChange={(e) => onChange({ pauseAdaptation: e.target.checked })}
          />{' '}
          Pause environment adaptation
        </label>
        <label className="status-line">
          Motion{' '}
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
      </div>

      <div className="feature-toolbar">
        <button
          type="button"
          className="btn"
          onClick={() =>
            void window.desk?.snapshotsSave(activeDock).then(async () => {
              setSnaps(await window.desk!.snapshotsList())
            })
          }
        >
          Save workspace snapshot
        </button>
      </div>
      <div className="file-list">
        {snaps.map((s) => (
          <div key={s.id} className="file-row">
            <span>
              {s.label} · {s.activeDock}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onRestoreDock(s.activeDock)}
            >
              Restore
            </button>
          </div>
        ))}
        {snaps.length === 0 ? (
          <p className="status-line">No snapshots yet — saves active dock + label locally.</p>
        ) : null}
      </div>
      <div className="tool-stack" style={{ marginTop: 12 }}>
        <p className="status-line">
          <strong>Living world controls</strong>
        </p>
        <p className="status-line">
          Edge-pan for 360° yaw · Alt/⌘-drag to orbit · Shift+wheel yaw · Alt+wheel pitch. Windows
          stay fixed on screen.
        </p>
        <p className="status-line">
          Atmosphere is local telemetry (CPU/RAM/processes), not outdoor weather APIs.
        </p>
      </div>
      <p className="status-line">
        Freshness: {state.freshness} · activity: {state.activity.workspaceState} · CPU{' '}
        {Math.round(state.system.cpuLoad * 100)}% · phase {state.solar.phase.replaceAll('_', ' ')}
      </p>
    </div>
  )
}
