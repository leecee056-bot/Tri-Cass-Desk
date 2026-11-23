import { useCallback, useState } from 'react'
import { APP_META, type DeskWindow } from './types'

let zCounter = 20
let idCounter = 1

function layoutDefaults(): DeskWindow[] {
  const W = typeof window !== 'undefined' ? window.innerWidth : 1440
  const H = typeof window !== 'undefined' ? window.innerHeight : 900
  const right = (w: number, pad = 28): number => Math.max(24, W - w - pad)
  const bottom = (h: number, pad = 110): number => Math.max(48, H - h - pad)

  return [
    {
      id: 'w-health',
      appId: 'health',
      title: 'Mood',
      x: 32,
      y: 40,
      w: 240,
      h: 340,
      z: 8
    },
    {
      id: 'w-browse',
      appId: 'browse',
      title: 'Browser',
      x: 290,
      y: 36,
      w: Math.min(520, Math.round(W * 0.36)),
      h: Math.min(400, Math.round(H * 0.42)),
      z: 10
    },
    {
      id: 'w-media',
      appId: 'media',
      title: 'Media',
      x: Math.round(W * 0.48),
      y: bottom(280),
      w: 280,
      h: 260,
      z: 12,
      minimized: true
    },
    {
      id: 'w-atmosphere',
      appId: 'atmosphere',
      title: 'Atmosphere',
      x: right(270),
      y: 32,
      w: 270,
      h: 300,
      z: 9
    },
    {
      id: 'w-projects',
      appId: 'projects',
      title: 'Projects',
      x: right(240),
      y: 350,
      w: 240,
      h: 230,
      z: 7
    },
    {
      id: 'w-system',
      appId: 'system',
      title: 'System',
      x: right(260),
      y: bottom(220),
      w: 260,
      h: 220,
      z: 11
    },
    {
      id: 'w-notes',
      appId: 'notes',
      title: 'Notes',
      x: 32,
      y: bottom(340),
      w: 420,
      h: 320,
      z: 6
    },
    {
      id: 'w-chat',
      appId: 'chat',
      title: 'Chat',
      x: Math.max(48, Math.round(W * 0.08)),
      y: bottom(420),
      w: Math.min(480, Math.round(W * 0.34)),
      h: 400,
      z: 14,
      minimized: false
    }
  ]
}

function stagger(n: number): { x: number; y: number } {
  return { x: 64 + (n % 6) * 40, y: 72 + (n % 5) * 32 }
}

export function useWindowManager() {
  const [windows, setWindows] = useState<DeskWindow[]>(() => layoutDefaults())

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
        return list.map((w) =>
          w.id === existing.id ? { ...w, z: zCounter, minimized: false } : w
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
