# Living-world assets & licences (HAP-91)

Every third-party piece used by the living scene. Prefer MIT / Apache / BSD / CC0.

| Asset / package | Role | Licence | Source |
|-----------------|------|---------|--------|
| `three` | WebGL renderer | MIT | https://github.com/mrdoob/three.js |
| `@react-three/fiber` | React renderer for three | MIT | https://github.com/pmndrs/react-three-fiber |
| `@react-three/drei` | Clouds, Stars helpers | MIT | https://github.com/pmndrs/drei |
| `drei-cloud.png` (bundled via drei import) | Cloud billboard texture | MIT (drei) | `@react-three/drei` |
| `earthbound-landscape.jpg` | Terrain plate (existing desk art) | Project asset | `src/renderer/src/assets/` |
| VegetationEngine (instanced grass) | Wind + cursor gust grass | MIT (original desk code) | Inspired by common instanced-grass technique; **not** a copy of GrassSystemThreeJS / al-ro sources |
| WaterEngine / AuroraEngine / HeatHaze / Sky wash | Scene shaders | MIT (original desk code) | Tri-Cass Desk |
| `systeminformation` | Telemetry for mood targets | MIT | https://github.com/sebhildebrandt/systeminformation |

## Considered but not vendored this pass
| Candidate | Why deferred |
|-----------|----------------|
| `@takram/three-atmosphere` / three-clouds | GPU-heavy; needs EffectComposer; evaluate after low-power baseline |
| globe.gl / Tellux / CesiumJS | Optional planet view — next polish if Lee wants Earth browse |
| GrassSystemThreeJS | MIT-friendly reference only; we wrote our own instanced field |
| Poly Haven / ambientCG HDRIs | Not downloaded yet; plate + procedural lighting for now |
| Open-Meteo / NASA GIBS | Outdoor weather APIs — desk policy remains **local telemetry metaphor** unless Lee opts in |

## Low-power mode
Mood debug → **Low-power scene** drops cloud density, star count, heat haze, and caps DPR to keep idle cost down.
