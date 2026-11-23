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
      x: 28,
      y: 36,
      w: 250,
      h: 330,
      z: 8
    },
    {
      id: 'w-browse',
      appId: 'browse',
      title: 'Browser',
      x: Math.round(W * 0.2),
      y: 56,
      w: Math.min(520, Math.round(W * 0.36)),
      h: Math.min(400, Math.round(H * 0.46)),
      z: 10
    },
    {
      id: 'w-media',
      appId: 'media',
      title: 'Media',
      x: Math.round(W * 0.38),
      y: Math.round(H * 0.28),
      w: 320,
      h: 340,
      z: 12
    },
    {
      id: 'w-atmosphere',
      appId: 'atmosphere',
      title: 'Atmosphere',
      x: right(280),
      y: 28,
      w: 280,
      h: 290,
      z: 9
    },
    {
      id: 'w-projects',
      appId: 'projects',
      title: 'Projects',
      x: right(250),
      y: 340,
      w: 250,
      h: 220,
      z: 7
    },
    {
      id: 'w-system',
      appId: 'system',
      title: 'System',
      x: right(270),
      y: bottom(230),
      w: 270,
      h: 230,
      z: 11
    },
    {
      id: 'w-notes',
      appId: 'notes',
      title: 'Notes',
      x: 28,
      y: bottom(170),
      w: 260,
      h: 170,
      z: 6
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

  return { windows, openApp, focus, close, move, resize, minimize }
}
