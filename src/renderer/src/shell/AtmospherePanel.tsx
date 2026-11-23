import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
}

function conditionLabel(c: EnvironmentState['weather']['condition']): string {
  switch (c) {
    case 'clear':
      return 'Clear load'
    case 'cloudy':
      return 'Soft load'
    case 'rain':
      return 'Heavy churn'
    case 'storm':
      return 'Peak strain'
    case 'fog':
      return 'Hazy idle'
    default:
      return 'Unknown'
  }
}

export default function AtmospherePanel({ state }: Props): React.JSX.Element {
  const { solar, weather, system, freshness } = state
  const heat = system.cpuTempC != null ? Math.round(system.cpuTempC) : null
  const wind = Math.round(weather.wind * 40)
  const moisture = Math.round((weather.fog * 0.45 + weather.rain * 0.55) * 100)

  return (
    <section className="atmosphere-panel" aria-label="Local time and atmosphere">
      <div className="atm-clock">{solar.clockLabel}</div>
      <div className="atm-date">{solar.dateLabel}</div>
      <div className="atm-condition">
        <span className={`atm-icon cond-${weather.condition}`} aria-hidden />
        <div>
          <strong>{conditionLabel(weather.condition)}</strong>
          <em>
            {heat != null ? `${heat}°C CPU` : 'CPU —'} ·{' '}
            {solar.phase.replaceAll('_', ' ')}
          </em>
        </div>
      </div>
      <div className="atm-stats">
        <div>
          <span>Moisture</span>
          <strong>{moisture}%</strong>
        </div>
        <div>
          <span>Drift</span>
          <strong>{wind}</strong>
        </div>
        <div>
          <span>Feels</span>
          <strong>{Math.round(state.health.score * 100)}</strong>
        </div>
      </div>
      <div className="atm-forecast" aria-label="Near-term telemetry trend">
        {(['calm', 'steady', 'busy'] as const).map((slot, i) => (
          <div key={slot} className="atm-day">
            <span>{slot}</span>
            <i className={`mini-cond c${(i + weather.cloudCover * 3) | 0}`} />
            <em>
              {Math.round((system.cpuLoad + i * 0.08) * 40)}–
              {Math.round((system.cpuLoad + i * 0.12) * 55)}
            </em>
          </div>
        ))}
      </div>
      <p className="atm-fine">
        Local telemetry ({freshness}) — not outdoor weather.
      </p>
    </section>
  )
}
