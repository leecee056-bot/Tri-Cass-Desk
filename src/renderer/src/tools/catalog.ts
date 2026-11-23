/** Tri-Cass Desk tool catalog — 240 glass-styled utilities. */
export type ToolGroup =
  | 'companion'
  | 'system'
  | 'browser'
  | 'media'
  | 'creative'
  | 'dev'
  | 'knowledge'
  | 'office'
  | 'security'
  | 'network'
  | 'fun'

export type ToolEngine =
  | 'dock'
  | 'system'
  | 'browser'
  | 'media'
  | 'creative'
  | 'dev'
  | 'knowledge'
  | 'office'
  | 'security'
  | 'network'
  | 'fun'

export type ToolEntry = {
  id: string
  name: string
  group: ToolGroup
  engine: ToolEngine
  status: 'live' | 'planned'
}

export const TOOL_CATALOG: ToolEntry[] = [
  {
    "id": "com-local-chat",
    "name": "Local Chat",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-agents",
    "name": "Agents",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-plugin-manager",
    "name": "Plugin Manager",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-llm-browser",
    "name": "LLM Browser",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-model-compare",
    "name": "Model Compare",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-prompt-library",
    "name": "Prompt Library",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-session-memory",
    "name": "Session Memory",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-voice-notes-local",
    "name": "Voice Notes Local",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-companion-help",
    "name": "Companion Help",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-update-notes",
    "name": "Update Notes",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-agent-packs",
    "name": "Agent Packs",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "com-allowlist-editor",
    "name": "Allowlist Editor",
    "group": "companion",
    "engine": "dock",
    "status": "live"
  },
  {
    "id": "sys-process-monitor",
    "name": "Process Monitor",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-sensor-map",
    "name": "Sensor Map",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-disk-map",
    "name": "Disk Map",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-gpu-pane",
    "name": "GPU Pane",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-port-inspector",
    "name": "Port Inspector",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-env-inspector",
    "name": "Env Inspector",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-clipboard-shelf",
    "name": "Clipboard Shelf",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-workspace-snapshots",
    "name": "Workspace Snapshots",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-focus-timer",
    "name": "Focus Timer",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-task-manager-lite",
    "name": "Task Manager Lite",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-startup-list",
    "name": "Startup List",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-service-viewer",
    "name": "Service Viewer",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-power-profile",
    "name": "Power Profile",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-battery-health",
    "name": "Battery Health",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-thermal-map",
    "name": "Thermal Map",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-fan-curve-view",
    "name": "Fan Curve View",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-network-adapters",
    "name": "Network Adapters",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-usb-devices",
    "name": "USB Devices",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-bluetooth-list",
    "name": "Bluetooth List",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-printer-queue",
    "name": "Printer Queue",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-display-info",
    "name": "Display Info",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-audio-devices",
    "name": "Audio Devices",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-font-inventory",
    "name": "Font Inventory",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-installed-apps",
    "name": "Installed Apps",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-system-log-tail",
    "name": "System Log Tail",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-resource-graph",
    "name": "Resource Graph",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-recycle-bin",
    "name": "Recycle Bin",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-quick-switcher",
    "name": "Quick Switcher",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-notification-center",
    "name": "Notification Center",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "sys-night-light",
    "name": "Night Light",
    "group": "system",
    "engine": "system",
    "status": "live"
  },
  {
    "id": "bro-glass-browser",
    "name": "Glass Browser",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-new-tab-wall",
    "name": "New Tab Wall",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-bookmarks",
    "name": "Bookmarks",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-history",
    "name": "History",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-downloads",
    "name": "Downloads",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-reading-list",
    "name": "Reading List",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-password-vault-local",
    "name": "Password Vault Local",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-cookie-jar",
    "name": "Cookie Jar",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-session-tabs",
    "name": "Session Tabs",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-split-browse",
    "name": "Split Browse",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-private-pane",
    "name": "Private Pane",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-find-in-page",
    "name": "Find in Page",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-zoom-controls",
    "name": "Zoom Controls",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-user-agent-lab",
    "name": "User Agent Lab",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-home-dashboard",
    "name": "Home Dashboard",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-speed-dial",
    "name": "Speed Dial",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-mute-tab",
    "name": "Mute Tab",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-pin-tab",
    "name": "Pin Tab",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-duplicate-tab",
    "name": "Duplicate Tab",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-screenshot-page",
    "name": "Screenshot Page",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-print-preview",
    "name": "Print Preview",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-reader-extract",
    "name": "Reader Extract",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-dark-site-force",
    "name": "Dark Site Force",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-site-permissions",
    "name": "Site Permissions",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-local-hosts-notes",
    "name": "Local Hosts Notes",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-rss-reader",
    "name": "RSS Reader",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-html-sandbox",
    "name": "HTML Sandbox",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-css-playground",
    "name": "CSS Playground",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-js-console-pad",
    "name": "JS Console Pad",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "bro-request-inspector",
    "name": "Request Inspector",
    "group": "browser",
    "engine": "browser",
    "status": "live"
  },
  {
    "id": "med-media-player",
    "name": "Media Player",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-playlist",
    "name": "Playlist",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-audio-player",
    "name": "Audio Player",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-video-player",
    "name": "Video Player",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-equalizer",
    "name": "Equalizer",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-visualizer",
    "name": "Visualizer",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-lyrics-pad",
    "name": "Lyrics Pad",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-album-art-view",
    "name": "Album Art View",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-media-library",
    "name": "Media Library",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-recent-media",
    "name": "Recent Media",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-favorites-media",
    "name": "Favorites Media",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-shuffle-queue",
    "name": "Shuffle Queue",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-loop-modes",
    "name": "Loop Modes",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-speed-control",
    "name": "Speed Control",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-a-b-loop",
    "name": "A-B Loop",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-subtitle-loader",
    "name": "Subtitle Loader",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-mini-player",
    "name": "Mini Player",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-fullscreen-cinema",
    "name": "Fullscreen Cinema",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-waveform-scrub",
    "name": "Waveform Scrub",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-spectrum-bars",
    "name": "Spectrum Bars",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-music-tags",
    "name": "Music Tags",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-cover-extract",
    "name": "Cover Extract",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-trim-media",
    "name": "Trim Media",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-screenshot-frame",
    "name": "Screenshot Frame",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-webcam-preview",
    "name": "Webcam Preview",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-mic-test",
    "name": "Mic Test",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-speaker-test",
    "name": "Speaker Test",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-midi-pad",
    "name": "MIDI Pad",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-metronome",
    "name": "Metronome",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "med-tuner",
    "name": "Tuner",
    "group": "media",
    "engine": "media",
    "status": "live"
  },
  {
    "id": "cre-theme-studio",
    "name": "Theme Studio",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-sketch-canvas",
    "name": "Sketch Canvas",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-pixel-lab",
    "name": "Pixel Lab",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-color-tools",
    "name": "Color Tools",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-palette-generator",
    "name": "Palette Generator",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-gradient-maker",
    "name": "Gradient Maker",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-icon-sketch",
    "name": "Icon Sketch",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-image-crop",
    "name": "Image Crop",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-image-resize",
    "name": "Image Resize",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-image-rotate",
    "name": "Image Rotate",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-image-filters",
    "name": "Image Filters",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-blur-studio",
    "name": "Blur Studio",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-contrast-lab",
    "name": "Contrast Lab",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-collage-board",
    "name": "Collage Board",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-typography-lab",
    "name": "Typography Lab",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-font-pairing",
    "name": "Font Pairing",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-ascii-art",
    "name": "ASCII Art",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-noise-texture",
    "name": "Noise Texture",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-pattern-maker",
    "name": "Pattern Maker",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-particle-sandbox",
    "name": "Particle Sandbox",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-sprite-sheet",
    "name": "Sprite Sheet",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-material-swatches",
    "name": "Material Swatches",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-brand-kit",
    "name": "Brand Kit",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-moodboard",
    "name": "Moodboard",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-reference-wall",
    "name": "Reference Wall",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-export-png",
    "name": "Export PNG",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-svg-editor-lite",
    "name": "SVG Editor Lite",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "cre-poster-layout",
    "name": "Poster Layout",
    "group": "creative",
    "engine": "creative",
    "status": "live"
  },
  {
    "id": "dev-safe-commands",
    "name": "Safe Commands",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-hash-checksum",
    "name": "Hash Checksum",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-base64-url",
    "name": "Base64 URL",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-json-studio",
    "name": "JSON Studio",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-regex-lab",
    "name": "Regex Lab",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-diff-viewer",
    "name": "Diff Viewer",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-code-editor",
    "name": "Code Editor",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-terminal",
    "name": "Terminal",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-uuid-generator",
    "name": "UUID Generator",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-lorem-ipsum",
    "name": "Lorem Ipsum",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-mock-json",
    "name": "Mock JSON",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-jwt-decode",
    "name": "JWT Decode",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-cron-builder",
    "name": "Cron Builder",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-semver-compare",
    "name": "Semver Compare",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-sql-formatter",
    "name": "SQL Formatter",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-yaml-studio",
    "name": "YAML Studio",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-toml-studio",
    "name": "TOML Studio",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-xml-pretty",
    "name": "XML Pretty",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-csv-studio",
    "name": "CSV Studio",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-case-converter",
    "name": "Case Converter",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-line-sort",
    "name": "Line Sort",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-dedupe-lines",
    "name": "Dedupe Lines",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-word-count",
    "name": "Word Count",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-unix-timestamp",
    "name": "Unix Timestamp",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-epoch-converter",
    "name": "Epoch Converter",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-slugify",
    "name": "Slugify",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-escape-tool",
    "name": "Escape Tool",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-color-css-out",
    "name": "Color CSS Out",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-flexbox-play",
    "name": "Flexbox Play",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "dev-grid-play",
    "name": "Grid Play",
    "group": "dev",
    "engine": "dev",
    "status": "live"
  },
  {
    "id": "kno-knowledge-vault",
    "name": "Knowledge Vault",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-quick-notes",
    "name": "Quick Notes",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-markdown-desk",
    "name": "Markdown Desk",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-reader-mode",
    "name": "Reader Mode",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-task-board",
    "name": "Task Board",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-local-calendar",
    "name": "Local Calendar",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-daily-journal",
    "name": "Daily Journal",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-flashcards",
    "name": "Flashcards",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-outline-mode",
    "name": "Outline Mode",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-wiki-page",
    "name": "Wiki Page",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-glossary",
    "name": "Glossary",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-checklist-pack",
    "name": "Checklist Pack",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-meeting-notes",
    "name": "Meeting Notes",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-decision-log",
    "name": "Decision Log",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-idea-inbox",
    "name": "Idea Inbox",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-research-queue",
    "name": "Research Queue",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-quote-wall",
    "name": "Quote Wall",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-tag-browser",
    "name": "Tag Browser",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-pinned-knowledge",
    "name": "Pinned Knowledge",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-vault-stats",
    "name": "Vault Stats",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-import-markdown",
    "name": "Import Markdown",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "kno-export-vault",
    "name": "Export Vault",
    "group": "knowledge",
    "engine": "knowledge",
    "status": "live"
  },
  {
    "id": "off-text-document",
    "name": "Text Document",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-spreadsheet-lite",
    "name": "Spreadsheet Lite",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-csv-table",
    "name": "CSV Table",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-presentation-notes",
    "name": "Presentation Notes",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-pdf-viewer",
    "name": "PDF Viewer",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-print-center",
    "name": "Print Center",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-mail-draft-local",
    "name": "Mail Draft Local",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-contacts-local",
    "name": "Contacts Local",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-invoice-sketch",
    "name": "Invoice Sketch",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-kanban-board",
    "name": "Kanban Board",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-habit-tracker",
    "name": "Habit Tracker",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-budget-sheet",
    "name": "Budget Sheet",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-resume-outline",
    "name": "Resume Outline",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-letter-templates",
    "name": "Letter Templates",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-label-maker",
    "name": "Label Maker",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-barcode-local",
    "name": "Barcode Local",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-table-maker",
    "name": "Table Maker",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "off-chart-sketch",
    "name": "Chart Sketch",
    "group": "office",
    "engine": "office",
    "status": "live"
  },
  {
    "id": "sec-password-generator",
    "name": "Password Generator",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-passphrase-maker",
    "name": "Passphrase Maker",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-entropy-meter",
    "name": "Entropy Meter",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-hash-verify",
    "name": "Hash Verify",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-file-checksum",
    "name": "File Checksum",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-secret-redactor",
    "name": "Secret Redactor",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-clipboard-auto-clear",
    "name": "Clipboard Auto Clear",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-permission-audit",
    "name": "Permission Audit",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-certificate-decode",
    "name": "Certificate Decode",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-jwt-safe-view",
    "name": "JWT Safe View",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-random-bytes",
    "name": "Random Bytes",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-token-vault-local",
    "name": "Token Vault Local",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-lock-vault",
    "name": "Lock Vault",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "sec-panic-hide",
    "name": "Panic Hide",
    "group": "security",
    "engine": "security",
    "status": "live"
  },
  {
    "id": "net-dns-lookup-notes",
    "name": "DNS Lookup Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-whois-notes",
    "name": "Whois Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-http-status",
    "name": "HTTP Status",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-ip-calculator",
    "name": "IP Calculator",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-hosts-file-notes",
    "name": "Hosts File Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-ssl-expiry-notes",
    "name": "SSL Expiry Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-local-server-list",
    "name": "Local Server List",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-latency-graph",
    "name": "Latency Graph",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-proxy-notes",
    "name": "Proxy Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-mac-vendor-notes",
    "name": "MAC Vendor Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-ping-notes",
    "name": "Ping Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-port-scan-notes",
    "name": "Port Scan Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-wifi-analyzer-notes",
    "name": "Wifi Analyzer Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "net-mock-api-server-notes",
    "name": "Mock API Server Notes",
    "group": "network",
    "engine": "network",
    "status": "live"
  },
  {
    "id": "fun-dice-roller",
    "name": "Dice Roller",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-card-draw",
    "name": "Card Draw",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-coin-flip",
    "name": "Coin Flip",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-stopwatch",
    "name": "Stopwatch",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-world-clock-local",
    "name": "World Clock Local",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-breathing-guide",
    "name": "Breathing Guide",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-ambient-mixer",
    "name": "Ambient Mixer",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-pomodoro-sets",
    "name": "Pomodoro Sets",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-pet-pixel",
    "name": "Pet Pixel",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-garden-idle",
    "name": "Garden Idle",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-typing-test",
    "name": "Typing Test",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  },
  {
    "id": "fun-memory-match",
    "name": "Memory Match",
    "group": "fun",
    "engine": "fun",
    "status": "live"
  }
]

export const TOOL_GROUPS: ToolGroup[] = [
  'companion','system','browser','media','creative','dev','knowledge','office','security','network','fun'
]
