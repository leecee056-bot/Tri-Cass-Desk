import { randomUUID } from 'node:crypto'
import type { AgentRun, AgentStep } from '../../shared/types'
import { listProcesses, listDisks, hashText } from './systemExtras'
import { listNotes } from './vault'
import { ollamaStatus, listModels } from './ollama'
import { sampleSystem } from '../telemetry'

async function step(
  kind: AgentStep['kind'],
  text: string
): Promise<AgentStep> {
  return { at: Date.now(), kind, text }
}

/** Local allowlisted agent — inspects machine state, never hits external APIs. */
export async function runAgent(prompt: string): Promise<AgentRun> {
  const run: AgentRun = {
    id: randomUUID(),
    prompt,
    steps: [],
    status: 'running'
  }

  run.steps.push(await step('thought', `Working locally on: ${prompt.slice(0, 200)}`))

  try {
    const q = prompt.toLowerCase()
    if (q.includes('cpu') || q.includes('ram') || q.includes('gpu') || q.includes('load')) {
      const sys = await sampleSystem()
      run.steps.push(
        await step(
          'tool',
          `sampleSystem → cpu=${(sys.cpuLoad * 100).toFixed(0)}% ram=${(sys.ramUsedRatio * 100).toFixed(0)}% gpu=${sys.gpuLoad != null ? `${(sys.gpuLoad * 100).toFixed(0)}%` : 'n/a'}`
        )
      )
      run.steps.push(
        await step(
          'result',
          `Machine load band estimate: CPU ${(sys.cpuLoad * 100).toFixed(0)}%, RAM ${(sys.ramUsedRatio * 100).toFixed(0)}%, ${sys.processCount} processes.`
        )
      )
    } else if (q.includes('process') || q.includes('top')) {
      const procs = await listProcesses()
      run.steps.push(await step('tool', `listProcesses → ${procs.length} rows`))
      const top = procs
        .slice(0, 5)
        .map((p) => `${p.name} pid=${p.pid} cpu=${p.cpu.toFixed(1)}`)
        .join('\n')
      run.steps.push(await step('result', `Top processes:\n${top}`))
    } else if (q.includes('disk') || q.includes('storage')) {
      const disks = await listDisks()
      run.steps.push(await step('tool', `listDisks → ${disks.length}`))
      run.steps.push(
        await step(
          'result',
          disks.map((d) => `${d.mount || d.fs}: ${d.use.toFixed(0)}% used`).join('\n')
        )
      )
    } else if (q.includes('vault') || q.includes('note')) {
      const notes = listNotes()
      run.steps.push(await step('tool', `vaultList → ${notes.length}`))
      run.steps.push(
        await step(
          'result',
          notes.length
            ? notes.map((n) => `• ${n.title}`).join('\n')
            : 'Vault is empty.'
        )
      )
    } else if (q.includes('model') || q.includes('ollama') || q.includes('llm')) {
      const status = await ollamaStatus()
      run.steps.push(await step('tool', `ollamaStatus → ${status.detail}`))
      if (status.ok) {
        const models = await listModels()
        run.steps.push(
          await step(
            'result',
            models.length
              ? models.map((m) => m.name).join('\n')
              : 'Ollama up, but no models pulled.'
          )
        )
      } else {
        run.steps.push(await step('result', status.detail))
      }
    } else if (q.includes('hash')) {
      const digest = hashText(prompt, 'sha256')
      run.steps.push(await step('tool', 'hashText sha256'))
      run.steps.push(await step('result', digest))
    } else {
      const sys = await sampleSystem()
      const status = await ollamaStatus()
      run.steps.push(await step('tool', 'sampleSystem + ollamaStatus'))
      run.steps.push(
        await step(
          'result',
          [
            'Local agent summary:',
            `• CPU ${(sys.cpuLoad * 100).toFixed(0)}% · RAM ${(sys.ramUsedRatio * 100).toFixed(0)}%`,
            `• Ollama: ${status.ok ? 'online' : 'offline'}`,
            'Try prompts like: “top processes”, “disk usage”, “list models”, “vault notes”.'
          ].join('\n')
        )
      )
    }
    run.status = 'done'
  } catch (err) {
    run.steps.push(
      await step('error', err instanceof Error ? err.message : String(err))
    )
    run.status = 'error'
  }

  return run
}
