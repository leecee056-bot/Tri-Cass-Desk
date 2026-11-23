import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function Bar({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: pct(value) }} />
      </div>
    </div>
  )
}

export default function SystemPanel({ state }: Props): React.JSX.Element {
  const { system, health, weather, freshness } = state
  return (
    <section className="panel glass system-panel" aria-label="System">
      <header className="panel-head">
        <h2>System</h2>
        <span className="pill">{health.band}</span>
      </header>
      <Bar label="CPU" value={system.cpuLoad} />
      <Bar label="RAM" value={system.ramUsedRatio} />
      <Bar label="GPU" value={system.gpuLoad ?? 0} />
      <div className="meta-row">
        <span>
          CPU {system.cpuTempC != null ? `${Math.round(system.cpuTempC)}°C` : '—'}
        </span>
        <span>
          GPU {system.gpuTempC != null ? `${Math.round(system.gpuTempC)}°C` : '—'}
        </span>
      </div>
      <div className="meta-row">
        <span>{system.processCount} processes</span>
        <span>scene: {weather.condition}</span>
      </div>
      <p className="fine-print">
        Atmosphere from local telemetry ({freshness}). Not weather / location data.
      </p>
    </section>
  )
}
