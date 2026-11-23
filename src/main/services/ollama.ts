import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { ChatMessage, OllamaModel } from '../../shared/types'
import { chatHistoryPath } from './paths'

const OLLAMA = process.env.OLLAMA_HOST?.replace(/\/$/, '') || 'http://127.0.0.1:11434'
const MAX_HISTORY = 80
const PROMPT_WINDOW = 16

export function loadChatHistory(): ChatMessage[] {
  try {
    if (!existsSync(chatHistoryPath())) return []
    const raw = JSON.parse(readFileSync(chatHistoryPath(), 'utf8')) as ChatMessage[]
    return Array.isArray(raw) ? raw.slice(-MAX_HISTORY) : []
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  writeFileSync(chatHistoryPath(), JSON.stringify(messages.slice(-MAX_HISTORY), null, 2), 'utf8')
}

export function clearChatHistory(): void {
  saveChatHistory([])
}

export async function ollamaStatus(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(2500) })
    if (!res.ok) return { ok: false, detail: `Ollama HTTP ${res.status}` }
    return { ok: true, detail: `Connected · ${OLLAMA}` }
  } catch (err) {
    return {
      ok: false,
      detail: `Ollama unreachable at ${OLLAMA}. Start it locally for chat.`
    }
  }
}

export async function listModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
  const data = (await res.json()) as {
    models?: Array<{ name: string; size?: number; modified_at?: string }>
  }
  return (data.models ?? []).map((m) => ({
    name: m.name,
    size: m.size,
    modifiedAt: m.modified_at
  }))
}

export type ChatGenerateOpts = {
  model?: string
  temperature?: number
  system?: string
}

/** One-shot completion against an explicit message list (multi-session UI). */
export async function chatGenerate(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  opts: ChatGenerateOpts = {}
): Promise<string> {
  const status = await ollamaStatus()
  if (!status.ok) return `Local model offline. ${status.detail}`

  const models = await listModels()
  const chosen = opts.model || models[0]?.name
  if (!chosen) {
    return 'No local Ollama models found. Pull one (e.g. `ollama pull smollm2:135m`).'
  }

  const system =
    opts.system?.trim() ||
    'You are Tri-Cass Desk, a local offline companion. Be concise and practical. Never claim network weather or cloud services.'

  const payload = {
    model: chosen,
    stream: false,
    options: {
      temperature: opts.temperature ?? 0.7,
      num_predict: 768
    },
    messages: [
      { role: 'system', content: system },
      ...messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-PROMPT_WINDOW)
    ]
  }

  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000)
  })
  if (!res.ok) return `Ollama chat failed (HTTP ${res.status}).`
  const data = (await res.json()) as { message?: { content?: string } }
  return data.message?.content?.trim() || '(empty reply)'
}

export async function chatSend(content: string, model?: string): Promise<ChatMessage[]> {
  const history = loadChatHistory()
  const userMsg: ChatMessage = {
    id: randomUUID(),
    role: 'user',
    content,
    at: Date.now()
  }
  history.push(userMsg)
  saveChatHistory(history)

  const status = await ollamaStatus()
  if (!status.ok) {
    const assistant: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: `Local model offline. ${status.detail}`,
      at: Date.now()
    }
    history.push(assistant)
    saveChatHistory(history)
    return history
  }

  const models = await listModels()
  const chosen = model || models[0]?.name
  if (!chosen) {
    const assistant: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: 'No local Ollama models found. Pull one (e.g. `ollama pull smollm2:135m`).',
      at: Date.now()
    }
    history.push(assistant)
    saveChatHistory(history)
    return history
  }

  const payload = {
    model: chosen,
    stream: false,
    options: { temperature: 0.7, num_predict: 512 },
    messages: [
      {
        role: 'system',
        content:
          'You are Tri-Cass Desk, a local offline companion. Be concise and practical. Never claim network weather or cloud services.'
      },
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-PROMPT_WINDOW)
        .map((m) => ({ role: m.role, content: m.content }))
    ]
  }

  const res = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000)
  })
  if (!res.ok) {
    const assistant: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: `Ollama chat failed (HTTP ${res.status}).`,
      at: Date.now()
    }
    history.push(assistant)
    saveChatHistory(history)
    return history
  }

  const data = (await res.json()) as { message?: { content?: string } }
  const assistant: ChatMessage = {
    id: randomUUID(),
    role: 'assistant',
    content: data.message?.content?.trim() || '(empty reply)',
    at: Date.now()
  }
  history.push(assistant)
  saveChatHistory(history)
  return history
}
