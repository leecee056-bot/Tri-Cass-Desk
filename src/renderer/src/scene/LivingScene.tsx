import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { MoodOverrides } from '../../../shared/mood'
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
 * Living companion world — real-time Three.js scene (Sky / Water / grass OSS stack)
 * with shared mood lerp. Windows stay fixed; edge-pan yaws the world slightly.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const cam = useSceneCamera(state.userPreferences.motion !== 'off')
  const [overrides, setOverrides] = useState<MoodOverrides>({})
  const [lowPower, setLowPower] = useState(
    () => state.userPreferences.motion === 'reduced' || state.userPreferences.motion === 'off'
  )
  const { mood } = useMoodState(state, overrides)
  const { solar, weather, system, health } = state

  const tint = useMemo(() => {
    const hues: Record<typeof health.band, string> = {
      tranquil: 'rgba(90,160,255,0.1)',
      balanced: 'rgba(90,220,170,0.08)',
      focused: 'rgba(255,200,80,0.1)',
      intense: 'rgba(255,120,60,0.12)',
      strained: 'rgba(190,120,255,0.1)'
    }
    return hues[health.band]
  }, [health.band])

  return (
    <div
      className={`living-scene living-scene-3d ${lowPower ? 'low-power' : ''}`}
      style={
        {
          '--mood-tint': tint,
          '--night': String(mood.nightness),
          '--day': String(1 - mood.nightness),
          '--heat': String(mood.heat),
          '--load': String(mood.load),
          '--wind': String(mood.wind)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-mood={health.band}
      data-condition={weather.condition}
    >
      <div className="world-stage world-stage-3d">
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
        <div className="mood-wash soft" />
      </div>
      <MoodDebugPanel
        mood={mood}
        overrides={overrides}
        onChange={setOverrides}
        lowPower={lowPower}
        onLowPower={setLowPower}
      />
      <div className="edge-hint" aria-hidden>
        Edge-pan · Alt-drag · cursor breeze · mood debug
      </div>
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Living 3D · heat {Math.round(mood.heat * 100)} · load {Math.round(mood.load * 100)} · night{' '}
        {Math.round(mood.nightness * 100)} · wind {Math.round(mood.wind * 100)} · CPU{' '}
        {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
