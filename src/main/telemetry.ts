import os from 'node:os'
import type { SystemSnapshot } from '../shared/environment'

let prevIdle = 0
let prevTotal = 0
let havePrev = false

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/**
 * Cheap local metrics only — no systeminformation.
 * The old path (processes + graphics + disksIO every 1s) pegged CPU at ~100% on Windows.
 */
export async function sampleSystem(): Promise<SystemSnapshot> {
  const cpus = os.cpus()
  let idle = 0
  let total = 0
  for (const cpu of cpus) {
    const t = cpu.times
    idle += t.idle
    total += t.user + t.nice + t.sys + t.idle + t.irq
  }

  let cpuLoad = 0.08
  if (havePrev && total > prevTotal) {
    const idleDelta = idle - prevIdle
    const totalDelta = total - prevTotal
    cpuLoad = clamp01(1 - idleDelta / totalDelta)
  }
  prevIdle = idle
  prevTotal = total
  havePrev = true

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const ramUsedRatio = totalMem > 0 ? clamp01((totalMem - freeMem) / totalMem) : 0

  return {
    cpuLoad,
    ramUsedRatio,
    gpuLoad: null,
    cpuTempC: null,
    gpuTempC: null,
    diskIoMbps: 0,
    diskUsedRatio: null,
    processCount: 0,
    processChurn: 0,
    sampledAt: Date.now()
  }
}
