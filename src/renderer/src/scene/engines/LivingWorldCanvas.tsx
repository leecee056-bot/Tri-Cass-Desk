import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import { AuroraEngine } from './AuroraEngine'
import { CelestialEngine } from './CelestialEngine'
import { HeatHazeEngine } from './HeatHazeEngine'
import { SkyCloudEngine } from './SkyCloudEngine'
import { VegetationEngine } from './VegetationEngine'
import { WaterEngine } from './WaterEngine'
import { WeatherEngine } from './WeatherEngine'

type Props = {
  state: EnvironmentState
  mood: MoodState
  yaw: number
  pointer: { nx: number; ny: number; inside: boolean }
  lowPower: boolean
}

/**
 * Three.js + drei living layer — each engine reads shared mood independently.
 */
export function LivingWorldCanvas({
  state,
  mood,
  yaw,
  pointer,
  lowPower
}: Props): React.JSX.Element {
  const motion = state.userPreferences.motion !== 'off'
  const night = mood.nightness
  const day = 1 - mood.nightness
  const auroraStrength =
    Math.max(state.celestial.aurora, mood.load * 0.55) * Math.max(night, 0.15)
  const showAurora =
    state.userPreferences.celestialEffects &&
    !lowPower &&
    (night > 0.1 || auroraStrength > 0.08)
  const weatherOn = state.userPreferences.weatherEffects && !lowPower

  // Process / churn spike → water ripple flash
  const [spike, setSpike] = useState(0)
  const lastChurn = useRef(state.system.processChurn)
  useEffect(() => {
    const delta = state.system.processChurn - lastChurn.current
    lastChurn.current = state.system.processChurn
    if (delta > 0.08 || state.system.cpuLoad > 0.85) {
      setSpike((s) => Math.min(1, s + 0.55 + delta))
    }
  }, [state.system.processChurn, state.system.cpuLoad, state.system.sampledAt])

  useEffect(() => {
    if (spike <= 0.01) return
    const t = window.setInterval(() => {
      setSpike((s) => Math.max(0, s * 0.86 - 0.02))
    }, 50)
    return () => window.clearInterval(t)
  }, [spike])

  const dpr: [number, number] = lowPower ? [1, 1.1] : [1, 1.75]

  return (
    <div className="living-canvas-host" aria-hidden>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.2, 6.4], fov: 40, near: 0.1, far: 200 }}
        gl={{
          alpha: true,
          antialias: !lowPower,
          powerPreference: lowPower ? 'low-power' : 'high-performance',
          premultipliedAlpha: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <SkyCloudEngine state={state} mood={mood} yaw={yaw} lowPower={lowPower} />
          {state.userPreferences.celestialEffects ? (
            <CelestialEngine
              day={day}
              night={night}
              moonGlow={state.celestial.moonGlow * (0.5 + (1 - mood.activity) * 0.5)}
              energy={mood.load}
              yawDeg={yaw}
            />
          ) : null}
          <AuroraEngine strength={auroraStrength} energy={mood.load} visible={showAurora} />
          <VegetationEngine
            mood={mood}
            pointer={pointer}
            motion={motion}
            lowPower={lowPower}
          />
          <WaterEngine mood={mood} motion={motion} spike={Math.max(spike, (1 - mood.activity) * 0.1)} />
          <HeatHazeEngine heat={mood.heat} motion={motion} lowPower={lowPower} />
          {weatherOn ? (
            <WeatherEngine
              rain={Math.max(state.weather.rain, mood.load > 0.65 ? mood.load * 0.4 : 0)}
              wind={mood.wind}
              fog={Math.max(state.weather.fog, mood.nightness * 0.15 * (1 - mood.activity))}
              motion={motion}
            />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  )
}
