import { useEffect, useState } from 'react'
import type { EnvironmentState, SolarPhase } from '../../../shared/environment'

function phaseFromDay(day: number): SolarPhase {
  if (day < 0.08) return 'night'
  if (day < 0.18) return 'astronomical_twilight'
  if (day < 0.3) return 'nautical_twilight'
  if (day < 0.45) return 'civil_twilight'
  return 'daylight'
}

function livingFallback(now = Date.now()): EnvironmentState {
  const d = new Date(now)
  // Slow day cycle + pulsing load so the world never looks frozen offline
  const minutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
  const day = 0.5 + 0.48 * Math.sin(((minutes - 360) / 1440) * Math.PI * 2)
  const pulse = (Math.sin(now / 4000) + 1) / 2
  const load = 0.18 + pulse * 0.35
  const night = 1 - day
  return {
    solar: {
      phase: phaseFromDay(day),
      daylight: day,
      clockLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateLabel: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    },
    weather: {
      condition: load > 0.45 ? 'rain' : load > 0.3 ? 'cloudy' : 'clear',
      rain: load > 0.42 ? 0.25 + pulse * 0.35 : 0.02,
      cloudCover: 0.25 + pulse * 0.4,
      fog: 0.05 + (1 - day) * 0.12,
      wind: 0.2 + pulse * 0.45,
      heatShimmer: day * load * 0.2,
      skyWarmth: day > 0.3 && day < 0.55 ? 0.7 : 0.25
    },
    celestial: {
      starVisibility: night * 0.9,
      milkyWay: night * 0.45,
      aurora: 0.35 + night * 0.5 + load * 0.25,
      moonGlow: 0.4 + night * 0.4,
      artistic: true
    },
    system: {
      cpuLoad: load,
      ramUsedRatio: 0.34 + pulse * 0.1,
      gpuLoad: null,
      cpuTempC: 42 + load * 28,
      gpuTempC: null,
      diskIoMbps: pulse * 12,
      diskUsedRatio: 0.55,
      processCount: 180 + Math.round(pulse * 40),
      processChurn: pulse * 0.35,
      sampledAt: now
    },
    activity: { workspaceState: 'active', protectedActivity: false },
    health: {
      band: load > 0.55 ? 'intense' : load > 0.4 ? 'focused' : 'balanced',
      score: 0.35 + pulse * 0.3
    },
    freshness: 'simulated',
    userPreferences: {
      motion: 'off',
      celestialEffects: false,
      weatherEffects: false,
      pauseAdaptation: false,
      reduceTransparency: false,
      compactDock: false,
      clock24h: false,
      deskTheme: 'nature'
    }
  }
}

export function useEnvironment(): {
  state: EnvironmentState
  setPreferences: (prefs: Partial<EnvironmentState['userPreferences']>) => Promise<void>
  wake: () => Promise<void>
} {
  const [state, setState] = useState<EnvironmentState>(() => livingFallback())
  const [live, setLive] = useState(false)

  useEffect(() => {
    let unsub = (): void => undefined
    let timer: number | undefined
    const boot = async (): Promise<void> => {
      if (!window.desk) {
        // Keep simulated telemetry alive so engines always have motion drivers
        timer = window.setInterval(() => setState(livingFallback()), 1000)
        return
      }
      const initial = await window.desk.getEnvironment()
      setState(initial)
      setLive(true)
      unsub = window.desk.onEnvironmentUpdated(setState)
    }
    void boot()
    return () => {
      unsub()
      if (timer) window.clearInterval(timer)
    }
  }, [])

  // Even with live Electron telemetry, tick the clock label locally every second
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => {
      setState((s) => {
        const d = new Date()
        return {
          ...s,
          solar: {
            ...s.solar,
            clockLabel: d.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: !s.userPreferences.clock24h
            }),
            dateLabel: d.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
          }
        }
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [live])

  return {
    state,
    setPreferences: async (prefs) => {
      if (!window.desk) {
        setState((s) => ({ ...s, userPreferences: { ...s.userPreferences, ...prefs } }))
        return
      }
      const next = await window.desk.setPreferences(prefs)
      setState(next)
    },
    wake: async () => {
      if (!window.desk) return
      await window.desk.wakeWorkspace()
    }
  }
}
