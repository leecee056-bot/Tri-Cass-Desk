import si from 'systeminformation'
import type { SystemSnapshot } from '../shared/environment'

let lastProcessCount = 0
let lastDiskBytes = 0
let lastDiskAt = 0

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/** Best-effort local metrics. Missing sensors → null / zeros, never fabricated weather. */
export async function sampleSystem(): Promise<SystemSnapshot> {
  const [load, mem, temp, graphics, disks, processes, fsSize] = await Promise.all([
    si.currentLoad().catch(() => null),
    si.mem().catch(() => null),
    si.cpuTemperature().catch(() => null),
    si.graphics().catch(() => null),
    si.disksIO().catch(() => null),
    si.processes().catch(() => null),
    si.fsSize().catch(() => null)
  ])

  const cpuLoad = clamp01((load?.currentLoad ?? 0) / 100)
  const ramUsedRatio =
    mem && mem.total > 0 ? clamp01((mem.total - mem.available) / mem.total) : 0

  const controllers = graphics?.controllers ?? []
  const gpuLoads = controllers
    .map((c) => c.utilizationGpu)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const gpuLoad = gpuLoads.length ? clamp01(gpuLoads.reduce((a, b) => a + b, 0) / gpuLoads.length / 100) : null

  const gpuTemps = controllers
    .map((c) => c.temperatureGpu)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  const gpuTempC = gpuTemps.length ? gpuTemps.reduce((a, b) => a + b, 0) / gpuTemps.length : null

  const cpuTempC =
    typeof temp?.main === 'number' && Number.isFinite(temp.main) ? temp.main : null

  const now = Date.now()
  const rBytes = disks?.rIO_sec ?? disks?.rIO ?? 0
  const wBytes = disks?.wIO_sec ?? disks?.wIO ?? 0
  // disksIO rIO_sec is often ops; treat as relative activity when bytes unavailable
  let diskIoMbps = 0
  if (typeof disks?.rIO_sec === 'number' || typeof disks?.wIO_sec === 'number') {
    diskIoMbps = Math.min(200, (Number(disks?.rIO_sec ?? 0) + Number(disks?.wIO_sec ?? 0)) / 50)
  } else if (lastDiskAt > 0) {
    const delta = rBytes + wBytes - lastDiskBytes
    const dt = (now - lastDiskAt) / 1000
    if (dt > 0 && delta >= 0) diskIoMbps = Math.min(200, delta / 1_000_000 / dt)
  }
  lastDiskBytes = rBytes + wBytes
  lastDiskAt = now

  const processCount = processes?.all ?? 0
  const processChurn = clamp01(Math.abs(processCount - lastProcessCount) / 40)
  lastProcessCount = processCount

  let diskUsedRatio: number | null = null
  if (Array.isArray(fsSize) && fsSize.length) {
    const total = fsSize.reduce((a, d) => a + (d.size || 0), 0)
    const used = fsSize.reduce((a, d) => a + (d.used || 0), 0)
    if (total > 0) diskUsedRatio = clamp01(used / total)
  }

  return {
    cpuLoad,
    ramUsedRatio,
    gpuLoad,
    cpuTempC,
    gpuTempC,
    diskIoMbps,
    diskUsedRatio,
    processCount,
    processChurn,
    sampledAt: now
  }
}
