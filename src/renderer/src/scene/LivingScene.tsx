import { useMemo } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { LiteLivingBackdrop } from './engines/LiteLivingBackdrop'
import { useMoodState } from './useMoodState'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Lite living companion — CSS backdrop only (no WebGL / Three.js).
 * Interactive 3D art was removed after v0.2.3 hard-crash reports on low-GPU hosts.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const { mood } = useMoodState(state, {})
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
      className="living-scene living-scene-lite"
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
        <LiteLivingBackdrop state={state} mood={mood} />
        <div className="mood-wash soft" />
        <div className="scene-vignette" />
      </div>
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Lite · {health.band} · heat {Math.round(mood.heat * 100)} · load{' '}
        {Math.round(mood.load * 100)} · night {Math.round(mood.nightness * 100)} · CPU{' '}
        {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
