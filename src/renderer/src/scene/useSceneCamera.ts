import { useEffect, useRef, useState } from 'react'

export type CameraState = {
  /** Display yaw 0–360 */
  yaw: number
  pitch: number
  x: number
  y: number
  /** Normalized pointer 0..1 for vegetation gusts */
  pointerNx: number
  pointerNy: number
  pointerInside: boolean
}

const EDGE = 0.12
const YAW_SPEED = 0.55
const PITCH_SPEED = 0.32
const PITCH_LIMIT = 28
const YAW_TO_PX = 4.2

/**
 * 360° edge-pan / drag orbit camera.
 * Absolute yaw scrolls forever across tiled plates; HUD shows 0–360.
 * Windows stay fixed on screen.
 */
export function useSceneCamera(enabled = true): CameraState {
  const [cam, setCam] = useState<CameraState>({
    yaw: 0,
    pitch: 0,
    x: 0,
    y: 0,
    pointerNx: 0.5,
    pointerNy: 0.5,
    pointerInside: false
  })
  const abs = useRef({ yaw: 0, pitch: 0 })
  const ptr = useRef({ nx: 0.5, ny: 0.5, inside: false, dragging: false, lastX: 0, lastY: 0 })

  useEffect(() => {
    if (!enabled) return

    const publish = (yawAbs: number, pitch: number): void => {
      const pitchClamped = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch))
      abs.current = { yaw: yawAbs, pitch: pitchClamped }
      setCam({
        yaw: ((yawAbs % 360) + 360) % 360,
        pitch: pitchClamped,
        x: -(yawAbs * YAW_TO_PX),
        y: pitchClamped * 6.5,
        pointerNx: ptr.current.nx,
        pointerNy: ptr.current.ny,
        pointerInside: ptr.current.inside
      })
    }

    const publishPointer = (): void => {
      setCam((c) => ({
        ...c,
        pointerNx: ptr.current.nx,
        pointerNy: ptr.current.ny,
        pointerInside: ptr.current.inside
      }))
    }

    const onMove = (e: PointerEvent): void => {
      const w = window.innerWidth || 1
      const h = window.innerHeight || 1
      ptr.current.nx = e.clientX / w
      ptr.current.ny = e.clientY / h
      ptr.current.inside = true
      publishPointer()

      if (ptr.current.dragging) {
        const dx = e.clientX - ptr.current.lastX
        const dy = e.clientY - ptr.current.lastY
        ptr.current.lastX = e.clientX
        ptr.current.lastY = e.clientY
        publish(abs.current.yaw - dx * 0.18, abs.current.pitch + dy * 0.12)
      }
    }
    const onDown = (e: PointerEvent): void => {
      if (e.button === 1 || e.altKey || e.metaKey) {
        ptr.current.dragging = true
        ptr.current.lastX = e.clientX
        ptr.current.lastY = e.clientY
      }
    }
    const onUp = (): void => {
      ptr.current.dragging = false
    }
    const onLeave = (): void => {
      ptr.current.inside = false
      ptr.current.dragging = false
      publishPointer()
    }
    const onWheel = (e: WheelEvent): void => {
      if (e.shiftKey) {
        e.preventDefault()
        publish(abs.current.yaw + e.deltaY * 0.08, abs.current.pitch)
      } else if (e.altKey) {
        e.preventDefault()
        publish(abs.current.yaw, abs.current.pitch + e.deltaY * 0.04)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('wheel', onWheel, { passive: false })

    let raf = 0
    const tick = (): void => {
      const { nx, ny, inside, dragging } = ptr.current
      if (inside && !dragging) {
        let dyaw = 0
        let dpitch = 0
        if (nx < EDGE) dyaw = -YAW_SPEED * (1 - nx / EDGE) * 3.2
        else if (nx > 1 - EDGE) dyaw = YAW_SPEED * ((nx - (1 - EDGE)) / EDGE) * 3.2
        if (ny < EDGE) dpitch = -PITCH_SPEED * (1 - ny / EDGE) * 2.4
        else if (ny > 1 - EDGE) dpitch = PITCH_SPEED * ((ny - (1 - EDGE)) / EDGE) * 2.4
        if (dyaw !== 0 || dpitch !== 0) {
          publish(abs.current.yaw + dyaw, abs.current.pitch + dpitch)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('wheel', onWheel)
    }
  }, [enabled])

  return cam
}
