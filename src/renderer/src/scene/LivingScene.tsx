import { useEffect, useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import landscape from '../assets/earthbound-landscape.jpg'
import { useSceneCamera } from './useSceneCamera'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Game-like living world: camera pans on edge push (windows stay put),
 * sky/clouds/aurora/day-night engines react to telemetry.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cam = useSceneCamera(state.userPreferences.motion !== 'off')
  const { solar, weather, celestial, activity, system, health, userPreferences } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.03
      : activity.workspaceState === 'resting'
        ? 1.015
        : 1

  const mood = useMemo(() => {
    const load = system.cpuLoad
    const day = solar.daylight
    const band = health.band
    const hues: Record<typeof band, string> = {
      tranquil: 'rgba(90,160,255,0.16)',
      balanced: 'rgba(90,220,170,0.14)',
      focused: 'rgba(255,200,80,0.16)',
      intense: 'rgba(255,120,60,0.18)',
      strained: 'rgba(190,120,255,0.18)'
    }
    // Day → night sky wash
    const skyNight = 1 - day
    return {
      tint: hues[band],
      night: skyNight,
      day,
      energy: 0.35 + load * 0.65 + celestial.aurora * 0.2,
      wind: weather.wind + system.processChurn * 0.35,
      warmth: weather.skyWarmth
    }
  }, [
    health.band,
    system.cpuLoad,
    system.processChurn,
    solar.daylight,
    celestial.aurora,
    weather.wind,
    weather.skyWarmth
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const motion = userPreferences.motion
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = (): void => {
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 240 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 480) / 1000,
      r: 0.3 + ((i * 17) % 14) / 10,
      a: 0.2 + ((i * 13) % 80) / 100,
      tw: 0.5 + (i % 8) * 0.28,
      phase: (i * 0.41) % (Math.PI * 2)
    }))

    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: (i / 6) * 1.4 - 0.2,
      y: 0.08 + (i % 3) * 0.07,
      w: 0.28 + (i % 3) * 0.08,
      h: 0.06 + (i % 2) * 0.02,
      speed: 0.008 + i * 0.002
    }))

    const drops = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.5 + Math.random() * 1.3
    }))

    const start = performance.now()

    const draw = (now: number): void => {
      if (!running) return
      const t = (now - start) / 1000
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const off = motion === 'off'
      const fxOn = userPreferences.weatherEffects
      const celOn = userPreferences.celestialEffects

      // —— Drifting cloud soft forms (telemetry wind) ——
      if (fxOn) {
        for (const c of clouds) {
          if (!off) c.x += (c.speed * (0.4 + mood.wind)) / 60
          if (c.x > 1.3) c.x = -0.35
          const cx = c.x * w
          const cy = c.y * h
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.w * w * 0.5)
          const a = 0.04 + weather.cloudCover * 0.14
          g.addColorStop(0, `rgba(220,230,255,${a})`)
          g.addColorStop(1, 'rgba(220,230,255,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.ellipse(cx, cy, c.w * w * 0.5, c.h * h * 2.2, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // —— Living aurora curtains ——
      if (celOn && mood.night > 0.15) {
        const strength = Math.max(celestial.aurora, system.cpuLoad * 0.4) * mood.night
        for (let band = 0; band < 3; band++) {
          const phase = t * (0.35 + band * 0.12) + band * 1.7
          const g = ctx.createLinearGradient(0, h * 0.02, 0, h * 0.42)
          g.addColorStop(0, `rgba(${40 + band * 40},${240 - band * 30},${160 + band * 30},${0.04 + strength * 0.22})`)
          g.addColorStop(0.55, `rgba(${90 + band * 20},${80},${220},${0.03 + strength * 0.14})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          const y0 = h * (0.04 + band * 0.03)
          ctx.moveTo(0, y0)
          for (let x = 0; x <= w; x += 24 * dpr) {
            const nx = x / w
            const wave =
              Math.sin(phase + nx * 4.2 + band) * 28 * dpr * strength +
              Math.sin(phase * 1.7 + nx * 9) * 12 * dpr * strength
            ctx.lineTo(x, y0 + wave + Math.sin(phase * 0.5 + nx * 2) * 40 * dpr * strength)
          }
          ctx.lineTo(w, h * 0.45)
          ctx.lineTo(0, h * 0.45)
          ctx.closePath()
          ctx.fill()
        }
      }

      // —— Stars (night) ——
      if (celOn && mood.night > 0.2) {
        const vis = mood.night * (1 - weather.cloudCover * 0.7) * Math.max(celestial.starVisibility, 0.4)
        for (const s of stars) {
          const tw = off ? 1 : 0.4 + 0.6 * Math.sin(t * s.tw + s.phase)
          ctx.beginPath()
          ctx.fillStyle = `rgba(255,255,255,${s.a * vis * tw})`
          ctx.arc(s.x * w, s.y * h, s.r * dpr * (0.8 + tw * 0.4), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // —— Soft lake caustics (no hard scanlines) ——
      {
        const lakeY = h * 0.58
        const lakeH = h * 0.3
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(w * 0.5, lakeY + lakeH * 0.38, w * 0.4, lakeH * 0.4, 0, 0, Math.PI * 2)
        ctx.clip()
        for (let i = 0; i < 4; i++) {
          const yOff = off ? 0 : Math.sin(t * (0.7 + i * 0.25) + i) * 10 * dpr
          const g = ctx.createRadialGradient(
            w * (0.35 + i * 0.1),
            lakeY + lakeH * 0.3 + yOff,
            10,
            w * 0.5,
            lakeY + lakeH * 0.4,
            w * 0.35
          )
          const a = 0.04 + mood.day * 0.04 + Math.sin(t + i) * 0.015
          g.addColorStop(0, `rgba(170,210,255,${Math.max(0, a)})`)
          g.addColorStop(1, 'rgba(170,210,255,0)')
          ctx.fillStyle = g
          ctx.fillRect(0, lakeY, w, lakeH)
        }
        // Soft wind ripples
        if (!off) {
          ctx.globalAlpha = 0.12 + mood.wind * 0.15
          ctx.strokeStyle = 'rgba(200,230,255,0.55)'
          ctx.lineWidth = 1.2 * dpr
          for (let i = 0; i < 8; i++) {
            const yy = lakeY + lakeH * 0.25 + i * 10 * dpr
            ctx.beginPath()
            for (let x = w * 0.15; x < w * 0.85; x += 10 * dpr) {
              const py =
                yy +
                Math.sin(t * (1.1 + mood.wind) + x * 0.012 + i) * (2.5 + mood.wind * 4) * dpr
              if (x === w * 0.15) ctx.moveTo(x, py)
              else ctx.lineTo(x, py)
            }
            ctx.stroke()
          }
          ctx.globalAlpha = 1
        }
        ctx.restore()
      }

      // —— Rain ——
      if (fxOn && weather.rain > 0.08 && !off) {
        ctx.strokeStyle = `rgba(190,215,255,${0.12 + weather.rain * 0.35})`
        ctx.lineWidth = 1 * dpr
        for (const d of drops) {
          if (Math.random() > weather.rain + 0.1) continue
          d.y = (d.y + d.s * 0.002 * 16) % 1
          d.x = (d.x + mood.wind * 0.0005 + 1) % 1
          ctx.beginPath()
          ctx.moveTo(d.x * w, d.y * h)
          ctx.lineTo(d.x * w + 2 * dpr + mood.wind * 10, d.y * h + 14 * dpr * d.s)
          ctx.stroke()
        }
      }

      // —— Fog ——
      if (fxOn && weather.fog > 0.05) {
        const fog = ctx.createLinearGradient(0, h * 0.45, 0, h)
        fog.addColorStop(0, 'rgba(160,180,210,0)')
        fog.addColorStop(1, `rgba(100,120,150,${weather.fog * 0.3})`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, w, h)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [
    weather.rain,
    weather.fog,
    weather.cloudCover,
    celestial.aurora,
    celestial.starVisibility,
    system.cpuLoad,
    mood.night,
    mood.wind,
    mood.day,
    userPreferences.motion,
    userPreferences.weatherEffects,
    userPreferences.celestialEffects
  ])

  return (
    <div
      ref={rootRef}
      className="living-scene"
      style={
        {
          '--idle-scale': String(idleScale),
          '--cam-x': `${cam.x}px`,
          '--cam-y': `${cam.y}px`,
          '--mood-tint': mood.tint,
          '--night': String(mood.night),
          '--day': String(mood.day),
          '--energy': String(mood.energy),
          '--wind': String(mood.wind),
          '--warmth': String(mood.warmth),
          '--load': String(system.cpuLoad)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-mood={health.band}
      data-condition={weather.condition}
    >
      <div className="world-stage" aria-hidden={false}>
        <div className="sky-dome" />
        <div className="sky-drift" />
        <img className="scene-plate" src={landscape} alt="" draggable={false} />
        <div className="day-night-veil" />
        <div className="mood-wash" />
        <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
      </div>
      <div className="scene-vignette" aria-hidden />
      <div className="edge-hint" aria-hidden>
        Push cursor to edges to explore
      </div>
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Living · {health.band} · {solar.phase.replaceAll('_', ' ')} · CPU{' '}
        {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
