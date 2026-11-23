/**
 * Built-in Tri-Cass Desk knowledge base — companion / OS / Earthbound context
 * the local LLM and coding agent can call on (OpenCode-style AGENTS guidance).
 */

export type KnowledgeDoc = {
  id: string
  title: string
  tags: string[]
  body: string
}

export const DESK_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: 'agents-desk',
    title: 'AGENTS.md — Tri-Cass Desk',
    tags: ['agents', 'coding', 'desk'],
    body: `# Tri-Cass Desk — agent instructions

You are the local Tri-Cass Desk companion (offline-first, Ollama).
- Prefer local files and vault notes over inventing paths.
- Never claim outdoor weather APIs — atmosphere is machine telemetry metaphor.
- Earthbound living scene reacts to CPU/RAM/process churn, solar phase, and preferences.
- Windows use frosted glass + title + minimize/maximize/close (not Apple traffic lights).
- After editing TypeScript: suggest \`npm run typecheck\` and \`npm run build\`.
- Packaging for Windows: \`npm run pack:win\`.
- Nexus-OS-V1 is a separate product — do not modify it from Desk tasks.
`
  },
  {
    id: 'earthbound',
    title: 'Earthbound / Celestial living companion',
    tags: ['scene', 'earthbound', 'telemetry'],
    body: `# Earthbound living world

The desk is a living companion environment, not a wallpaper.
- Camera: full 360° yaw via edge-pan; Alt/⌘-drag or Shift+wheel to orbit.
- Engines: Three.js/drei clouds & stars, WebGL aurora & lake water.
- Telemetry bands: tranquil → strained drive mood tint and aurora energy.
- Day/night from local solar phase; rain/fog/wind from system load metaphors.
`
  },
  {
    id: 'companion-apps',
    title: 'Companion app suite map',
    tags: ['apps', 'suite', 'os'],
    body: `# Desk apps (market intent)

| App | Market equivalent intent |
| Chat | ChatGPT / Grok — sessions, modes, KB, settings |
| Agents | OpenCode — plan/build, tools, AGENTS.md |
| Editor | VS Code — tabs, save, language |
| Files | Finder/Explorer — browse, open, preview |
| Browser | Chrome/Edge — tab strip, omnibox (URL/search), bookmark bar + star, history search, back/forward/reload/stop/home |
| Terminal | iTerm/Windows Terminal — safe commands |
| Media | VLC/Music — playlist, transport (play/seek/vol), open multi-file, loop/shuffle |
| Vault | Notes/secrets store — local encrypted-ish notes |
| Atmosphere | Weather widget — local telemetry weather metaphor |
| Mood/System | Activity Monitor / Health |
| Tools | 240 utility tools hub |
| Projects | Project folders / launcher |
| Notes | Apple Notes — multi-note |
`
  },
  {
    id: 'coding-workflow',
    title: 'Coding with local LLM',
    tags: ['coding', 'opencode', 'ollama'],
    body: `# Coding workflow

Modes:
- **Chat** — general companion Q&A with optional knowledge; **streams** Ollama tokens live.
- **Code** — read/list workspace files, propose edits, \`/agent\` OpenCode loop, vault/notes context.
- **Plan** — read-only analysis (OpenCode plan agent style).

Agents app: inspect / plan / build multi-round TOOL→FINAL loop with allowlisted local tools; build writes need Approve.
Knowledge is loaded from built-in Desk docs plus \`~/.tricass-desk/knowledge/*.md\` when present.
Always cite which knowledge doc you used when answering product questions.
`
  },
  {
    id: 'nexus-boundary',
    title: 'Nexus vs Desk boundary',
    tags: ['nexus', 'boundary'],
    body: `# Product boundary

- **Tri-Cass Desk** — this Electron living companion (HAP-76).
- **Nexus-OS-V1** — separate OS/site product; Desk must not edit Nexus repos.
- Shared brand: Tri-Cass; keep Desk offline-first and local-telemetry honest.
`
  }
]

export function searchKnowledge(query: string): KnowledgeDoc[] {
  const q = query.trim().toLowerCase()
  if (!q) return DESK_KNOWLEDGE
  return DESK_KNOWLEDGE.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.tags.some((t) => t.includes(q)) ||
      d.body.toLowerCase().includes(q)
  )
}

export function knowledgeAsSystemPrompt(ids?: string[]): string {
  const docs = ids?.length
    ? DESK_KNOWLEDGE.filter((d) => ids.includes(d.id))
    : DESK_KNOWLEDGE
  return docs.map((d) => `## ${d.title}\n${d.body}`).join('\n\n')
}

export function modeSystemPrompt(mode: 'chat' | 'code' | 'plan'): string {
  if (mode === 'plan') {
    return `You are Tri-Cass Desk Plan agent (OpenCode-style, read-only). Analyze, outline steps, do not invent file writes. Use knowledge base when relevant.`
  }
  if (mode === 'code') {
    return `You are Tri-Cass Desk Code agent. Help write and reason about code. Prefer concrete diffs and commands. Use knowledge base and attached file context.`
  }
  return `You are Tri-Cass Desk companion. Helpful, local-first, honest about offline limits.`
}
