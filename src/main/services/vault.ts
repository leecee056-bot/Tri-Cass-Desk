import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { VaultNote } from '../../shared/types'
import { vaultDir } from './paths'

function notePath(id: string): string {
  return join(vaultDir(), `${id}.json`)
}

export function listNotes(): VaultNote[] {
  return readdirSync(vaultDir())
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(vaultDir(), f), 'utf8')) as VaultNote
      } catch {
        return null
      }
    })
    .filter((n): n is VaultNote => n != null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getNote(id: string): VaultNote | null {
  const p = notePath(id)
  if (!existsSync(p)) return null
  return JSON.parse(readFileSync(p, 'utf8')) as VaultNote
}

export function saveNote(input: Partial<VaultNote> & { title: string; body: string }): VaultNote {
  const id = input.id || randomUUID()
  const note: VaultNote = {
    id,
    title: input.title.trim() || 'Untitled',
    body: input.body,
    updatedAt: Date.now()
  }
  writeFileSync(notePath(id), JSON.stringify(note, null, 2), 'utf8')
  return note
}

export function deleteNote(id: string): void {
  const p = notePath(id)
  if (existsSync(p)) unlinkSync(p)
}
