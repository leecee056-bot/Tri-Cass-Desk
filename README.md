# Tri-Cass Desk

Local-only living companion for **Tri-Cass OS**. Earthbound / Celestial atmosphere is driven by **machine telemetry** (CPU / RAM / GPU / disk / processes) — not outdoor weather APIs — with a frosted glass window manager and utility suite.

## Download (site-ready)

1. Open **[Releases](https://github.com/leecee056-bot/Tri-Cass-Desk/releases/latest)**
2. Download Windows x64:
   - **`Tri-Cass-Desk-*-win-x64.exe`** — NSIS setup (desktop + Start Menu shortcut, Tri-Cass icon)
   - or the **portable** `.exe` from the same release if you prefer no installer
3. Run the setup (or portable), launch **Tri-Cass Desk**
4. On first launch you’ll see the **Tri-Cass OS** boot splash with the brand logo

**Current recommended:** **v0.3.0** — interactive living world is back, but with the **CPU-safe telemetry** fix (no heavy 1s process/GPU scans). Also: themes, quiet launch, window fits the screen, closable chrome. Turn off **Settings → Living world → Interactive living world** to use wallpaper-only if 3D feels heavy.

**Safe wallpaper-only:** **v0.2.6 Lite** if you want zero WebGL.

**Do not use v0.2.3–v0.2.5** — crashed / pegged CPU.

Link that Releases page from the Tri-Cass site as: **Download → unzip/run setup → launch**.

## Brand

- Boot splash: Tri-Cass OS wordmark + mascot logo
- Desktop / Start Menu / installer icons: `build/icon.png`
- Window title: **Tri-Cass OS · Desk**

## Develop

```bash
npm install
npm run dev
```

Optional: local [Ollama](https://ollama.com) for AI chat (dock → Chat).

```bash
npm run typecheck
npm run build
npm run pack:win        # NSIS installer + portable (Windows runner / wine)
npm run pack:win:dir    # unpacked dir for smoke tests
```

Tag a release to publish Windows builds via GitHub Actions:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## What is reactive (not a flat wallpaper)

- Polls local telemetry ~every 2s → `EnvironmentState`
- Optional Three.js lakeside (low-power defaults) or wallpaper themes (Earth / Space / Nature / Cosmic)
- Light CPU/RAM sampling every ~15s (not process/GPU scans)
- Idle states dim glass; wake restores workspace
- Launch starts with an empty desk; open apps from the dock

## Apps (same glass style)

Dock opens floating frosted windows: Apps, Files, Browser, Editor, Notes, Media, **Chat** (Ollama), Settings, Bin — plus Mood / Atmosphere / Projects / System companions.

## License

MIT — see [LICENSE](LICENSE).
