import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  state: EnvironmentState
  mood: MoodState
}

/**
 * CPU-light desk backdrop — CSS only. No WebGL / Three.js / Poly Haven meshes.
 * Ships in the lite Windows build after v0.2.3 GPU hard-crash reports.
 */
export function LiteLivingBackdrop({ state, mood }: Props): React.JSX.Element {
  const { solar, weather, health } = state
  return (
    <div
      className="lite-backdrop"
      data-phase={solar.phase}
      data-condition={weather.condition}
      data-mood={health.band}
      style={
        {
          '--lite-day': String(1 - mood.nightness),
          '--lite-night': String(mood.nightness),
          '--lite-heat': String(mood.heat),
          '--lite-load': String(mood.load),
          '--lite-wind': String(mood.wind),
          '--lite-cloud': String(weather.cloudCover)
        } as React.CSSProperties
      }
    >
      <div className="lite-sky" />
      <div className="lite-haze" />
      <div className="lite-sun" />
      <div className="lite-hills" />
      <div className="lite-water" />
      <div className="lite-shore" />
    </div>
  )
}
