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
  wakeWorkspace: 'desk:wake-workspace',
  noteActivity: 'desk:note-activity',

  chatHistory: 'desk:chat-history',
  chatSend: 'desk:chat-send',
  chatClear: 'desk:chat-clear',
  ollamaModels: 'desk:ollama-models',
  ollamaStatus: 'desk:ollama-status',

  agentRun: 'desk:agent-run',

  listDir: 'desk:list-dir',
  readTextFile: 'desk:read-text-file',
  writeTextFile: 'desk:write-text-file',
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

  hashText: 'desk:hash-text',
  runSafeCommand: 'desk:run-safe-command'
} as const

export type DeskApi = {
  getEnvironment: () => Promise<EnvironmentState>
  setPreferences: (
    prefs: Partial<EnvironmentState['userPreferences']>
  ) => Promise<EnvironmentState>
  wakeWorkspace: () => Promise<void>
  noteActivity: () => Promise<void>
  onEnvironmentUpdated: (cb: (state: EnvironmentState) => void) => () => void

  chatHistory: () => Promise<ChatMessage[]>
  chatSend: (content: string, model?: string) => Promise<ChatMessage[]>
  chatClear: () => Promise<void>
  ollamaModels: () => Promise<OllamaModel[]>
  ollamaStatus: () => Promise<{ ok: boolean; detail: string }>

  agentRun: (prompt: string) => Promise<AgentRun>

  listDir: (dirPath?: string) => Promise<{ path: string; entries: FileEntry[] }>
  readTextFile: (filePath: string) => Promise<string>
  writeTextFile: (filePath: string, content: string) => Promise<void>
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

  hashText: (
    text: string,
    algo: 'sha256' | 'sha1' | 'md5'
  ) => Promise<string>
  runSafeCommand: (commandId: string) => Promise<{ ok: boolean; output: string }>
}
