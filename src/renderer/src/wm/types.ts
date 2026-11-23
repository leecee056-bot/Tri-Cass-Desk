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
  payload?: Record<string, string>
}

export const APP_META: Record<
  string,
  { title: string; w: number; h: number; icon: string }
> = {
  chat: { title: 'Chat', w: 440, h: 520, icon: '◎' },
  agents: { title: 'Agents', w: 420, h: 460, icon: '✶' },
  files: { title: 'Files', w: 560, h: 480, icon: '▤' },
  vault: { title: 'Vault', w: 560, h: 480, icon: '◇' },
  browse: { title: 'Browser', w: 720, h: 560, icon: '◉' },
  media: { title: 'Media', w: 520, h: 420, icon: '♫' },
  terminal: { title: 'Terminal', w: 640, h: 360, icon: '▷' },
  editor: { title: 'Editor', w: 680, h: 500, icon: '✎' },
  tools: { title: 'Tools', w: 640, h: 520, icon: '⬡' },
  settings: { title: 'Settings', w: 420, h: 420, icon: '⚙' },
  bin: { title: 'Bin', w: 400, h: 360, icon: '⌀' },
  launcher: { title: 'Apps', w: 560, h: 480, icon: '▦' },
  system: { title: 'System', w: 280, h: 240, icon: '◈' },
  health: { title: 'Mood', w: 250, h: 330, icon: '✧' },
  clock: { title: 'Clock', w: 220, h: 140, icon: '◔' },
  atmosphere: { title: 'Atmosphere', w: 280, h: 290, icon: '☁' },
  notes: { title: 'Notes', w: 260, h: 180, icon: '✎' },
  projects: { title: 'Projects', w: 250, h: 220, icon: '▤' }
}
