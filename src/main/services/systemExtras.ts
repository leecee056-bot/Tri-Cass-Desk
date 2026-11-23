import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { clipboard } from 'electron'
import si from 'systeminformation'
import type { DiskPartition, PortRow, ProcessRow } from '../../shared/types'

const execFileAsync = promisify(execFile)

export async function listProcesses(): Promise<ProcessRow[]> {
  const data = await si.processes()
  return (data.list ?? [])
    .map((p) => ({
      pid: p.pid,
      name: p.name || '',
      cpu: p.cpu ?? 0,
      mem: p.memRss ?? p.mem ?? 0,
      command: p.command || ''
    }))
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 80)
}

export async function listDisks(): Promise<DiskPartition[]> {
  const parts = await si.fsSize()
  return parts.map((p) => ({
    fs: p.fs,
    type: p.type,
    size: p.size,
    used: p.used,
    available: p.available,
    use: p.use,
    mount: p.mount
  }))
}

export async function listPorts(): Promise<PortRow[]> {
  const data = await si.networkConnections()
  return (data ?? [])
    .filter((c) => c.state === 'LISTEN' || c.state === 'ESTABLISHED')
    .slice(0, 120)
    .map((c) => ({
      protocol: c.protocol,
      localAddress: c.localAddress,
      localPort: Number(c.localPort) || 0,
      peerAddress: c.peerAddress,
      peerPort: Number(c.peerPort) || 0,
      state: c.state,
      pid: c.pid,
      process: c.process
    }))
}

export function envVars(): Record<string, string> {
  const allow = [
    'PATH',
    'HOME',
    'USER',
    'USERNAME',
    'USERPROFILE',
    'APPDATA',
    'LOCALAPPDATA',
    'TEMP',
    'TMP',
    'SHELL',
    'ComSpec',
    'OS',
    'PROCESSOR_ARCHITECTURE',
    'NUMBER_OF_PROCESSORS',
    'OLLAMA_HOST'
  ]
  const out: Record<string, string> = {}
  for (const key of allow) {
    if (process.env[key]) out[key] = process.env[key]!
  }
  return out
}

export function clipboardRead(): string {
  return clipboard.readText()
}

export function clipboardWrite(text: string): void {
  clipboard.writeText(text)
}

export function hashText(text: string, algo: 'sha256' | 'sha1' | 'md5'): string {
  return createHash(algo).update(text, 'utf8').digest('hex')
}

export type SafeCommandMeta = {
  id: string
  label: string
  hint: string
}

type SafeSpec =
  | { kind: 'exec'; bin: string; args: string[] }
  | { kind: 'builtin'; run: () => string | Promise<string> }

const SAFE_COMMANDS: Record<string, SafeSpec & { meta: Omit<SafeCommandMeta, 'id'> }> = {
  'node-version': {
    kind: 'exec',
    bin: 'node',
    args: ['-v'],
    meta: { label: 'node -v', hint: 'Node.js version' }
  },
  'npm-version': {
    kind: 'exec',
    bin: 'npm',
    args: ['-v'],
    meta: { label: 'npm -v', hint: 'npm version' }
  },
  'ollama-list': {
    kind: 'exec',
    bin: 'ollama',
    args: ['list'],
    meta: { label: 'ollama list', hint: 'Local Ollama models' }
  },
  uname: {
    kind: 'exec',
    bin: 'uname',
    args: ['-a'],
    meta: { label: 'uname -a', hint: 'Kernel / OS identity' }
  },
  date: {
    kind: 'exec',
    bin: 'date',
    args: [],
    meta: { label: 'date', hint: 'System clock' }
  },
  whoami: {
    kind: 'exec',
    bin: 'whoami',
    args: [],
    meta: { label: 'whoami', hint: 'Current user' }
  },
  'desk-info': {
    kind: 'builtin',
    meta: { label: 'desk-info', hint: 'Desk process info' },
    run: () =>
      [
        `Tri-Cass Desk`,
        `platform: ${process.platform} ${process.arch}`,
        `node: ${process.version}`,
        `pid: ${process.pid}`,
        `cwd: ${process.cwd()}`
      ].join('\n')
  }
}

/** Catalog for Terminal chips / help — allowlisted only. */
export function listSafeCommands(): SafeCommandMeta[] {
  return Object.entries(SAFE_COMMANDS).map(([id, spec]) => ({
    id,
    label: spec.meta.label,
    hint: spec.meta.hint
  }))
}

export async function runSafeCommand(
  commandId: string
): Promise<{ ok: boolean; output: string }> {
  const spec = SAFE_COMMANDS[commandId]
  if (!spec) return { ok: false, output: 'Unknown or disallowed command' }
  try {
    if (spec.kind === 'builtin') {
      const output = await spec.run()
      return { ok: true, output: output.trim() || '(no output)' }
    }
    const { stdout, stderr } = await execFileAsync(spec.bin, spec.args, {
      timeout: 8000,
      windowsHide: true
    })
    return { ok: true, output: (stdout || stderr || '').trim() || '(no output)' }
  } catch (err) {
    return { ok: false, output: err instanceof Error ? err.message : String(err) }
  }
}
