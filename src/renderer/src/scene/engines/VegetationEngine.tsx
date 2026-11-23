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

type LayerKind = 'meadow' | 'reed' | 'flower' | 'clover' | 'fern'

/**
 * Multi-layer shoreline flora — thin GPU-instanced blades.
 * Technique adapted from GrassSystemThreeJS (MIT © mohamedachrefelouafi).
 * Layers: clover undergrowth, meadow, ferns, reeds, wildflowers + shrubs.
 */
export function VegetationEngine(props: Props): React.JSX.Element {
  return (
    <group>
      <BladeLayer kind="clover" {...props} />
      <BladeLayer kind="meadow" {...props} />
      <BladeLayer kind="fern" {...props} />
      <BladeLayer kind="reed" {...props} />
      <BladeLayer kind="flower" {...props} />
      <ShrubClumps lowPower={props.lowPower} mood={props.mood} />
    </group>
  )
}

function BladeLayer({
  kind,
  mood,
  pointer,
  motion,
  lowPower,
  sunDir
}: Props & { kind: LayerKind }): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)
  const cfg = LAYER_CFG[kind]
  const maxCount = lowPower ? cfg.lowCount : cfg.hiCount
  const fill = lowPower ? cfg.lowFill : cfg.hiFill

  const { geometry, uniforms } = useMemo(() => {
    const segments = 6
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

    const rand = mulberry32(cfg.seed)
    for (let i = 0; i < maxCount; i++) {
      const { x, z } = cfg.place(rand)
      iPos[i * 2] = x
      iPos[i * 2 + 1] = z
      iYaw[i] = rand() * Math.PI * 2
      iHeight[i] = 0.45 + rand() * 0.75
      iWidth[i] = 0.55 + rand() * 0.7
      iPhase[i] = rand() * Math.PI * 2
      iCurlVar[i] = 0.4 + rand() * 1.1
      iColorVar[i] = rand()
    }
    geometry.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 2))
    geometry.setAttribute('iYaw', new THREE.InstancedBufferAttribute(iYaw, 1))
    geometry.setAttribute('iHeight', new THREE.InstancedBufferAttribute(iHeight, 1))
    geometry.setAttribute('iWidth', new THREE.InstancedBufferAttribute(iWidth, 1))
    geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(iPhase, 1))
    geometry.setAttribute('iCurlVar', new THREE.InstancedBufferAttribute(iCurlVar, 1))
    geometry.setAttribute('iColorVar', new THREE.InstancedBufferAttribute(iColorVar, 1))
    geometry.instanceCount = Math.floor(maxCount * fill)
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 2), 48)

    const uniforms = {
      uTime: { value: 0 },
      uCurl: { value: cfg.curl },
      uHeight: { value: cfg.heightScale },
      uWidth: { value: cfg.widthScale },
      uWindDir: { value: new THREE.Vector2(1, 0.35).normalize() },
      uWindStrength: { value: 0.35 },
      uWindSpeed: { value: cfg.windSpeed },
      uWindScale: { value: 0.35 },
      uGust: { value: 0.4 },
      uCursorGust: { value: 0 },
      uCursorPos: { value: new THREE.Vector2(0, 6) },
      uColorBase: { value: new THREE.Color(cfg.base) },
      uColorTip: { value: new THREE.Color(cfg.tip) },
      uColorVarAmt: { value: cfg.colorVar },
      uHeat: { value: 0 },
      uSunDir: { value: new THREE.Vector3(1, 1, 1) },
      uFlower: { value: kind === 'flower' ? 1 : 0 },
      uNight: { value: 0 }
    }

    return { geometry, uniforms }
  }, [maxCount, fill, cfg, kind])

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
      0.22 + mood.wind * 0.9,
      0.08
    )
    uniforms.uGust.value = THREE.MathUtils.lerp(uniforms.uGust.value, 0.28 + mood.wind * 0.7, 0.08)
    uniforms.uHeat.value = THREE.MathUtils.lerp(uniforms.uHeat.value, mood.heat, 0.08)
    uniforms.uNight.value = THREE.MathUtils.lerp(uniforms.uNight.value, mood.nightness, 0.08)
    uniforms.uSunDir.value.copy(sunDir)
    const cx = (pointer.nx - 0.5) * 24
    const cz = 12 - pointer.ny * 14
    uniforms.uCursorPos.value.set(cx, cz)
    uniforms.uCursorGust.value = THREE.MathUtils.lerp(
      uniforms.uCursorGust.value,
      pointer.inside ? 0.55 + mood.activity * 0.4 : 0,
      0.12
    )
    if (kind === 'flower') {
      const h = (mood.heat * 0.15 + mood.activity * 0.08) % 1
      uniforms.uColorTip.value.setHSL(0.12 + h * 0.35, 0.88, 0.64)
    } else if (kind === 'clover') {
      uniforms.uColorTip.value.setRGB(
        THREE.MathUtils.lerp(0.35, 0.55, mood.heat),
        THREE.MathUtils.lerp(0.72, 0.48, mood.heat),
        THREE.MathUtils.lerp(0.28, 0.16, mood.heat)
      )
    } else if (kind === 'fern') {
      uniforms.uColorTip.value.setRGB(
        THREE.MathUtils.lerp(0.28, 0.5, mood.heat),
        THREE.MathUtils.lerp(0.55, 0.38, mood.heat),
        THREE.MathUtils.lerp(0.22, 0.14, mood.heat)
      )
    } else if (kind === 'meadow') {
      uniforms.uColorTip.value.setRGB(
        THREE.MathUtils.lerp(0.62, 0.78, mood.heat),
        THREE.MathUtils.lerp(0.86, 0.55, mood.heat),
        THREE.MathUtils.lerp(0.29, 0.18, mood.heat)
      )
    } else {
      uniforms.uColorTip.value.setRGB(
        THREE.MathUtils.lerp(0.72, 0.82, mood.heat),
        THREE.MathUtils.lerp(0.82, 0.62, mood.heat),
        THREE.MathUtils.lerp(0.35, 0.22, mood.heat)
      )
    }
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
}

