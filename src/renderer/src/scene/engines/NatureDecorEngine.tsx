import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  lowPower: boolean
}

type Placement = {
  url: string
  pos: [number, number, number]
  scale: number | [number, number, number]
  rotY: number
}

/**
 * Poly Haven CC0 nature props — lakeside wilderness variety.
 * Scales are tuned to each asset's native glTF bounds (no homemade meshes).
 */
export function NatureDecorEngine({ mood, lowPower }: Props): React.JSX.Element {
  const placements = useMemo(() => buildPlacements(lowPower), [lowPower])
  return (
    <group>
      {placements.map((p, i) => (
        <PhInstance key={`${p.url}-${i}`} {...p} mood={mood} />
      ))}
    </group>
  )
}

function buildPlacements(lowPower: boolean): Placement[] {
  const pine = '/nature/pine_sapling_small/pine_sapling_small_1k.gltf'
  const shrub = '/nature/shrub_01/shrub_01_1k.gltf'
  const fern = '/nature/fern_02/fern_02_1k.gltf'
  const dandelion = '/nature/dandelion_01/dandelion_01_1k.gltf'
  const celandine = '/nature/celandine_01/celandine_01_1k.gltf'
  const rock = '/nature/rock_09/rock_09_1k.gltf'
  const boulder = '/nature/boulder_01/boulder_01_1k.gltf'
  const moss = '/nature/rock_moss_set_01/rock_moss_set_01_1k.gltf'
  const stump = '/nature/tree_stump_01/tree_stump_01_1k.gltf'
  const trunk = '/nature/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf'
  const branches = '/nature/dry_branches_medium_01/dry_branches_medium_01_1k.gltf'

  const out: Placement[] = []

  // pine_sapling_small ≈ 1.3 m tall native → scale ~4–6 for young bank trees
  const pineCount = lowPower ? 2 : 4
  for (let i = 0; i < pineCount; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: pine,
      pos: [side * (8.4 + i * 1.1), 0, 2.8 + i * 1.9],
      scale: 4.2 + (i % 3) * 0.7,
      rotY: i * 1.1
    })
  }

  // shrub_01 is wide/low (~2.5 × 0.4 m) — bank fill hedges
  const shrubN = lowPower ? 5 : 9
  for (let i = 0; i < shrubN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: shrub,
      pos: [side * (9.0 + (i % 4) * 0.85), 0, -1.5 + (i % 5) * 1.7],
      scale: [1.4 + (i % 3) * 0.25, 2.2 + (i % 2) * 0.4, 1.4 + (i % 3) * 0.25],
      rotY: i * 0.8
    })
  }

  // Ferns near damp shore
  const fernN = lowPower ? 6 : 12
  for (let i = 0; i < fernN; i++) {
    const a = (i / fernN) * Math.PI * 2
    out.push({
      url: fern,
      pos: [Math.cos(a) * (13.2 + (i % 3) * 0.35), 0, -5.5 + Math.sin(a) * 6.5],
      scale: 1.4 + (i % 4) * 0.25,
      rotY: a
    })
  }

  // Wildflowers — native ~0.2 m → scale up for meadow read
  const flowerN = lowPower ? 8 : 16
  for (let i = 0; i < flowerN; i++) {
    out.push({
      url: i % 2 === 0 ? dandelion : celandine,
      pos: [(hash(i, 1) - 0.5) * 16, 0, 5 + hash(i, 2) * 6],
      scale: 2.4 + hash(i, 3) * 1.6,
      rotY: hash(i, 4) * Math.PI * 2
    })
  }

  // rock_09 is pebble-sized (~0.07 m) → ×30–55 for shoreline stones
  const rockN = lowPower ? 8 : 14
  for (let i = 0; i < rockN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: rock,
      pos: [
        i % 4 === 0 ? (hash(i, 5) - 0.5) * 12 : side * (10 + hash(i, 5) * 3.5),
        0,
        i % 4 === 0 ? 6 + hash(i, 6) * 4 : -5 + hash(i, 6) * 9
      ],
      scale: 28 + hash(i, 7) * 22,
      rotY: hash(i, 8) * Math.PI * 2
    })
  }

  // boulder_01 ≈ 1.5 m — a few larger bank boulders
  const boulderN = lowPower ? 3 : 6
  for (let i = 0; i < boulderN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: boulder,
      pos: [side * (11.5 + i * 0.6), 0, -3 + i * 2.4],
      scale: 1.35 + hash(i, 9) * 0.9,
      rotY: hash(i, 10) * Math.PI * 2
    })
  }

  const mossN = lowPower ? 2 : 4
  for (let i = 0; i < mossN; i++) {
    out.push({
      url: moss,
      pos: [(i % 2 === 0 ? -1 : 1) * (12 + i * 0.8), 0, -3.5 + i * 2.2],
      scale: 0.55 + i * 0.08,
      rotY: i * 0.7
    })
  }

  out.push(
    { url: stump, pos: [-6.2, 0, 7.0], scale: 1.15, rotY: 0.4 },
    { url: trunk, pos: [7.4, 0, 6.2], scale: 0.85, rotY: -0.55 },
    { url: branches, pos: [-8.0, 0, 4.4], scale: 2.4, rotY: 1.2 }
  )
  if (!lowPower) {
    out.push(
      { url: stump, pos: [5.0, 0, 8.6], scale: 0.95, rotY: 2.1 },
      { url: branches, pos: [9.2, 0, 2.0], scale: 2.0, rotY: -1.4 },
      { url: pine, pos: [-10.5, 0, 8.5], scale: 5.6, rotY: 0.3 },
      { url: pine, pos: [11.2, 0, 7.8], scale: 5.0, rotY: -0.9 }
    )
  }

  return out
}

