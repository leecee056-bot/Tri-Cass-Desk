import { useEffect, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'

const fallback: EnvironmentState = {
  solar: {
    phase: 'civil_twilight',
    daylight: 0.35,
    clockLabel: '--:--',
    dateLabel: '—'
  },
  weather: {
    condition: 'cloudy',
    rain: 0.1,
    cloudCover: 0.4,
    fog: 0.1,
    wind: 0.1,
    heatShimmer: 0,
    skyWarmth: 0.4
  },
  celestial: {
    starVisibility: 0.5,
    milkyWay: 0.2,
    aurora: 0.15,
    moonGlow: 0.4,
    artistic: true
  },
  system: {
    cpuLoad: 0.12,
    ramUsedRatio: 0.34,
    gpuLoad: null,
    cpuTempC: null,
    gpuTempC: null,
    diskIoMbps: 0,
    processCount: 0,
    processChurn: 0,
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
