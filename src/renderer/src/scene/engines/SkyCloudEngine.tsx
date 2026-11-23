import { Cloud, Clouds, Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import cloudTextureUrl from '../../assets/drei-cloud.png'

type Props = {
  state: EnvironmentState
  mood: MoodState
  yaw: number
  lowPower: boolean
}

/**
 * Overlay sky engines (drei Clouds + Stars) + atmosphere wash — driven by shared mood.
 */
export function SkyCloudEngine({ state, mood, yaw, lowPower }: Props): React.JSX.Element {
  const { weather, userPreferences } = state
  const cloudGroup = useRef<THREE.Group>(null)
  const atmosMat = useRef<THREE.ShaderMaterial>(null)
  const day = 1 - mood.nightness
  const night = mood.nightness

  const atmosUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDay: { value: day },
      uNight: { value: night },
      uWarmth: { value: mood.heat },
      uEnergy: { value: mood.load },
      uWind: { value: mood.wind }
    }),
    []
  )

  useFrame((_, dt) => {
    if (userPreferences.motion !== 'off') {
      if (cloudGroup.current) {
        cloudGroup.current.position.x += dt * (0.05 + mood.wind * 0.35 + mood.load * 0.12)
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
      u.uWarmth.value = THREE.MathUtils.lerp(u.uWarmth.value, mood.heat, 0.05)
      u.uEnergy.value = THREE.MathUtils.lerp(u.uEnergy.value, mood.load, 0.05)
      u.uWind.value = THREE.MathUtils.lerp(u.uWind.value, mood.wind, 0.05)
    }
  })

  const showStars = userPreferences.celestialEffects && night > 0.18 && !lowPower
  const showClouds =
    userPreferences.weatherEffects && (weather.cloudCover > 0.04 || mood.load > 0.25) && !lowPower
  const cloudOpacity = 0.2 + Math.max(weather.cloudCover, mood.load * 0.45) * 0.55
  const cloudSpeed = 0.1 + mood.wind * 0.55 + mood.load * 0.25
  // Warm tint when heat high
  const cloudColor = new THREE.Color().setHSL(
    THREE.MathUtils.lerp(0.58, 0.08, mood.heat * 0.85),
    0.15 + mood.heat * 0.25,
    0.82 - mood.heat * 0.12
  )

  const starCount = lowPower
    ? 800
    : Math.floor(1800 + night * 3200 + (1 - mood.activity) * 800)

  void yaw

  return (
    <>
      <ambientLight intensity={0.4 + day * 0.4 - mood.heat * 0.05} />
      <directionalLight
        position={[4 - day * 2, 2 + day * 4, 3]}
        intensity={0.35 + day * 0.85}
        color={mood.heat > 0.45 ? '#ffb07a' : day > 0.35 ? '#fff6e8' : '#ff9b5c'}
      />

      <mesh position={[0, 1.6, -5]} scale={[12, 5.5, 1]} renderOrder={0}>
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
          count={starCount}
          factor={2.4 + night}
          saturation={0}
          fade
          speed={0.15 + mood.load * 0.4}
        />
      ) : null}

      {showClouds ? (
        <group ref={cloudGroup} position={[0, 2.35, -5.5]}>
          <Clouds material={THREE.MeshLambertMaterial} limit={lowPower ? 16 : 32} texture={cloudTextureUrl}>
            <Cloud
              segments={lowPower ? 18 : 30}
              bounds={[9, 1.7, 1.5]}
              volume={7 + Math.max(weather.cloudCover, mood.load) * 12}
              color={cloudColor}
              fade={45}
              speed={cloudSpeed}
              opacity={cloudOpacity}
              position={[-2.8, 0.15, 0]}
            />
            <Cloud
              segments={lowPower ? 14 : 26}
              bounds={[8, 1.5, 1.3]}
              volume={6 + Math.max(weather.cloudCover, mood.load) * 10}
              color={cloudColor.clone().offsetHSL(0, 0, -0.05)}
              fade={55}
              speed={cloudSpeed * 0.85}
              opacity={cloudOpacity * 0.92}
              position={[3.4, -0.05, 0.35]}
            />
            <Cloud
              segments={lowPower ? 12 : 22}
              bounds={[6, 1.2, 1.1]}
              volume={4.5 + weather.fog * 7 + mood.load * 3}
              color={cloudColor.clone().offsetHSL(0.02, 0, -0.08)}
              fade={65}
              speed={cloudSpeed * 1.15}
              opacity={0.18 + weather.fog * 0.35 + mood.load * 0.15}
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
  vec3 warmCol = vec3(0.95, 0.45, 0.18);
  vec3 stormCol = vec3(0.22, 0.28, 0.4);
  vec3 base = mix(nightCol, dayCol, uDay);
  base = mix(base, stormCol, uEnergy * 0.35 * uDay);
  base = mix(base, warmCol, uWarmth * (0.35 + (1.0 - abs(uDay - 0.4)) * 0.5));
  float band = smoothstep(0.15, 0.85, vUv.y);
  float sweep = 0.55 + 0.45 * sin(drift * 6.28318 + vUv.y * 2.0);
  float a = band * (0.12 + uNight * 0.24 + uWarmth * 0.1 + uEnergy * 0.08) * sweep;
  gl_FragColor = vec4(base, a);
}
`
