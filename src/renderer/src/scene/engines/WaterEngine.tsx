import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Water } from 'three-stdlib'
import type { MoodState } from '../../../../shared/mood'

type Props = {
  mood: MoodState
  motion: boolean
  sunDir: THREE.Vector3
  normals: THREE.Texture
}

/**
 * Layered water — main lake + shallower cove + soft shore ring.
 * three-stdlib Water (MIT) + waternormals.jpg from three.js examples.
 */
export function WaterEngine({ mood, motion, sunDir, normals }: Props): React.JSX.Element {
  // 256² reflection maps — software-GL VMs stall hard on 512 ReadPixels
  const lake = useMemo(() => makeWater(normals, 14.5, 72, 0x1488a0, 3.6, 256), [normals])
  const cove = useMemo(() => makeWater(normals, 5.2, 40, 0x2ab8a8, 2.4, 128), [normals])

  useFrame((_, dt) => {
    tickWater(lake, mood, motion, sunDir, dt, {
      base: 0x1488a0,
      warm: 0x6a5a28,
      speed: 0.42,
      distortionBase: 2.8
    })
    tickWater(cove, mood, motion, sunDir, dt, {
      base: 0x2ab8a8,
      warm: 0x7a6830,
      speed: 0.55,
      distortionBase: 2.0
    })
  })

  return (
    <group>
      <primitive object={lake} />
      <group position={[7.5, 0.015, 3.5]} scale={[1, 1, 0.72]}>
        <primitive object={cove} />
      </group>
      <ShoreRing />
    </group>
  )
}

function makeWater(
  normals: THREE.Texture,
  radius: number,
  segments: number,
  color: number,
  distortion: number,
  texSize: number
): Water {
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping
  const geom = new THREE.CircleGeometry(radius, segments)
  const w = new Water(geom, {
    textureWidth: texSize,
    textureHeight: texSize,
    waterNormals: normals,
    sunDirection: new THREE.Vector3(0.4, 0.7, 0.2),
    sunColor: 0xfff5e0,
    waterColor: color,
    distortionScale: distortion,
    fog: false,
    alpha: 1
  })
  w.rotation.x = -Math.PI / 2
  return w
}

function tickWater(
  water: Water,
  mood: MoodState,
  motion: boolean,
  sunDir: THREE.Vector3,
  dt: number,
  opts: { base: number; warm: number; speed: number; distortionBase: number }
): void {
  const mat = water.material as THREE.ShaderMaterial
  if (motion) mat.uniforms['time'].value += dt * (opts.speed + mood.wind * 0.85)
  mat.uniforms['sunDirection'].value.copy(sunDir)
  const nightLift = mood.nightness * 0.28
  const base = new THREE.Color(opts.base).offsetHSL(0, 0.05 - nightLift * 0.12, 0.04 + nightLift * 0.1)
  const warm = new THREE.Color(opts.warm)
  mat.uniforms['waterColor'].value.copy(base).lerp(warm, mood.heat * 0.38)
  mat.uniforms['sunColor'].value.set(mood.heat > 0.55 ? 0xffc090 : 0xfff6e8)
  mat.uniforms['distortionScale'].value = opts.distortionBase + mood.wind * 2.4
}

/** Soft luminous shore foam ring — reads as wet edge variety. */
function ShoreRing(): React.JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[13.6, 15.2, 96]} />
      <meshStandardMaterial
        color="#d8f0ea"
        transparent
        opacity={0.35}
        roughness={0.55}
        metalness={0.05}
        emissive="#8ad4c8"
        emissiveIntensity={0.18}
      />
    </mesh>
  )
}

