import { useEffect, useRef, useState } from 'react'

export type CameraState = {
  x: number
  y: number
}

const EDGE = 0.11
const SPEED = 2.4
const LIMIT = 180

/**
 * Edge-pan camera for the living world.
 * Windows stay fixed on screen; only the scene layer moves.
 */
export function useSceneCamera(enabled = true): CameraState {
  const [cam, setCam] = useState<CameraState>({ x: 0, y: 0 })
  const ptr = useRef({ nx: 0.5, ny: 0.5, inside: false })
  const camRef = useRef(cam)
  camRef.current = cam

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent): void => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      ptr.current = {
        nx: e.clientX / w,
        ny: e.clientY / h,
        inside: true
      }
    }
    const onLeave = (): void => {
      ptr.current.inside = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    let raf = 0
    const tick = (): void => {
      const { nx, ny, inside } = ptr.current
      let dx = 0
      let dy = 0
      if (inside) {
        if (nx < EDGE) dx = -SPEED * (1 - nx / EDGE)
        else if (nx > 1 - EDGE) dx = SPEED * ((nx - (1 - EDGE)) / EDGE)
        if (ny < EDGE) dy = -SPEED * (1 - ny / EDGE)
        else if (ny > 1 - EDGE) dy = SPEED * ((ny - (1 - EDGE)) / EDGE)
      }
      if (dx !== 0 || dy !== 0) {
        const next = {
          x: Math.max(-LIMIT, Math.min(LIMIT, camRef.current.x + dx)),
          y: Math.max(-LIMIT * 0.65, Math.min(LIMIT * 0.65, camRef.current.y + dy))
        }
        camRef.current = next
        setCam(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  return cam
}
