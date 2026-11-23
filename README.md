# Tri-Cass Desk

Local-only living companion desktop for **Tri-Cass OS**.

The atmosphere is inspired by an Earthbound / Celestial adaptive desktop — cinematic landscape, frosted glass surfaces, graceful idle — but **driven by this machine**, not the weather outside. No location or forecast APIs.

## Stack (new — not a nexus-app clone)

- **Electron + Vite + React + TypeScript**
- Main-process telemetry (`systeminformation`) → normalized `EnvironmentState`
- Layered living scene + glass shell + dock
- Tool registry for companion features + dozens of integrated utilities

## Metric → scene (v1)

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

```bash
npm run typecheck
npm run build
npm run pack:win
```

## Phases

1. **Living shell** (this PR) — scene, telemetry, glass UI, dock, tool catalog stubs
2. Companion core — chat / agents / files / vault / browse / settings
3. Tool packs — wire OSS utilities into the registry
4. Idle intelligence — layout snapshots, protected activity, wake restore
5. Polish — performance tiers, a11y, installer

## License

MIT — see [LICENSE](LICENSE).
