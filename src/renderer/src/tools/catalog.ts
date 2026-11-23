/** Registry of companion + expanded tools. Phase 1 lists slots; Phase 3+ wires OSS. */
export type ToolEntry = {
  id: string
  name: string
  group: 'companion' | 'system' | 'creative' | 'dev' | 'knowledge'
  status: 'live' | 'planned'
}

export const TOOL_CATALOG: ToolEntry[] = [
  { id: 'chat', name: 'Local Chat', group: 'companion', status: 'planned' },
  { id: 'agents', name: 'Agents', group: 'companion', status: 'planned' },
  { id: 'browse', name: 'Browse', group: 'companion', status: 'planned' },
  { id: 'vault', name: 'Knowledge Vault', group: 'knowledge', status: 'planned' },
  { id: 'files', name: 'File Manager', group: 'system', status: 'planned' },
  { id: 'themes', name: 'Theme Studio', group: 'creative', status: 'planned' },
  { id: 'plugins', name: 'Plugin Manager', group: 'companion', status: 'planned' },
  { id: 'models', name: 'LLM Browser', group: 'companion', status: 'planned' },
  { id: 'monitor', name: 'Process Monitor', group: 'system', status: 'live' },
  { id: 'sensors', name: 'Sensor Map', group: 'system', status: 'live' },
  { id: 'notes', name: 'Quick Notes', group: 'knowledge', status: 'planned' },
  { id: 'terminal', name: 'Terminal', group: 'dev', status: 'planned' },
  { id: 'diff', name: 'Diff Viewer', group: 'dev', status: 'planned' },
  { id: 'json', name: 'JSON Studio', group: 'dev', status: 'planned' },
  { id: 'regex', name: 'Regex Lab', group: 'dev', status: 'planned' },
  { id: 'hash', name: 'Hash / Checksum', group: 'dev', status: 'planned' },
  { id: 'base64', name: 'Base64 / URL', group: 'dev', status: 'planned' },
  { id: 'color', name: 'Color Tools', group: 'creative', status: 'planned' },
  { id: 'markdown', name: 'Markdown Desk', group: 'knowledge', status: 'planned' },
  { id: 'canvas', name: 'Sketch Canvas', group: 'creative', status: 'planned' },
  { id: 'pixel', name: 'Pixel Lab', group: 'creative', status: 'planned' },
  { id: 'audio', name: 'Local Audio Pad', group: 'creative', status: 'planned' },
  { id: 'timer', name: 'Focus Timer', group: 'system', status: 'planned' },
  { id: 'clipboard', name: 'Clipboard Shelf', group: 'system', status: 'planned' },
  { id: 'snapshots', name: 'Workspace Snapshots', group: 'system', status: 'planned' },
  { id: 'logs', name: 'Log Tail', group: 'dev', status: 'planned' },
  { id: 'ports', name: 'Port Inspector', group: 'dev', status: 'planned' },
  { id: 'env', name: 'Env Inspector', group: 'dev', status: 'planned' },
  { id: 'disk', name: 'Disk Map', group: 'system', status: 'planned' },
  { id: 'gpu', name: 'GPU Pane', group: 'system', status: 'planned' },
  { id: 'calendar', name: 'Local Calendar', group: 'knowledge', status: 'planned' },
  { id: 'tasks', name: 'Task Board', group: 'knowledge', status: 'planned' },
  { id: 'reader', name: 'Reader Mode', group: 'knowledge', status: 'planned' },
  { id: 'archive', name: 'Archive Browser', group: 'system', status: 'planned' },
  { id: 'convert', name: 'Unit Convert', group: 'system', status: 'planned' },
  { id: 'qr', name: 'QR Local', group: 'system', status: 'planned' }
]
