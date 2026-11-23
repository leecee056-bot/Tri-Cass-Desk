import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  pointer: { nx: number; ny: number; inside: boolean }
  motion: boolean
  lowPower: boolean
  sunDir: THREE.Vector3
}

/**
 * Shoreline grass — thin GPU-instanced blades.
 * Technique adapted from GrassSystemThreeJS (MIT © mohamedachrefelouafi).
 * Kept on near shore only so the lake stays visible.
 */
export function VegetationEngine({
  mood,
  pointer,
  motion,
  lowPower,
  sunDir
}: Props): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)
  const maxCount = lowPower ? 5000 : 16000

  const { geometry, uniforms } = useMemo(() => {
    const segments = 5
    const positions: number[] = []
    const indices: number[] = []
    for (let j = 0; j <= segments; j++) {
      const t = j / segments
      positions.push(-0.5, t, 0, 0.5, t, 0)
      if (j < segments) {
        const a = j * 2
        indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
      }
    }
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)

    const iPos = new Float32Array(maxCount * 2)
    const iYaw = new Float32Array(maxCount)
    const iHeight = new Float32Array(maxCount)
    const iWidth = new Float32Array(maxCount)
    const iPhase = new Float32Array(maxCount)
    const iCurlVar = new Float32Array(maxCount)
    const iColorVar = new Float32Array(maxCount)

    // Shore band: near camera (+Z) and sides of lake — not covering the water plane
    for (let i = 0; i < maxCount; i++) {
      const side = Math.random()
      let x: number
      let z: number
      if (side < 0.55) {
        // Front meadow
        x = (Math.random() - 0.5) * 28
        z = 2 + Math.random() * 10
      } else if (side < 0.78) {
        // Left bank
        x = -10 - Math.random() * 8
        z = -10 + Math.random() * 16
      } else {
        // Right bank
        x = 10 + Math.random() * 8
        z = -10 + Math.random() * 16
      }
      iPos[i * 2] = x
      iPos[i * 2 + 1] = z
      iYaw[i] = Math.random() * Math.PI * 2
      iHeight[i] = 0.55 + Math.random() * 0.55
      iWidth[i] = 0.7 + Math.random() * 0.45
      iPhase[i] = Math.random() * Math.PI * 2
      iCurlVar[i] = 0.55 + Math.random() * 0.8
      iColorVar[i] = Math.random()
    }
    geometry.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 2))
    geometry.setAttribute('iYaw', new THREE.InstancedBufferAttribute(iYaw, 1))
    geometry.setAttribute('iHeight', new THREE.InstancedBufferAttribute(iHeight, 1))
    geometry.setAttribute('iWidth', new THREE.InstancedBufferAttribute(iWidth, 1))
    geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(iPhase, 1))
    geometry.setAttribute('iCurlVar', new THREE.InstancedBufferAttribute(iCurlVar, 1))
    geometry.setAttribute('iColorVar', new THREE.InstancedBufferAttribute(iColorVar, 1))
    geometry.instanceCount = Math.floor(maxCount * (lowPower ? 0.4 : 0.7))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 2), 40)

    const uniforms = {
      uTime: { value: 0 },
      uCurl: { value: 0.85 },
      uHeight: { value: 0.55 },
      uWidth: { value: 0.028 },
      uWindDir: { value: new THREE.Vector2(1, 0.35).normalize() },
      uWindStrength: { value: 0.35 },
      uWindSpeed: { value: 1.2 },
      uWindScale: { value: 0.35 },
      uGust: { value: 0.4 },
      uCursorGust: { value: 0 },
      uCursorPos: { value: new THREE.Vector2(0, 6) },
      uColorBase: { value: new THREE.Color(0x2a3a18) },
      uColorTip: { value: new THREE.Color(0x8fbf45) },
      uColorVarAmt: { value: 0.35 },
      uHeat: { value: 0 },
      uSunDir: { value: new THREE.Vector3(1, 1, 1) }
    }

    return { geometry, uniforms }
  }, [maxCount, lowPower])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide
      }),
    [uniforms]
  )

  useFrame((state) => {
    if (motion) uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uWindStrength.value = THREE.MathUtils.lerp(
      uniforms.uWindStrength.value,
      0.2 + mood.wind * 0.85,
      0.08
    )
    uniforms.uGust.value = THREE.MathUtils.lerp(uniforms.uGust.value, 0.25 + mood.wind * 0.65, 0.08)
    uniforms.uHeat.value = THREE.MathUtils.lerp(uniforms.uHeat.value, mood.heat, 0.08)
    uniforms.uSunDir.value.copy(sunDir)
    const cx = (pointer.nx - 0.5) * 24
    const cz = 12 - pointer.ny * 14
    uniforms.uCursorPos.value.set(cx, cz)
    uniforms.uCursorGust.value = THREE.MathUtils.lerp(
      uniforms.uCursorGust.value,
      pointer.inside ? 0.5 + mood.activity * 0.4 : 0,
      0.12
    )
    uniforms.uColorTip.value.setRGB(
      THREE.MathUtils.lerp(0.56, 0.72, mood.heat),
      THREE.MathUtils.lerp(0.75, 0.52, mood.heat),
      THREE.MathUtils.lerp(0.27, 0.18, mood.heat)
    )
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
}

const VERT = /* glsl */ `
attribute vec2  iPos;
attribute float iYaw;
attribute float iHeight;
attribute float iWidth;
attribute float iPhase;
attribute float iCurlVar;
attribute float iColorVar;
uniform float uTime;
uniform float uCurl;
uniform float uHeight;
uniform float uWidth;
uniform vec2  uWindDir;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform float uWindScale;
uniform float uGust;
uniform float uCursorGust;
uniform vec2  uCursorPos;
varying float vT;
varying float vColorVar;

void main() {
  float t = position.y;
  float side = position.x;
  float h = uHeight * iHeight;
  float w = uWidth * iWidth * (1.0 - t) * (0.7 + 0.3 * (1.0 - t));
  float A = uCurl * iCurlVar;
  float yA = abs(A) > 0.001 ? h * sin(A * t) / A : h * t;
  float zA = abs(A) > 0.001 ? h * (1.0 - cos(A * t)) / A : 0.0;
  vec3 pLocal = vec3(side * w, yA, zA);
  float cy = cos(iYaw), sy = sin(iYaw);
  vec3 pR = vec3(pLocal.x * cy + pLocal.z * sy, pLocal.y, -pLocal.x * sy + pLocal.z * cy);
  float gph = dot(iPos, uWindDir) * uWindScale + uTime * uWindSpeed + iPhase;
  float gust = sin(gph) * 0.6 + sin(gph * 0.5 + 1.7) * 0.4;
  float flutter = sin(uTime * 8.0 + iPhase * 3.0) * 0.15 * uGust;
  float sway = (gust + flutter) * uWindStrength;
  vec2 windOff = uWindDir * sway * (t * t);
  float dist = length(iPos - uCursorPos);
  float cGust = uCursorGust * exp(-dist * dist * 0.06) * (t * t);
  windOff += normalize(iPos - uCursorPos + vec2(0.001)) * cGust * 0.5;
  vec3 gPos = vec3(iPos.x + pR.x + windOff.x, pR.y, iPos.y + pR.z + windOff.y);
  vT = t;
  vColorVar = iColorVar;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(gPos, 1.0);
}
`

const FRAG = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorTip;
uniform float uColorVarAmt;
uniform float uHeat;
uniform vec3 uSunDir;
varying float vT;
varying float vColorVar;
void main() {
  vec3 gcol = mix(uColorBase, uColorTip, vT);
  gcol *= mix(1.0 - uColorVarAmt, 1.0 + uColorVarAmt, vColorVar);
  gcol *= mix(0.55, 1.0, smoothstep(0.0, 0.35, vT));
  gcol = mix(gcol, vec3(0.55, 0.42, 0.18), uHeat * 0.25 * vT);
  float lit = 0.7 + 0.3 * clamp(uSunDir.y, 0.0, 1.0);
  gl_FragColor = vec4(gcol * lit, 1.0);
}
`
