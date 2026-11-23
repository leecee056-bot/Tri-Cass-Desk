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

/** Sun + moon bodies that travel across the sky with day/night + yaw. */
export function CelestialEngine({ day, night, moonGlow, energy, yawDeg }: Props): React.JSX.Element {
  const sun = useRef<THREE.Mesh>(null)
  const moon = useRef<THREE.Mesh>(null)
  const sunMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffe6a8'),
        transparent: true,
        depthWrite: false
      }),
    []
  )
  const moonMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#dce6ff'),
        transparent: true,
        depthWrite: false
      }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const yaw = (yawDeg * Math.PI) / 180
    const elev = THREE.MathUtils.lerp(-0.6, 1.15, day)
    const orbit = t * 0.02 * (0.4 + energy)
    if (sun.current) {
      sun.current.position.set(
        Math.sin(yaw + orbit) * 5.5,
        elev * 2.8 + Math.sin(t * 0.15) * 0.08,
        -4.5 + Math.cos(yaw + orbit) * 1.2
      )
      sunMat.opacity = 0.15 + day * 0.85
      sun.current.scale.setScalar(0.35 + day * 0.45)
    }
    if (moon.current) {
      moon.current.position.set(
        Math.sin(yaw + orbit + Math.PI) * 5.2,
        THREE.MathUtils.lerp(2.2, -0.4, day) + Math.sin(t * 0.12) * 0.05,
        -4.2 + Math.cos(yaw + orbit + Math.PI) * 1.1
      )
      moonMat.opacity = (0.2 + night * 0.75) * (0.5 + moonGlow * 0.5)
      moon.current.scale.setScalar(0.28 + night * 0.25)
    }
  })

  return (
    <>
      <mesh ref={sun} renderOrder={1}>
        <sphereGeometry args={[1, 24, 24]} />
        <primitive object={sunMat} attach="material" />
      </mesh>
      <mesh ref={moon} renderOrder={1}>
        <sphereGeometry args={[1, 24, 24]} />
        <primitive object={moonMat} attach="material" />
      </mesh>
      <pointLight
        intensity={0.2 + day * 1.1}
        color="#fff2d0"
        distance={20}
        position={[3, 4, 2]}
      />
    </>
  )
}
