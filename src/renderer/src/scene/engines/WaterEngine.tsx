import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  wind: number
  day: number
  motion: boolean
}

/**
 * Soft living lake surface — animated ripple/caustic shader over the plate lake.
 * Uses a WebGL engine instead of scanline/CSS hacks.
 */
export function WaterEngine({ wind, day, motion }: Props): React.JSX.Element {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: wind },
      uDay: { value: day }
    }),
    []
  )

  useFrame((_, dt) => {
    if (!mat.current) return
    if (motion) mat.current.uniforms.uTime.value += dt
    mat.current.uniforms.uWind.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uWind.value,
      wind,
      0.06
    )
    mat.current.uniforms.uDay.value = THREE.MathUtils.lerp(mat.current.uniforms.uDay.value, day, 0.06)
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
varying vec2 vUv;
varying float vRipple;

void main() {
  vUv = uv;
  vec3 p = position;
  float w = 0.4 + uWind * 1.6;
  float r1 = sin(uv.x * 18.0 + uTime * (1.2 + uWind)) * 0.012 * w;
  float r2 = sin(uv.y * 14.0 - uTime * 0.9 + uv.x * 6.0) * 0.01 * w;
  p.z += r1 + r2;
  vRipple = r1 + r2;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uDay;
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
  vec3 col = mix(deep, lit, 0.35 + uDay * 0.35 + caustic * 0.25);
  col = mix(col, highlight, smoothstep(0.65, 1.0, caustic) * (0.15 + uWind * 0.2));

  float alpha = mask * (0.22 + uDay * 0.12 + uWind * 0.08);
  gl_FragColor = vec4(col, alpha);
}
`
