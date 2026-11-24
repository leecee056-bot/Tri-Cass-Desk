import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import { themeById } from '../themes'

type Props = {
  state: EnvironmentState
  mood: MoodState
}

/**
 * Lite desk backdrop — themed wallpaper image + light mood wash.
 * No WebGL / Three.js (safer after v0.2.3 GPU hard-crash reports).
 */
export function LiteLivingBackdrop({ state, mood }: Props): React.JSX.Element {
  const theme = themeById(state.userPreferences.deskTheme)
  const { solar, weather, health } = state

  return (
    <div
      className="lite-backdrop"
      data-theme={theme.id}
      data-phase={solar.phase}
      data-condition={weather.condition}
      data-mood={health.band}
      style={
        {
          '--lite-day': String(1 - mood.nightness),
          '--lite-night': String(mood.nightness),
          '--lite-heat': String(mood.heat),
          '--lite-load': String(mood.load),
          '--lite-wash': theme.wash
        } as React.CSSProperties
      }
    >
      <img className="lite-wallpaper" src={theme.image} alt="" draggable={false} />
      <div className="lite-theme-veil" />
      <div className="lite-mood-tint" />
    </div>
  )
}
