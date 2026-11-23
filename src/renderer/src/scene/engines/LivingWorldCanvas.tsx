import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import type { EnvironmentState } from '../../../../shared/environment'
import { AuroraEngine } from './AuroraEngine'
import { CelestialEngine } from './CelestialEngine'
import { SkyCloudEngine } from './SkyCloudEngine'
import { WaterEngine } from './WaterEngine'
import { WeatherEngine } from './WeatherEngine'

type Props = {
  state: EnvironmentState
  energy: number
  night: number
  day: number
  wind: number
  yaw: number
}

/**
 * Three.js + drei living layer: sky, clouds, stars, sun/moon, weather, aurora, water.
 */
export function LivingWorldCanvas({
  state,
  energy,
  night,
  day,
  wind,
  yaw
}: Props): React.JSX.Element {
  const motion = state.userPreferences.motion !== 'off'
  const auroraStrength =
    Math.max(state.celestial.aurora, state.system.cpuLoad * 0.45) * Math.max(night, 0.2)
  const showAurora = state.userPreferences.celestialEffects && (night > 0.1 || auroraStrength > 0.08)
  const weatherOn = state.userPreferences.weatherEffects

  return (
    <div className="living-canvas-host" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.2, 6.4], fov: 40, near: 0.1, far: 200 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          premultipliedAlpha: true
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <SkyCloudEngine
            state={state}
            energy={energy}
            night={night}
            day={day}
            wind={wind}
            warmth={state.weather.skyWarmth}
          />
          {state.userPreferences.celestialEffects ? (
            <CelestialEngine
              day={day}
              night={night}
              moonGlow={state.celestial.moonGlow}
              energy={energy}
              yawDeg={yaw}
            />
          ) : null}
          <AuroraEngine strength={auroraStrength} energy={energy} visible={showAurora} />
          <WaterEngine wind={wind} day={day} motion={motion} />
          {weatherOn ? (
            <WeatherEngine
              rain={state.weather.rain}
              wind={wind}
              fog={state.weather.fog}
              motion={motion}
            />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  )
}
