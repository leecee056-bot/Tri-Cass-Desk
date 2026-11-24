/**
 * Workspace checkpoints (Cline-style) under workspace/.tri-cass/checkpoints/
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  rmSync
} from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { workspaceRoot } from '../paths'

const MAX = 20
const MAX_FILES = 80
const MAX_BYTES = 1_500_000
const MAX_FILE = 200_000

export type CheckpointMeta = {
  id: string
  label: string
  createdAt: number
  fileCount: number
}

type SnapshotFile = { path: string; content: string; kind?: 'file' | 'folder' }

type Snapshot = {
  meta: CheckpointMeta
  files: SnapshotFile[]
}

function cpRoot(): string {
  const dir = join(workspaceRoot(), '.tri-cass', 'checkpoints')
  mkdirSync(dir, { recursive: true })
  return dir
}

function indexPath(): string {
  return join(cpRoot(), 'index.json')
}

function snapPath(id: string): string {
  return join(cpRoot(), id, 'snapshot.json')
}

function readIndex(): CheckpointMeta[] {
  try {
    if (!existsSync(indexPath())) return []
    const raw = JSON.parse(readFileSync(indexPath(), 'utf8')) as CheckpointMeta[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeIndex(items: CheckpointMeta[]): void {
  writeFileSync(indexPath(), JSON.stringify(items, null, 2), 'utf8')
}

function walkCollect(dir: string, root: string, out: SnapshotFile[], state: { bytes: number }): void {
  if (out.length >= MAX_FILES || state.bytes >= MAX_BYTES) return
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (out.length >= MAX_FILES || state.bytes >= MAX_BYTES) return
    const full = join(dir, name)
    const rel = relative(root, full).split(sep).join('/')
    if (!rel || rel.startsWith('.tri-cass/checkpoints')) continue
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      out.push({ path: rel, content: '', kind: 'folder' })
      walkCollect(full, root, out, state)
      continue
    }
    if (!st.isFile() || st.size > MAX_FILE) continue
    try {
      const content = readFileSync(full, 'utf8')
      if (state.bytes + content.length > MAX_BYTES) continue
      state.bytes += content.length
      out.push({ path: rel, content, kind: 'file' })
    } catch {
      /* binary / unreadable */
    }
  }
}

export function listCheckpoints(): CheckpointMeta[] {
  return readIndex()
}

export function createCheckpoint(label: string): CheckpointMeta {
  const root = workspaceRoot()
  const files: SnapshotFile[] = []
  walkCollect(root, root, files, { bytes: 0 })
  const meta: CheckpointMeta = {
    id: randomUUID().slice(0, 8),
    label: label.trim() || 'checkpoint',
    createdAt: Date.now(),
    fileCount: files.filter((f) => f.kind !== 'folder').length
  }
  const dir = join(cpRoot(), meta.id)
  mkdirSync(dir, { recursive: true })
  const snap: Snapshot = { meta, files }
  writeFileSync(snapPath(meta.id), JSON.stringify(snap), 'utf8')
  const idx = [meta, ...readIndex()].slice(0, MAX)
  // prune dropped
  const keep = new Set(idx.map((m) => m.id))
  for (const m of readIndex()) {
    if (!keep.has(m.id)) {
      try {
        rmSync(join(cpRoot(), m.id), { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
  }
  writeIndex(idx)
  return meta
}

export function restoreCheckpoint(id: string): string {
  const items = readIndex()
  const targetId = id === 'latest' || !id ? items[0]?.id : id
  if (!targetId) return 'No checkpoints to restore.'
  const file = snapPath(targetId)
  if (!existsSync(file)) return `Checkpoint ${targetId} not found.`
  const snap = JSON.parse(readFileSync(file, 'utf8')) as Snapshot
  const root = workspaceRoot()
  for (const f of snap.files) {
    const full = join(root, f.path)
    if (f.kind === 'folder') {
      mkdirSync(full, { recursive: true })
      continue
    }
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, f.content, 'utf8')
  }
  return `Restored checkpoint ${targetId} (${snap.meta.label}) — ${snap.meta.fileCount} files.`
}
