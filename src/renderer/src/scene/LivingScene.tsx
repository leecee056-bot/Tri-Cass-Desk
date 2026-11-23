import { useEffect, useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import landscape from '../assets/earthbound-landscape.jpg'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

type Ptr = { x: number; y: number; active: boolean }

/**
 * Fully living environment: continuous water, twinkle, aurora, breeze flora,
 * and mood colour wash driven by live telemetry + pointer proximity.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ptr = useRef<Ptr>({ x: 0.5, y: 0.5, active: false })
  const { solar, weather, celestial, activity, system, health, userPreferences } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.045
      : activity.workspaceState === 'resting'
        ? 1.022
        : 1

  const moodWash = useMemo(() => {
    const load = system.cpuLoad
    const band = health.band
    const day = solar.daylight
    const warmth = weather.skyWarmth
    const hues: Record<typeof band, [number, number, number]> = {
      tranquil: [80, 160, 255],
      balanced: [90, 220, 180],
      focused: [255, 210, 90],
      intense: [255, 140, 70],
      strained: [200, 140, 255]
    }
    const [r, g, b] = hues[band]
    return {
      tint: `rgba(${r}, ${g}, ${b}, ${0.08 + load * 0.18})`,
      top: `rgba(${Math.round(10 + warmth * 40)}, ${Math.round(16 + day * 35)}, ${Math.round(40 + day * 50)}, ${0.2 + weather.cloudCover * 0.12})`,
      mid: `rgba(${Math.round(30 + warmth * 80)}, ${Math.round(24 + warmth * 25)}, ${Math.round(50)}, ${0.1 + (1 - day) * 0.12})`,
      bottom: `rgba(4, 6, 14, ${0.2 + weather.fog * 0.25 + load * 0.1})`,
      accent: `rgb(${r}, ${g}, ${b})`
    }
  }, [health.band, system.cpuLoad, solar.daylight, weather.skyWarmth, weather.cloudCover, weather.fog])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onMove = (e: PointerEvent): void => {
      const rect = root.getBoundingClientRect()
      ptr.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true
      }
      root.style.setProperty('--mx', String(ptr.current.x))
      root.style.setProperty('--my', String(ptr.current.y))
    }
    const onLeave = (): void => {
      ptr.current.active = false
    }
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
    }
  }, [])

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

    const stars = Array.from({ length: 220 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 520) / 1000,
      r: 0.35 + ((i * 17) % 16) / 10,
      a: 0.15 + ((i * 13) % 85) / 100,
      tw: 0.6 + (i % 9) * 0.35,
      phase: (i * 0.37) % (Math.PI * 2)
    }))

    const drops = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.45 + Math.random() * 1.5
    }))

    const ripples = Array.from({ length: 5 }, (_, i) => ({
      phase: i * 1.3,
      amp: 0.35 + i * 0.1,
      freq: 1.2 + i * 0.35
    }))

    const fireflies = Array.from({ length: 28 }, (_, i) => ({
      x: 0.05 + ((i * 37) % 90) / 100,
      y: 0.62 + ((i * 19) % 32) / 100,
      r: 1.2 + (i % 4) * 0.4,
      phase: i * 0.7,
      speed: 0.00025 + (i % 5) * 0.00008
    }))

    const start = performance.now()

    const draw = (now: number): void => {
      if (!running) return
      const t = (now - start) / 1000
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const fxOn = userPreferences.weatherEffects
      const celOn = userPreferences.celestialEffects
      const wind = weather.wind + (ptr.current.active ? 0.15 : 0)
      const reduced = motion === 'reduced'
      const off = motion === 'off'

      // —— Aurora (continuous, GPU-linked) ——
      if (celOn && (celestial.aurora > 0.02 || system.cpuLoad > 0.2)) {
        const strength = Math.max(celestial.aurora, system.cpuLoad * 0.35)
        const wave = off ? 0 : Math.sin(t * 0.7) * 36 * strength
        const g = ctx.createLinearGradient(0, 0, w, h * 0.48)
        g.addColorStop(0, `rgba(40,255,170,${0.05 + strength * 0.32})`)
        g.addColorStop(0.4, `rgba(110,90,255,${0.04 + strength * 0.22})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(0, h * 0.05)
        ctx.bezierCurveTo(w * 0.25, h * 0.01 + wave, w * 0.55, h * 0.14 - wave, w, h * 0.03)
        ctx.lineTo(w, h * 0.4)
        ctx.lineTo(0, h * 0.42)
        ctx.closePath()
        ctx.fill()
      }

      // —— Twinkling stars / lights ——
      if (celOn) {
        const vis = Math.max(celestial.starVisibility, (1 - solar.daylight) * 0.55)
        if (vis > 0.04) {
          for (const s of stars) {
            const tw = off ? 1 : 0.45 + 0.55 * Math.sin(t * s.tw + s.phase)
            ctx.beginPath()
            ctx.fillStyle = `rgba(255,255,255,${s.a * vis * tw})`
            ctx.arc(s.x * w, s.y * h, s.r * dpr * (0.85 + tw * 0.35), 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // —— Living water (lake ripples + shimmer) ——
      {
        const lakeY = h * 0.62
        const lakeH = h * 0.28
        const lakeX = w * 0.12
        const lakeW = w * 0.76
        ctx.save()
        ctx.beginPath()
        ctx.ellipse(w * 0.5, lakeY + lakeH * 0.35, lakeW * 0.48, lakeH * 0.42, 0, 0, Math.PI * 2)
        ctx.clip()

        const waterAlpha = 0.12 + weather.rain * 0.1 + solar.daylight * 0.08
        for (const rip of ripples) {
          const yOff = off ? 0 : Math.sin(t * rip.freq + rip.phase) * 6 * dpr * rip.amp
          const grad = ctx.createLinearGradient(lakeX, lakeY + yOff, lakeX + lakeW, lakeY + lakeH)
          grad.addColorStop(0, `rgba(120, 180, 255, 0)`)
          grad.addColorStop(0.45, `rgba(160, 210, 255, ${waterAlpha * rip.amp})`)
          grad.addColorStop(1, `rgba(80, 140, 220, 0)`)
          ctx.fillStyle = grad
          ctx.fillRect(lakeX, lakeY + yOff, lakeW, lakeH)
        }

        // Wind-driven surface lines
        if (!off) {
          ctx.strokeStyle = `rgba(200, 230, 255, ${0.08 + wind * 0.2})`
          ctx.lineWidth = 1 * dpr
          for (let i = 0; i < 14; i++) {
            const yy = lakeY + lakeH * 0.2 + i * 8 * dpr
            const phase = t * (1.2 + wind) + i * 0.4
            ctx.beginPath()
            for (let x = 0; x <= lakeW; x += 12 * dpr) {
              const px = lakeX + x
              const py = yy + Math.sin(phase + x * 0.02) * (2 + wind * 5) * dpr
              if (x === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            }
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      // —— Waterfall shimmer ——
      if (!off) {
        const fx = w * 0.48
        const fy = h * 0.42
        ctx.strokeStyle = `rgba(220, 240, 255, ${0.15 + Math.sin(t * 8) * 0.08})`
        ctx.lineWidth = 2 * dpr
        for (let i = 0; i < 5; i++) {
          const ox = (i - 2) * 4 * dpr
          ctx.beginPath()
          ctx.moveTo(fx + ox, fy)
          ctx.lineTo(fx + ox + Math.sin(t * 6 + i) * 3 * dpr, fy + h * 0.18)
          ctx.stroke()
        }
      }

      // —— Firefly / flora lights (twinkle near vegetation) ——
      for (const f of fireflies) {
        if (!off) {
          f.x += Math.sin(t + f.phase) * f.speed
          f.y += Math.cos(t * 0.7 + f.phase) * f.speed * 0.6
        }
        const glow = off ? 0.5 : 0.35 + 0.65 * Math.sin(t * 2.2 + f.phase)
        const near =
          ptr.current.active &&
          Math.hypot(ptr.current.x - f.x, ptr.current.y - f.y) < 0.12
            ? 1.6
            : 1
        ctx.beginPath()
        ctx.fillStyle = `rgba(180, 120, 255, ${0.25 * glow * near})`
        ctx.arc(f.x * w, f.y * h, f.r * dpr * 2.2 * near, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.fillStyle = `rgba(230, 200, 255, ${0.55 * glow * near})`
        ctx.arc(f.x * w, f.y * h, f.r * dpr * near, 0, Math.PI * 2)
        ctx.fill()
      }

      // —— Rain ——
      if (fxOn && weather.rain > 0.05 && !off) {
        ctx.strokeStyle = `rgba(190, 215, 255, ${0.16 + weather.rain * 0.42})`
        ctx.lineWidth = 1.1 * dpr
        const speed = reduced ? 0.0009 : 0.0022
        for (const d of drops) {
          if (Math.random() > Math.min(1, weather.rain + 0.2)) continue
          d.y = (d.y + d.s * speed * 16) % 1
          d.x = (d.x + wind * 0.00055 + 1) % 1
          ctx.beginPath()
          ctx.moveTo(d.x * w, d.y * h)
          ctx.lineTo(d.x * w + 2 * dpr + wind * 14, d.y * h + 16 * dpr * d.s)
          ctx.stroke()
        }
      }

      // —— Fog ——
      if (fxOn && weather.fog > 0.04) {
        const fog = ctx.createLinearGradient(0, h * 0.4, 0, h)
        fog.addColorStop(0, 'rgba(160,180,210,0)')
        fog.addColorStop(0.45, `rgba(150,170,200,${weather.fog * 0.22})`)
        fog.addColorStop(1, `rgba(90,110,140,${weather.fog * 0.34})`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, w, h)
      }

      // —— Cloud veil ——
      if (fxOn && weather.cloudCover > 0.3) {
        ctx.fillStyle = `rgba(8, 12, 26, ${(weather.cloudCover - 0.3) * 0.5})`
        ctx.fillRect(0, 0, w, h * 0.52)
      }

      raf = requestAnimationFrame(draw)
    }

    if (motion === 'off') {
      draw(start)
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [
    weather.rain,
    weather.wind,
    weather.fog,
    weather.cloudCover,
    celestial.aurora,
    celestial.starVisibility,
    solar.daylight,
    system.cpuLoad,
    userPreferences.motion,
    userPreferences.weatherEffects,
    userPreferences.celestialEffects
  ])

  const breeze = 0.35 + weather.wind * 0.9 + system.processChurn * 0.4

  return (
    <div
      ref={rootRef}
      className="living-scene"
      style={
        {
          '--idle-scale': String(idleScale),
          '--grade-top': moodWash.top,
          '--grade-mid': moodWash.mid,
          '--grade-bottom': moodWash.bottom,
          '--mood-tint': moodWash.tint,
          '--mood-accent': moodWash.accent,
          '--breeze': String(breeze),
          '--load': String(system.cpuLoad),
          '--parallax': String(weather.wind * 10 + system.processChurn * 5),
          '--lake-glow': String(0.2 + solar.daylight * 0.3 + weather.skyWarmth * 0.25),
          '--mx': '0.5',
          '--my': '0.5'
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-condition={weather.condition}
      data-mood={health.band}
    >
      <img className="scene-plate" src={landscape} alt="" draggable={false} />
      <div className="mood-wash" aria-hidden />
      <div className="scene-grade" aria-hidden />
      <div className="aurora-band" aria-hidden />
      <div className="star-field" aria-hidden />
      <div className="water-sheet" aria-hidden />

      {/* Interactive vegetation layers — breeze + pointer proximity */}
      <div className="flora-layer left" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={`fl-${i}`} className="flora-stem" style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <div className="flora-layer right" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={`fr-${i}`} className="flora-stem" style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <div className="tree-sway left" aria-hidden />
      <div className="tree-sway right" aria-hidden />

      <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
      <div className="scene-vignette" aria-hidden />
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Living · {health.band} · {weather.condition} · CPU {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
