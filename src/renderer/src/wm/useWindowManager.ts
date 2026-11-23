import { useCallback, useState } from 'react'
import { APP_META, type DeskWindow } from './types'

let zCounter = 10
let idCounter = 1

function stagger(n: number): { x: number; y: number } {
  return { x: 48 + (n % 6) * 36, y: 56 + (n % 5) * 28 }
}

export function useWindowManager() {
  const [windows, setWindows] = useState<DeskWindow[]>(() => {
    const a = stagger(0)
    const b = stagger(1)
    const c = stagger(2)
    return [
      {
        id: 'w-system',
        appId: 'system',
        title: 'System',
        x: typeof window !== 'undefined' ? Math.max(40, window.innerWidth - 340) : 900,
        y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 360) : 520,
        w: 300,
        h: 280,
        z: 5
      },
      {
        id: 'w-health',
        appId: 'health',
        title: 'Machine mood',
        x: 40,
        y: 80,
        w: 280,
        h: 300,
        z: 4
      },
      {
        id: 'w-chat',
        appId: 'chat',
        title: 'Chat',
        x: a.x + 280,
        y: a.y + 40,
        w: 440,
        h: 520,
        z: 6
      },
      {
        id: 'w-clock',
        appId: 'clock',
        title: 'Clock',
        x: typeof window !== 'undefined' ? Math.max(40, window.innerWidth - 260) : 980,
        y: 40,
        w: 220,
        h: 140,
        z: 3
      }
    ]
  })

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
        win.id === id ? { ...win, w: Math.max(260, w), h: Math.max(160, h) } : win
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
