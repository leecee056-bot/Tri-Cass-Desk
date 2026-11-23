export type AppId =
  | 'chat'
  | 'agents'
  | 'files'
  | 'vault'
  | 'browse'
  | 'media'
  | 'terminal'
  | 'editor'
  | 'tools'
  | 'settings'
  | 'bin'
  | 'launcher'
  | 'system'
  | 'health'
  | 'clock'
  | 'atmosphere'
  | 'notes'
  | 'projects'

export type DeskWindow = {
  id: string
  appId: AppId | string
  title: string
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized?: boolean
  maximized?: boolean
  restore?: { x: number; y: number; w: number; h: number }
  payload?: Record<string, string>
}

export const APP_META: Record<
  string,
  { title: string; w: number; h: number; icon: string }
> = {
  chat: { title: 'Chat', w: 440, h: 520, icon: '◎' },
  agents: { title: 'Agents', w: 420, h: 460, icon: '✶' },
  files: { title: 'Files', w: 760, h: 540, icon: '▤' },
  vault: { title: 'Vault', w: 780, h: 540, icon: '◇' },
  browse: { title: 'Browser', w: 720, h: 560, icon: '◉' },
  media: { title: 'Media', w: 720, h: 480, icon: '♫' },
  terminal: { title: 'Terminal', w: 720, h: 440, icon: '▷' },
  editor: { title: 'Editor', w: 820, h: 560, icon: '✎' },
  tools: { title: 'Tools', w: 640, h: 520, icon: '⬡' },
  settings: { title: 'Settings', w: 720, h: 560, icon: '⚙' },
  bin: { title: 'Bin', w: 480, h: 420, icon: '⌀' },
  launcher: { title: 'Apps', w: 640, h: 520, icon: '▦' },
  system: { title: 'System', w: 420, h: 520, icon: '◈' },
  health: { title: 'Mood', w: 300, h: 520, icon: '✧' },
  clock: { title: 'Clock', w: 280, h: 220, icon: '◔' },
  atmosphere: { title: 'Atmosphere', w: 340, h: 480, icon: '☁' },
  notes: { title: 'Notes', w: 720, h: 520, icon: '✎' },
  projects: { title: 'Projects', w: 420, h: 480, icon: '▤' }
}