const LAYER_CFG = {
  clover: {
    seed: 0xc10a11,
    lowCount: 5000,
    hiCount: 14000,
    lowFill: 0.6,
    hiFill: 0.9,
    heightScale: 0.22,
    widthScale: 0.05,
    curl: 0.25,
    windSpeed: 1.8,
    colorVar: 0.4,
    base: 0x1a4014,
    tip: 0x5a9a38,
    place: (rand: () => number) => {
      if (rand() < 0.8) return { x: (rand() - 0.5) * 28, z: 2 + rand() * 11 }
      return { x: (rand() < 0.5 ? -1 : 1) * (8 + rand() * 10), z: -8 + rand() * 14 }
    }
  },
  meadow: {
    seed: 0x91a11e,
    lowCount: 8000,
    hiCount: 24000,
    lowFill: 0.65,
    hiFill: 0.92,
    heightScale: 0.72,
    widthScale: 0.024,
    curl: 0.95,
    windSpeed: 1.25,
    colorVar: 0.48,
    base: 0x1a3810,
    tip: 0xb4f04e,
    place: (rand: () => number) => {
      const r = rand()
      if (r < 0.72) return { x: (rand() - 0.5) * 30, z: 2 + rand() * 11 }
      if (r < 0.86) return { x: -8 - rand() * 14, z: -10 + rand() * 16 }
      return { x: 8 + rand() * 14, z: -10 + rand() * 16 }
    }
  },
  fern: {
    seed: 0xfe12a1,
    lowCount: 1600,
    hiCount: 4800,
    lowFill: 0.5,
    hiFill: 0.78,
    heightScale: 0.95,
    widthScale: 0.06,
    curl: 1.15,
    windSpeed: 0.95,
    colorVar: 0.38,
    base: 0x143218,
    tip: 0x4a7a32,
    place: (rand: () => number) => {
      // Shade under tree banks + damp pockets
      if (rand() < 0.55) {
        const side = rand() < 0.5 ? -1 : 1
        return { x: side * (10 + rand() * 8), z: -6 + rand() * 12 }
      }
      return { x: (rand() - 0.5) * 20, z: 4 + rand() * 7 }
    }
  },
  reed: {
    seed: 0x7eed01,
    lowCount: 2400,
    hiCount: 7000,
    lowFill: 0.6,
    hiFill: 0.88,
    heightScale: 1.55,
    widthScale: 0.022,
    curl: 0.5,
    windSpeed: 1.05,
    colorVar: 0.35,
    base: 0x1e3a24,
    tip: 0xd8ea72,
    place: (rand: () => number) => {
      // Near shore arc facing camera + side banks of the lake (centred ~z=-6)
      if (rand() < 0.45) {
        const x = (rand() - 0.5) * 22
        return { x, z: -6 + 11.5 + rand() * 2.2 }
      }
      const angle = rand() * Math.PI * 2
      const radius = 12.2 + rand() * 2.8
      return { x: Math.cos(angle) * radius, z: -6 + Math.sin(angle) * radius * 0.55 }
    }
  },
  flower: {
    seed: 0xf10a11,
    lowCount: 1400,
    hiCount: 4200,
    lowFill: 0.55,
    hiFill: 0.85,
    heightScale: 0.55,
    widthScale: 0.055,
    curl: 0.35,
    windSpeed: 1.65,
    colorVar: 0.62,
    base: 0x2e5a1c,
    tip: 0xff6ab0,
    place: (rand: () => number) => {
      if (rand() < 0.78) return { x: (rand() - 0.5) * 24, z: 3.5 + rand() * 8 }
      return {
        x: (rand() < 0.5 ? -1 : 1) * (9 + rand() * 9),
        z: -6 + rand() * 12
      }
    }
  }
} as const

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Soft shrub / bush clumps for mid-ground diversity — multi-sphere foliage. */
function ShrubClumps({
  lowPower,
  mood
}: {
  lowPower: boolean
  mood: MoodState
}): React.JSX.Element {
  const count = lowPower ? 14 : 26
  const clumps = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; hue: number }[] = []
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1
      // Keep as small bank accents — never mid-meadow blobs
      const x = side * (11.5 + (i % 8) * 0.85 + Math.sin(i * 1.7) * 0.6)
      const z = -8 + (i % 7) * 1.7 + Math.cos(i * 0.9) * 0.8
      items.push({
        pos: [x, 0.12, z],
        scale: 0.28 + (i % 4) * 0.07,
        hue: 0.27 + (i % 5) * 0.025
      })
    }
    return items
  }, [count])

  return (
    <group>
      {clumps.map((c, i) => (
        <group key={i} position={c.pos}>
          <mesh castShadow position={[0, c.scale * 0.7, 0]}>
            <sphereGeometry args={[c.scale, 10, 8]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(c.hue, 0.58, 0.26 + mood.heat * 0.08)}
              roughness={0.86}
              metalness={0}
            />
          </mesh>
          <mesh castShadow position={[c.scale * 0.4, c.scale * 0.45, c.scale * 0.15]}>
            <sphereGeometry args={[c.scale * 0.55, 8, 6]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(c.hue + 0.015, 0.55, 0.3)}
              roughness={0.88}
              metalness={0}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
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
uniform float uNight;
uniform vec3 uSunDir;
uniform float uFlower;
varying float vT;
varying float vColorVar;
void main() {
  vec3 gcol = mix(uColorBase, uColorTip, pow(vT, 0.85));
  gcol *= mix(1.0 - uColorVarAmt, 1.0 + uColorVarAmt, vColorVar);
  gcol *= mix(0.5, 1.15, smoothstep(0.0, 0.4, vT));
  if (uFlower > 0.5 && vT > 0.72) {
    gcol = mix(gcol, uColorTip * 1.25, smoothstep(0.72, 1.0, vT));
  }
  // Sunset / heat wash + night cool-down — same mood pipe as sky/water
  gcol = mix(gcol, vec3(0.72, 0.42, 0.16), uHeat * 0.28 * vT);
  gcol *= mix(1.0, 0.55, uNight * 0.65);
  float lit = 0.55 + 0.6 * clamp(uSunDir.y, 0.05, 1.0);
  float rim = pow(1.0 - abs(vT * 2.0 - 1.0), 2.0) * 0.14;
  gl_FragColor = vec4(gcol * lit + rim, 1.0);
}
`
