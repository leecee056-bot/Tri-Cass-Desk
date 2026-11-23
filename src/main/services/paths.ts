import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

export function deskDataDir(): string {
  const dir = join(app.getPath('userData'), 'tri-cass-desk')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function vaultDir(): string {
  const dir = join(deskDataDir(), 'vault')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function workspaceRoot(): string {
  const dir = join(deskDataDir(), 'workspace')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function chatHistoryPath(): string {
  return join(deskDataDir(), 'chat-history.json')
}

export function snapshotsPath(): string {
  return join(deskDataDir(), 'snapshots.json')
}
