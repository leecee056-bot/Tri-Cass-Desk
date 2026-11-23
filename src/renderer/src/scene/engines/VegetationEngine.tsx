import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  pointer: { nx: number; ny: number; inside: boolean }
  motion: boolean
  lowPower: boolean
}

/**
 * Instanced grass field — wind + local cursor gust.
 * Original MIT desk code; technique inspired by common instanced grass demos
 * without vendoring third-party sources.
 */
export function VegetationEngine({
  mood,
  pointer,
  motion,
  lowPower
}: Props): React.JSX.Element {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const count = lowPower ? 420 : 1100
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { offsets, scales } = useMemo(() => {
    const offsetsArr = new Float32Array(count * 3)
    const scalesArr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      offsetsArr[i * 3] = (Math.random() - 0.5) * 9.5
      offsetsArr[i * 3 + 1] = -1.15 + Math.random() * 0.08
      offsetsArr[i * 3 + 2] = -0.2 - Math.random() * 3.8
      scalesArr[i] = 0.55 + Math.random() * 0.9
    }
    return { offsets: offsetsArr, scales: scalesArr }
  }, [count])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      dummy.position.set(offsets[i * 3]!, offsets[i * 3 + 1]!, offsets[i * 3 + 2]!)
      dummy.scale.set(1, scales[i]!, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [count, offsets, scales, dummy])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWind: { value: mood.wind },
      uHeat: { value: mood.heat },
      uGust: { value: 0 },
      uGustPos: { value: new THREE.Vector2(0, -1) }
    }),
    []
  )

  useFrame((state) => {
    if (!mat.current) return
    if (motion) mat.current.uniforms.uTime.value = state.clock.elapsedTime
    mat.current.uniforms.uWind.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uWind.value,
      mood.wind,
      0.08
    )
    mat.current.uniforms.uHeat.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uHeat.value,
      mood.heat,
      0.08
    )
    const gustX = (pointer.nx - 0.5) * 9
    const gustZ = -0.4 - pointer.ny * 3.2
    const strength = pointer.inside ? 0.35 + mood.activity * 0.45 : 0
    mat.current.uniforms.uGust.value = THREE.MathUtils.lerp(
      mat.current.uniforms.uGust.value,
      strength,
      0.12
    )
    mat.current.uniforms.uGustPos.value.set(gustX, gustZ)
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[0.06, 0.55, 1, 4]} />
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </instancedMesh>
  )
}

const VERT = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uGust;
uniform vec2 uGustPos;
varying float vH;
varying float vShade;

void main() {
  vH = uv.y;
  mat4 im = instanceMatrix;
  vec3 ip = vec3(im[3][0], im[3][1], im[3][2]);
  float bend = (0.15 + uWind * 0.55) * uv.y * uv.y;
  float sway = sin(uTime * (1.4 + uWind * 2.2) + ip.x * 2.1 + ip.z * 1.7) * bend;
  float dist = length(ip.xz - uGustPos);
  float gust = uGust * exp(-dist * dist * 0.35) * uv.y * uv.y;
  vec3 p = position;
  p.x += sway * 0.35 + gust * 0.55;
  p.z += sway * 0.12 + gust * 0.2;
  vShade = 0.55 + uv.y * 0.45;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uHeat;
varying float vH;
varying float vShade;

void main() {
  vec3 cool = vec3(0.18, 0.42, 0.22);
  vec3 tip = vec3(0.45, 0.72, 0.28);
  vec3 warm = vec3(0.55, 0.48, 0.18);
  vec3 col = mix(cool, tip, vH);
  col = mix(col, warm, uHeat * 0.35);
  float a = smoothstep(0.0, 0.08, vH) * (0.55 + vShade * 0.35);
  gl_FragColor = vec4(col, a);
}
`
