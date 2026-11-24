import { useMemo } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import { clamp01, type MoodOverrides, type MoodState } from '../../../shared/mood'

function targetFromEnv(state: EnvironmentState): MoodState {
  const sys = state.system
  const temp =
    sys.cpuTempC != null
      ? clamp01((sys.cpuTempC - 40) / 45)
      : clamp01(sys.cpuLoad * 0.55 + (sys.gpuLoad ?? 0) * 0.25)
  const load = clamp01(sys.cpuLoad * 0.7 + (sys.gpuLoad ?? sys.cpuLoad * 0.4) * 0.3)
  const idleBoost =
    state.activity.workspaceState === 'ambient_idle'
      ? 0.35
      : state.activity.workspaceState === 'resting'
        ? 0.2
        : state.activity.workspaceState === 'settling'
          ? 0.1
          : 0
  const nightness = clamp01(1 - state.solar.daylight + idleBoost * 0.5)
  const wind = clamp01(
    state.weather.wind * 0.55 + sys.processChurn * 0.45 + sys.diskIoMbps / 50
  )
  const activity =
    state.activity.workspaceState === 'active'
      ? 1
      : state.activity.workspaceState === 'settling'
        ? 0.65
        : state.activity.workspaceState === 'resting'
          ? 0.35
          : 0.12

  return {
    heat: clamp01(temp * 0.75 + state.weather.heatShimmer * 0.35 + state.weather.skyWarmth * 0.2),
    load,
    nightness,
    wind,
    activity
  }
}

/**
 * Lite mood — no requestAnimationFrame loop (that ran forever and burned CPU).
 * Updates only when environment / overrides change.
 */
export function useMoodState(
  state: EnvironmentState,
  overrides: MoodOverrides
): { mood: MoodState; target: MoodState } {
  const mood = useMemo(() => {
    const base = targetFromEnv(state)
    if (!overrides.enabled) return base
    return {
      heat: overrides.heat ?? base.heat,
      load: overrides.load ?? base.load,
      nightness: overrides.nightness ?? base.nightness,
      wind: overrides.wind ?? base.wind,
      activity: overrides.activity ?? base.activity
    }
  }, [
    state,
    overrides.enabled,
    overrides.heat,
    overrides.load,
    overrides.nightness,
    overrides.wind,
    overrides.activity
  ])

  return { mood, target: mood }
}
