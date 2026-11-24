import { useEffect, useMemo, useState } from 'react'
import type { EnvironmentState } from '../../../shared/environment'
import type { ProcessRow } from '../../../shared/types'

type Props = {
  state: EnvironmentState
}

type SortKey = 'cpu' | 'mem' | 'name'

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function formatMem(raw: number): string {
  // Prefer bytes (memRss); fall back sensibly for smaller unit samples
  const bytes = raw > 1_000_000 ? raw : raw > 10_000 ? raw * 1024 : raw * 1024 * 1024
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.max(1, Math.round(mb))} MB`
}

function Bar({
  label,
  value,
  detail
}: {
  label: string
  value: number
  detail?: string
}): React.JSX.Element {
  const clamped = Math.min(1, Math.max(0, value))
  const hot = clamped >= 0.85
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {detail ?? pct(clamped)}
          {hot ? ' · hot' : ''}
        </span>
      </div>
      <div className="meter-track">
        <div
          className={`meter-fill ${hot ? 'hot' : ''}`}
          style={{ width: pct(clamped) }}
        />
      </div>
    </div>
  )
}

/** Activity Monitor–style system widget: meters + live process table. */
export default function SystemPanel({ state }: Props): React.JSX.Element {
  const { system, health, activity } = state
  const [procs, setProcs] = useState<ProcessRow[]>([])
  const [sort, setSort] = useState<SortKey>('cpu')
  const [status, setStatus] = useState('Sampling…')

  useEffect(() => {
    let alive = true
    const load = async (): Promise<void> => {
      if (!window.desk) {
        setStatus('Simulated · no process IPC')
        return
      }
      try {
        const rows = await window.desk.processes()
        if (!alive) return
        setProcs(rows)
        setStatus(`${rows.length} processes · refreshes ~3s`)
      } catch (err) {
        if (!alive) return
        setStatus(err instanceof Error ? err.message : 'Process sample failed')
      }
    }
    void load()
    const t = window.setInterval(() => void load(), 3000)
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [])

  const sorted = useMemo(() => {
    const copy = [...procs]
    copy.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'mem') return b.mem - a.mem
      return b.cpu - a.cpu
    })
    return copy.slice(0, 24)
  }, [procs, sort])

  const gpu = system.gpuLoad
  const storage = system.diskUsedRatio ?? 0

  return (
    <section className="system-panel activity-monitor" aria-label="Activity Monitor">
      <header className="panel-head tight">
        <h2>
          <span className="sys-pulse" aria-hidden />
          Activity Monitor
        </h2>
        <span className="pill">{health.band}</span>
      </header>

      <div className="sys-meters">
        <Bar label="CPU" value={system.cpuLoad} />
        <Bar label="Memory" value={system.ramUsedRatio} />
        <Bar
          label="GPU"
          value={gpu ?? system.cpuLoad * 0.45}
          detail={gpu != null ? pct(gpu) : 'est.'}
        />
        <Bar label="Disk" value={storage} />
      </div>

      <div className="sys-meta-grid" aria-label="Extra meters">
        <div>
          <span>CPU °C</span>
          <strong>{system.cpuTempC != null ? Math.round(system.cpuTempC) : '—'}</strong>
        </div>
        <div>
          <span>Disk I/O</span>
          <strong>{system.diskIoMbps.toFixed(1)} MB/s</strong>
        </div>
        <div>
          <span>Churn</span>
          <strong>{Math.round(system.processChurn * 100)}%</strong>
        </div>
        <div>
          <span>Workspace</span>
          <strong className="cap">{activity.workspaceState.replaceAll('_', ' ')}</strong>
        </div>
      </div>

      <div className="sys-proc-head">
        <strong>Top processes</strong>
        <div className="sys-sort" role="group" aria-label="Sort processes">
          {(['cpu', 'mem', 'name'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`btn btn-ghost sys-sort-btn ${sort === key ? 'on' : ''}`}
              onClick={() => setSort(key)}
            >
              {key === 'cpu' ? 'CPU' : key === 'mem' ? 'Mem' : 'Name'}
            </button>
          ))}
        </div>
      </div>

      <div className="sys-proc-table-wrap">
        <table className="sys-proc-table">
          <thead>
            <tr>
              <th>Process</th>
              <th>PID</th>
              <th>CPU%</th>
              <th>Mem</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((p) => (
                <tr key={`${p.pid}-${p.name}`}>
                  <td title={p.command || p.name}>{p.name || '—'}</td>
                  <td>{p.pid}</td>
                  <td>{p.cpu.toFixed(1)}</td>
                  <td>{formatMem(p.mem)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="sys-empty">
                  {window.desk
                    ? 'Waiting for process sample…'
                    : 'No live process list (browser fallback)'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="fine-print">
        Local Activity Monitor · {system.processCount} counted · {status}
      </p>
    </section>
  )
}
