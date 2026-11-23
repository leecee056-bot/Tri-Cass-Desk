import { useEffect, useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
}

/** Desktop clock / calendar glance. */
export default function ClockPanel({ state }: Props): React.JSX.Element {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const week = useMemo(() => {
    const start = new Date(now)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
    // dayKey anchors the week strip to the calendar day
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey])

  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <section className="clock-block clock-glance" aria-label="Local time and calendar">
      <div className="clock-time">{time || state.solar.clockLabel}</div>
      <div className="clock-date">{state.solar.dateLabel}</div>
      <div className="clock-phase">{state.solar.phase.replaceAll('_', ' ')}</div>
      <div className="clock-week" aria-label="This week">
        {week.map((d) => {
          const isToday = d.toDateString() === now.toDateString()
          return (
            <div key={d.toISOString()} className={`clock-day ${isToday ? 'on' : ''}`}>
              <span>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              <strong>{d.getDate()}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
