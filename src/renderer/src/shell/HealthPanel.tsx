import type { EnvironmentState } from '../../../shared/environment'

const BANDS: EnvironmentState['health']['band'][] = [
  'tranquil',
  'balanced',
  'focused',
  'intense',
  'strained'
]

type Props = {
  state: EnvironmentState
}

export default function HealthPanel({ state }: Props): React.JSX.Element {
  return (
    <section className="panel glass health-panel" aria-label="Machine mood">
      <header className="panel-head">
        <h2>Machine mood</h2>
      </header>
      <p className="lede">
        Derived from CPU, RAM, GPU and process churn — not emotions or cloud services.
      </p>
      <ul className="band-list">
        {BANDS.map((band) => (
          <li key={band} className={state.health.band === band ? 'on' : ''}>
            <span className="dot" />
            {band}
          </li>
        ))}
      </ul>
      <div className="wave" aria-hidden />
    </section>
  )
}
