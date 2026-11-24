import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join, resolve, normalize, relative, sep, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { AgentRun, AgentStep } from '../../shared/types'
import { listProcesses, listDisks, hashText } from './systemExtras'
import { listNotes } from './vault'
import { chatGenerate, ollamaStatus, listModels } from './ollama'
import { sampleSystem } from '../telemetry'
import { listDirectory, readTextFile, writeTextFile, getHomeDir } from './files'
import { workspaceRoot } from './paths'
import {
  GRAMMAR_SYSTEM,
  MAX_GRAMMAR_STEPS,
  parseGrammarCall,
  type GrammarCall
} from './agentCline/grammar'
import {
  createCheckpoint,
  listCheckpoints,
  restoreCheckpoint
} from './agentCline/checkpoints'
import { createStuckTracker, isStuck, recordError, rollbackLatest } from './agentCline/stuck'
import { postWriteVerify } from './agentCline/postWrite'
import { runSandboxed } from './agentCline/sandboxRun'
import {
  ensureRulesFile,
  loadPlanText,
  loadRulesText,
  parseModeIntent,
  savePlanText,
  wantsBuildPlan
} from './agentCline/planRules'
import { ensureCodingPack, searchCodingPack } from './agentCline/codingPack'

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
- Build/act mode uses the Cline-slim JSON grammar against the Desk workspace (+ projects/).
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
  /** Prefer JSON grammar loop (default for build). */
  protocol?: 'text' | 'grammar'
}

function resolveWorkspacePath(raw: string): string {
  const root = workspaceRoot()
  const trimmed = (raw || '').trim()
  if (!trimmed || trimmed === '.' || trimmed === './') return root
  if (trimmed.startsWith('~')) return join(homedir(), trimmed.slice(1))
  if (trimmed.startsWith('/') || /^[A-Za-z]:[\\/]/.test(trimmed)) {
    return resolve(normalize(trimmed))
  }
  return resolve(root, trimmed)
}

