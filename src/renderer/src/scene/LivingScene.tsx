import { useEffect, useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import refArt from '../assets/earthbound-ref.png'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string): number[] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]
  const A = parse(a)
  const B = parse(b)
  const m = (i: number): string =>
    Math.round(A[i] + (B[i] - A[i]) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${m(0)}${m(1)}${m(2)}`
}

export default function LivingScene({ state }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { solar, weather, celestial, activity, userPreferences } = state

  const sky = useMemo(() => {
    const night = '#050814'
    const dusk = '#1a1740'
    const day = lerpColor('#4f7cff', '#ffb37a', weather.skyWarmth)
    const top = lerpColor(night, day, solar.daylight)
    const mid = lerpColor(dusk, lerpColor('#6a8cff', '#ff9b6a', weather.skyWarmth), solar.daylight)
    const horizon = lerpColor('#2a1848', lerpColor('#ffc58a', '#ff7a4a', weather.skyWarmth), solar.daylight)
    return { top, mid, horizon }
  }, [solar.daylight, weather.skyWarmth])

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.04
      : activity.workspaceState === 'resting'
        ? 1.02
        : 1

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

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: 0.4 + Math.random() * 1.4,
      a: 0.25 + Math.random() * 0.75
    }))

    const drops = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.4 + Math.random() * 1.2
    }))

    const start = performance.now()

    const draw = (t: number): void => {
      if (!running) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Aurora (artistic / GPU-driven)
      if (celestial.aurora > 0.05 && celestial.starVisibility > 0.05) {
        const g = ctx.createLinearGradient(0, 0, w, h * 0.45)
        g.addColorStop(0, `rgba(80,255,180,${0.05 + celestial.aurora * 0.22})`)
        g.addColorStop(0.45, `rgba(120,90,255,${0.04 + celestial.aurora * 0.18})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        const wave = motion === 'off' ? 0 : Math.sin(t / 1800) * 30 * celestial.aurora
        ctx.moveTo(0, h * 0.08)
        ctx.bezierCurveTo(w * 0.25, h * 0.02 + wave, w * 0.55, h * 0.18 - wave, w, h * 0.05)
        ctx.lineTo(w, h * 0.4)
        ctx.lineTo(0, h * 0.42)
        ctx.closePath()
        ctx.fill()
      }

      // Milky Way band
      if (celestial.milkyWay > 0.08) {
        ctx.save()
        ctx.translate(w * 0.55, h * 0.12)
        ctx.rotate(-0.55)
        const band = ctx.createLinearGradient(0, -40 * dpr, 0, 40 * dpr)
        band.addColorStop(0, 'rgba(255,255,255,0)')
        band.addColorStop(0.5, `rgba(210,220,255,${0.08 + celestial.milkyWay * 0.18})`)
        band.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = band
        ctx.fillRect(-w, -50 * dpr, w * 2, 100 * dpr)
        ctx.restore()
      }

      // Stars
      if (celestial.starVisibility > 0.05) {
        for (const s of stars) {
          ctx.beginPath()
          ctx.fillStyle = `rgba(255,255,255,${s.a * celestial.starVisibility})`
          ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Rain
      if (weather.rain > 0.08 && motion !== 'off') {
        ctx.strokeStyle = `rgba(180,210,255,${0.15 + weather.rain * 0.35})`
        ctx.lineWidth = 1 * dpr
        const speed = motion === 'reduced' ? 0.0008 : 0.0018
        for (const d of drops) {
          if (Math.random() > weather.rain) continue
          d.y = (d.y + d.s * speed * 16) % 1
          d.x = (d.x + weather.wind * 0.0004) % 1
          const x = d.x * w
          const y = d.y * h
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 2 * dpr + weather.wind * 8, y + 12 * dpr * d.s)
          ctx.stroke()
        }
      }

      // Fog veil
      if (weather.fog > 0.05) {
        const fog = ctx.createLinearGradient(0, h * 0.45, 0, h)
        fog.addColorStop(0, `rgba(160,180,210,0)`)
        fog.addColorStop(0.4, `rgba(150,170,200,${weather.fog * 0.18})`)
        fog.addColorStop(1, `rgba(120,140,170,${weather.fog * 0.28})`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, w, h)
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
  }, [celestial, weather.rain, weather.wind, weather.fog, userPreferences.motion])

  const refOpacity = 0.42 + solar.daylight * 0.2 - weather.fog * 0.15

  return (
    <div
      className="living-scene"
      style={
        {
          '--sky-top': sky.top,
          '--sky-mid': sky.mid,
          '--sky-horizon': sky.horizon,
          '--cloud': String(weather.cloudCover),
          '--warm': String(weather.skyWarmth),
          '--idle-scale': String(idleScale),
          '--shimmer': String(weather.heatShimmer),
          '--ref-opacity': String(Math.max(0.2, refOpacity))
        } as React.CSSProperties
      }
    >
      <img className="ref-plate" src={refArt} alt="" draggable={false} />
      <div className="sky" />
      <div className="clouds" />
      <div className="moon" style={{ opacity: celestial.moonGlow * 0.55 }} />
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
      <div className="ridges" />
      <div className="waterfall" />
      <div className="lake" />
      <div className="trees left" />
      <div className="trees right" />
      <div className="flora" />
      <div className="vignette" />
    </div>
  )
}
