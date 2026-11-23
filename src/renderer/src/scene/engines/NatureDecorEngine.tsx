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
/** Bump when placement layout changes so Fast Refresh remounts props. */
const PLACEMENT_REV = 6

export function NatureDecorEngine({ mood, lowPower }: Props): React.JSX.Element {
  const placements = useMemo(
    () => buildPlacements(lowPower),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- PLACEMENT_REV forces layout remounts
    [lowPower, PLACEMENT_REV]
  )
  return (
    <group key={`nature-${PLACEMENT_REV}-${lowPower ? 'lo' : 'hi'}`}>
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

  // Lake at (0,-6) r≈14.5. No near-camera pines (they read as mid-frame).
  // Side-bank only — outside water, |x| large, z kept away from camera center.
  out.push(
    { url: pine, pos: [-18.0, 0, -1.0], scale: 4.2, rotY: 0.5 },
    { url: pine, pos: [18.5, 0, -2.0], scale: 3.8, rotY: -0.9 },
    { url: pine, pos: [-19.5, 0, 4.5], scale: 3.6, rotY: 1.1 },
    { url: pine, pos: [19.0, 0, 3.5], scale: 3.4, rotY: -1.3 }
  )
  if (!lowPower) {
    out.push(
      { url: pine, pos: [-20.0, 0, 7.0], scale: 3.2, rotY: 0.2 },
      { url: pine, pos: [20.5, 0, 6.0], scale: 3.0, rotY: -0.4 }
    )
  }

  // shrub_01 is wide/low (~2.5 × 0.4 m) — bank fill hedges (outside water)
  const shrubN = lowPower ? 5 : 9
  for (let i = 0; i < shrubN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: shrub,
      pos: [side * (15.2 + (i % 4) * 0.7), 0, -2 + (i % 5) * 2.0],
      scale: [1.4 + (i % 3) * 0.25, 2.2 + (i % 2) * 0.4, 1.4 + (i % 3) * 0.25],
      rotY: i * 0.8
    })
  }

  // Ferns near damp shore ring (outside lake radius)
  const fernN = lowPower ? 6 : 12
  for (let i = 0; i < fernN; i++) {
    const a = (i / fernN) * Math.PI * 2
    const r = 16.2 + (i % 3) * 0.45
    out.push({
      url: fern,
      pos: [Math.cos(a) * r, 0, -6 + Math.sin(a) * r * 0.85],
      scale: 1.4 + (i % 4) * 0.25,
      rotY: a
    })
  }

  // Wildflowers — dry meadow band near camera (z past lake edge ~8.5)
  const flowerN = lowPower ? 8 : 16
  for (let i = 0; i < flowerN; i++) {
    out.push({
      url: i % 2 === 0 ? dandelion : celandine,
      pos: [(hash(i, 1) - 0.5) * 22, 0, 9.2 + hash(i, 2) * 4.5],
      scale: 2.2 + hash(i, 3) * 1.4,
      rotY: hash(i, 4) * Math.PI * 2
    })
  }

  // rock_09 pebble → ×30–55 shoreline stones on banks
  const rockN = lowPower ? 8 : 14
  for (let i = 0; i < rockN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: rock,
      pos: [
        side * (14.5 + hash(i, 5) * 4),
        0,
        -8 + hash(i, 6) * 14
      ],
      scale: 28 + hash(i, 7) * 22,
      rotY: hash(i, 8) * Math.PI * 2
    })
  }

  // boulder_01 — bank boulders, keep off mid-water
  const boulderN = lowPower ? 3 : 6
  for (let i = 0; i < boulderN; i++) {
    const side = i % 2 === 0 ? -1 : 1
    out.push({
      url: boulder,
      pos: [side * (15.5 + i * 0.55), 0, -4 + i * 2.6],
      scale: 1.35 + hash(i, 9) * 0.9,
      rotY: hash(i, 10) * Math.PI * 2
    })
  }

  const mossN = lowPower ? 2 : 4
  for (let i = 0; i < mossN; i++) {
    out.push({
      url: moss,
      pos: [(i % 2 === 0 ? -1 : 1) * (15.5 + i * 0.7), 0, -4 + i * 2.4],
      scale: 0.55 + i * 0.08,
      rotY: i * 0.7
    })
  }

  // Dry-land accents — stump / trunk / branches on banks (not mid-lake)
  out.push(
    { url: stump, pos: [-14.8, 0, 8.5], scale: 1.05, rotY: 0.4 },
    { url: trunk, pos: [15.6, 0, 7.2], scale: 0.8, rotY: -0.55 },
    { url: branches, pos: [-16.2, 0, 4.0], scale: 2.2, rotY: 1.2 }
  )
  if (!lowPower) {
    out.push(
      { url: stump, pos: [14.2, 0, 10.0], scale: 0.9, rotY: 2.1 },
      { url: branches, pos: [16.8, 0, 1.2], scale: 1.9, rotY: -1.4 },
      // Subtle diversity — small props, not scene-dominant
      { url: fern, pos: [-12.5, 0, 10.8], scale: 1.1, rotY: 0.6 },
      { url: fern, pos: [13.0, 0, 11.2], scale: 1.05, rotY: -0.4 },
      { url: dandelion, pos: [-4.5, 0, 11.5], scale: 2.0, rotY: 1.2 },
      { url: celandine, pos: [3.8, 0, 12.0], scale: 1.9, rotY: -0.7 },
      { url: rock, pos: [-13.2, 0, 9.5], scale: 22, rotY: 0.9 },
      { url: rock, pos: [12.8, 0, 9.0], scale: 26, rotY: -1.1 },
      { url: branches, pos: [-15.0, 0, 11.5], scale: 1.6, rotY: 0.3 }
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
