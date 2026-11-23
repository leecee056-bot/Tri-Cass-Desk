import { homedir } from 'node:os'
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync
} from 'node:fs'
import { join, normalize, resolve, sep, basename, dirname } from 'node:path'
import { shell } from 'electron'
import type { FileEntry } from '../../shared/types'
import { workspaceRoot } from './paths'

const TEXT_MAX = 1_500_000

function assertSafePath(target: string): string {
  const resolved = resolve(normalize(target))
  // Allow home, workspace, and common user folders — block absolute escapes to system roots only loosely
  if (!resolved || resolved === sep) throw new Error('Invalid path')
  return resolved
}

export function getHomeDir(): string {
  return homedir()
}

export function getDefaultBrowseRoot(): string {
  return workspaceRoot()
}

export function listDirectory(dirPath?: string): { path: string; entries: FileEntry[] } {
  const path = assertSafePath(dirPath || workspaceRoot())
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error('Not a directory')
  }
  const entries: FileEntry[] = readdirSync(path)
    .map((name) => {
      const full = join(path, name)
      try {
        const st = statSync(full)
        return {
          name,
          path: full,
          isDirectory: st.isDirectory(),
          size: st.size,
          mtimeMs: st.mtimeMs
        } satisfies FileEntry
      } catch {
        return null
      }
    })
    .filter((e): e is FileEntry => e != null)
    .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name))
  return { path, entries }
}

export function readTextFile(filePath: string): string {
  const path = assertSafePath(filePath)
  const st = statSync(path)
  if (!st.isFile()) throw new Error('Not a file')
  if (st.size > TEXT_MAX) throw new Error('File too large for text preview')
  return readFileSync(path, 'utf8')
}

export function writeTextFile(filePath: string, content: string): void {
  const path = assertSafePath(filePath)
  writeFileSync(path, content, 'utf8')
}

export function mkdirDir(dirPath: string): string {
  const path = assertSafePath(dirPath)
  if (existsSync(path)) throw new Error('Already exists')
  mkdirSync(path, { recursive: false })
  return path
}

export function renamePath(fromPath: string, newName: string): string {
  const from = assertSafePath(fromPath)
  const clean = basename(newName.trim())
  if (!clean || clean === '.' || clean === '..' || /[\\/]/.test(clean)) {
    throw new Error('Invalid name')
  }
  const to = join(dirname(from), clean)
  if (existsSync(to)) throw new Error('Target already exists')
  renameSync(from, to)
  return to
}

export function userFolder(name: 'Desktop' | 'Documents' | 'Downloads'): string {
  return join(homedir(), name)
}

export async function openPath(target: string): Promise<void> {
  const path = assertSafePath(target)
  await shell.openPath(path)
}

export async function openExternal(url: string): Promise<void> {
  if (!/^https?:\/\//i.test(url) && !/^file:\/\//i.test(url)) {
    throw new Error('Only http(s) or file URLs allowed')
  }
  await shell.openExternal(url)
}
