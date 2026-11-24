/** Stuck detection: same error fingerprint ×3 → rollback. */

import { listCheckpoints, restoreCheckpoint } from './checkpoints'

export function errorFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+/g, 'N')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

export type StuckTracker = {
  fingerprints: string[]
}

export function createStuckTracker(): StuckTracker {
  return { fingerprints: [] }
}

export function recordError(tracker: StuckTracker, text: string): number {
  const fp = errorFingerprint(text)
  if (!fp) return 0
  tracker.fingerprints.push(fp)
  let n = 0
  for (let i = tracker.fingerprints.length - 1; i >= 0; i--) {
    if (tracker.fingerprints[i] === fp) n++
    else break
  }
  return n
}

export function isStuck(count: number, threshold = 3): boolean {
  return count >= threshold
}

export function rollbackLatest(baselineId?: string): string {
  try {
    const items = listCheckpoints()
    const target = baselineId || items[0]?.id
    if (!target) return 'Stuck: no checkpoint to restore.'
    return restoreCheckpoint(target)
  } catch (e) {
    return e instanceof Error ? e.message : 'Stuck rollback failed'
  }
}
