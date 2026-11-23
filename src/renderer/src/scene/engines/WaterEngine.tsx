import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  motion: boolean
  /** Brief ripple boost from process / activity spikes */
  spike: number
}

/**
 * Soft living lake surface — wind + activity ripples + spike flash.
 */
export function WaterEngine({ mood, motion, spike }: Props): React.JSX.Element {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: mood.wind },
      uDay: { value: 1 - mood.nightness },
      uActivity: { value: mood.activity },
      uSpike: { value: 0 },
      uHeat: { value: mood.heat }
    }),
    []
  )

  useFrame((_, dt) => {
    if (!mat.current) return
    if (motion) mat.current.uniforms.uTime.value += dt * (1 + mood.wind * 0.6)
    const u = mat.current.uniforms
    u.uWind.value = THREE.MathUtils.lerp(u.uWind.value, mood.wind, 0.06)
    u.uDay.value = THREE.MathUtils.lerp(u.uDay.value, 1 - mood.nightness, 0.06)
    u.uActivity.value = THREE.MathUtils.lerp(u.uActivity.value, mood.activity, 0.06)
    u.uHeat.value = THREE.MathUtils.lerp(u.uHeat.value, mood.heat, 0.06)
    u.uSpike.value = THREE.MathUtils.lerp(u.uSpike.value, spike, 0.15)
  })

  return (
    <mesh position={[0, -0.95, -1.2]} rotation={[-0.42, 0, 0]} scale={[5.2, 2.1, 1]} renderOrder={3}>
      <planeGeometry args={[1, 1, 64, 32]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  )
}

const VERT = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uSpike;
uniform float uActivity;
varying vec2 vUv;
varying float vRipple;

void main() {
  vUv = uv;
  vec3 p = position;
  float w = 0.4 + uWind * 1.6 + uSpike * 1.8;
  float r1 = sin(uv.x * 18.0 + uTime * (1.2 + uWind)) * 0.012 * w;
  float r2 = sin(uv.y * 14.0 - uTime * 0.9 + uv.x * 6.0) * 0.01 * w;
  float burst = sin(length(uv - 0.5) * 28.0 - uTime * 6.0) * uSpike * 0.03;
  p.z += r1 + r2 + burst * (0.5 + uActivity);
  vRipple = r1 + r2 + burst;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uDay;
uniform float uSpike;
uniform float uHeat;
varying vec2 vUv;
varying float vRipple;

void main() {
  vec2 uv = vUv;
  float mask = smoothstep(0.0, 0.18, uv.y) * smoothstep(1.0, 0.82, uv.y)
             * smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  float caustic = sin((uv.x + vRipple * 8.0) * 40.0 + uTime * 1.4)
                * sin((uv.y - vRipple * 6.0) * 28.0 - uTime * 1.1);
  caustic = caustic * 0.5 + 0.5;

  vec3 deep = vec3(0.05, 0.12, 0.22);
  vec3 lit = vec3(0.35, 0.62, 0.78);
  vec3 highlight = vec3(0.75, 0.9, 1.0);
  vec3 warm = vec3(0.55, 0.4, 0.28);
  vec3 col = mix(deep, lit, 0.35 + uDay * 0.35 + caustic * 0.25);
  col = mix(col, warm, uHeat * 0.2);
  col = mix(col, highlight, smoothstep(0.65, 1.0, caustic) * (0.15 + uWind * 0.2 + uSpike * 0.35));

  float alpha = mask * (0.22 + uDay * 0.12 + uWind * 0.08 + uSpike * 0.12);
  gl_FragColor = vec4(col, alpha);
}
`
