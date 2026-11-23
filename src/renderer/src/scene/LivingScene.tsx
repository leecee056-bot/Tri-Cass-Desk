import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { MoodOverrides } from '../../../shared/mood'
import landscape from '../assets/earthbound-landscape.jpg'
import { LivingWorldCanvas } from './engines/LivingWorldCanvas'
import { SceneErrorBoundary } from './engines/SceneErrorBoundary'
import MoodDebugPanel from './MoodDebugPanel'
import { useMoodState } from './useMoodState'
import { useSceneCamera } from './useSceneCamera'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Living companion world: shared mood drives independent Three.js engines
 * (sky, clouds, stars, grass, water, weather) over the Earthbound plate.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const cam = useSceneCamera(state.userPreferences.motion !== 'off')
  const [overrides, setOverrides] = useState<MoodOverrides>({})
  const [lowPower, setLowPower] = useState(
    () => state.userPreferences.motion === 'reduced' || state.userPreferences.motion === 'off'
  )
  const { mood } = useMoodState(state, overrides)
  const { solar, weather, activity, system, health } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.03
      : activity.workspaceState === 'resting'
        ? 1.015
        : 1

  const tint = useMemo(() => {
    const hues: Record<typeof health.band, string> = {
      tranquil: 'rgba(90,160,255,0.16)',
      balanced: 'rgba(90,220,170,0.14)',
      focused: 'rgba(255,200,80,0.16)',
      intense: 'rgba(255,120,60,0.18)',
      strained: 'rgba(190,120,255,0.18)'
    }
    return hues[health.band]
  }, [health.band])

  const day = 1 - mood.nightness

  return (
    <div
      className={`living-scene ${lowPower ? 'low-power' : ''}`}
      style={
        {
          '--idle-scale': String(idleScale),
          '--cam-x': `${cam.x}px`,
          '--cam-y': `${cam.y}px`,
          '--yaw': String(cam.yaw),
          '--pitch': String(cam.pitch),
          '--mood-tint': tint,
          '--night': String(mood.nightness),
          '--day': String(day),
          '--energy': String(0.35 + mood.load * 0.65),
          '--wind': String(mood.wind),
          '--warmth': String(mood.heat),
          '--load': String(mood.load),
          '--rain': String(weather.rain),
          '--heat': String(mood.heat)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-mood={health.band}
      data-condition={weather.condition}
    >
      <div className="world-stage" aria-hidden={false}>
        <div className="plate-strip">
          <img className="scene-plate" src={landscape} alt="" draggable={false} />
          <img className="scene-plate" src={landscape} alt="" draggable={false} />
          <img className="scene-plate" src={landscape} alt="" draggable={false} />
        </div>
        <SceneErrorBoundary>
          <LivingWorldCanvas
            state={state}
            mood={mood}
            yaw={cam.yaw}
            pointer={{
              nx: cam.pointerNx,
              ny: cam.pointerNy,
              inside: cam.pointerInside
            }}
            lowPower={lowPower}
          />
        </SceneErrorBoundary>
        <div className="day-night-veil" />
        <div className="mood-wash" />
      </div>
      <div className="scene-vignette" aria-hidden />
      <MoodDebugPanel
        mood={mood}
        overrides={overrides}
        onChange={setOverrides}
        lowPower={lowPower}
        onLowPower={setLowPower}
      />
      <div className="edge-hint" aria-hidden>
        Edge-pan · Alt-drag · cursor breeze on grass · mood debug
      </div>
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Living · heat {Math.round(mood.heat * 100)} · load {Math.round(mood.load * 100)} · night{' '}
        {Math.round(mood.nightness * 100)} · wind {Math.round(mood.wind * 100)} · CPU{' '}
        {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
