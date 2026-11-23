import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentRun, AgentStep } from '../../shared/types'
import { listProcesses, listDisks, hashText } from './systemExtras'
import { listNotes } from './vault'
import { chatGenerate, ollamaStatus, listModels } from './ollama'
import { sampleSystem } from '../telemetry'
import { listDirectory, readTextFile, writeTextFile, getHomeDir } from './files'

async function step(kind: AgentStep['kind'], text: string): Promise<AgentStep> {
  return { at: Date.now(), kind, text }
}

const AGENTS_MD = `# Tri-Cass Desk — agent instructions

You are the local Tri-Cass Desk companion (offline-first, Ollama).
- Prefer local files and vault notes over inventing paths.
- Never claim outdoor weather APIs — atmosphere is machine telemetry metaphor.
- After editing TypeScript: suggest \`npm run typecheck\` and \`npm run build\`.
- Packaging for Windows: \`npm run pack:win\`.
- Nexus-OS-V1 is a separate product — do not modify it from Desk tasks.
`

const TOOL_CATALOG = `Available tools (call at most one per turn):
- TOOL list_dir path=<absolute-or-~>
- TOOL read_file path=<absolute-or-~>
- TOOL processes
- TOOL disks
- TOOL system_sample
- TOOL ollama_status
- TOOL vault_list
- TOOL hash text=<string>
- TOOL knowledge (returns AGENTS.md excerpt)

When finished (or if no tool needed), reply with:
FINAL
<your answer for the user>

Rules:
- Prefer tools over guessing machine state or file contents.
- plan mode: never propose writes.
- build mode: you may end with WRITE path=<path> then a fenced code block to propose a file write (user must approve).
`

export type AgentLoopOpts = {
  mode?: 'inspect' | 'plan' | 'build'
  model?: string
  temperature?: number
  maxRounds?: number
}

async function execTool(name: string, args: Record<string, string>): Promise<string> {
  switch (name) {
    case 'list_dir': {
      const raw = args.path || (await getHomeDir())
      const path = raw.startsWith('~') ? join(homedir(), raw.slice(1)) : raw
      const { path: resolved, entries } = await listDirectory(path)
      return (
        `list_dir ${resolved}\n` +
        entries
          .slice(0, 50)
          .map((e) => `${e.isDirectory ? 'dir' : 'file'} ${e.name}`)
          .join('\n')
      )
    }
    case 'read_file': {
      const raw = args.path || ''
      if (!raw) return 'error: path required'
      const path = raw.startsWith('~') ? join(homedir(), raw.slice(1)) : raw
      const body = await readTextFile(path)
      return `read_file ${path}\n${body.slice(0, 6000)}`
    }
    case 'processes': {
      const procs = await listProcesses()
      return (
        `processes (${procs.length})\n` +
        procs
          .slice(0, 12)
          .map((p) => `${p.name} pid=${p.pid} cpu=${p.cpu.toFixed(1)}`)
          .join('\n')
      )
    }
    case 'disks': {
      const disks = await listDisks()
      return disks.map((d) => `${d.mount || d.fs}: ${d.use.toFixed(0)}% used`).join('\n')
    }
    case 'system_sample': {
      const sys = await sampleSystem()
      return `cpu=${(sys.cpuLoad * 100).toFixed(0)}% ram=${(sys.ramUsedRatio * 100).toFixed(0)}% gpu=${
        sys.gpuLoad != null ? `${(sys.gpuLoad * 100).toFixed(0)}%` : 'n/a'
      } processes=${sys.processCount}`
    }
    case 'ollama_status': {
      const status = await ollamaStatus()
      if (!status.ok) return status.detail
      const models = await listModels()
      return `${status.detail}\nmodels:\n${models.map((m) => m.name).join('\n') || '(none)'}`
    }
    case 'vault_list': {
      const notes = listNotes()
      return notes.length ? notes.map((n) => `• ${n.title}`).join('\n') : 'Vault is empty.'
    }
    case 'hash': {
      return hashText(args.text || '', 'sha256')
    }
    case 'knowledge': {
      return AGENTS_MD
    }
    default:
      return `Unknown tool: ${name}`
  }
}

function parseToolCall(text: string): { name: string; args: Record<string, string> } | null {
  const toolLine = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^TOOL\s+/i.test(l))
  if (!toolLine) return null
  const rest = toolLine.replace(/^TOOL\s+/i, '').trim()
  const [name, ...argParts] = rest.split(/\s+/)
  if (!name) return null
  const args: Record<string, string> = {}
  for (const part of argParts) {
    const eq = part.indexOf('=')
    if (eq > 0) args[part.slice(0, eq)] = part.slice(eq + 1)
  }
  // multi-line path= support: TOOL read_file\npath: foo
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^(path|text)\s*[:=]\s*(.+)$/i)
    if (m) args[m[1]!.toLowerCase()] = m[2]!.trim()
  }
  return { name: name.toLowerCase(), args }
}

function parseWriteProposal(text: string): { path: string; content: string } | null {
  const match = text.match(/WRITE\s+path=(\S+)[\s\S]*?```[\w]*\n([\s\S]*?)```/i)
  if (match) return { path: match[1]!, content: match[2]! }
  const alt = text.match(/WRITE\s+(\S+)\s*```[\w]*\n([\s\S]*?)```/i)
  if (alt) return { path: alt[1]!, content: alt[2]! }
  return null
}

/** Legacy keyword agent — inspects machine state, never hits external APIs. */
export async function runAgent(prompt: string): Promise<AgentRun> {
  return runAgentLoop(prompt, { mode: 'inspect', maxRounds: 1 })
}

