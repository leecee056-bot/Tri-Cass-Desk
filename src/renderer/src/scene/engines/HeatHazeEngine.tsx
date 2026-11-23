import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  heat: number
  motion: boolean
  lowPower: boolean
}

/** Subtle heat shimmer when machine temperature pressure is high. */
export function HeatHazeEngine({ heat, motion, lowPower }: Props): React.JSX.Element | null {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeat: { value: heat }
    }),
    []
  )

  useFrame((_, dt) => {
    if (!mat.current) return
    if (motion) mat.current.uniforms.uTime.value += dt
    mat.current.uniforms.uHeat.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uHeat.value,
      heat,
      0.08
    )
  })

  if (lowPower || heat < 0.35) return null

  return (
    <mesh position={[0, -0.2, -1.6]} scale={[10, 2.4, 1]} renderOrder={6}>
      <planeGeometry />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  )
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uHeat;
varying vec2 vUv;

void main() {
  float w = sin(vUv.x * 40.0 + uTime * 3.0) * sin(vUv.y * 18.0 - uTime * 2.2);
  float band = smoothstep(0.05, 0.45, vUv.y) * smoothstep(0.95, 0.55, vUv.y);
  float a = band * max(0.0, uHeat - 0.3) * 0.22 * (0.5 + 0.5 * w);
  vec3 col = vec3(1.0, 0.55, 0.25);
  gl_FragColor = vec4(col * a, a);
}
`
