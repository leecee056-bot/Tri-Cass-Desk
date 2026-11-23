#!/usr/bin/env node
/**
 * HAP-80 smoke: Ollama streaming + non-stream chat (main-process contract).
 * Run with Ollama up: `node scripts/hap80-ollama-smoke.mjs`
 */
const OLLAMA = process.env.OLLAMA_HOST?.replace(/\/$/, '') || 'http://127.0.0.1:11434'

async function main() {
  const tags = await fetch(`${OLLAMA}/api/tags`)
  if (!tags.ok) throw new Error(`Ollama tags HTTP ${tags.status}`)
  const { models } = await tags.json()
  const model = models?.[0]?.name
  if (!model) throw new Error('No models pulled')
  console.log('model', model)

  // Non-stream
  const once = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      options: { num_predict: 16, temperature: 0 }
    })
  })
  if (!once.ok) throw new Error(`chat once HTTP ${once.status}`)
  const onceData = await once.json()
  console.log('once', JSON.stringify(onceData.message?.content || '').slice(0, 80))

  // Stream NDJSON
  const stream = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'user', content: 'Count 1 2 3' }],
      options: { num_predict: 32, temperature: 0 }
    })
  })
  if (!stream.ok) throw new Error(`chat stream HTTP ${stream.status}`)
  const reader = stream.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  let chunks = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      const j = JSON.parse(line)
      const d = j.message?.content || ''
      if (d) {
        full += d
        chunks++
      }
    }
  }
  console.log('stream chunks', chunks, 'text', JSON.stringify(full).slice(0, 120))
  if (chunks < 1) throw new Error('Expected streamed deltas')
  console.log('HAP-80 ollama smoke OK')
}

main().catch((e) => {
  console.error('FAIL', e)
  process.exit(1)
})
