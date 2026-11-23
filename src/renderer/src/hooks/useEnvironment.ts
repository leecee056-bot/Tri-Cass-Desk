import { useEffect, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'

const fallback: EnvironmentState = {
  solar: {
    phase: 'night',
    daylight: 0.12,
    clockLabel: '--:--',
    dateLabel: '—'
  },
  weather: {
    condition: 'cloudy',
    rain: 0.05,
    cloudCover: 0.45,
    fog: 0.08,
    wind: 0.35,
    heatShimmer: 0,
    skyWarmth: 0.25
  },
  celestial: {
    starVisibility: 0.85,
    milkyWay: 0.4,
    aurora: 0.72,
    moonGlow: 0.45,
    artistic: true
  },
  system: {
    cpuLoad: 0.28,
    ramUsedRatio: 0.34,
    gpuLoad: null,
    cpuTempC: null,
    gpuTempC: null,
    diskIoMbps: 0,
    diskUsedRatio: null,
    processCount: 0,
    processChurn: 0.15,
    sampledAt: Date.now()
  },
  activity: { workspaceState: 'active', protectedActivity: false },
  health: { band: 'balanced', score: 0.3 },
  freshness: 'unavailable',
  userPreferences: {
    motion: 'full',
    celestialEffects: true,
    weatherEffects: true,
    pauseAdaptation: false
  }
}

export function useEnvironment(): {
  state: EnvironmentState
  setPreferences: (prefs: Partial<EnvironmentState['userPreferences']>) => Promise<void>
  wake: () => Promise<void>
} {
  const [state, setState] = useState<EnvironmentState>(fallback)

  useEffect(() => {
    let unsub = (): void => undefined
    const boot = async (): Promise<void> => {
      if (!window.desk) return
      const initial = await window.desk.getEnvironment()
      setState(initial)
      unsub = window.desk.onEnvironmentUpdated(setState)
    }
    void boot()
    return () => unsub()
  }, [])

  return {
    state,
    setPreferences: async (prefs) => {
      if (!window.desk) return
      const next = await window.desk.setPreferences(prefs)
      setState(next)
    },
    wake: async () => {
      if (!window.desk) return
      await window.desk.wakeWorkspace()
    }
  }
}