function toRel(path: string): string {
  const root = workspaceRoot()
  const rel = relative(root, path)
  if (!rel || rel.startsWith('..')) return path
  return rel.split(sep).join('/')
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

async function execGrammarTool(call: GrammarCall, push: (k: AgentStep['kind'], t: string) => Promise<void>): Promise<{
  ok: boolean
  text: string
  wrote?: { path: string; content: string }
}> {
  const { tool, args } = call
  switch (tool) {
    case 'finish':
      return { ok: true, text: args.message || '(done)' }
    case 'list_dir': {
      const path = resolveWorkspacePath(args.path || '')
      try {
        const { path: resolved, entries } = listDirectory(path)
        return {
          ok: true,
          text:
            `list_dir ${toRel(resolved) || resolved}\n` +
            entries
              .slice(0, 60)
              .map((e) => `${e.isDirectory ? 'dir' : 'file'} ${e.name}`)
              .join('\n')
        }
      } catch (e) {
        return { ok: false, text: e instanceof Error ? e.message : String(e) }
      }
    }
    case 'read_file': {
      const path = resolveWorkspacePath(args.path || '')
      try {
        const body = readTextFile(path)
        return { ok: true, text: `read_file ${toRel(path)}\n${body.slice(0, 8000)}` }
      } catch (e) {
        return { ok: false, text: e instanceof Error ? e.message : String(e) }
      }
    }
    case 'write_file': {
      const path = resolveWorkspacePath(args.path || '')
      const content = args.content ?? ''
      if (!args.path) return { ok: false, text: 'write_file needs path' }
      mkdirSync(dirname(path), { recursive: true })
      writeTextFile(path, content)
      const verify = await postWriteVerify({ path: toRel(path), content })
      await push('note', `post-write: ${verify.detail}`)
      return {
        ok: verify.ok,
        text: verify.ok
          ? `wrote ${toRel(path)} (${content.length} chars) · ${verify.detail}`
          : `wrote ${toRel(path)} but verify failed: ${verify.detail}`,
        wrote: { path, content }
      }
    }
    case 'edit_file': {
      const path = resolveWorkspacePath(args.path || '')
      const old = args.old ?? ''
      const neu = args.new ?? ''
      if (!args.path || !old) return { ok: false, text: 'edit_file needs path and old' }
      let body: string
      try {
        body = readTextFile(path)
      } catch (e) {
        return { ok: false, text: e instanceof Error ? e.message : String(e) }
      }
      if (!body.includes(old)) return { ok: false, text: 'edit_file: old text not found' }
      const next = body.replace(old, neu)
      writeTextFile(path, next)
      const verify = await postWriteVerify({ path: toRel(path), content: next })
      await push('note', `post-write: ${verify.detail}`)
      return {
        ok: verify.ok,
        text: verify.ok
          ? `edited ${toRel(path)} · ${verify.detail}`
          : `edited ${toRel(path)} but verify failed: ${verify.detail}`,
        wrote: { path, content: next }
      }
    }
    case 'run': {
      const res = await runSandboxed({
        project: args.project || '',
        command: args.command || '',
        timeout: args.timeout
      })
      return { ok: res.ok, text: res.text }
    }
    case 'search_knowledge': {
      const vault = listNotes()
        .filter((n) => {
          const q = (args.query || '').toLowerCase()
          if (!q) return true
          return (
            n.title.toLowerCase().includes(q) ||
            (n.body || '').toLowerCase().includes(q)
          )
        })
        .slice(0, 5)
        .map((n) => `• ${n.title}`)
        .join('\n')
      const pack = searchCodingPack(args.query || '')
      return {
        ok: true,
        text: `Vault:\n${vault || '(none)'}\n\nCoding pack:\n${pack}`
      }
    }
    case 'create_checkpoint': {
      const meta = createCheckpoint(args.label || 'agent')
      return {
        ok: true,
        text: `checkpoint ${meta.id} · ${meta.label} · ${meta.fileCount} files`
      }
    }
    case 'list_checkpoints': {
      const items = listCheckpoints()
      if (!items.length) return { ok: true, text: 'No checkpoints yet.' }
      return {
        ok: true,
        text: items
          .map((m) => `${m.id}  ${m.label}  files=${m.fileCount}  ${new Date(m.createdAt).toISOString()}`)
          .join('\n')
      }
    }
    case 'restore_checkpoint': {
      return { ok: true, text: restoreCheckpoint(args.id || 'latest') }
    }
    default:
      return { ok: false, text: `Unknown tool: ${tool}` }
  }
}

/**
 * Cline-slim JSON grammar loop for build/act (workspace + Editor-friendly).
 */
async function runGrammarLoop(prompt: string, opts: AgentLoopOpts, run: AgentRun): Promise<AgentRun> {
  const push = async (kind: AgentStep['kind'], text: string): Promise<void> => {
    run.steps.push(await step(kind, text))
  }

  ensureRulesFile()
  ensureCodingPack()
  const rules = loadRulesText()
  const plan = loadPlanText()

  const intent = parseModeIntent(prompt)
  if (intent === 'plan' || (opts.mode === 'plan' && !intent)) {
    await push('plan', 'Plan mode — drafting checklist into .tri-cass/plan.md (no writes).')
  }
  if (intent === 'accept') {
    await push('note', 'Plan accepted — switching to act/grammar build.')
  }
  if (!plan && wantsBuildPlan(prompt) && opts.mode !== 'build') {
    await push(
      'note',
      'Tip: multi-file builds work best after a short plan. Say "plan mode" or use Plan in Agents.'
    )
  }

  const status = await ollamaStatus()
  if (!status.ok) {
    await push('error', `Ollama offline: ${status.detail}`)
    run.status = 'error'
    return run
  }

  // Baseline checkpoint before mutating turns
  const baseline = createCheckpoint('pre-agent')
  await push('note', `Checkpoint ${baseline.id} saved before grammar loop.`)

  const stuck = createStuckTracker()
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: prompt }
  ]

  const system = [
    GRAMMAR_SYSTEM,
    'Workspace root is the Desk workspace (projects/ for sandboxed run).',
    `Project rules:\n${rules.slice(0, 2500)}`,
    plan ? `Current plan.md:\n${plan.slice(0, 1500)}` : '',
    opts.mode === 'plan'
      ? 'PLAN ONLY: do not call write_file or edit_file. Prefer finish with a markdown checklist; you may ask to save the plan.'
      : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  let lastWrote: { path: string; content: string } | null = null

  for (let i = 0; i < (opts.maxRounds ?? MAX_GRAMMAR_STEPS); i++) {
    await push('plan', `Grammar step ${i + 1}/${opts.maxRounds ?? MAX_GRAMMAR_STEPS}`)
    const reply = await chatGenerate(history, {
      model: opts.model,
      temperature: opts.temperature ?? 0.2,
      system,
      numPredict: 768,
      format: 'json',
      timeoutMs: 240_000
    })
    await push('llm', reply)
    history.push({ role: 'assistant', content: reply })

    const call = parseGrammarCall(reply)
    if (!call) {
      await push('error', 'Model did not return a valid grammar JSON tool call.')
      const streak = recordError(stuck, 'invalid grammar json')
      if (isStuck(streak)) {
        const msg = rollbackLatest(baseline.id)
        await push('result', `Stuck ×3 on invalid JSON. ${msg}`)
        run.status = 'done'
        return run
      }
      history.push({
        role: 'user',
        content: 'Invalid JSON. Reply with one {"tool":"...","args":{...}} object only.'
      })
      continue
    }

    if (call.tool === 'finish') {
      const message = call.args.message || '(done)'
      // If plan mode produced a checklist, persist it
      if (opts.mode === 'plan' && message.includes('-')) {
        savePlanText(`# Plan\n\n${message}\n`)
        await push('note', 'Saved plan to .tri-cass/plan.md')
      }
      await push('result', message)
      if (lastWrote) {
        await push(
          'permission',
          JSON.stringify({
            path: lastWrote.path,
            content: lastWrote.content,
            preview: lastWrote.content.slice(0, 400),
            openEditor: true
          })
        )
      }
      run.status = 'done'
      return run
    }

    if (opts.mode === 'plan' && (call.tool === 'write_file' || call.tool === 'edit_file')) {
      await push('note', 'Plan mode blocked write — use finish with a checklist instead.')
      history.push({
        role: 'user',
        content: 'Plan mode: do not write files. Call finish with a markdown checklist.'
      })
      continue
    }

    try {
      const out = await execGrammarTool(call, push)
      await push('tool', `${call.tool} →\n${out.text}`)
      if (out.wrote) lastWrote = out.wrote
      if (!out.ok) {
        const streak = recordError(stuck, out.text)
        if (isStuck(streak)) {
          const msg = rollbackLatest(baseline.id)
          await push(
            'result',
            `Stuck on the same error ${streak} times. ${msg} Stopped — change approach (smaller edit).`
          )
          run.status = 'done'
          return run
        }
      } else if (call.tool === 'write_file' || call.tool === 'edit_file') {
        createCheckpoint(`after-${call.tool}`)
      }
      history.push({
        role: 'user',
        content: `Tool result for ${call.tool}:\n${out.text}\n\nContinue with one JSON tool call (or finish).`
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await push('error', `${call.tool}: ${msg}`)
      const streak = recordError(stuck, msg)
      if (isStuck(streak)) {
        const rb = rollbackLatest(baseline.id)
        await push('result', `Stuck ×3. ${rb}`)
        run.status = 'done'
        return run
      }
      history.push({
        role: 'user',
        content: `Tool ${call.tool} failed: ${msg}\nContinue with another tool or finish.`
      })
    }
  }

  await push('note', 'Reached max grammar steps — stopping.')
  run.status = 'done'
  return run
}

/** Legacy keyword agent — inspects machine state, never hits external APIs. */
export async function runAgent(prompt: string): Promise<AgentRun> {
  return runAgentLoop(prompt, { mode: 'inspect', maxRounds: 1 })
}

/**
 * OpenCode-style multi-round tool loop + Cline-slim grammar for build.
 * inspect/plan (text): tools + FINAL
 * build (grammar): JSON one-tool loop with checkpoints / stuck / sandbox run
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

  const useGrammar =
    opts.protocol === 'grammar' ||
    (opts.protocol !== 'text' && mode === 'build')

  await push(
    'thought',
    `${mode} agent · ${useGrammar ? 'Cline grammar' : 'text tools'} · ${prompt.slice(0, 200)}`
  )

  if (useGrammar) {
    return runGrammarLoop(prompt, { ...opts, mode }, run)
  }

  try {
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
        await push('tool', await execTool('list_dir', { path: workspaceRoot() }))
      } else if (q.includes('checkpoint')) {
        const items = listCheckpoints()
        await push(
          'tool',
          items.length
            ? items.map((m) => `${m.id} ${m.label}`).join('\n')
            : 'No checkpoints yet.'
        )
      } else {
        await push('tool', await execTool('system_sample', {}))
        await push('tool', await execTool('ollama_status', {}))
      }
    }

    if (mode === 'plan') {
      ensureRulesFile()
      const rules = loadRulesText()
      await push('note', `Loaded .tri-cass-rules (${rules.split('\n').length} lines)`)
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
      mode === 'plan' ? 'Read-only — do not propose WRITE. Prefer a markdown checklist FINAL.' : '',
      mode === 'build' ? 'You may propose one WRITE at the end after tools.' : '',
      mode === 'inspect' ? 'Be concise. Prefer FINAL with a short summary of tool data.' : '',
      mode === 'plan' ? `Rules:\n${loadRulesText().slice(0, 1500)}` : ''
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

        if (mode === 'plan') {
          savePlanText(`# Plan\n\n${finalText}\n`)
          await push('note', 'Saved plan to workspace/.tri-cass/plan.md')
        }

        if (mode === 'build') {
          const proposed = parseWriteProposal(reply)
          if (proposed) {
            await push(
              'permission',
              JSON.stringify({
                path: proposed.path,
                content: proposed.content,
                preview: proposed.content.slice(0, 400),
                openEditor: true
              })
            )
          }
        }
        run.status = 'done'
        return run
      }

      const tool = parseToolCall(reply)
      if (!tool) {
        await push('result', reply)
        if (mode === 'plan') {
          savePlanText(`# Plan\n\n${reply}\n`)
        }
        if (mode === 'build') {
          const proposed = parseWriteProposal(reply)
          if (proposed) {
            await push(
              'permission',
              JSON.stringify({
                path: proposed.path,
                content: proposed.content,
                preview: proposed.content.slice(0, 400),
                openEditor: true
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
  const resolved = path.startsWith('~') ? join(homedir(), path.slice(1)) : resolveWorkspacePath(path)
  mkdirSync(dirname(resolved), { recursive: true })
  await writeTextFile(resolved, content)
  createCheckpoint('after-approve-write')
}

export {
  listCheckpoints,
  createCheckpoint,
  restoreCheckpoint,
  ensureRulesFile,
  loadRulesText,
  loadPlanText
}