/**
 * OpenCode-style multi-round tool loop with local Ollama + allowlisted tools.
 * inspect: tools only (fast heuristics + optional LLM)
 * plan/build: LLM decides tools until FINAL
 */
export async function runAgentLoop(prompt: string, opts: AgentLoopOpts = {}): Promise<AgentRun> {
  const mode = opts.mode ?? 'inspect'
  const run: AgentRun = {
    id: randomUUID(),
    prompt,
    steps: [],
    status: 'running',
    at: Date.now()
  }

  const push = async (kind: AgentStep['kind'], text: string): Promise<void> => {
    run.steps.push(await step(kind, text))
  }

  await push('thought', `${mode} agent · working locally on: ${prompt.slice(0, 200)}`)

  try {
    // Fast path for inspect: keyword tools first, then optional LLM summary
    if (mode === 'inspect') {
      const q = prompt.toLowerCase()
      if (q.includes('cpu') || q.includes('ram') || q.includes('gpu') || q.includes('load')) {
        await push('tool', await execTool('system_sample', {}))
      } else if (q.includes('process') || q.includes('top')) {
        await push('tool', await execTool('processes', {}))
      } else if (q.includes('disk') || q.includes('storage')) {
        await push('tool', await execTool('disks', {}))
      } else if (q.includes('vault') || q.includes('note')) {
        await push('tool', await execTool('vault_list', {}))
      } else if (q.includes('model') || q.includes('ollama') || q.includes('llm')) {
        await push('tool', await execTool('ollama_status', {}))
      } else if (q.includes('hash')) {
        await push('tool', await execTool('hash', { text: prompt }))
      } else if (q.includes('list') || q.includes('files') || q.includes('dir')) {
        await push('tool', await execTool('list_dir', {}))
      } else {
        await push('tool', await execTool('system_sample', {}))
        await push('tool', await execTool('ollama_status', {}))
      }
    }

    const status = await ollamaStatus()
    if (!status.ok) {
      if (mode === 'inspect' && run.steps.some((s) => s.kind === 'tool')) {
        await push(
          'result',
          run.steps
            .filter((s) => s.kind === 'tool')
            .map((s) => s.text)
            .join('\n\n') + `\n\n(Ollama offline — ${status.detail})`
        )
        run.status = 'done'
        return run
      }
      await push('error', `Ollama offline: ${status.detail}`)
      run.status = 'error'
      return run
    }

    const maxRounds = opts.maxRounds ?? (mode === 'inspect' ? 2 : mode === 'plan' ? 4 : 6)
    const history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      {
        role: 'user',
        content:
          mode === 'inspect'
            ? `Summarize these tool results for the user request "${prompt}":\n\n` +
              run.steps
                .filter((s) => s.kind === 'tool')
                .map((s) => s.text)
                .join('\n\n')
            : prompt
      }
    ]

    const system = [
      AGENTS_MD,
      TOOL_CATALOG,
      `Mode: ${mode}.`,
      mode === 'plan' ? 'Read-only — do not propose WRITE.' : '',
      mode === 'build' ? 'You may propose one WRITE at the end after tools.' : '',
      mode === 'inspect' ? 'Be concise. Prefer FINAL with a short summary of tool data.' : ''
    ]
      .filter(Boolean)
      .join('\n\n')

    for (let round = 0; round < maxRounds; round++) {
      await push('plan', `LLM round ${round + 1}/${maxRounds}`)
      const reply = await chatGenerate(history, {
        model: opts.model,
        temperature: opts.temperature ?? (mode === 'build' ? 0.3 : 0.4),
        system,
        numPredict: mode === 'inspect' ? 256 : 512,
        timeoutMs: 240_000
      })
      await push('llm', reply)
      history.push({ role: 'assistant', content: reply })

      if (/^FINAL\b/im.test(reply) || reply.trim().toUpperCase().startsWith('FINAL')) {
        const finalText = reply.replace(/^[\s\S]*?\bFINAL\b\s*/i, '').trim() || reply
        await push('result', finalText)

        if (mode === 'build') {
          const proposed = parseWriteProposal(reply)
          if (proposed) {
            await push(
              'permission',
              JSON.stringify({
                path: proposed.path,
                content: proposed.content,
                preview: proposed.content.slice(0, 400)
              })
            )
          }
        }
        run.status = 'done'
        return run
      }

      const tool = parseToolCall(reply)
      if (!tool) {
        // Model answered without FINAL — treat as result
        await push('result', reply)
        if (mode === 'build') {
          const proposed = parseWriteProposal(reply)
          if (proposed) {
            await push(
              'permission',
              JSON.stringify({
                path: proposed.path,
                content: proposed.content,
                preview: proposed.content.slice(0, 400)
              })
            )
          }
        }
        run.status = 'done'
        return run
      }

      try {
        const out = await execTool(tool.name, tool.args)
        await push('tool', `${tool.name} →\n${out}`)
        history.push({
          role: 'user',
          content: `Tool result for ${tool.name}:\n${out}\n\nContinue. Use another TOOL or FINAL.`
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await push('error', `${tool.name}: ${msg}`)
        history.push({
          role: 'user',
          content: `Tool ${tool.name} failed: ${msg}\nContinue with FINAL or another TOOL.`
        })
      }
    }

    await push('note', 'Reached max tool rounds — stopping.')
    run.status = 'done'
  } catch (err) {
    await push('error', err instanceof Error ? err.message : String(err))
    run.status = 'error'
  }

  return run
}

/** Apply an approved write from a permission step (build mode). */
export async function applyAgentWrite(path: string, content: string): Promise<void> {
  const resolved = path.startsWith('~') ? join(homedir(), path.slice(1)) : path
  await writeTextFile(resolved, content)
}
