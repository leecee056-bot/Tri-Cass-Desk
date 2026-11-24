/**
 * Lightweight coding-pack snippets seeded into the Desk workspace for search_knowledge.
 */
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { workspaceRoot } from '../paths'

const PACK: Array<{ file: string; title: string; body: string }> = [
  {
    file: 'python-cli.md',
    title: 'Coding pack · Python CLI',
    body: `# Python CLI (stdlib)

\`\`\`python
#!/usr/bin/env python3
import argparse

def main():
    p = argparse.ArgumentParser(description="Demo CLI")
    p.add_argument("name")
    args = p.parse_args()
    print(f"Hello, {args.name}!")

if __name__ == "__main__":
    main()
\`\`\`

Run: python3 app.py world
`
  },
  {
    file: 'common-fixes.md',
    title: 'Coding pack · Common fixes',
    body: `# Common fixes

- SyntaxError → check brackets / quotes near the reported line.
- ModuleNotFoundError → stay on stdlib for Desk sandbox; no pip in sandbox.
- Stuck loop — after the same error three times, roll back the checkpoint and change approach (smaller edit).
- Prefer edit_file over full rewrite when changing a few lines.
`
  },
  {
    file: 'html-app.md',
    title: 'Coding pack · HTML app',
    body: `# Minimal HTML app

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Demo</title>
  <style>body{font-family:system-ui;margin:2rem}</style>
</head>
<body>
  <h1>Hello</h1>
  <button id="b">Click</button>
  <script>
    document.getElementById('b').onclick = () => alert('ok');
  </script>
</body>
</html>
\`\`\`
`
  }
]

function packDir(): string {
  const dir = join(workspaceRoot(), '.tri-cass', 'coding-pack')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function ensureCodingPack(): void {
  const dir = packDir()
  for (const item of PACK) {
    const p = join(dir, item.file)
    if (!existsSync(p)) writeFileSync(p, item.body, 'utf8')
  }
}

export function searchCodingPack(query: string): string {
  ensureCodingPack()
  const q = query.toLowerCase().trim()
  const dir = packDir()
  const hits: string[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const body = readFileSync(join(dir, name), 'utf8')
    if (!q || body.toLowerCase().includes(q) || name.includes(q.replace(/\s+/g, '-'))) {
      hits.push(`## ${name}\n${body.slice(0, 1200)}`)
    }
  }
  if (!hits.length) {
    return PACK.map((p) => `• ${p.title}`).join('\n')
  }
  return hits.slice(0, 3).join('\n\n')
}
