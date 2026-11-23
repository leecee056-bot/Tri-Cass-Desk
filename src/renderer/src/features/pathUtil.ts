/** Browser-safe dirname without node:path. */
export function dirname(p: string): string {
  if (!p) return p
  const norm = p.replace(/\\/g, '/')
  const idx = norm.lastIndexOf('/')
  if (idx <= 0) return p
  // Keep Windows drive root like C:/
  if (/^[A-Za-z]:\/$/.test(norm.slice(0, idx + 1))) return p
  const parent = norm.slice(0, idx)
  return p.includes('\\') ? parent.replace(/\//g, '\\') : parent
}
