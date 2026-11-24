import { useCallback, useEffect, useState } from 'react'
import { useEnvironment } from './hooks/useEnvironment'
import LivingScene from './scene/LivingScene'
import Dock from './shell/Dock'
import { BootSplash } from './shell/BootSplash'
import { WindowChrome } from './shell/WindowChrome'
import FloatingWindow from './wm/FloatingWindow'
import AppHost from './wm/AppHost'
import { useWindowManager } from './wm/useWindowManager'
import './shell/shell.css'
import './features/features.css'
import './surfaces/surfaces.css'
import './wm/wm.css'

export default function App(): React.JSX.Element {
  const { state, setPreferences, wake } = useEnvironment()
  const { windows, openApp, focus, close, move, minimize, maximize } = useWindowManager()
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  useEffect(() => {
    let last = 0
    const ping = (): void => {
      const now = Date.now()
      if (now - last < 4000) return
      last = now
      void window.desk?.noteActivity()
    }
    // No pointermove — that was IPC-spamming on every mouse wiggle
    window.addEventListener('pointerdown', ping)
    window.addEventListener('keydown', ping)
    return () => {
      window.removeEventListener('pointerdown', ping)
      window.removeEventListener('keydown', ping)
    }
  }, [])

  const minimized = windows.filter((w) => w.minimized)
  const hasMaximized = windows.some((w) => w.maximized && !w.minimized)
  const idle =
    state.activity.workspaceState === 'ambient_idle' ||
    state.activity.workspaceState === 'resting'

  return (
    <div
      className={[
        'desk-root',
        state.activity.workspaceState,
        hasMaximized ? 'has-maximized' : '',
        state.userPreferences.reduceTransparency ? 'reduce-transparency' : '',
        state.userPreferences.compactDock ? 'compact-dock' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {booting ? <BootSplash onFinished={finishBoot} /> : null}
      <WindowChrome />
      <LivingScene state={state} />

      {windows.map((win) => (
        <FloatingWindow
          key={win.id}
          win={win}
          onFocus={() => focus(win.id)}
          onClose={() => close(win.id)}
          onMinimize={() => minimize(win.id)}
          onMaximize={() => maximize(win.id)}
          onMove={(x, y) => move(win.id, x, y)}
        >
          <AppHost
            win={win}
            state={state}
            setPreferences={setPreferences}
            openApp={openApp}
            close={() => close(win.id)}
          />
        </FloatingWindow>
      ))}

      <div className={`desk-dock-wrap ${idle ? 'idle' : ''}`}>
        {minimized.length > 0 ? (
          <div className="mini-tray">
            {minimized.map((w) => (
              <button key={w.id} type="button" onClick={() => focus(w.id)}>
                {w.title}
              </button>
            ))}
          </div>
        ) : null}
        {idle ? (
          <button
            type="button"
            className="wake-chip"
            onClick={() => {
              void wake()
              windows.forEach((w) => {
                if (w.minimized) focus(w.id)
              })
            }}
          >
            Return to workspace
          </button>
        ) : null}
        <Dock
          activeId=""
          onSelect={(id) => openApp(id)}
          dimmed={idle}
        />
      </div>
    </div>
  )
}
