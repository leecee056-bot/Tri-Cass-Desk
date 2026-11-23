import { Cloud, Clouds, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentState } from '../../../../shared/environment'

type Props = {
  state: EnvironmentState
  energy: number
  night: number
  day: number
  wind: number
  warmth: number
}

/**
 * Overlay sky engines (drei Clouds + Stars) + drifting atmosphere plane.
 * Kept transparent so the Earthbound plate stays the terrain — sky moves over it.
 */
export function SkyCloudEngine({
  state,
  energy,
  night,
  day,
  wind,
  warmth
}: Props): React.JSX.Element {
  const { weather, celestial, userPreferences } = state
  const cloudGroup = useRef<THREE.Group>(null)
  const atmos = useRef<THREE.Mesh>(null)
  const atmosMat = useRef<THREE.ShaderMaterial>(null)

  const atmosUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDay: { value: day },
      uNight: { value: night },
      uWarmth: { value: warmth },
      uEnergy: { value: energy },
      uWind: { value: wind }
    }),
    []
  )

  useFrame((_, dt) => {
    if (userPreferences.motion !== 'off') {
      if (cloudGroup.current) {
        cloudGroup.current.position.x += dt * (0.05 + wind * 0.28)
        if (cloudGroup.current.position.x > 7) cloudGroup.current.position.x = -7
      }
      if (atmosMat.current) {
        atmosMat.current.uniforms.uTime.value += dt
      }
    }
    if (atmosMat.current) {
      const u = atmosMat.current.uniforms
      u.uDay.value = THREE.MathUtils.lerp(u.uDay.value, day, 0.05)
      u.uNight.value = THREE.MathUtils.lerp(u.uNight.value, night, 0.05)
      u.uWarmth.value = THREE.MathUtils.lerp(u.uWarmth.value, warmth, 0.05)
      u.uEnergy.value = THREE.MathUtils.lerp(u.uEnergy.value, energy, 0.05)
      u.uWind.value = THREE.MathUtils.lerp(u.uWind.value, wind, 0.05)
    }
  })

  const showStars = userPreferences.celestialEffects && night > 0.18
  const showClouds = userPreferences.weatherEffects && weather.cloudCover > 0.04
  const cloudOpacity = 0.22 + weather.cloudCover * 0.5
  const cloudSpeed = 0.1 + wind * 0.5 + energy * 0.1

  return (
    <>
      <ambientLight intensity={0.55 + day * 0.35} />
      <directionalLight
        position={[4 - day * 2, 2 + day * 4, 3]}
        intensity={0.4 + day * 0.8}
        color={day > 0.35 ? '#fff6e8' : '#ff9b5c'}
      />

      {/* Moving atmosphere / day-night wash across the sky */}
      <mesh ref={atmos} position={[0, 1.6, -5]} scale={[12, 5.5, 1]} renderOrder={0}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={atmosMat}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          uniforms={atmosUniforms}
          vertexShader={ATMOS_VERT}
          fragmentShader={ATMOS_FRAG}
        />
      </mesh>

      {showStars ? (
        <Stars
          radius={90}
          depth={40}
          count={Math.floor(2400 + celestial.starVisibility * 3000)}
          factor={2.6 + night}
          saturation={0}
          fade
          speed={0.2 + energy * 0.45}
        />
      ) : null}

      {showClouds ? (
        <group ref={cloudGroup} position={[0, 2.35, -5.5]}>
          <Clouds material={THREE.MeshLambertMaterial} limit={32}>
            <Cloud
              segments={30}
              bounds={[9, 1.7, 1.5]}
              volume={7 + weather.cloudCover * 11}
              color="#eef3fb"
              fade={45}
              speed={cloudSpeed}
              opacity={cloudOpacity}
              position={[-2.8, 0.15, 0]}
            />
            <Cloud
              segments={26}
              bounds={[8, 1.5, 1.3]}
              volume={6 + weather.cloudCover * 9}
              color="#d7e0f0"
              fade={55}
              speed={cloudSpeed * 0.85}
              opacity={cloudOpacity * 0.92}
              position={[3.4, -0.05, 0.35]}
            />
            <Cloud
              segments={22}
              bounds={[6, 1.2, 1.1]}
              volume={4.5 + weather.fog * 7}
              color="#c5d0e6"
              fade={65}
              speed={cloudSpeed * 1.15}
              opacity={0.18 + weather.fog * 0.4}
              position={[0.2, 0.5, -0.5]}
            />
          </Clouds>
        </group>
      ) : null}
    </>
  )
}

const ATMOS_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const ATMOS_FRAG = /* glsl */ `
uniform float uTime;
uniform float uDay;
uniform float uNight;
uniform float uWarmth;
uniform float uEnergy;
uniform float uWind;
varying vec2 vUv;

void main() {
  float drift = fract(vUv.x * 0.35 + uTime * (0.015 + uWind * 0.04));
  vec3 nightCol = vec3(0.02, 0.05, 0.14);
  vec3 dayCol = vec3(0.35, 0.55, 0.85);
  vec3 warmCol = vec3(0.95, 0.55, 0.28);
  vec3 base = mix(nightCol, dayCol, uDay);
  base = mix(base, warmCol, uWarmth * (1.0 - abs(uDay - 0.35) * 1.4) * 0.55);
  float band = smoothstep(0.15, 0.85, vUv.y);
  float sweep = 0.55 + 0.45 * sin(drift * 6.28318 + vUv.y * 2.0);
  float a = band * (0.1 + uNight * 0.22 + (1.0 - uDay) * 0.08) * sweep * (0.7 + uEnergy * 0.35);
  gl_FragColor = vec4(base, a);
}
`
