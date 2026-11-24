/**
 * Sandboxed project command runner — python/node only under workspace/projects/<name>.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve, normalize, sep } from 'node:path'
import { workspaceRoot } from '../paths'

export const RUN_ALLOWED = ['python', 'python3', 'py', 'node'] as const
export const DEFAULT_RUN_TIMEOUT_SEC = 20
export const MAX_RUN_TIMEOUT_SEC = 60

export type SandboxRunResult = {
  ok: boolean
  text: string
  exitCode?: number
  timedOut?: boolean
}

export function splitCommand(command: string): string[] | null {
  const s = command.trim()
  if (!s || s.length > 500 || /[\n\r]/.test(s)) return null
  const out: string[] = []
  let cur = ''
  let quote: '"' | "'" | null = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (quote) {
      if (c === '\\' && quote === '"' && i + 1 < s.length) {
        cur += s[++i]
        continue
      }
      if (c === quote) {
        quote = null
        continue
      }
      cur += c
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      continue
    }
    if (/\s/.test(c)) {
      if (cur) {
        out.push(cur)
        cur = ''
      }
      continue
    }
    cur += c
  }
  if (quote) return null
  if (cur) out.push(cur)
  return out.length ? out : null
}

export function parseTimeout(raw: string | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_RUN_TIMEOUT_SEC
  return Math.min(MAX_RUN_TIMEOUT_SEC, Math.max(1, Math.floor(n)))
}

function projectsRoot(): string {
  const dir = join(workspaceRoot(), 'projects')
  mkdirSync(dir, { recursive: true })
  return dir
}

export async function runSandboxed(args: {
  project: string
  command: string
  timeout?: string
}): Promise<SandboxRunResult> {
  const project = (args.project || '').trim().replace(/^\/+|\/+$/g, '')
  if (!project || project.includes('..') || project.includes('/') || project.includes('\\')) {
    return {
      ok: false,
      text: 'run needs a single project folder under projects/ (e.g. demo).'
    }
  }
  const argv = splitCommand(args.command || '')
  if (!argv) {
    return { ok: false, text: 'run needs a single-line command.' }
  }
  const bin = argv[0]!.replace(/^.*[/\\]/, '').toLowerCase()
  if (!(RUN_ALLOWED as readonly string[]).includes(bin)) {
    return {
      ok: false,
      text: `binary '${bin}' not allowed — use: ${RUN_ALLOWED.join(', ')}`
    }
  }

  const cwd = resolve(normalize(join(projectsRoot(), project)))
  const root = resolve(projectsRoot())
  if (!cwd.startsWith(root + sep) && cwd !== root) {
    return { ok: false, text: 'project path escaped sandbox.' }
  }
  if (!existsSync(cwd)) {
    mkdirSync(cwd, { recursive: true })
  }

  const timeoutSec = parseTimeout(args.timeout)
  return new Promise((resolvePromise) => {
    const child = spawn(argv[0]!, argv.slice(1), {
      cwd,
      env: { ...process.env, PATH: process.env.PATH },
      shell: false,
      windowsHide: true
    })
    let out = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {
        /* ignore */
      }
    }, timeoutSec * 1000)

    const append = (buf: Buffer): void => {
      out += buf.toString('utf8')
      if (out.length > 20_000) out = out.slice(0, 20_000) + '\n…(truncated)'
    }
    child.stdout?.on('data', append)
    child.stderr?.on('data', append)
    child.on('error', (err) => {
      clearTimeout(timer)
      resolvePromise({
        ok: false,
        text: err.message.includes('ENOENT')
          ? `${bin} not found on PATH`
          : err.message
      })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) {
        resolvePromise({
          ok: false,
          text: `timed out after ${timeoutSec}s\n${out}`.trim(),
          timedOut: true
        })
        return
      }
      const exitCode = code ?? 1
      resolvePromise({
        ok: exitCode === 0,
        text: out.trim() || `(exit ${exitCode})`,
        exitCode
      })
    })
  })
}
