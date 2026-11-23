import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  lowPower: boolean
}

/**
 * Ground texture, rock field, and procedural trees.
 * All original MIT scene code — mood-tinted so sunset / night wash the whole set.
 */
export function TerrainDecorEngine({ mood, lowPower }: Props): React.JSX.Element {
  return (
    <group>
      <TexturedGround mood={mood} />
      <RockField lowPower={lowPower} mood={mood} />
      <TreeGrove lowPower={lowPower} mood={mood} />
    </group>
  )
}

function makeGroundTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3a5424'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 2 + Math.random() * 10
    const shade = 40 + Math.floor(Math.random() * 55)
    const g = 70 + Math.floor(Math.random() * 50)
    ctx.fillStyle = `rgba(${shade}, ${g}, ${28 + (i % 20)}, ${0.25 + Math.random() * 0.45})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // Dirt patches near "shore" band
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * size
    const y = size * 0.35 + Math.random() * size * 0.3
    ctx.fillStyle = `rgba(${90 + (i % 40)}, ${78 + (i % 30)}, ${42}, 0.35)`
    ctx.beginPath()
    ctx.ellipse(x, y, 8 + Math.random() * 18, 4 + Math.random() * 10, Math.random(), 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 6)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function TexturedGround({ mood }: { mood: MoodState }): React.JSX.Element {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const tex = useMemo(() => makeGroundTexture(), [])
  const shoreTex = useMemo(() => {
    const t = tex.clone()
    t.repeat.set(3, 3)
    t.needsUpdate = true
    return t
  }, [tex])

  useFrame(() => {
    if (!matRef.current) return
    // Sunset / heat washes the turf orange-gold; night cools it
    const c = new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.28, 0.08, mood.heat * 0.85),
      0.35 + mood.heat * 0.2,
      THREE.MathUtils.lerp(0.28, 0.42, 1 - mood.nightness * 0.55)
    )
    matRef.current.color.copy(c)
    matRef.current.emissive.setHSL(0.08, 0.55, 0.08).multiplyScalar(mood.heat * 0.15)
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[55, 80]} />
        <meshStandardMaterial
          ref={matRef}
          map={tex}
          color="#4a6830"
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]} receiveShadow>
        <ringGeometry args={[12.5, 18, 72]} />
        <meshStandardMaterial map={shoreTex} color="#6a7240" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  )
}

function RockField({ lowPower, mood }: { lowPower: boolean; mood: MoodState }): React.JSX.Element {
  const count = lowPower ? 28 : 48
  const rocks = useMemo(() => {
    const items: {
      pos: [number, number, number]
      scale: [number, number, number]
      rot: [number, number, number]
      color: string
    }[] = []
    const colors = ['#5a6058', '#7a7468', '#4a5248', '#8a8274', '#6a6860', '#9a9080']
    for (let i = 0; i < count; i++) {
      const bank = i % 5
      let x: number
      let z: number
      if (bank < 2) {
        // Near meadow — larger stones that poke through grass
        x = (hash(i, 1) - 0.5) * 20
        z = 4 + hash(i, 2) * 8
      } else if (bank === 2) {
        const a = hash(i, 3) * Math.PI * 2
        const r = 12.8 + hash(i, 4) * 2.5
        x = Math.cos(a) * r
        z = -6 + Math.sin(a) * r * 0.55
      } else {
        const side = i % 2 === 0 ? -1 : 1
        x = side * (8 + hash(i, 5) * 8)
        z = -8 + hash(i, 6) * 14
      }
      const s = 0.22 + hash(i, 7) * (i % 5 === 0 ? 0.7 : 0.35)
      items.push({
        pos: [x, s * 0.35, z],
        scale: [s * (0.8 + hash(i, 8) * 0.5), s * (0.45 + hash(i, 9) * 0.4), s * (0.7 + hash(i, 10) * 0.5)],
        rot: [hash(i, 11) * 0.6, hash(i, 12) * Math.PI, hash(i, 13) * 0.5],
        color: colors[i % colors.length]
      })
    }
    return items
  }, [count])

  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])

  useFrame(() => {
    for (const m of mats.current) {
      if (!m) continue
      m.emissive.setHSL(0.07, 0.6, 0.05).multiplyScalar(mood.heat * 0.2)
      m.color.offsetHSL(0, 0, 0) // keep base; slight night darken via roughness not needed
    }
  })

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={r.pos}
          rotation={r.rot}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          {i % 3 === 0 ? (
            <dodecahedronGeometry args={[1, 0]} />
          ) : i % 3 === 1 ? (
            <icosahedronGeometry args={[1, 0]} />
          ) : (
            <octahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            ref={(el) => {
              mats.current[i] = el
            }}
            color={r.color}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

type TreeSpec = {
  pos: [number, number, number]
  height: number
  kind: 'pine' | 'round'
  lean: number
}

function TreeGrove({ lowPower, mood }: { lowPower: boolean; mood: MoodState }): React.JSX.Element {
  const trees = useMemo(() => {
    const n = lowPower ? 12 : 20
    const items: TreeSpec[] = []
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1
      // Keep inside the camera frustum (not buried behind side UI chrome)
      const ring = i % 4
      let x: number
      let z: number
      if (ring === 0) {
        // Near mid — peek between Mood/System windows
        x = side * (6.5 + hash(i, 20) * 2.2)
        z = 4 + hash(i, 21) * 4
      } else if (ring === 1) {
        x = side * (8.5 + hash(i, 20) * 2.5)
        z = -1 + hash(i, 21) * 5
      } else if (ring === 2) {
        x = side * (9 + hash(i, 20) * 3)
        z = -8 + hash(i, 21) * 4
      } else {
        x = (hash(i, 20) - 0.5) * 10
        z = -2 + hash(i, 21) * 3
      }
      items.push({
        pos: [x, 0, z],
        height: 2.6 + hash(i, 22) * 2.8,
        kind: i % 3 === 0 ? 'round' : 'pine',
        lean: (hash(i, 23) - 0.5) * 0.1
      })
    }
    return items
  }, [lowPower])

  return (
    <group>
      {trees.map((t, i) =>
        t.kind === 'pine' ? (
          <PineTree key={i} spec={t} mood={mood} />
        ) : (
          <RoundTree key={i} spec={t} mood={mood} />
        )
      )}
    </group>
  )
}

function PineTree({ spec, mood }: { spec: TreeSpec; mood: MoodState }): React.JSX.Element {
  const foliageMats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const trunk = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => {
    const day = 1 - mood.nightness
    const col = new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.32, 0.1, mood.heat * 0.7),
      0.45 + mood.heat * 0.15,
      0.18 + day * 0.12
    )
    const em = new THREE.Color().setHSL(0.08, 0.7, 0.1).multiplyScalar(mood.heat * 0.25)
    for (const m of foliageMats.current) {
      if (!m) continue
      m.color.copy(col)
      m.emissive.copy(em)
    }
    trunk.current?.color.setHSL(0.07, 0.35, 0.18 + day * 0.06)
  })
  const h = spec.height
  return (
    <group position={spec.pos} rotation={[0, 0, spec.lean]}>
      <mesh castShadow position={[0, h * 0.28, 0]}>
        <cylinderGeometry args={[0.08, 0.14, h * 0.55, 6]} />
        <meshStandardMaterial ref={trunk} color="#4a3420" roughness={0.95} />
      </mesh>
      {[0.55, 0.72, 0.88].map((t, i) => (
        <mesh key={i} castShadow position={[0, h * t, 0]}>
          <coneGeometry args={[h * (0.28 - i * 0.05), h * 0.35, 7]} />
          <meshStandardMaterial
            ref={(el) => {
              foliageMats.current[i] = el
            }}
            color="#2a4a1c"
            roughness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}

function RoundTree({ spec, mood }: { spec: TreeSpec; mood: MoodState }): React.JSX.Element {
  const foliage = useRef<THREE.MeshStandardMaterial>(null)
  const trunk = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(() => {
    const day = 1 - mood.nightness
    foliage.current?.color.setHSL(
      THREE.MathUtils.lerp(0.3, 0.09, mood.heat * 0.75),
      0.5 + mood.heat * 0.2,
      0.22 + day * 0.14
    )
    trunk.current?.color.setHSL(0.08, 0.32, 0.2 + day * 0.05)
    if (foliage.current) {
      foliage.current.emissive.setHSL(0.07, 0.65, 0.12).multiplyScalar(mood.heat * 0.28)
    }
  })
  const h = spec.height
  return (
    <group position={spec.pos} rotation={[0, 0, spec.lean]}>
      <mesh castShadow position={[0, h * 0.32, 0]}>
        <cylinderGeometry args={[0.1, 0.16, h * 0.55, 6]} />
        <meshStandardMaterial ref={trunk} color="#5a3e28" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0, h * 0.78, 0]}>
        <sphereGeometry args={[h * 0.32, 10, 8]} />
        <meshStandardMaterial ref={foliage} color="#3a6a28" roughness={0.82} />
      </mesh>
      <mesh castShadow position={[h * 0.18, h * 0.7, h * 0.08]}>
        <sphereGeometry args={[h * 0.2, 8, 6]} />
        <meshStandardMaterial color="#2e5820" roughness={0.85} />
      </mesh>
    </group>
  )
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
