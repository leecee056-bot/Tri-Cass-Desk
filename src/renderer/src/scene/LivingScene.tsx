import { useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import landscape from '../assets/earthbound-landscape.jpg'
import { LivingWorldCanvas } from './engines/LivingWorldCanvas'
import { SceneErrorBoundary } from './engines/SceneErrorBoundary'
import { useSceneCamera } from './useSceneCamera'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Living companion world: edge-pan camera (windows stay fixed) +
 * Three.js/drei engines for sky, clouds, stars, aurora, water —
 * all reactive to local system telemetry.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const cam = useSceneCamera(state.userPreferences.motion !== 'off')
  const { solar, weather, celestial, activity, system, health } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.03
      : activity.workspaceState === 'resting'
        ? 1.015
        : 1

  const mood = useMemo(() => {
    const load = system.cpuLoad
    const day = solar.daylight
    const band = health.band
    const hues: Record<typeof band, string> = {
      tranquil: 'rgba(90,160,255,0.16)',
      balanced: 'rgba(90,220,170,0.14)',
      focused: 'rgba(255,200,80,0.16)',
      intense: 'rgba(255,120,60,0.18)',
      strained: 'rgba(190,120,255,0.18)'
    }
    return {
      tint: hues[band],
      night: 1 - day,
      day,
      energy: 0.35 + load * 0.65 + celestial.aurora * 0.2,
      wind: weather.wind + system.processChurn * 0.35,
      warmth: weather.skyWarmth
    }
  }, [
    health.band,
    system.cpuLoad,
    system.processChurn,
    solar.daylight,
    celestial.aurora,
    weather.wind,
    weather.skyWarmth
  ])

  return (
    <div
      ref={rootRef}
      className="living-scene"
      style={
        {
          '--idle-scale': String(idleScale),
          '--cam-x': `${cam.x}px`,
          '--cam-y': `${cam.y}px`,
          '--mood-tint': mood.tint,
          '--night': String(mood.night),
          '--day': String(mood.day),
          '--energy': String(mood.energy),
          '--wind': String(mood.wind),
          '--warmth': String(mood.warmth),
          '--load': String(system.cpuLoad)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-mood={health.band}
      data-condition={weather.condition}
    >
      <div className="world-stage" aria-hidden={false}>
        <img className="scene-plate" src={landscape} alt="" draggable={false} />
        <SceneErrorBoundary>
          <LivingWorldCanvas
            state={state}
            energy={mood.energy}
            night={mood.night}
            day={mood.day}
            wind={mood.wind}
          />
        </SceneErrorBoundary>
        <div className="day-night-veil" />
        <div className="mood-wash" />
      </div>
      <div className="scene-vignette" aria-hidden />
      <div className="edge-hint" aria-hidden>
        Push cursor to edges to explore
      </div>
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Living · {health.band} · {solar.phase.replaceAll('_', ' ')} · CPU{' '}
        {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
