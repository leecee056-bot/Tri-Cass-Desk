import { useRef } from 'react'
import type { DeskWindow } from './types'
import './wm.css'

type Props = {
  win: DeskWindow
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMove: (x: number, y: number) => void
  children: React.ReactNode
}

/** Concept-style glass frame — no Apple traffic lights. */
export default function FloatingWindow({
  win,
  onFocus,
  onClose,
  onMinimize,
  onMove,
  children
}: Props): React.JSX.Element | null {
  const drag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null)

  if (win.minimized) return null

  return (
    <section
      className="float-win"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z
      }}
      onMouseDown={onFocus}
    >
      <header
        className="float-bar"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          onFocus()
          drag.current = { ox: e.clientX, oy: e.clientY, sx: win.x, sy: win.y }
          const move = (ev: MouseEvent): void => {
            if (!drag.current) return
            onMove(
              drag.current.sx + (ev.clientX - drag.current.ox),
              Math.max(8, drag.current.sy + (ev.clientY - drag.current.oy))
            )
          }
          const up = (): void => {
            drag.current = null
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', up)
          }
          window.addEventListener('mousemove', move)
          window.addEventListener('mouseup', up)
        }}
      >
        <div className="float-title">{win.title}</div>
        <div className="float-actions">
          <button type="button" className="fa min" aria-label="Minimize" onClick={onMinimize}>
            −
          </button>
          <button type="button" className="fa close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
      </header>
      <div className="float-body">{children}</div>
    </section>
  )
}
