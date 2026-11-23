/** Shared living-scene mood — always 0..1, smoothed by the renderer. */

export type MoodState = {
  /** CPU/GPU temperature pressure → warm sky / heat haze */
  heat: number
  /** CPU/GPU load → storm energy / cloud speed */
  load: number
  /** Idle + solar night → stars / dusk */
  nightness: number
  /** Process churn + disk I/O → wind */
  wind: number
  /** Workspace activity (1 = active, 0 = ambient idle) */
  activity: number
}

export type MoodOverrides = Partial<MoodState> & {
  /** When true, overrides replace telemetry targets instead of blending. */
  enabled?: boolean
}

export const defaultMood: MoodState = {
  heat: 0.25,
  load: 0.2,
  nightness: 0.35,
  wind: 0.2,
  activity: 1
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function lerpMood(from: MoodState, to: MoodState, t: number): MoodState {
  const k = clamp01(t)
  return {
    heat: from.heat + (to.heat - from.heat) * k,
    load: from.load + (to.load - from.load) * k,
    nightness: from.nightness + (to.nightness - from.nightness) * k,
    wind: from.wind + (to.wind - from.wind) * k,
    activity: from.activity + (to.activity - from.activity) * k
  }
}
