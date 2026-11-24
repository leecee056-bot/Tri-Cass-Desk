/**
 * Plan mode + project rules (.tri-cass-rules / .tri-cass/plan.md).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { workspaceRoot } from '../paths'

export type AgentMode = 'plan' | 'act'

export const PLAN_PATH = '.tri-cass/plan.md'
export const RULES_FILE = '.tri-cass-rules'

export const DEFAULT_RULES = `# Tri-Cass Desk project rules
- Prefer projects/ under the Desk workspace for agent builds.
- Keep files small; one concern per file.
- Use relative paths under the workspace; never touch system paths.
- After edits, prefer short run checks (python/node) when possible.
- Ask at most one clarifying question before planning a multi-file app.
- Open the Editor after writing so the user can review.
`

function rulesPath(): string {
  return join(workspaceRoot(), RULES_FILE)
}

function planAbs(): string {
  return join(workspaceRoot(), PLAN_PATH)
}

export function ensureRulesFile(): void {
  const p = rulesPath()
  if (!existsSync(p)) {
    writeFileSync(p, DEFAULT_RULES, 'utf8')
  }
  mkdirSync(join(workspaceRoot(), '.tri-cass'), { recursive: true })
  mkdirSync(join(workspaceRoot(), 'projects'), { recursive: true })
}

export function loadRulesText(): string {
  ensureRulesFile()
  try {
    return readFileSync(rulesPath(), 'utf8')
  } catch {
    return DEFAULT_RULES
  }
}

export function loadPlanText(): string {
  try {
    if (!existsSync(planAbs())) return ''
    return readFileSync(planAbs(), 'utf8')
  } catch {
    return ''
  }
}

export function savePlanText(body: string): void {
  mkdirSync(join(workspaceRoot(), '.tri-cass'), { recursive: true })
  writeFileSync(planAbs(), body, 'utf8')
}

export function parseModeIntent(
  userMessage: string
): 'plan' | 'accept' | 'act' | null {
  const q = userMessage.trim().toLowerCase()
  if (
    /^(accept( plan)?|approve( plan)?|looks good|lgtm|go ahead|execute plan|start building)\b/.test(
      q
    ) ||
    /\b(accept|approve)\s+(the\s+)?plan\b/.test(q)
  ) {
    return 'accept'
  }
  if (
    /^(plan mode|enter plan|switch to plan)\b/.test(q) ||
    /\b(enter|start|use)\s+plan\s+mode\b/.test(q)
  ) {
    return 'plan'
  }
  if (
    /^(act mode|execute mode|build mode)\b/.test(q) ||
    /\b(enter|start|use|switch to)\s+act\s+mode\b/.test(q)
  ) {
    return 'act'
  }
  if (/^plan\b/.test(q) && !/\baccept\b/.test(q)) {
    return 'plan'
  }
  return null
}

export function wantsBuildPlan(userMessage: string): boolean {
  const q = userMessage.toLowerCase()
  return (
    /\b(build|scaffold|create|make|write)\b/.test(q) &&
    /\b(app|website|project|timer|flask|cli|site|game)\b/.test(q)
  )
}
