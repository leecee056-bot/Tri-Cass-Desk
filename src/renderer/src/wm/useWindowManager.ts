import { useCallback, useState } from 'react'
import { APP_META, type DeskWindow } from './types'

let zCounter = 20
let idCounter = 1

/** Fresh launch — empty desk. Apps open only from the dock. */
function layoutDefaults(): DeskWindow[] {
  return []
}

function stagger(n: number): { x: number; y: number } {
  return { x: 64 + (n % 6) * 40, y: 72 + (n % 5) * 32 }
}

export function useWindowManager() {
  const [windows, setWindows] = useState<DeskWindow[]>(layoutDefaults)

  const focus = useCallback((id: string) => {
    zCounter += 1
    setWindows((list) => list.map((w) => (w.id === id ? { ...w, z: zCounter, minimized: false } : w)))
  }, [])

  const close = useCallback((id: string) => {
    setWindows((list) => list.filter((w) => w.id !== id))
  }, [])

  const move = useCallback((id: string, x: number, y: number) => {
    setWindows((list) => list.map((w) => (w.id === id ? { ...w, x, y } : w)))
  }, [])

  const resize = useCallback((id: string, w: number, h: number) => {
    setWindows((list) =>
      list.map((win) =>
        win.id === id ? { ...win, w: Math.max(220, w), h: Math.max(140, h) } : win
      )
    )
  }, [])

  const openApp = useCallback((appId: string, title?: string, payload?: Record<string, string>) => {
    setWindows((list) => {
      const existing = list.find((w) => w.appId === appId && !payload)
      if (existing && !payload) {
        zCounter += 1
        const meta = APP_META[appId]
        return list.map((w) =>
          w.id === existing.id
            ? {
                ...w,
                z: zCounter,
                minimized: false,
                w: meta && w.w < meta.w ? meta.w : w.w,
                h: meta && w.h < meta.h ? meta.h : w.h
              }
            : w
        )
      }
      const meta = APP_META[appId] || { title: title || appId, w: 480, h: 420, icon: '◇' }
      const pos = stagger(list.length)
      zCounter += 1
      const next: DeskWindow = {
        id: `w-${idCounter++}`,
        appId,
        title: title || meta.title,
        x: pos.x,
        y: pos.y,
        w: meta.w,
        h: meta.h,
        z: zCounter,
        payload
      }
      return [...list, next]
    })
  }, [])

  const minimize = useCallback((id: string) => {
    setWindows((list) => list.map((w) => (w.id === id ? { ...w, minimized: true } : w)))
  }, [])

  const maximize = useCallback((id: string) => {
    zCounter += 1
    const topZ = Math.max(zCounter, 20000)
    zCounter = topZ
    setWindows((list) =>
      list.map((w) => {
        if (w.id !== id) return w
        if (w.maximized && w.restore) {
          return {
            ...w,
            maximized: false,
            x: w.restore.x,
            y: w.restore.y,
            w: w.restore.w,
            h: w.restore.h,
            restore: undefined,
            z: topZ,
            minimized: false
          }
        }
        return {
          ...w,
          maximized: true,
          restore: { x: w.x, y: w.y, w: w.w, h: w.h },
          z: topZ,
          minimized: false
        }
      })
    )
  }, [])

  return { windows, openApp, focus, close, move, resize, minimize, maximize }
}
