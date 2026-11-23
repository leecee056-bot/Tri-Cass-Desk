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
        <div className="meter-fill" style={{ width: pct(Math.min(1, value)) }} />
      </div>
    </div>
  )
}

export default function SystemPanel({ state }: Props): React.JSX.Element {
  const { system, health } = state
  const storage = system.diskUsedRatio ?? 0
  return (
    <section className="system-panel compact" aria-label="System">
      <header className="panel-head tight">
        <h2>
          <span className="sys-pulse" aria-hidden />
          System
        </h2>
        <span className="pill">{health.band}</span>
      </header>
      <Bar label="CPU" value={system.cpuLoad} />
      <Bar label="RAM" value={system.ramUsedRatio} />
      <Bar label="Storage" value={storage} />
      <p className="fine-print">Live local meters · {system.processCount} processes</p>
    </section>
  )
}
