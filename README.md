# Tri-Cass Desk

Local-only living companion for **Tri-Cass OS** — Earthbound/Celestial atmosphere driven by machine telemetry (not weather APIs), plus a full glass-styled utility suite.

## Highlights

- **Floating glass window manager** over a full-bleed living scene (Earthbound/Celestial reference plate + telemetry FX) — not a dashboard grid
- **Living scene** — CPU/RAM/GPU/temp/disk → rain, clouds, aurora, heat, wind; clock → day/night
- **Dock apps**: chat, agents, files, vault, browser (tabs/bookmarks/history), media (playlist), terminal, editor, tools, bin, settings
- **240 tools** open as frosted floating windows, routed by engine (browser/media/dev/system/fun/security/…)
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
