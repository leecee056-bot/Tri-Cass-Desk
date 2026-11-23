import { useEffect, useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import landscape from '../assets/earthbound-landscape.jpg'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Living environment — landscape plate + telemetry-driven FX layers.
 * Rain/fog/clouds/aurora/heat respond to EnvironmentState every poll.
 * Not a static wallpaper: overlays + grade + parallax change with load.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { solar, weather, celestial, activity, system, userPreferences } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.04
      : activity.workspaceState === 'resting'
        ? 1.02
        : 1

  const grade = useMemo(() => {
    const day = solar.daylight
    const warmth = weather.skyWarmth
    const load = system.cpuLoad
    return {
      top: `rgba(${Math.round(16 + warmth * 50 + load * 20)}, ${Math.round(20 + day * 40)}, ${Math.round(40 + day * 50)}, ${0.22 - day * 0.12 + weather.cloudCover * 0.08})`,
      mid: `rgba(${Math.round(36 + warmth * 90)}, ${Math.round(28 + warmth * 30)}, ${Math.round(55 - warmth * 15)}, ${0.1 + (1 - day) * 0.1 + weather.fog * 0.08})`,
      bottom: `rgba(6, 8, 18, ${0.18 + weather.fog * 0.25 + load * 0.08})`,
      heat: weather.heatShimmer
    }
  }, [solar.daylight, weather.skyWarmth, weather.fog, weather.cloudCover, weather.heatShimmer, system.cpuLoad])

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

    const stars = Array.from({ length: 160 }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 550) / 1000,
      r: 0.4 + ((i * 17) % 14) / 10,
      a: 0.2 + ((i * 13) % 80) / 100,
      tw: (i % 7) + 1
    }))

    const drops = Array.from({ length: 160 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.45 + Math.random() * 1.4
    }))

    const start = performance.now()

    const draw = (now: number): void => {
      if (!running) return
      const t = now - start
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const fxOn = userPreferences.weatherEffects
      const celOn = userPreferences.celestialEffects

      // Aurora curtain (GPU / artistic celestial)
      if (celOn && celestial.aurora > 0.04) {
        const wave = motion === 'off' ? 0 : Math.sin(t / 1600) * 28 * celestial.aurora
        const g = ctx.createLinearGradient(0, 0, w, h * 0.5)
        g.addColorStop(0, `rgba(60,255,170,${0.04 + celestial.aurora * 0.28})`)
        g.addColorStop(0.45, `rgba(100,90,255,${0.03 + celestial.aurora * 0.2})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(0, h * 0.06)
        ctx.bezierCurveTo(w * 0.28, h * 0.02 + wave, w * 0.6, h * 0.16 - wave, w, h * 0.04)
        ctx.lineTo(w, h * 0.38)
        ctx.lineTo(0, h * 0.4)
        ctx.closePath()
        ctx.fill()
      }

      // Twinkling stars over plate at night
      if (celOn && celestial.starVisibility > 0.06) {
        for (const s of stars) {
          const tw =
            motion === 'off' ? 1 : 0.65 + 0.35 * Math.sin(t / (400 * s.tw) + s.x * 10)
          ctx.beginPath()
          ctx.fillStyle = `rgba(255,255,255,${s.a * celestial.starVisibility * tw})`
          ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Rain from CPU / churn
      if (fxOn && weather.rain > 0.06 && motion !== 'off') {
        ctx.strokeStyle = `rgba(190, 215, 255, ${0.14 + weather.rain * 0.4})`
        ctx.lineWidth = 1.15 * dpr
        const speed = motion === 'reduced' ? 0.0008 : 0.002
        for (const d of drops) {
          if (Math.random() > Math.min(1, weather.rain + 0.15)) continue
          d.y = (d.y + d.s * speed * 16) % 1
          d.x = (d.x + weather.wind * 0.0005 + 1) % 1
          const x = d.x * w
          const y = d.y * h
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 2 * dpr + weather.wind * 12, y + 16 * dpr * d.s)
          ctx.stroke()
        }
      }

      // Fog / valley mist
      if (fxOn && weather.fog > 0.04) {
        const fog = ctx.createLinearGradient(0, h * 0.4, 0, h)
        fog.addColorStop(0, 'rgba(160,180,210,0)')
        fog.addColorStop(0.4, `rgba(150,170,200,${weather.fog * 0.2})`)
        fog.addColorStop(1, `rgba(100,120,150,${weather.fog * 0.32})`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, w, h)
      }

      // Cloud veil
      if (fxOn && weather.cloudCover > 0.35) {
        ctx.fillStyle = `rgba(10, 14, 28, ${(weather.cloudCover - 0.35) * 0.45})`
        ctx.fillRect(0, 0, w, h * 0.55)
      }

      // Heat shimmer bands near horizon
      if (fxOn && weather.heatShimmer > 0.12 && motion !== 'off') {
        const y0 = h * 0.55
        for (let i = 0; i < 6; i++) {
          const oy = Math.sin(t / 500 + i) * 3 * dpr * weather.heatShimmer
          ctx.fillStyle = `rgba(255, 180, 120, ${0.015 + weather.heatShimmer * 0.03})`
          ctx.fillRect(0, y0 + i * 8 * dpr + oy, w, 3 * dpr)
        }
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
    weather.heatShimmer,
    celestial.aurora,
    celestial.starVisibility,
    userPreferences.motion,
    userPreferences.weatherEffects,
    userPreferences.celestialEffects
  ])

  return (
    <div
      className="living-scene"
      style={
        {
          '--idle-scale': String(idleScale),
          '--grade-top': grade.top,
          '--grade-mid': grade.mid,
          '--grade-bottom': grade.bottom,
          '--parallax': String(weather.wind * 8 + system.processChurn * 4),
          '--heat': String(grade.heat),
          '--load': String(system.cpuLoad),
          '--lake-glow': String(0.15 + solar.daylight * 0.25 + weather.skyWarmth * 0.2)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-condition={weather.condition}
      data-fresh={state.freshness}
    >
      <img className="scene-plate" src={landscape} alt="" draggable={false} />
      <div className="scene-lake-sheen" aria-hidden />
      <div className="scene-grade" aria-hidden />
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
      <div className="scene-vignette" aria-hidden />
      <div className="scene-live" aria-live="polite">
        <span className="live-dot" />
        Live · {weather.condition} · CPU {Math.round(system.cpuLoad * 100)}%
      </div>
    </div>
  )
}
