# Tri-Cass Desk Mobile / Android TV

Capacitor shell for phones and Android TV leanback launchers. **Electron cannot ship APKs** — this lite React UI (Ollama chat + on-device vault) is the Android path.

## Formats

| Target | Artifact | Notes |
|--------|----------|-------|
| Android phone | `Tri-Cass-Desk-*-android.apk` | LAUNCHER |
| Android TV / boxes | same APK | `LEANBACK_LAUNCHER`, touchscreen not required |

Full Desk (Editor, Agents, living world) remains Electron: Windows / Linux x64 / **Pi arm64 AppImage**.

## Develop

```bash
cd mobile
npm install
npm run dev          # browser
npm run cap:sync     # build web → android/
# with Android SDK:
npm run apk:debug
```

Tag `v*` on the Desk repo to build + upload the APK via `.github/workflows/android.yml`.
