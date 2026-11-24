import type { EnvironmentState } from '../../../shared/environment'

const BANDS: {
  id: EnvironmentState['health']['band']
  label: string
  tone: string
  tip: string
}[] = [
  {
    id: 'tranquil',
    label: 'Calm',
    tone: '#6ec8ff',
    tip: 'Light load — good window for deep focus or rest.'
  },
  {
    id: 'balanced',
    label: 'Balanced',
    tone: '#7dffc8',
    tip: 'Steady machine mood — keep current rhythm.'
  },
  {
    id: 'focused',
    label: 'Focused',
    tone: '#ffe07a',
    tip: 'Raised energy — protect the session; avoid extra apps.'
  },
  {
    id: 'intense',
    label: 'Intense',
    tone: '#ff9a5c',
    tip: 'High churn — close idle windows or pause heavy tools.'
  },
  {
    id: 'strained',
    label: 'Dreamy',
    tone: '#f2f4ff',
    tip: 'Soft strain / haze — cool the desk or take a break.'
  }
]

type Props = {
  state: EnvironmentState
}

function Driver({
  label,
  value,
  weight
}: {
  label: string
  value: number
  weight: number
}): React.JSX.Element {
  const contrib = Math.round(value * weight * 100)
  return (
    <div className="mood-driver">
      <div className="mood-driver-label">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${Math.min(100, contrib)}%` }} />
      </div>
    </div>
  )
}

/** Health / focus widget — machine mood from local telemetry drivers. */
export default function HealthPanel({ state }: Props): React.JSX.Element {
  const band = BANDS.find((b) => b.id === state.health.band) || BANDS[1]!
  const score = Math.round(state.health.score * 100)
  const energy =
    state.health.band === 'tranquil' || state.health.band === 'balanced'
      ? 'Steady'
      : state.health.band === 'focused'
        ? 'Raised'
        : 'High'

  const gpu = state.system.gpuLoad ?? state.system.cpuLoad * 0.4
  const ringStyle = {
    background: `conic-gradient(${band.tone} ${score}%, rgba(255,255,255,0.08) 0)`
  }

  return (
    <section className="mood-panel health-focus" aria-label="Machine mood">
      <header className="panel-head tight">
        <h2>Mood</h2>
        <span className="pill" style={{ color: band.tone }}>
          {band.label}
        </span>
      </header>

      <div className="mood-score-row">
        <div className="mood-score-ring" style={ringStyle} aria-hidden>
          <div className="mood-score-inner">
            <strong>{score}</strong>
            <span>focus</span>
          </div>
        </div>
        <div className="mood-orb" aria-hidden>
          <div className="mood-orb-core" />
          <div className="mood-orb-ring" />
        </div>
      </div>

      <div className="mood-readout">
        <div>
          <span>Energy</span>
          <strong>{energy}</strong>
        </div>
        <div>
          <span>Workspace</span>
          <strong className="cap">
            {state.activity.workspaceState.replaceAll('_', ' ')}
          </strong>
        </div>
      </div>

      <div
        className="mood-wave"
        aria-hidden
        style={{ opacity: 0.45 + state.system.cpuLoad * 0.55 }}
      />

      <div className="mood-drivers" aria-label="Mood drivers">
        <p className="mood-drivers-title">Drivers</p>
        <Driver label="CPU" value={state.system.cpuLoad} weight={0.4} />
        <Driver label="RAM" value={state.system.ramUsedRatio} weight={0.25} />
        <Driver label="GPU" value={gpu} weight={0.2} />
        <Driver label="Churn" value={state.system.processChurn} weight={0.15} />
      </div>

      <ul className="mood-bands">
        {BANDS.map((b) => (
          <li key={b.id} className={state.health.band === b.id ? 'on' : ''}>
            <span className="dot" style={{ background: b.tone }} />
            {b.label}
          </li>
        ))}
      </ul>

      <p className="mood-tip">{band.tip}</p>
      <p className="mood-fine">From CPU, RAM, GPU and process churn — local only.</p>
    </section>
  )
}
