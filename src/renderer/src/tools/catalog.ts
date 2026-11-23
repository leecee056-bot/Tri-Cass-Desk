/** Registry of companion + expanded tools. */
export type ToolEntry = {
  id: string
  name: string
  group: 'companion' | 'system' | 'creative' | 'dev' | 'knowledge'
  status: 'live' | 'planned'
}

export const TOOL_CATALOG: ToolEntry[] = [
  { id: 'monitor', name: 'Process Monitor', group: 'system', status: 'live' },
  { id: 'sensors', name: 'Sensor Map', group: 'system', status: 'live' },
  { id: 'disk', name: 'Disk Map', group: 'system', status: 'live' },
  { id: 'gpu', name: 'GPU Pane', group: 'system', status: 'live' },
  { id: 'ports', name: 'Port Inspector', group: 'system', status: 'live' },
  { id: 'env', name: 'Env Inspector', group: 'system', status: 'live' },
  { id: 'clipboard', name: 'Clipboard Shelf', group: 'system', status: 'live' },
  { id: 'snapshots', name: 'Workspace Snapshots', group: 'system', status: 'live' },
  { id: 'timer', name: 'Focus Timer', group: 'system', status: 'live' },
  { id: 'hash', name: 'Hash / Checksum', group: 'dev', status: 'live' },
  { id: 'base64', name: 'Base64 / URL', group: 'dev', status: 'live' },
  { id: 'json', name: 'JSON Studio', group: 'dev', status: 'live' },
  { id: 'regex', name: 'Regex Lab', group: 'dev', status: 'live' },
  { id: 'diff', name: 'Diff Viewer', group: 'dev', status: 'live' },
  { id: 'terminal', name: 'Safe Commands', group: 'dev', status: 'live' },
  { id: 'logs', name: 'Command Output', group: 'dev', status: 'live' },
  { id: 'color', name: 'Color Tools', group: 'creative', status: 'live' },
  { id: 'canvas', name: 'Sketch Canvas', group: 'creative', status: 'live' },
  { id: 'pixel', name: 'Pixel Lab', group: 'creative', status: 'live' },
  { id: 'audio', name: 'Local Audio Pad', group: 'creative', status: 'live' },
  { id: 'qr', name: 'QR Local', group: 'system', status: 'live' },
  { id: 'convert', name: 'Unit Convert', group: 'system', status: 'live' },
  { id: 'markdown', name: 'Markdown Desk', group: 'knowledge', status: 'live' },
  { id: 'notes', name: 'Quick Notes', group: 'knowledge', status: 'live' },
  { id: 'reader', name: 'Reader Mode', group: 'knowledge', status: 'live' },
  { id: 'tasks', name: 'Task Board', group: 'knowledge', status: 'live' },
  { id: 'calendar', name: 'Local Calendar', group: 'knowledge', status: 'live' },
  { id: 'models', name: 'LLM Browser', group: 'companion', status: 'live' },
  { id: 'chat', name: 'Local Chat', group: 'companion', status: 'live' },
  { id: 'agents', name: 'Agents', group: 'companion', status: 'live' },
  { id: 'files', name: 'File Manager', group: 'system', status: 'live' },
  { id: 'vault', name: 'Knowledge Vault', group: 'knowledge', status: 'live' },
  { id: 'browse', name: 'Browse', group: 'companion', status: 'live' },
  { id: 'themes', name: 'Theme Studio', group: 'creative', status: 'live' },
  { id: 'plugins', name: 'Plugin Manager', group: 'companion', status: 'live' },
  { id: 'archive', name: 'Archive Browser', group: 'system', status: 'live' }
]
