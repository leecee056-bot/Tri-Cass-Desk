import type { EnvironmentState } from './environment'
import type {
  AgentRun,
  ChatMessage,
  DiskPartition,
  FileEntry,
  OllamaModel,
  PortRow,
  ProcessRow,
  VaultNote,
  WorkspaceSnapshot
} from './types'

export const IPC = {
  getEnvironment: 'desk:get-environment',
  environmentUpdated: 'desk:environment-updated',
  setPreferences: 'desk:set-preferences',
  resetPreferences: 'desk:reset-preferences',
  wakeWorkspace: 'desk:wake-workspace',
  noteActivity: 'desk:note-activity',
  windowClose: 'desk:window-close',
  windowMinimize: 'desk:window-minimize',
  windowMaximize: 'desk:window-maximize',

  chatHistory: 'desk:chat-history',
  chatSend: 'desk:chat-send',
  chatClear: 'desk:chat-clear',
  chatGenerate: 'desk:chat-generate',
  chatStreamStart: 'desk:chat-stream-start',
  chatStreamChunk: 'desk:chat-stream-chunk',
  chatStreamAbort: 'desk:chat-stream-abort',
  ollamaModels: 'desk:ollama-models',
  ollamaStatus: 'desk:ollama-status',

  agentRun: 'desk:agent-run',
  agentLoop: 'desk:agent-loop',

  listDir: 'desk:list-dir',
  readTextFile: 'desk:read-text-file',
  writeTextFile: 'desk:write-text-file',
  mkdirDir: 'desk:mkdir-dir',
  renamePath: 'desk:rename-path',
  userFolder: 'desk:user-folder',
  homeDir: 'desk:home-dir',
  openPath: 'desk:open-path',
  openExternal: 'desk:open-external',

  vaultList: 'desk:vault-list',
  vaultGet: 'desk:vault-get',
  vaultSave: 'desk:vault-save',
  vaultDelete: 'desk:vault-delete',

  processes: 'desk:processes',
  disks: 'desk:disks',
  ports: 'desk:ports',
  envVars: 'desk:env-vars',
  clipboardRead: 'desk:clipboard-read',
  clipboardWrite: 'desk:clipboard-write',

  snapshotsList: 'desk:snapshots-list',
  snapshotsSave: 'desk:snapshots-save',
  snapshotsRestore: 'desk:snapshots-restore',
  snapshotsDelete: 'desk:snapshots-delete',

  hashText: 'desk:hash-text',
  runSafeCommand: 'desk:run-safe-command',
  safeCommandsList: 'desk:safe-commands-list',
  pickMediaFile: 'desk:pick-media-file',
  binList: 'desk:bin-list',
  binEntries: 'desk:bin-entries',
  binMove: 'desk:bin-move',
  binRestore: 'desk:bin-restore',
  binDelete: 'desk:bin-delete',
  binEmpty: 'desk:bin-empty'
} as const

export type DeskApi = {
  getEnvironment: () => Promise<EnvironmentState>
  setPreferences: (
    prefs: Partial<EnvironmentState['userPreferences']>
  ) => Promise<EnvironmentState>
  resetPreferences: () => Promise<EnvironmentState>
  wakeWorkspace: () => Promise<void>
  noteActivity: () => Promise<void>
  windowClose: () => Promise<void>
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  onEnvironmentUpdated: (cb: (state: EnvironmentState) => void) => () => void

  chatHistory: () => Promise<ChatMessage[]>
  chatSend: (content: string, model?: string) => Promise<ChatMessage[]>
  chatClear: () => Promise<void>
  chatGenerate: (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    opts?: { model?: string; temperature?: number; system?: string; numPredict?: number }
  ) => Promise<string>
  chatStreamStart: (
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    opts?: { model?: string; temperature?: number; system?: string; numPredict?: number }
  ) => Promise<{ streamId: string }>
  chatStreamAbort: (streamId: string) => Promise<void>
  onChatStreamChunk: (
    cb: (payload: {
      streamId: string
      delta: string
      done?: boolean
      error?: string
    }) => void
  ) => () => void
  ollamaModels: () => Promise<OllamaModel[]>
  ollamaStatus: () => Promise<{ ok: boolean; detail: string }>

  agentRun: (prompt: string) => Promise<AgentRun>
  agentLoop: (
    prompt: string,
    opts?: { mode?: 'inspect' | 'plan' | 'build'; model?: string; temperature?: number }
  ) => Promise<AgentRun>

  listDir: (dirPath?: string) => Promise<{ path: string; entries: FileEntry[] }>
  readTextFile: (filePath: string) => Promise<string>
  writeTextFile: (filePath: string, content: string) => Promise<void>
  mkdirDir: (dirPath: string) => Promise<string>
  renamePath: (fromPath: string, newName: string) => Promise<string>
  userFolder: (name: 'Desktop' | 'Documents' | 'Downloads') => Promise<string>
  homeDir: () => Promise<string>
  openPath: (target: string) => Promise<void>
  openExternal: (url: string) => Promise<void>

  vaultList: () => Promise<VaultNote[]>
  vaultGet: (id: string) => Promise<VaultNote | null>
  vaultSave: (note: Partial<VaultNote> & { title: string; body: string }) => Promise<VaultNote>
  vaultDelete: (id: string) => Promise<void>

  processes: () => Promise<ProcessRow[]>
  disks: () => Promise<DiskPartition[]>
  ports: () => Promise<PortRow[]>
  envVars: () => Promise<Record<string, string>>
  clipboardRead: () => Promise<string>
  clipboardWrite: (text: string) => Promise<void>

  snapshotsList: () => Promise<WorkspaceSnapshot[]>
  snapshotsSave: (activeDock: string, label?: string) => Promise<WorkspaceSnapshot>
  snapshotsRestore: (id: string) => Promise<WorkspaceSnapshot | null>
  snapshotsDelete: (id: string) => Promise<boolean>

  hashText: (
    text: string,
    algo: 'sha256' | 'sha1' | 'md5'
  ) => Promise<string>
  runSafeCommand: (commandId: string) => Promise<{ ok: boolean; output: string }>
  safeCommandsList: () => Promise<Array<{ id: string; label: string; hint: string }>>

  pickMediaFile: () => Promise<Array<{ url: string; name: string; path: string }>>
  binList: () => Promise<string[]>
  binEntries: () => Promise<
    Array<{ name: string; displayName: string; size: number; mtimeMs: number }>
  >
  binMove: (targetPath: string) => Promise<string>
  binRestore: (name: string) => Promise<string>
  binDelete: (name: string) => Promise<void>
  binEmpty: () => Promise<number>
}
