import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import type { EnvironmentState } from '../../../../shared/environment'
import { AuroraEngine } from './AuroraEngine'
import { SkyCloudEngine } from './SkyCloudEngine'
import { WaterEngine } from './WaterEngine'

type Props = {
  state: EnvironmentState
  energy: number
  night: number
  day: number
  wind: number
}

/**
 * Three.js + drei living layer over the Earthbound plate.
 * Clouds/stars from drei; aurora + lake from WebGL engines; all telemetry-driven.
 */
export function LivingWorldCanvas({ state, energy, night, day, wind }: Props): React.JSX.Element {
  const motion = state.userPreferences.motion !== 'off'
  const auroraStrength =
    Math.max(state.celestial.aurora, state.system.cpuLoad * 0.45) * Math.max(night, 0.2)
  const showAurora = state.userPreferences.celestialEffects && (night > 0.1 || auroraStrength > 0.08)

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
          <AuroraEngine strength={auroraStrength} energy={energy} visible={showAurora} />
          <WaterEngine wind={wind} day={day} motion={motion} />
        </Suspense>
      </Canvas>
    </div>
  )
}
