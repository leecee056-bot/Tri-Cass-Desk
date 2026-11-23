import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  strength: number
  energy: number
  visible: boolean
}

/**
 * Living northern-lights curtains — WebGL noise aurora (not fake CSS bands).
 * Strength/energy come from celestial + system telemetry.
 */
export function AuroraEngine({ strength, energy, visible }: Props): React.JSX.Element | null {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStrength: { value: strength },
      uEnergy: { value: energy }
    }),
    []
  )

  useFrame((_, dt) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value += dt * (0.35 + energy * 0.8)
    mat.current.uniforms.uStrength.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uStrength.value,
      strength,
      0.08
    )
    mat.current.uniforms.uEnergy.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uEnergy.value,
      energy,
      0.08
    )
  })

  if (!visible || strength < 0.02) return null

  return (
    <mesh position={[0, 1.35, -4]} scale={[9.5, 3.2, 1]} renderOrder={2}>
      <planeGeometry args={[1, 1, 1, 1]} />
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
uniform float uStrength;
uniform float uEnergy;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;
  float curtain = fbm(vec2(uv.x * 3.2 + t * 0.15, uv.y * 1.4 + t * 0.05));
  float wave = fbm(vec2(uv.x * 6.0 - t * 0.35, uv.y * 2.5 + curtain));
  float band = smoothstep(0.25, 0.75, wave) * smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.45, uv.y);
  float edge = smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  float a = band * edge * (0.22 + uStrength * 0.85) * (0.55 + uEnergy * 0.35);

  vec3 green = vec3(0.25, 0.95, 0.55);
  vec3 violet = vec3(0.45, 0.2, 0.95);
  vec3 cyan = vec3(0.2, 0.75, 1.0);
  vec3 col = mix(green, violet, curtain);
  col = mix(col, cyan, wave * 0.45);

  gl_FragColor = vec4(col * a, a);
}
`
