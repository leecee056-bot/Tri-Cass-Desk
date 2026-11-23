import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  day: number
  night: number
  moonGlow: number
  energy: number
  yawDeg: number
}

/** Soft additive sun/moon discs — small glowing bodies, not opaque blobs. */
export function CelestialEngine({ day, night, moonGlow, energy, yawDeg }: Props): React.JSX.Element {
  const sun = useRef<THREE.Mesh>(null)
  const moon = useRef<THREE.Mesh>(null)
  const sunMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffd89a'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      }),
    []
  )
  const moonMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#c8d6ff'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const yaw = (yawDeg * Math.PI) / 180
    const elev = THREE.MathUtils.lerp(-0.35, 1.05, day)
    const orbit = t * 0.015 * (0.35 + energy * 0.5)
    if (sun.current) {
      sun.current.visible = day > 0.08
      sun.current.position.set(
        Math.sin(yaw + orbit) * 4.8,
        elev * 2.4 + Math.sin(t * 0.12) * 0.05,
        -5.2 + Math.cos(yaw + orbit) * 0.8
      )
      sunMat.opacity = Math.min(0.85, 0.2 + day * 0.7)
      sun.current.scale.setScalar(0.12 + day * 0.14)
    }
    if (moon.current) {
      moon.current.visible = night > 0.15
      moon.current.position.set(
        Math.sin(yaw + orbit + Math.PI) * 4.6,
        THREE.MathUtils.lerp(1.9, -0.2, day) + Math.sin(t * 0.1) * 0.04,
        -5 + Math.cos(yaw + orbit + Math.PI) * 0.7
      )
      moonMat.opacity = Math.min(0.7, (0.15 + night * 0.55) * (0.45 + moonGlow * 0.55))
      moon.current.scale.setScalar(0.1 + night * 0.1)
    }
  })

  return (
    <>
      <mesh ref={sun} renderOrder={1}>
        <sphereGeometry args={[1, 16, 16]} />
        <primitive object={sunMat} attach="material" />
      </mesh>
      <mesh ref={moon} renderOrder={1}>
        <sphereGeometry args={[1, 16, 16]} />
        <primitive object={moonMat} attach="material" />
      </mesh>
      <pointLight intensity={0.15 + day * 0.7} color="#fff1d0" distance={18} position={[2, 3.5, 2]} />
    </>
  )
}
