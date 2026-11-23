# Tri-Cass Desk

Local-only living companion desktop for **Tri-Cass OS**.

Earthbound / Celestial atmosphere — cinematic landscape, frosted glass, graceful idle — driven by **this machine** (CPU, RAM, GPU, temps, processes, disk). No weather or location APIs.

## Stack

- Electron + Vite + React + TypeScript (desktop-first; not a nexus-app / Expo clone)
- `systeminformation` telemetry → `EnvironmentState` → living scene
- Local Ollama chat, allowlisted agent, files, vault, browse, settings
- 30+ integrated local tools (hash, JSON, regex, monitor, ports, timer, canvas, …)

## Metric → scene

| Telemetry | Scene |
|---|---|
| CPU + process churn | Rain / storm |
| RAM pressure | Cloud / fog |
| GPU load | Aurora / Milky Way (artistic) |
| Temps | Heat shimmer / sky warmth |
| Disk I/O | Wind / motion |
| Device clock | Day / night sky phase |

## Develop (Windows target)

```bash
npm install
npm run dev
```

Requires [Ollama](https://ollama.com) locally for chat / model list (optional — Desk runs without it).

```bash
npm run typecheck
npm run build
npm run pack:win
```

## Layout

- `src/main` — Electron main, telemetry, Ollama, files, vault, agent
- `src/preload` — `window.desk` bridge
- `src/renderer` — living scene + glass shell + feature views + tools
- `src/shared` — types / IPC

Data lives under the Electron userData `tri-cass-desk/` folder (chat history, vault, workspace, snapshots).

## License

MIT — see [LICENSE](LICENSE).
