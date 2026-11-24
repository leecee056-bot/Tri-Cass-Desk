import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { EnvironmentState } from '../../../../shared/environment'
import type { MoodState } from '../../../../shared/mood'
import landscapeUrl from '../../assets/earthbound-landscape.jpg'
import waterNormalsUrl from '../../assets/waternormals.jpg'
import { NatureDecorEngine } from './NatureDecorEngine'
import { SkyCloudEngine } from './SkyCloudEngine'
import { VegetationEngine } from './VegetationEngine'
import { WaterEngine } from './WaterEngine'

type Props = {
  state: EnvironmentState
  mood: MoodState
  yaw: number
  pointer: { nx: number; ny: number; inside: boolean }
  lowPower: boolean
}

/** Distant painted plate — full-width backdrop under the procedural Sky. */
function MountainBackdrop({ nightness }: { nightness: number }): React.JSX.Element {
  const tex = useLoader(THREE.TextureLoader, landscapeUrl)
  tex.colorSpace = THREE.SRGBColorSpace
  const tint = new THREE.Color().setHSL(0.08, 0.15, 0.92 - nightness * 0.35)
  return (
    <mesh position={[0, 14, -95]}>
      <planeGeometry args={[240, 100]} />
      <meshBasicMaterial map={tex} toneMapped={false} color={tint} />
    </mesh>
  )
}

/** ambientCG CC0 turf + shore soil + rock bank patches. */
function Ground({ mood }: { mood: MoodState }): React.JSX.Element {
  const [
    grassColor,
    grassNorm,
    grassRough,
    groundColor,
    groundNorm,
    groundRough,
    rockColor,
    rockNorm,
    rockRough
  ] = useLoader(THREE.TextureLoader, [
    '/nature/textures/Grass001_1K-JPG_Color.jpg',
    '/nature/textures/Grass001_1K-JPG_NormalGL.jpg',
    '/nature/textures/Grass001_1K-JPG_Roughness.jpg',
    '/nature/textures/Ground037_1K-JPG_Color.jpg',
    '/nature/textures/Ground037_1K-JPG_NormalGL.jpg',
    '/nature/textures/Ground037_1K-JPG_Roughness.jpg',
    '/nature/textures/Rock023_1K-JPG_Color.jpg',
    '/nature/textures/Rock023_1K-JPG_NormalGL.jpg',
    '/nature/textures/Rock023_1K-JPG_Roughness.jpg'
  ])

  useEffect(() => {
    for (const t of [
      grassColor,
      grassNorm,
      grassRough,
      groundColor,
      groundNorm,
      groundRough,
      rockColor,
      rockNorm,
      rockRough
    ]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.anisotropy = 4
    }
    grassColor.colorSpace = THREE.SRGBColorSpace
    groundColor.colorSpace = THREE.SRGBColorSpace
    rockColor.colorSpace = THREE.SRGBColorSpace
    grassColor.repeat.set(14, 14)
    grassNorm.repeat.set(14, 14)
    grassRough.repeat.set(14, 14)
    groundColor.repeat.set(6, 6)
    groundNorm.repeat.set(6, 6)
    groundRough.repeat.set(6, 6)
    rockColor.repeat.set(4, 4)
    rockNorm.repeat.set(4, 4)
    rockRough.repeat.set(4, 4)
  }, [
    grassColor,
    grassNorm,
    grassRough,
    groundColor,
    groundNorm,
    groundRough,
    rockColor,
    rockNorm,
    rockRough
  ])

  const grassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: grassColor,
        normalMap: grassNorm,
        roughnessMap: grassRough,
        roughness: 1,
        metalness: 0
      }),
    [grassColor, grassNorm, grassRough]
  )
  const shoreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: groundColor,
        normalMap: groundNorm,
        roughnessMap: groundRough,
        roughness: 1,
        metalness: 0
      }),
    [groundColor, groundNorm, groundRough]
  )
  const rockMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: rockColor,
        normalMap: rockNorm,
        roughnessMap: rockRough,
        roughness: 1,
        metalness: 0.02
      }),
    [rockColor, rockNorm, rockRough]
  )

  useFrame(() => {
    grassMat.emissive.setHSL(0.08, 0.5, 0.06).multiplyScalar(mood.heat * 0.18)
    shoreMat.emissive.setHSL(0.07, 0.45, 0.05).multiplyScalar(mood.heat * 0.14)
    rockMat.emissive.setHSL(0.06, 0.35, 0.04).multiplyScalar(mood.heat * 0.1)
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[55, 72]} />
        <primitive object={grassMat} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]} receiveShadow>
        <ringGeometry args={[12.5, 18, 64]} />
        <primitive object={shoreMat} attach="material" />
      </mesh>
      {/* Rock023 bank patches — rocky shelves beside the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[-14.5, 0.02, -2]} receiveShadow>
        <planeGeometry args={[9, 5.5]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.4]} position={[15.2, 0.02, 1.5]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.1]} position={[0, 0.015, -16]} receiveShadow>
        <planeGeometry args={[14, 4.5]} />
        <primitive object={rockMat} attach="material" />
      </mesh>
    </group>
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
    const fogCol = new THREE.Color().setHSL(
      THREE.MathUtils.lerp(0.56, 0.08, mood.heat * 0.7),
      0.28 + mood.heat * 0.2,
      THREE.MathUtils.lerp(0.36, 0.68, day)
    )
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(fogCol)
      scene.fog.density = 0.0035 + mood.load * 0.0025 + mood.nightness * 0.0015
    }
    gl.setClearColor(fogCol, 1)
    gl.toneMappingExposure = 1.05 + day * 0.22 - mood.heat * 0.03
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
      <MountainBackdrop nightness={mood.nightness} />
      <Ground mood={mood} />
      <group position={[0, 0.02, -6]}>
        <WaterEngine mood={mood} motion={motion} sunDir={sunDir} normals={waterNormals} />
      </group>
      <NatureDecorEngine mood={mood} lowPower={lowPower} />
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
 * Opaque Three.js living world — Sky + Water + grass + Poly Haven / ambientCG props.
 */
export function LivingWorldCanvas(props: Props): React.JSX.Element {
  // Cap pixel ratio hard — high DPR + shadows was part of the crash cocktail with heavy telemetry
  const dpr: [number, number] = props.lowPower ? [1, 1] : [1, 1.25]
  return (
    <div className="living-canvas-host living-canvas-opaque" aria-hidden>
      <Canvas
        dpr={dpr}
        shadows={false}
        frameloop={props.state.userPreferences.motion === 'off' ? 'demand' : 'always'}
        camera={{ position: [0, 5.2, 15.5], fov: 42, near: 0.3, far: 500 }}
        gl={{
          antialias: false,
          powerPreference: 'low-power',
          alpha: false,
          stencil: false,
          depth: true
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x7aa8c8, 1)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
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
