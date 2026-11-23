import type { MoodOverrides, MoodState } from '../../../shared/mood'

type Props = {
  mood: MoodState
  overrides: MoodOverrides
  onChange: (next: MoodOverrides) => void
  lowPower: boolean
  onLowPower: (v: boolean) => void
}

function Slider({
  label,
  value,
  onChange,
  disabled
}: {
  label: string
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <label className="mood-debug-row">
      <span>
        {label} <em>{Math.round(value * 100)}</em>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  )
}

/** Debug mood sliders — test scene without stressing the PC. */
export default function MoodDebugPanel({
  mood,
  overrides,
  onChange,
  lowPower,
  onLowPower
}: Props): React.JSX.Element {
  const live = overrides.enabled
    ? {
        heat: overrides.heat ?? mood.heat,
        load: overrides.load ?? mood.load,
        nightness: overrides.nightness ?? mood.nightness,
        wind: overrides.wind ?? mood.wind,
        activity: overrides.activity ?? mood.activity
      }
    : mood

  return (
    <aside className="mood-debug" aria-label="Mood debug panel">
      <header>
        <strong>Mood debug</strong>
        <label className="mood-debug-toggle">
          <input
            type="checkbox"
            checked={Boolean(overrides.enabled)}
            onChange={(e) =>
              onChange({
                ...overrides,
                enabled: e.target.checked,
                heat: mood.heat,
                load: mood.load,
                nightness: mood.nightness,
                wind: mood.wind,
                activity: mood.activity
              })
            }
          />
          Override
        </label>
      </header>
      <Slider
        label="Heat"
        value={live.heat}
        disabled={!overrides.enabled}
        onChange={(heat) => onChange({ ...overrides, heat })}
      />
      <Slider
        label="Load"
        value={live.load}
        disabled={!overrides.enabled}
        onChange={(load) => onChange({ ...overrides, load })}
      />
      <Slider
        label="Night"
        value={live.nightness}
        disabled={!overrides.enabled}
        onChange={(nightness) => onChange({ ...overrides, nightness })}
      />
      <Slider
        label="Wind"
        value={live.wind}
        disabled={!overrides.enabled}
        onChange={(wind) => onChange({ ...overrides, wind })}
      />
      <Slider
        label="Activity"
        value={live.activity}
        disabled={!overrides.enabled}
        onChange={(activity) => onChange({ ...overrides, activity })}
      />
      <label className="mood-debug-toggle">
        <input type="checkbox" checked={lowPower} onChange={(e) => onLowPower(e.target.checked)} />
        Low-power scene
      </label>
      <p className="mood-debug-hint">Live lerped values drive sky / clouds / grass / water.</p>
    </aside>
  )
}
