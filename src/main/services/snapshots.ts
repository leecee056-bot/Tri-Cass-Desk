import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { WorkspaceSnapshot } from '../../shared/types'
import { snapshotsPath } from './paths'

function load(): WorkspaceSnapshot[] {
  try {
    if (!existsSync(snapshotsPath())) return []
    const raw = JSON.parse(readFileSync(snapshotsPath(), 'utf8')) as WorkspaceSnapshot[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function save(list: WorkspaceSnapshot[]): void {
  writeFileSync(snapshotsPath(), JSON.stringify(list.slice(0, 40), null, 2), 'utf8')
}

export function listSnapshots(): WorkspaceSnapshot[] {
  return load().sort((a, b) => b.createdAt - a.createdAt)
}

export function saveSnapshot(activeDock: string, label?: string): WorkspaceSnapshot {
  const snap: WorkspaceSnapshot = {
    id: randomUUID(),
    label: label?.trim() || `Desk · ${new Date().toLocaleString()}`,
    activeDock,
    createdAt: Date.now()
  }
  const list = load()
  list.push(snap)
  save(list)
  return snap
}

export function restoreSnapshot(id: string): WorkspaceSnapshot | null {
  return load().find((s) => s.id === id) ?? null
}

export function deleteSnapshot(id: string): boolean {
  const list = load()
  const next = list.filter((s) => s.id !== id)
  if (next.length === list.length) return false
  save(next)
  return true
}
