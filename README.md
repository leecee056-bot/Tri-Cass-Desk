# Tri-Cass Desk

Local-only living companion for **Tri-Cass OS**. Earthbound / Celestial atmosphere is driven by **machine telemetry** (CPU / RAM / GPU / disk / processes) — not outdoor weather APIs — with a frosted glass window manager and utility suite.

## Download (site-ready)

1. Open **[Releases](https://github.com/leecee056-bot/Tri-Cass-Desk/releases/latest)**
2. Pick a format:
   - **Windows** — `Tri-Cass-Desk-*-win-x64.exe` / `*-win-ia32.exe` (NSIS setup or portable; low-spec PCs use ia32)
   - **Linux x64** — `.AppImage` or `.deb`
   - **Raspberry Pi / aarch64** — `Tri-Cass-Desk-*-linux-arm64.AppImage`
   - **Android phone + Android TV** — `Tri-Cass-Desk-*-android.apk` (Capacitor lite shell — chat + vault; not the full Electron Desk)
3. Run the installer / AppImage / sideload the APK
4. On first desktop launch you’ll see the **Tri-Cass OS** boot splash with the brand logo

Link that Releases page from the Tri-Cass site as: **Download → pick format → launch**.

## Brand

- Boot splash: Tri-Cass OS wordmark + mascot logo
- Desktop / Start Menu / installer icons: `build/icon.png`
- Window title: **Tri-Cass OS · Desk**

## Develop

```bash
npm install
npm run dev
```

Optional: local [Ollama](https://ollama.com) for AI chat (dock → Chat) and Agents.

### Agents (Cline-slim)

Dock → **Agents**:

- **inspect** — local tools + short LLM summary
- **plan** — read-only checklist saved to workspace `.tri-cass/plan.md` + `.tri-cass-rules`
- **build** — JSON one-tool grammar loop (write/edit/read/list/run/checkpoints/finish), sandboxed `python`/`node` under `workspace/projects/`, post-write checks, stuck×3 → rollback, approve/open in the Monaco **Editor**

```bash
npm run typecheck
npm run build
npm run pack:win           # NSIS + portable, x64 + ia32
npm run pack:linux         # AppImage + deb (x64)
npm run pack:linux:arm64   # AppImage for Pi / aarch64
```

Tag a release to publish desktop + Android builds via GitHub Actions:

```bash
git tag v0.4.0
git push origin v0.4.0
```

### Android (Capacitor)

See [`mobile/README.md`](mobile/README.md). Full Electron Desk does **not** wrap to APK; the Capacitor app is the phone/TV product surface.

## What is reactive (not a flat wallpaper)

- Polls local telemetry ~every 2s → `EnvironmentState`
- Scene grade, sky, water, grass, and mood panels follow load / clock / activity
- Idle states dim glass and scale the scene; wake restores workspace

## Apps (same glass style)

Dock opens floating frosted windows: Apps, Files, Browser, Editor, Notes, Media, **Chat** (Ollama), Settings, Bin — plus Mood / Atmosphere / Projects / System companions.

## License

MIT — see [LICENSE](LICENSE).
