/** Normalized living-environment state. Local telemetry only — no weather APIs. */

export type Freshness = 'fresh' | 'stale' | 'unavailable' | 'simulated'
export type WorkspaceActivity = 'active' | 'settling' | 'resting' | 'ambient_idle'
export type SolarPhase =
  | 'night'
  | 'astronomical_twilight'
  | 'nautical_twilight'
  | 'civil_twilight'
  | 'daylight'

export type MotionPreference = 'full' | 'reduced' | 'off'

export interface SystemSnapshot {
  cpuLoad: number
  ramUsedRatio: number
  gpuLoad: number | null
  cpuTempC: number | null
  gpuTempC: number | null
  diskIoMbps: number
  /** Aggregate disk used / size across mounts; null if unavailable. */
  diskUsedRatio: number | null
  processCount: number
  processChurn: number
  sampledAt: number
}

export interface EnvironmentState {
  solar: {
    phase: SolarPhase
    /** 0 = midnight-ish dark, 1 = noon-ish bright (clock-derived). */
    daylight: number
    clockLabel: string
    dateLabel: string
  }
  weather: {
    /** Artistic mapping from CPU / process churn — not meteorological. */
    condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'unknown'
    rain: number
    cloudCover: number
    fog: number
    wind: number
    heatShimmer: number
    skyWarmth: number
  }
  celestial: {
    /** Artistic — driven by GPU load; never claimed as observed sky science. */
    starVisibility: number
    milkyWay: number
    aurora: number
    moonGlow: number
    artistic: true
  }
  system: SystemSnapshot
  activity: {
    workspaceState: WorkspaceActivity
    protectedActivity: boolean
  }
  health: {
    band: 'tranquil' | 'balanced' | 'focused' | 'intense' | 'strained'
    score: number
  }
  freshness: Freshness
  userPreferences: {
    motion: MotionPreference
    celestialEffects: boolean
    weatherEffects: boolean
    pauseAdaptation: boolean
    /** Soften glass / panel blur for readability. */
    reduceTransparency: boolean
    /** Compact dock icon spacing. */
    compactDock: boolean
    /** Prefer 24-hour clock labels in widgets. */
    clock24h: boolean
  }
}

export const defaultPreferences: EnvironmentState['userPreferences'] = {
  motion: 'full',
  celestialEffects: true,
  weatherEffects: true,
  pauseAdaptation: false,
  reduceTransparency: false,
  compactDock: false,
  clock24h: false
}
