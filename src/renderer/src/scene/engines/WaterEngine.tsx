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
 * three-stdlib Water (three.js addon, MIT) + waternormals.jpg from three.js examples.
 */
export function WaterEngine({ mood, motion, sunDir, normals }: Props): React.JSX.Element {
  const water = useMemo(() => {
    normals.wrapS = normals.wrapT = THREE.RepeatWrapping
    const geom = new THREE.CircleGeometry(14, 64)
    const w = new Water(geom, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: sunDir.clone(),
      sunColor: 0xffffff,
      waterColor: 0x1a6a7c,
      distortionScale: 3.2,
      fog: false,
      alpha: 1
    })
    w.rotation.x = -Math.PI / 2
    w.position.set(0, 0, 0)
    return w
  }, [normals])

  const ref = useRef(water)

  useFrame((_, dt) => {
    const mat = ref.current.material as THREE.ShaderMaterial
    if (motion) mat.uniforms['time'].value += dt * (0.35 + mood.wind * 0.7)
    mat.uniforms['sunDirection'].value.copy(sunDir)
    // Lift night water so the lake reads as water, not a black band
    const nightLift = mood.nightness * 0.35
    const base = new THREE.Color(0x1a6a7c).offsetHSL(0, -nightLift * 0.15, nightLift * 0.12)
    const warm = new THREE.Color(0x5a4820)
    mat.uniforms['waterColor'].value.copy(base).lerp(warm, mood.heat * 0.4)
    mat.uniforms['distortionScale'].value = 2.6 + mood.wind * 2.2
  })

  return <primitive object={water} ref={ref} />
}
