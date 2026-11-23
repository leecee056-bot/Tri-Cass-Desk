import { Cloud, Clouds, Sky, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import cloudTextureUrl from '../../assets/drei-cloud.png'

type Props = {
  state: EnvironmentState
  mood: MoodState
  lowPower: boolean
}

/**
 * Layer: sky + day/night + clouds + stars.
 * Reuses drei Sky (three.js Sky addon / three-stdlib) + Clouds + Stars — MIT.
 */
export function SkyCloudEngine({ state, mood, lowPower }: Props): React.JSX.Element {
  const cloudGroup = useRef<THREE.Group>(null)
  const day = 1 - mood.nightness
  // Map nightness/heat → sun inclination (0.5 ≈ horizon, ~0.15 night-ish)
  const inclination = THREE.MathUtils.lerp(0.49, 0.14, mood.nightness)
  const turbidity = 1.6 + mood.heat * 6 + mood.load * 3
  const rayleigh = 0.8 + day * 2.6 + mood.heat * 1.2
  const sunPosition = useMemo(() => {
    const v = new THREE.Vector3()
    const theta = Math.PI * (inclination - 0.5)
    const phi = 2 * Math.PI * (0.25 - 0.5)
    v.x = Math.cos(phi)
    v.y = Math.sin(theta)
    v.z = Math.sin(phi)
    return v
  }, [inclination])

  useFrame((_, dt) => {
    if (state.userPreferences.motion === 'off' || !cloudGroup.current) return
    cloudGroup.current.rotation.y += dt * (0.01 + mood.wind * 0.04 + mood.load * 0.02)
  })

  const showStars = state.userPreferences.celestialEffects && mood.nightness > 0.35
  const showClouds =
    state.userPreferences.weatherEffects && !lowPower && (mood.load > 0.12 || mood.wind > 0.15)
  const warmCloud = new THREE.Color().setHSL(
    THREE.MathUtils.lerp(0.55, 0.08, mood.heat),
    0.12 + mood.heat * 0.3,
    0.78 - mood.heat * 0.1
  )

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={inclination}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
        rayleigh={rayleigh}
        turbidity={turbidity}
      />

      {/* Lower ambient so tree/rock shadows read; key tinted by sunset/heat */}
      <ambientLight intensity={0.28 + day * 0.32} />
      <hemisphereLight
        args={[
          mood.heat > 0.45 || mood.nightness > 0.35 ? '#ffd0a8' : '#c8e4ff',
          '#2a3a20',
          0.38 + day * 0.35
        ]}
      />
      <directionalLight
        castShadow
        shadow-mapSize-width={lowPower ? 512 : 1024}
        shadow-mapSize-height={lowPower ? 512 : 1024}
        shadow-camera-near={2}
        shadow-camera-far={90}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.0004}
        position={[sunPosition.x * 42, Math.max(8, sunPosition.y * 48), sunPosition.z * 42]}
        intensity={0.85 + day * 1.35}
        color={
          mood.heat > 0.4 || (mood.nightness > 0.25 && mood.nightness < 0.7)
            ? '#ffb070'
            : '#fff8e8'
        }
      />
      <directionalLight
        position={[-18, 12, 10]}
        intensity={0.15 + day * 0.22}
        color={mood.nightness > 0.5 ? '#6a90c8' : '#a8d8ff'}
      />

      {showStars ? (
        <Stars
          radius={200}
          depth={60}
          count={lowPower ? 900 : Math.floor(2500 + mood.nightness * 3500)}
          factor={3 + mood.nightness}
          saturation={0}
          fade
          speed={0.15 + mood.load * 0.3}
        />
      ) : null}

      {showClouds ? (
        <group ref={cloudGroup} position={[0, 36, -70]}>
          <Clouds material={THREE.MeshLambertMaterial} limit={lowPower ? 10 : 20} texture={cloudTextureUrl}>
            <Cloud
              seed={1}
              segments={lowPower ? 14 : 24}
              bounds={[50, 10, 14]}
              volume={22 + mood.load * 18}
              color={warmCloud}
              fade={100}
              speed={0.12 + mood.wind * 0.4}
              opacity={0.3 + mood.load * 0.28}
              position={[-16, 4, 0]}
            />
            <Cloud
              seed={2}
              segments={lowPower ? 12 : 20}
              bounds={[40, 8, 12]}
              volume={16 + mood.load * 14}
              color={warmCloud.clone().offsetHSL(0, 0, -0.06)}
              fade={110}
              speed={0.1 + mood.wind * 0.35}
              opacity={0.24 + mood.load * 0.25}
              position={[20, 2, 6]}
            />
          </Clouds>
        </group>
      ) : null}
    </>
  )
}
