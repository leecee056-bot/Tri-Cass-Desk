import type { ToolEntry } from './catalog'

/**
 * HAP-79 curated Top-20 — Raycast-class utilities that must have real local engines
 * (not the generic “Run local action” stub).
 */
export const TOP20_IDS = [
  'dev-uuid-generator',
  'dev-hash-checksum',
  'dev-base64-url',
  'dev-json-studio',
  'dev-regex-lab',
  'dev-diff-viewer',
  'cre-color-tools',
  'sec-password-generator',
  'sys-clipboard-shelf',
  'dev-unix-timestamp',
  'kno-markdown-desk',
  'dev-csv-studio',
  'dev-jwt-decode',
  'dev-cron-builder',
  'dev-case-converter',
  'sys-process-monitor',
  'sys-port-inspector',
  'sys-focus-timer',
  'dev-word-count',
  'dev-slugify'
] as const

export type Top20Id = (typeof TOP20_IDS)[number]

export function isTop20(tool: ToolEntry | string): boolean {
  const id = typeof tool === 'string' ? tool : tool.id
  return (TOP20_IDS as readonly string[]).includes(id)
}
