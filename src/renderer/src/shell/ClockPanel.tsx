import type { EnvironmentState } from '../../../shared/environment'

type Props = {
  state: EnvironmentState
}

export default function ClockPanel({ state }: Props): React.JSX.Element {
  return (
    <section className="clock-block" aria-label="Local time">
      <div className="clock-time">{state.solar.clockLabel}</div>
      <div className="clock-date">{state.solar.dateLabel}</div>
      <div className="clock-phase">{state.solar.phase.replaceAll('_', ' ')}</div>
    </section>
  )
}
