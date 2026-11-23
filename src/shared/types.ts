export type ChatRole = 'system' | 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  at: number
}

export type OllamaModel = {
  name: string
  size?: number
  modifiedAt?: string
}

export type FileEntry = {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtimeMs: number
}

export type VaultNote = {
  id: string
  title: string
  body: string
  updatedAt: number
}

export type ProcessRow = {
  pid: number
  name: string
  cpu: number
  mem: number
  command: string
}

export type DiskPartition = {
  fs: string
  type: string
  size: number
  used: number
  available: number
  use: number
  mount: string
}

export type PortRow = {
  protocol: string
  localAddress: string
  localPort: number
  peerAddress: string
  peerPort: number
  state: string
  pid?: number
  process?: string
}

export type WorkspaceSnapshot = {
  id: string
  label: string
  activeDock: string
  createdAt: number
}

export type AgentStep = {
  at: number
  kind:
    | 'thought'
    | 'tool'
    | 'result'
    | 'error'
    | 'plan'
    | 'note'
    | 'llm'
    | 'permission'
    | 'knowledge'
  text: string
}

export type AgentRun = {
  id: string
  prompt: string
  steps: AgentStep[]
  status?: 'running' | 'done' | 'error'
  at?: number
}
