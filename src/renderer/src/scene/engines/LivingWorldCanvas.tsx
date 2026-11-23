import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import landscapeUrl from '../../assets/earthbound-landscape.jpg'
import waterNormalsUrl from '../../assets/waternormals.jpg'
import { SkyCloudEngine } from './SkyCloudEngine'
import { TerrainDecorEngine } from './TerrainDecorEngine'
import { VegetationEngine } from './VegetationEngine'
import { WaterEngine } from './WaterEngine'

type Props = {
  state: EnvironmentState
  mood: MoodState
  yaw: number
  pointer: { nx: number; ny: number; inside: boolean }
  lowPower: boolean
}

/** Distant painted plate — mood-tinted under the procedural Sky. */
function MountainBackdrop({ mood }: { mood: MoodState }): React.JSX.Element {
  const tex = useLoader(THREE.TextureLoader, landscapeUrl)
  tex.colorSpace = THREE.SRGBColorSpace
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (!matRef.current) return
    matRef.current.color.setHSL(
      THREE.MathUtils.lerp(0.08, 0.04, mood.heat),
      0.12 + mood.heat * 0.35,
      0.9 - mood.nightness * 0.4
    )
  })
  return (
    <mesh position={[0, 14, -95]}>
      <planeGeometry args={[240, 100]} />
      <meshBasicMaterial ref={matRef} map={tex} toneMapped={false} color="#fff0e0" />
    </mesh>
  )
}

function CameraRig({ yaw }: { yaw: number }): null {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 5.2, 15.5)
    camera.lookAt(0, 1.4, -7)
  }, [camera])
  useFrame(() => {
    camera.rotation.y = THREE.MathUtils.degToRad(-yaw * 0.12)
  })
  return null
}

function FogMood({ mood }: { mood: MoodState }): null {
  const { scene, gl } = useThree()
  useFrame(() => {
    const day = 1 - mood.nightness
    // Sunset oranges when heat+dusk; cool blue at night; crisp day air
    const dusk = mood.nightness * (1 - Math.abs(mood.nightness - 0.45) * 1.2)
    const fogCol = new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.56, 0.06, Math.max(mood.heat, dusk * 1.4)),
      0.28 + mood.heat * 0.25 + dusk * 0.2,
      THREE.MathUtils.lerp(0.34, 0.7, day)
    )
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogCol)
      scene.fog.density = 0.0032 + mood.load * 0.0022 + mood.nightness * 0.0018
    }
    gl.setClearColor(fogCol, 1)
    gl.toneMappingExposure = 1.05 + day * 0.22 - mood.heat * 0.02
  })
  return null
}

function SceneBody({
  state,
  mood,
  yaw,
  pointer,
  lowPower
}: Props): React.JSX.Element {
  const motion = state.userPreferences.motion !== 'off'
  const sunDir = useMemo(() => {
    const incl = THREE.MathUtils.lerp(0.49, 0.18, mood.nightness)
    const theta = Math.PI * (incl - 0.5)
    const phi = 2 * Math.PI * (0.25 - 0.5)
    return new THREE.Vector3(Math.cos(phi), Math.max(0.05, Math.sin(theta)), Math.sin(phi)).normalize()
  }, [mood.nightness])

  const waterNormals = useLoader(THREE.TextureLoader, waterNormalsUrl)

  return (
    <>
      <CameraRig yaw={yaw} />
      <FogMood mood={mood} />
      <SkyCloudEngine state={state} mood={mood} lowPower={lowPower} />
      <MountainBackdrop mood={mood} />
      <TerrainDecorEngine mood={mood} lowPower={lowPower} />
      <group position={[0, 0.02, -6]}>
        <WaterEngine mood={mood} motion={motion} sunDir={sunDir} normals={waterNormals} />
      </group>
      <VegetationEngine
        mood={mood}
        pointer={pointer}
        motion={motion}
        lowPower={lowPower}
        sunDir={sunDir}
      />
    </>
  )
}

/**
 * Opaque Three.js living world — Sky + Water + flora + trees/rocks (OSS stack).
 * Shared mood drives day/night, sunset wash, wind, and heat across every layer.
 */
export function LivingWorldCanvas(props: Props): React.JSX.Element {
  const dpr: [number, number] = props.lowPower ? [1, 1.15] : [1, 1.5]
  return (
    <div className="living-canvas-host living-canvas-opaque" aria-hidden>
      <Canvas
        dpr={dpr}
        shadows
        camera={{ position: [0, 5.2, 15.5], fov: 42, near: 0.3, far: 500 }}
        gl={{
          antialias: !props.lowPower,
          powerPreference: props.lowPower ? 'low-power' : 'high-performance',
          alpha: false
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x7aa8c8, 1)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          scene.fog = new THREE.FogExp2(0x7aa8c8, 0.004)
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneBody {...props} />
        </Suspense>
      </Canvas>
    </div>
  )
}
