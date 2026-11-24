/**
 * Cline-slim JSON one-tool-at-a-time grammar (ported from Pocket Agent / HAP-112).
 * Shape: {"tool":"<name>","args":{...}}
 */

export const GRAMMAR_TOOLS = [
  'write_file',
  'edit_file',
  'read_file',
  'list_dir',
  'run',
  'search_knowledge',
  'create_checkpoint',
  'list_checkpoints',
  'restore_checkpoint',
  'finish'
] as const

export type GrammarToolName = (typeof GRAMMAR_TOOLS)[number]

export type GrammarCall = {
  tool: GrammarToolName
  args: Record<string, string>
}

export const MAX_GRAMMAR_STEPS = 10

export const GRAMMAR_SYSTEM = `You are Tri-Cass Desk Pocket Agent (Cline-slim). Reply with ONE JSON object only — no markdown fences, no prose.
Shape: {"tool":"<name>","args":{...}}
Tools (one per reply):
- write_file: args path, content — create/overwrite under the Desk workspace
- edit_file: args path, old, new — replace first occurrence of old with new
- read_file: args path
- list_dir: args path ("" = workspace root)
- run: args project, command — sandboxed; cwd=projects/<project>; python/node only
- search_knowledge: args query — vault + coding pack hints
- create_checkpoint: args label — snapshot workspace files
- list_checkpoints: args {}
- restore_checkpoint: args id ("latest" = most recent)
- finish: args message — done; message is the user-facing answer
Prefer relative paths under the workspace. Prefer short edits. After writes, run a check when useful. Call finish when done.`

const TOOL_SET = new Set<string>(GRAMMAR_TOOLS)

/** Extract first balanced JSON object from model text. */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) {
        esc = false
      } else if (c === '\\') {
        esc = true
      } else if (c === '"') {
        inStr = false
      }
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

export function parseGrammarCall(text: string): GrammarCall | null {
  const raw = extractJsonObject(text)
  if (!raw) return null
  try {
    const obj = JSON.parse(raw) as {
      tool?: unknown
      args?: unknown
      name?: unknown
    }
    const tool = String(obj.tool ?? obj.name ?? '').trim()
    if (!TOOL_SET.has(tool)) return null
    const argsIn =
      obj.args && typeof obj.args === 'object' && !Array.isArray(obj.args)
        ? (obj.args as Record<string, unknown>)
        : {}
    const args: Record<string, string> = {}
    for (const [k, v] of Object.entries(argsIn)) {
      if (v == null) continue
      args[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }
    return { tool: tool as GrammarToolName, args }
  } catch {
    return null
  }
}
