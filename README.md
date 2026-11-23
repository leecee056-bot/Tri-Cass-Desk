# Tri-Cass Desk

Local-only living companion for **Tri-Cass OS**. Earthbound/Celestial atmosphere is driven by **machine telemetry** (CPU/RAM/GPU/disk/processes) — not outdoor weather APIs — with a frosted glass window manager and utility suite.

## Download (when a release is published)

1. Open [Releases](https://github.com/leecee056-bot/Tri-Cass-Desk/releases)
2. Download **Windows x64**:
   - `Tri-Cass-Desk-*-win-x64.exe` — NSIS installer (Start Menu + desktop shortcut + Tri-Cass icon)
   - or `Tri-Cass-Desk-*-win-x64.exe` portable build from the portable target
3. Run the installer (or unzip/portable), launch **Tri-Cass Desk** from the desktop shortcut

Later this same Windows build will be linked from the Tri-Cass site for hard-drive / USB / direct PC download.

## Develop

```bash
npm install
npm run dev
```

Optional: local [Ollama](https://ollama.com) for AI chat (dock → Chat).

```bash
npm run typecheck
npm run build
npm run pack:win        # NSIS installer + portable (run on Windows or with wine)
npm run pack:win:dir    # unpacked dir for smoke tests
```

App icon lives in `build/icon.png` (desktop shortcut / installer / window).

## What is reactive (not a flat wallpaper)

- Polls local telemetry ~every 2s → `EnvironmentState`
- Scene grade, parallax, rain, fog, cloud veil, aurora, heat shimmer, lake sheen follow load / clock / GPU
- Mood / Atmosphere / System panels update live
- Idle states dim glass and scale the scene; wake restores workspace

## Apps (same glass style)

Dock opens floating frosted windows: Apps, Files, Browser, Editor, Notes, Media, **Chat** (Ollama), Settings, Bin — plus Mood / Atmosphere / Projects / System companions.

## License

MIT — see [LICENSE](LICENSE).
