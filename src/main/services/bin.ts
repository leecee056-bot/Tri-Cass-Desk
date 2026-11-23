import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { basename, join } from 'node:path'
import { deskDataDir } from './paths'

export function binDir(): string {
  const dir = join(deskDataDir(), 'bin')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function binList(): string[] {
  return readdirSync(binDir())
}

export function binMove(targetPath: string): string {
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    throw new Error('Only files can be moved to Desk bin')
  }
  const dest = join(binDir(), `${Date.now()}-${basename(targetPath)}`)
  renameSync(targetPath, dest)
  return dest
}

export function binRestore(name: string, destDir: string): string {
  const src = join(binDir(), name)
  if (!existsSync(src)) throw new Error('Not in bin')
  const original = name.replace(/^\d+-/, '')
  const dest = join(destDir, original)
  renameSync(src, dest)
  return dest
}

export function binDelete(name: string): void {
  const src = join(binDir(), name)
  if (!existsSync(src)) throw new Error('Not in bin')
  unlinkSync(src)
}

export function binEmpty(): number {
  const names = binList()
  for (const name of names) unlinkSync(join(binDir(), name))
  return names.length
}

export type BinEntry = {
  name: string
  displayName: string
  size: number
  mtimeMs: number
}

export function binEntries(): BinEntry[] {
  return binList()
    .map((name) => {
      const full = join(binDir(), name)
      try {
        const st = statSync(full)
        return {
          name,
          displayName: name.replace(/^\d+-/, ''),
          size: st.size,
          mtimeMs: st.mtimeMs
        }
      } catch {
        return null
      }
    })
    .filter((e): e is BinEntry => e != null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}
