import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
  onChange: (prefs: Partial<EnvironmentState['userPreferences']>) => void
  onWake: () => void
}

export default function ControlsBar({ state, onChange, onWake }: Props): React.JSX.Element {
  const p = state.userPreferences
  return (
    <section className="panel glass controls-bar" aria-label="Environment controls">
      <label>
        <input
          type="checkbox"
          checked={p.weatherEffects}
          onChange={(e) => onChange({ weatherEffects: e.target.checked })}
        />
        Load atmosphere
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.celestialEffects}
          onChange={(e) => onChange({ celestialEffects: e.target.checked })}
        />
        Celestial art
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.pauseAdaptation}
          onChange={(e) => onChange({ pauseAdaptation: e.target.checked })}
        />
        Pause adaptation
      </label>
      <label>
        Motion
        <select
          value={p.motion}
          onChange={(e) =>
            onChange({ motion: e.target.value as EnvironmentState['userPreferences']['motion'] })
          }
        >
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
          <option value="off">Off</option>
        </select>
      </label>
      <button type="button" className="wake-btn" onClick={onWake}>
        Wake workspace
      </button>
    </section>
  )
}
