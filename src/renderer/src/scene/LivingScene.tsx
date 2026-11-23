import { useEffect, useMemo, useRef } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import landscape from '../assets/earthbound-landscape.jpg'
import './living-scene.css'

type Props = {
  state: EnvironmentState
}

/**
 * Living environment layer — the landscape IS the desk atmosphere.
 * Not a wallpaper behind chrome: full-bleed cinematic scene with
 * telemetry-driven weather overlays. Celestial detail lives in the
 * painted plate; canvas adds rain/fog/wind motion only.
 */
export default function LivingScene({ state }: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { solar, weather, activity, userPreferences } = state

  const idleScale =
    activity.workspaceState === 'ambient_idle'
      ? 1.035
      : activity.workspaceState === 'resting'
        ? 1.018
        : 1

  const grade = useMemo(() => {
    const day = solar.daylight
    const warmth = weather.skyWarmth
    return {
      top: `rgba(${Math.round(20 + warmth * 40)}, ${Math.round(24 + day * 30)}, ${Math.round(48 + day * 40)}, ${0.18 - day * 0.1})`,
      mid: `rgba(${Math.round(40 + warmth * 80)}, ${Math.round(30 + warmth * 20)}, ${Math.round(60 - warmth * 20)}, ${0.12 + (1 - day) * 0.08})`,
      bottom: `rgba(8, 10, 22, ${0.22 + weather.fog * 0.2})`
    }
  }, [solar.daylight, weather.skyWarmth, weather.fog])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!userPreferences.weatherEffects) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

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

    const drops = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.45 + Math.random() * 1.3
    }))

    const draw = (): void => {
      if (!running) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      if (weather.rain > 0.08 && motion !== 'off') {
        ctx.strokeStyle = `rgba(190, 215, 255, ${0.12 + weather.rain * 0.32})`
        ctx.lineWidth = 1.1 * dpr
        const speed = motion === 'reduced' ? 0.0007 : 0.0017
        for (const d of drops) {
          if (Math.random() > weather.rain) continue
          d.y = (d.y + d.s * speed * 16) % 1
          d.x = (d.x + weather.wind * 0.00035) % 1
          const x = d.x * w
          const y = d.y * h
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + 2 * dpr + weather.wind * 10, y + 14 * dpr * d.s)
          ctx.stroke()
        }
      }

      if (weather.fog > 0.05) {
        const fog = ctx.createLinearGradient(0, h * 0.42, 0, h)
        fog.addColorStop(0, 'rgba(160,180,210,0)')
        fog.addColorStop(0.45, `rgba(150,170,200,${weather.fog * 0.16})`)
        fog.addColorStop(1, `rgba(110,130,160,${weather.fog * 0.26})`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, w, h)
      }

      if (weather.cloudCover > 0.55) {
        ctx.fillStyle = `rgba(12, 16, 32, ${(weather.cloudCover - 0.55) * 0.28})`
        ctx.fillRect(0, 0, w, h * 0.55)
      }

      raf = requestAnimationFrame(draw)
    }

    if (motion === 'off') {
      draw()
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [weather.rain, weather.wind, weather.fog, weather.cloudCover, userPreferences.motion, userPreferences.weatherEffects])

  return (
    <div
      className="living-scene"
      style={
        {
          '--idle-scale': String(idleScale),
          '--grade-top': grade.top,
          '--grade-mid': grade.mid,
          '--grade-bottom': grade.bottom,
          '--parallax': String(weather.wind * 0.4)
        } as React.CSSProperties
      }
      data-phase={solar.phase}
      data-condition={weather.condition}
    >
      <img
        className="scene-plate"
        src={landscape}
        alt=""
        draggable={false}
      />
      <div className="scene-grade" aria-hidden />
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden />
      <div className="scene-vignette" aria-hidden />
    </div>
  )
}
