import { useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { MoodOverrides } from '../../../shared/mood'
import { LiteLivingBackdrop } from './engines/LiteLivingBackdrop'
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
 * Living companion — interactive Three.js lakeside when enabled, else themed wallpaper.
 * CPU-heavy systeminformation polling was removed (that pegged Windows at ~100%).
 * WebGL stays behind an error boundary so a GPU failure falls back to wallpaper.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const want3d = state.userPreferences.livingWorld3d !== false
  const motionOn = state.userPreferences.motion !== 'off'
  const cam = useSceneCamera(want3d && motionOn)
  const [overrides, setOverrides] = useState<MoodOverrides>({})
  const [lowPower, setLowPower] = useState(
    () => state.userPreferences.motion !== 'full'
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

  const wallpaper = <LiteLivingBackdrop state={state} mood={mood} />

  return (
    <div
      className={`living-scene living-scene-3d ${lowPower ? 'low-power' : ''} ${want3d ? '' : 'living-scene-lite'}`}
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
        {want3d ? (
          <SceneErrorBoundary fallback={wallpaper}>
            <LivingWorldCanvas
              state={state}
              mood={mood}
              yaw={cam.yaw}
              pointer={{
                nx: cam.pointerNx,
                ny: cam.pointerNy,
                inside: cam.pointerInside
              }}
              lowPower={lowPower || state.userPreferences.motion !== 'full'}
            />
          </SceneErrorBoundary>
        ) : (
          wallpaper
        )}
        <div className="mood-wash soft" />
        {!want3d ? <div className="scene-vignette" /> : null}
      </div>
      {want3d ? (
        <MoodDebugPanel
          mood={mood}
          overrides={overrides}
          onChange={setOverrides}
          lowPower={lowPower}
          onLowPower={setLowPower}
        />
      ) : null}
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        {want3d ? 'Living 3D' : (state.userPreferences.deskTheme ?? 'nature')} · {health.band} ·
        load {Math.round(mood.load * 100)} · CPU {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
