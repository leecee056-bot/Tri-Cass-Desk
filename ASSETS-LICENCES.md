# Living-world assets & licences (HAP-91 rebuild)

Licence rule: MIT / Apache / BSD / CC0 only. GPL or unclear → ask Lee.

| Asset / package | Role | Licence | Source / how plugged in |
|-----------------|------|---------|-------------------------|
| `three` | WebGL core | MIT | npm `three` |
| `@react-three/fiber` | React Three renderer | MIT | npm |
| `@react-three/drei` `Sky` | Precomputed sky (three.js Sky addon) | MIT | `SkyCloudEngine` — day/night via inclination + turbidity from mood |
| `@react-three/drei` `Clouds` / `Stars` | Cloud billboards + starfield | MIT | `SkyCloudEngine` |
| `three-stdlib` `Water` | Reflective water mesh | MIT | `WaterEngine` — time / sun / tint from mood |
| `waternormals.jpg` | Water normal map | MIT (three.js examples) | `src/renderer/src/assets/waternormals.jpg` from three.js `examples/textures/` |
| GrassSystemThreeJS technique | Thin GPU-instanced grass + wind | MIT © mohamedachrefelouafi | Adapted into `VegetationEngine` (blade strip, curl, wind); https://github.com/achrefelouafi/GrassSystemThreeJS |
| `earthbound-landscape.jpg` | Distant mountain billboard | Project asset | `MountainBackdrop` in canvas |
| `systeminformation` | Telemetry → mood targets | MIT | main process |

## Considered / deferred
| Candidate | Decision |
|-----------|----------|
| `@takram/three-atmosphere` / three-clouds | MIT — deferred (EffectComposer + GPU cost); drei Sky is the brief’s fallback |
| globe.gl / Tellux / CesiumJS | Optional planet view — not this pass |
| Poly Haven / ambientCG HDRIs | CC0 — deferred; soft lighting from Sky + directional for now |
| Open-Meteo / NASA GIBS | Outdoor weather — desk stays local telemetry metaphor |

## Low-power
Mood debug → **Low-power scene** reduces grass density, cloud/star counts, shadows, and DPR.
