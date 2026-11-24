import { useEffect, useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
}

function conditionLabel(c: EnvironmentState['weather']['condition']): string {
  switch (c) {
    case 'clear':
      return 'Clear skies'
    case 'cloudy':
      return 'Soft overcast'
    case 'rain':
      return 'Heavy rain'
    case 'storm':
      return 'Storm front'
    case 'fog':
      return 'Fog bank'
    default:
      return 'Unknown'
  }
}

function conditionHint(c: EnvironmentState['weather']['condition']): string {
  switch (c) {
    case 'clear':
      return 'Low CPU & process churn'
    case 'cloudy':
      return 'Moderate load building'
    case 'rain':
      return 'Sustained churn / I/O'
    case 'storm':
      return 'Peak strain — cool the desk'
    case 'fog':
      return 'Idle haze / soft RAM pressure'
    default:
      return 'Telemetry mapping'
  }
}

/** Weather-widget metaphor driven by local machine telemetry (not outdoor APIs). */
export default function AtmospherePanel({ state }: Props): React.JSX.Element {
  const { solar, weather, system, freshness, health } = state
  const heat = system.cpuTempC != null ? Math.round(system.cpuTempC) : null
  const wind = Math.round(weather.wind * 40)
  const moisture = Math.round((weather.fog * 0.45 + weather.rain * 0.55) * 100)
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 24 }, (_, i) => Math.min(1, system.cpuLoad * (0.7 + (i % 5) * 0.05)))
  )

  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev.slice(1), Math.min(1, Math.max(0, system.cpuLoad))]
      return next
    })
  }, [system.sampledAt, system.cpuLoad])

  const spark = useMemo(() => {
    const w = 220
    const h = 36
    const pts = history
      .map((v, i) => {
        const x = (i / Math.max(1, history.length - 1)) * w
        const y = h - v * (h - 4) - 2
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    return { w, h, pts }
  }, [history])

  const forecast = useMemo(() => {
    const base = system.cpuLoad
    return [
      {
        slot: 'Now',
        cond: weather.condition,
        lo: Math.round(base * 40),
        hi: Math.round(base * 55)
      },
      {
        slot: '+15m',
        cond: base > 0.55 ? 'storm' : base > 0.35 ? 'rain' : 'cloudy',
        lo: Math.round((base + 0.08) * 40),
        hi: Math.round((base + 0.12) * 55)
      },
      {
        slot: '+30m',
        cond: base > 0.45 ? 'rain' : 'clear',
        lo: Math.round((base + 0.04) * 38),
        hi: Math.round((base + 0.1) * 52)
      },
      {
        slot: '+1h',
        cond: base > 0.6 ? 'storm' : 'cloudy',
        lo: Math.round((base * 0.9) * 36),
        hi: Math.round((base * 1.05) * 50)
      }
    ] as const
  }, [system.cpuLoad, weather.condition])

  return (
    <section className="atmosphere-panel weather-widget" aria-label="Atmosphere weather metaphor">
      <header className="panel-head tight">
        <h2>Atmosphere</h2>
        <span className="pill">{freshness}</span>
      </header>

      <div className="atm-hero">
        <div className="atm-clock-block">
          <div className="atm-clock">{solar.clockLabel}</div>
          <div className="atm-date">{solar.dateLabel}</div>
          <div className="atm-phase">{solar.phase.replaceAll('_', ' ')}</div>
        </div>
        <div className={`atm-icon-lg cond-${weather.condition}`} aria-hidden />
      </div>

      <div className="atm-condition">
        <div>
          <strong>{conditionLabel(weather.condition)}</strong>
          <em>{conditionHint(weather.condition)}</em>
        </div>
        <span className="atm-feels">
          Feels {Math.round(health.score * 100)}
        </span>
      </div>

      <div className="atm-stats">
        <div>
          <span>CPU heat</span>
          <strong>{heat != null ? `${heat}°` : '—'}</strong>
        </div>
        <div>
          <span>Moisture</span>
          <strong>{moisture}%</strong>
        </div>
        <div>
          <span>Drift</span>
          <strong>{wind}</strong>
        </div>
        <div>
          <span>Cloud</span>
          <strong>{Math.round(weather.cloudCover * 100)}%</strong>
        </div>
      </div>

      <div className="atm-spark" aria-label="Recent CPU load trend">
        <span className="atm-spark-label">Load trend</span>
        <svg viewBox={`0 0 ${spark.w} ${spark.h}`} width="100%" height={spark.h} role="img">
          <polyline
            fill="none"
            stroke="rgba(122, 215, 255, 0.85)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={spark.pts}
          />
        </svg>
      </div>

      <div className="atm-forecast" aria-label="Near-term telemetry forecast">
        {forecast.map((slot) => (
          <div key={slot.slot} className="atm-day">
            <span>{slot.slot}</span>
            <i className={`mini-cond cond-${slot.cond}`} />
            <em>
              {slot.lo}–{slot.hi}
            </em>
          </div>
        ))}
      </div>

      <p className="atm-fine">
        Local telemetry weather metaphor ({freshness}) — not outdoor weather APIs.
      </p>
    </section>
  )
}