function PhInstance({
  url,
  pos,
  scale,
  rotY,
  mood
}: Placement & { mood: MoodState }): React.JSX.Element {
  const { scene } = useGLTF(url)
  const root = useRef<THREE.Group>(null)
  const wash = useRef({ heat: -1, night: -1 })
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone())
      } else if (mesh.material) {
        mesh.material = mesh.material.clone()
      }
    })
    return c
  }, [scene])

  // Mood wash — only when heat/nightness actually change (soft-GL friendly)
  useFrame(() => {
    if (!root.current) return
    if (
      Math.abs(wash.current.heat - mood.heat) < 0.02 &&
      Math.abs(wash.current.night - mood.nightness) < 0.02
    ) {
      return
    }
    wash.current = { heat: mood.heat, night: mood.nightness }
    const day = 1 - mood.nightness
    root.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial
        if (!std?.emissive) continue
        std.emissive.setHSL(0.08, 0.65, 0.08).multiplyScalar(mood.heat * 0.22)
        std.envMapIntensity = 0.4 + day * 0.4
      }
    })
  })

  return (
    <group ref={root} position={pos} scale={scale} rotation={[0, rotY, 0]}>
      <primitive object={cloned} />
    </group>
  )
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

;[
  '/nature/pine_sapling_small/pine_sapling_small_1k.gltf',
  '/nature/shrub_01/shrub_01_1k.gltf',
  '/nature/fern_02/fern_02_1k.gltf',
  '/nature/dandelion_01/dandelion_01_1k.gltf',
  '/nature/celandine_01/celandine_01_1k.gltf',
  '/nature/rock_09/rock_09_1k.gltf',
  '/nature/boulder_01/boulder_01_1k.gltf',
  '/nature/rock_moss_set_01/rock_moss_set_01_1k.gltf',
  '/nature/tree_stump_01/tree_stump_01_1k.gltf',
  '/nature/dead_tree_trunk_02/dead_tree_trunk_02_1k.gltf',
  '/nature/dry_branches_medium_01/dry_branches_medium_01_1k.gltf'
].forEach((u) => useGLTF.preload(u))
