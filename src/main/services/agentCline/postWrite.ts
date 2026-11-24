/**
 * Post-write smoke checks (in-process; optional sandboxed py_compile / node --check).
 */

import { runSandboxed } from './sandboxRun'

export type VerifyResult = {
  ok: boolean
  detail: string
}

function balance(text: string, open: string, close: string): boolean {
  let n = 0
  let inStr: '"' | "'" | '`' | null = null
  let esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c
      continue
    }
    if (c === open) n++
    else if (c === close) {
      n--
      if (n < 0) return false
    }
  }
  return n === 0
}

function verifyJson(content: string): VerifyResult {
  try {
    JSON.parse(content)
    return { ok: true, detail: 'json: ok' }
  } catch (e) {
    return {
      ok: false,
      detail: `json: ${e instanceof Error ? e.message : 'parse error'}`
    }
  }
}

function verifyHtml(content: string): VerifyResult {
  const openTags = (content.match(/<[a-zA-Z][^/>]*>/g) || []).length
  const closeTags = (content.match(/<\/[a-zA-Z][^>]*>/g) || []).length
  const selfClose = (content.match(/<[a-zA-Z][^>]*\/>/g) || []).length
  if (openTags > closeTags + selfClose + 8) {
    return {
      ok: false,
      detail: `html: many more open tags (${openTags}) than close tags (${closeTags})`
    }
  }
  return { ok: true, detail: 'html: smoke ok' }
}

function verifyBraced(content: string, kind: string): VerifyResult {
  if (!balance(content, '{', '}') || !balance(content, '(', ')') || !balance(content, '[', ']')) {
    return { ok: false, detail: `${kind}: unbalanced brackets` }
  }
  return { ok: true, detail: `${kind}: brackets ok` }
}

function verifyPython(content: string): VerifyResult {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (/^\t+ +|^\t* +\t/.test(line)) {
      return { ok: false, detail: `python: mixed tabs/spaces near line ${i + 1}` }
    }
  }
  if (
    !balance(content, '(', ')') ||
    !balance(content, '[', ']') ||
    !balance(content, '{', '}')
  ) {
    return { ok: false, detail: 'python: unbalanced brackets' }
  }
  return { ok: true, detail: 'python: basic smoke ok' }
}

export function verifyContent(path: string, content: string): VerifyResult {
  const p = path.toLowerCase()
  if (p.endsWith('.json')) return verifyJson(content)
  if (p.endsWith('.html') || p.endsWith('.htm')) return verifyHtml(content)
  if (p.endsWith('.css')) return verifyBraced(content, 'css')
  if (p.endsWith('.js') || p.endsWith('.mjs') || p.endsWith('.cjs')) {
    return verifyBraced(content, 'js')
  }
  if (p.endsWith('.ts') || p.endsWith('.tsx')) return verifyBraced(content, 'ts')
  if (p.endsWith('.py')) return verifyPython(content)
  return { ok: true, detail: 'skip: no checker for this type' }
}

function projectFromPath(path: string): string | undefined {
  const parts = path.replace(/\\/g, '/').replace(/^\/+/, '').split('/')
  if (parts[0] === 'projects' && parts[1]) return parts[1]
  return undefined
}

export async function postWriteVerify(opts: {
  path: string
  content: string
}): Promise<VerifyResult> {
  const basic = verifyContent(opts.path, opts.content)
  if (!basic.ok) return basic

  const project = projectFromPath(opts.path)
  const base = opts.path.replace(/\\/g, '/').split('/').pop() || opts.path
  if (project && opts.path.toLowerCase().endsWith('.py')) {
    const rel =
      opts.path.replace(/\\/g, '/').replace(/^projects\/[^/]+\//, '') || base
    const run = await runSandboxed({
      project,
      command: `python3 -m py_compile ${rel}`,
      timeout: '15'
    })
    if (run && !run.ok && !/not found on PATH|needs a single/i.test(run.text)) {
      return { ok: false, detail: `py_compile: ${run.text.slice(0, 400)}` }
    }
    if (run?.ok) return { ok: true, detail: 'python: py_compile ok' }
  }
  if (project && /\.(js|mjs|cjs)$/i.test(opts.path)) {
    const rel =
      opts.path.replace(/\\/g, '/').replace(/^projects\/[^/]+\//, '') || base
    const run = await runSandboxed({
      project,
      command: `node --check ${rel}`,
      timeout: '15'
    })
    if (run && !run.ok && !/not found on PATH|needs a single/i.test(run.text)) {
      return { ok: false, detail: `node --check: ${run.text.slice(0, 400)}` }
    }
    if (run?.ok) return { ok: true, detail: 'js: node --check ok' }
  }
  return basic
}
