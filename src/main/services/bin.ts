import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs'
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
