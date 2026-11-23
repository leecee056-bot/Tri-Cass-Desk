import type { EnvironmentState } from '../../../shared/environment'

const BANDS: {
  id: EnvironmentState['health']['band']
  label: string
  tone: string
}[] = [
  { id: 'tranquil', label: 'Calm', tone: '#6ec8ff' },
  { id: 'balanced', label: 'Balanced', tone: '#7dffc8' },
  { id: 'focused', label: 'Focused', tone: '#ffe07a' },
  { id: 'intense', label: 'Intense', tone: '#ff9a5c' },
  { id: 'strained', label: 'Dreamy', tone: '#f2f4ff' }
]

type Props = {
  state: EnvironmentState
}

export default function HealthPanel({ state }: Props): React.JSX.Element {
  const band = BANDS.find((b) => b.id === state.health.band) || BANDS[1]!
  const energy =
    state.health.band === 'tranquil' || state.health.band === 'balanced'
      ? 'Steady'
      : state.health.band === 'focused'
        ? 'Raised'
        : 'High'

  return (
    <section className="mood-panel" aria-label="Machine mood">
      <div className="mood-orb" aria-hidden>
        <div className="mood-orb-core" />
        <div className="mood-orb-ring" />
      </div>
      <div className="mood-readout">
        <div>
          <span>Mood</span>
          <strong style={{ color: band.tone }}>{band.label}</strong>
        </div>
        <div>
          <span>Energy</span>
          <strong>{energy}</strong>
        </div>
        <div className="mood-wave" aria-hidden />
      </div>
      <ul className="mood-bands">
        {BANDS.map((b) => (
          <li key={b.id} className={state.health.band === b.id ? 'on' : ''}>
            <span className="dot" style={{ background: b.tone }} />
            {b.label}
          </li>
        ))}
      </ul>
      <p className="mood-fine">
        From CPU, RAM, GPU and process churn — local only.
      </p>
    </section>
  )
}
