import {
  defaultPreferences,
  type EnvironmentState,
  type SolarPhase,
  type SystemSnapshot
} from '../shared/environment'
import { sampleSystem } from './telemetry'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function solarFromClock(now = new Date(), clock24h = false): EnvironmentState['solar'] {
  const minutes = now.getHours() * 60 + now.getMinutes()
  // Approximate solar elevation proxy from local clock (no location / astronomy API).
  const dayAngle = ((minutes - 6 * 60) / (24 * 60)) * Math.PI * 2
  const daylight = clamp01((Math.sin(dayAngle) + 0.15) / 1.15)

  let phase: SolarPhase
  if (daylight > 0.55) phase = 'daylight'
  else if (daylight > 0.35) phase = 'civil_twilight'
  else if (daylight > 0.18) phase = 'nautical_twilight'
  else if (daylight > 0.05) phase = 'astronomical_twilight'
  else phase = 'night'

  const clockLabel = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !clock24h
  })
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return { phase, daylight, clockLabel, dateLabel }
}

function healthBand(score: number): EnvironmentState['health']['band'] {
  if (score < 0.2) return 'tranquil'
  if (score < 0.4) return 'balanced'
  if (score < 0.6) return 'focused'
  if (score < 0.8) return 'intense'
  return 'strained'
}

function mapWeather(sys: SystemSnapshot, prefs: EnvironmentState['userPreferences']) {
  const stormPressure = clamp01(sys.cpuLoad * 0.75 + sys.processChurn * 0.45)
  const rain = prefs.weatherEffects ? clamp01(stormPressure * 1.1 - 0.15) : 0
  const cloudCover = prefs.weatherEffects
    ? clamp01(sys.ramUsedRatio * 0.85 + sys.cpuLoad * 0.15)
    : 0.2
  const fog = prefs.weatherEffects
    ? clamp01(
        ((sys.gpuLoad ?? sys.cpuLoad) * 0.4 +
          (sys.cpuTempC != null ? clamp01((sys.cpuTempC - 55) / 40) : 0) * 0.5)
      )
    : 0
  const wind = prefs.weatherEffects ? clamp01(sys.diskIoMbps / 40 + sys.processChurn * 0.35) : 0

  const tempC = sys.gpuTempC ?? sys.cpuTempC
  const heat = tempC != null ? clamp01((tempC - 50) / 45) : clamp01(sys.cpuLoad * 0.4)
  const heatShimmer = prefs.weatherEffects ? heat : 0
  const skyWarmth = clamp01(0.25 + heat * 0.55)

  let condition: EnvironmentState['weather']['condition'] = 'clear'
  if (rain > 0.72) condition = 'storm'
  else if (rain > 0.35) condition = 'rain'
  else if (fog > 0.55) condition = 'fog'
  else if (cloudCover > 0.45) condition = 'cloudy'

  return { condition, rain, cloudCover, fog, wind, heatShimmer, skyWarmth }
}

function mapCelestial(
  sys: SystemSnapshot,
  daylight: number,
  cloudCover: number,
  prefs: EnvironmentState['userPreferences']
) {
  const gpu = sys.gpuLoad ?? sys.cpuLoad * 0.5
  const nightFactor = clamp01(1 - daylight * 1.35)
  const clearSky = clamp01(1 - cloudCover * 0.9)
  const starVisibility = prefs.celestialEffects ? clamp01(nightFactor * clearSky) : 0
  const milkyWay = prefs.celestialEffects ? clamp01(starVisibility * (0.35 + gpu * 0.65)) : 0
  const aurora = prefs.celestialEffects ? clamp01(gpu * nightFactor * 1.1) : 0
  const moonGlow = prefs.celestialEffects ? clamp01(nightFactor * (0.4 + (1 - cloudCover) * 0.4)) : 0
  return { starVisibility, milkyWay, aurora, moonGlow, artistic: true as const }
}

export class EnvironmentEngine {
  private prefs = { ...defaultPreferences }
  private last: EnvironmentState | null = null
  private idleMs = 0
  private lastSampleAt = Date.now()
  private persist: ((prefs: EnvironmentState['userPreferences']) => void) | null = null

  /** Load disk prefs after Electron app is ready (userData path). */
  hydrate(
    prefs: EnvironmentState['userPreferences'],
    persist?: (prefs: EnvironmentState['userPreferences']) => void
  ): void {
    this.prefs = { ...defaultPreferences, ...prefs }
    this.persist = persist ?? null
  }

  getPreferences(): EnvironmentState['userPreferences'] {
    return { ...this.prefs }
  }

  setPreferences(partial: Partial<EnvironmentState['userPreferences']>): void {
    this.prefs = { ...this.prefs, ...partial }
    this.persist?.(this.prefs)
  }

  resetPreferences(): void {
    this.prefs = { ...defaultPreferences }
    this.persist?.(this.prefs)
  }

  wake(): void {
    this.idleMs = 0
    if (this.last) {
      this.last = {
        ...this.last,
        activity: { workspaceState: 'active', protectedActivity: false }
      }
    }
  }

  noteActivity(): void {
    this.idleMs = 0
  }

  async tick(): Promise<EnvironmentState> {
    const now = Date.now()
    const dt = now - this.lastSampleAt
    this.lastSampleAt = now
    this.idleMs += dt

    let sys: SystemSnapshot
    let freshness: EnvironmentState['freshness'] = 'fresh'
    try {
      sys = await sampleSystem()
    } catch {
      sys = this.last?.system ?? {
        cpuLoad: 0.12,
        ramUsedRatio: 0.34,
        gpuLoad: null,
        cpuTempC: null,
        gpuTempC: null,
        diskIoMbps: 0,
        diskUsedRatio: null,
        processCount: 0,
        processChurn: 0,
        sampledAt: now
      }
      freshness = this.last ? 'stale' : 'unavailable'
    }

    // Headless / sensor-poor hosts: still produce a living scene from whatever we have.
    if (sys.gpuLoad == null && sys.cpuTempC == null && sys.cpuLoad === 0) {
      freshness = freshness === 'fresh' ? 'simulated' : freshness
    }

    const solar = solarFromClock(new Date(now), this.prefs.clock24h)
    const weather = this.prefs.pauseAdaptation && this.last
      ? this.last.weather
      : mapWeather(sys, this.prefs)
    const celestial = this.prefs.pauseAdaptation && this.last
      ? this.last.celestial
      : mapCelestial(sys, solar.daylight, weather.cloudCover, this.prefs)

    const score = clamp01(
      sys.cpuLoad * 0.4 +
        sys.ramUsedRatio * 0.25 +
        (sys.gpuLoad ?? 0) * 0.2 +
        sys.processChurn * 0.15
    )

    let workspaceState: EnvironmentState['activity']['workspaceState'] = 'active'
    if (this.idleMs > 180_000) workspaceState = 'ambient_idle'
    else if (this.idleMs > 90_000) workspaceState = 'resting'
    else if (this.idleMs > 45_000) workspaceState = 'settling'

    this.last = {
      solar,
      weather,
      celestial,
      system: sys,
      activity: { workspaceState, protectedActivity: false },
      health: { band: healthBand(score), score },
      freshness,
      userPreferences: { ...this.prefs }
    }
    return this.last
  }
}
