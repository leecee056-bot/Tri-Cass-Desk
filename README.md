# Tri-Cass Desk

Local-only living companion for **Tri-Cass OS** — Earthbound/Celestial atmosphere driven by machine telemetry (not weather APIs), plus a full glass-styled utility suite.

## Highlights

- **Living scene** — CPU/RAM/GPU/temp/disk → rain, clouds, aurora, heat, wind; clock → day/night
- **240 tools** across companion, system, browser, media, creative, dev, knowledge, office, security, network, fun
- **Glass surfaces** (rounded frosted chrome — no sharp OS windows):
  - In-desk **Browser** (Electron `webview`)
  - **Media player** (local audio/video, speed/loop/volume)
  - **Terminal** ([xterm](https://xtermjs.org/) + allowlisted commands)
  - **Editor** (glass textarea + optional [Monaco](https://microsoft.github.io/monaco-editor/))
  - **Bin** soft-delete shelf
- Ready-made libs: `qrcode`, `jszip`, `marked`+`dompurify`, `papaparse`, `date-fns`, `uuid`, `@xterm/xterm`, `monaco-editor`

## Develop (Windows)

```bash
npm install
npm run dev
```

Optional: local [Ollama](https://ollama.com) for chat.

```bash
npm run typecheck
npm run build
npm run pack:win
```

## License

MIT — see [LICENSE](LICENSE).
