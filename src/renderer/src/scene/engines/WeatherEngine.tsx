import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  rain: number
  wind: number
  fog: number
  motion: boolean
}

/** Particle rain + fog sheets driven by telemetry weather metaphors. */
export function WeatherEngine({ rain, wind, fog, motion }: Props): React.JSX.Element | null {
  const rainRef = useRef<THREE.Points>(null)
  const fogRef = useRef<THREE.Mesh>(null)
  const count = 900
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 14
      a[i * 3 + 1] = Math.random() * 6
      a[i * 3 + 2] = -2 - Math.random() * 4
    }
    return a
  }, [])

  useFrame((_, dt) => {
    if (!motion) return
    if (rainRef.current && rain > 0.05) {
      const attr = rainRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = attr.array as Float32Array
      for (let i = 0; i < count; i++) {
        arr[i * 3]! += wind * dt * 1.8
        arr[i * 3 + 1]! -= (1.8 + rain * 4) * dt * (0.7 + (i % 5) * 0.1)
        if (arr[i * 3 + 1]! < -1) {
          arr[i * 3 + 1] = 5.5
          arr[i * 3] = (Math.random() - 0.5) * 14
        }
        if (arr[i * 3]! > 7) arr[i * 3] = -7
      }
      attr.needsUpdate = true
      ;(rainRef.current.material as THREE.PointsMaterial).opacity = 0.15 + rain * 0.55
    }
    if (fogRef.current) {
      const m = fogRef.current.material as THREE.MeshBasicMaterial
      m.opacity = fog * 0.35
      fogRef.current.position.x += dt * wind * 0.15
      if (fogRef.current.position.x > 3) fogRef.current.position.x = -3
    }
  })

  if (rain < 0.04 && fog < 0.04) return null

  return (
    <>
      {rain > 0.04 ? (
        <points ref={rainRef} renderOrder={4}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color="#b8d4ff"
            size={0.035}
            transparent
            depthWrite={false}
            opacity={0.35}
          />
        </points>
      ) : null}
      {fog > 0.04 ? (
        <mesh ref={fogRef} position={[0, -0.2, -2]} scale={[16, 3, 1]} renderOrder={5}>
          <planeGeometry />
          <meshBasicMaterial color="#9aadc8" transparent opacity={fog * 0.3} depthWrite={false} />
        </mesh>
      ) : null}
    </>
  )
}
