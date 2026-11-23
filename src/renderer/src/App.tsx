import { useEffect } from 'react'
import { useEnvironment } from './hooks/useEnvironment'
import LivingScene from './scene/LivingScene'
import Dock from './shell/Dock'
import ControlsBar from './shell/ControlsBar'
import FloatingWindow from './wm/FloatingWindow'
import AppHost from './wm/AppHost'
import { useWindowManager } from './wm/useWindowManager'
import './shell/shell.css'
import './features/features.css'
import './surfaces/surfaces.css'
import './wm/wm.css'

export default function App(): React.JSX.Element {
  const { state, setPreferences, wake } = useEnvironment()
  const { windows, openApp, focus, close, move, minimize } = useWindowManager()

  useEffect(() => {
    const onPointer = (): void => {
      void window.desk?.noteActivity()
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onPointer)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onPointer)
    }
  }, [])

  const minimized = windows.filter((w) => w.minimized)

  return (
    <div className={`desk-root ${state.activity.workspaceState}`}>
      <LivingScene state={state} />

      <div className="desk-brand-float">
        <h1>Tri-Cass Desk</h1>
        <p>Local living companion</p>
      </div>

      {windows.map((win) => (
        <FloatingWindow
          key={win.id}
          win={win}
          onFocus={() => focus(win.id)}
          onClose={() => close(win.id)}
          onMinimize={() => minimize(win.id)}
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

      <div className="desk-dock-wrap">
        {minimized.length > 0 ? (
          <div className="mini-tray">
            {minimized.map((w) => (
              <button key={w.id} type="button" onClick={() => focus(w.id)}>
                {w.title}
              </button>
            ))}
          </div>
        ) : null}
        <div className="glass" style={{ borderRadius: 22, padding: '6px 8px' }}>
          <ControlsBar
            state={state}
            onChange={(prefs) => {
              void setPreferences(prefs)
            }}
            onWake={() => {
              void wake()
              windows.forEach((w) => {
                if (w.minimized) focus(w.id)
              })
            }}
          />
        </div>
        <Dock
          activeId=""
          onSelect={(id) => openApp(id)}
          dimmed={state.activity.workspaceState !== 'active'}
        />
      </div>
    </div>
  )
}
