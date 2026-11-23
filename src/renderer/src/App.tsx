import { useMemo, useState } from 'react'
import { useEnvironment } from './hooks/useEnvironment'
import LivingScene from './scene/LivingScene'
import ClockPanel from './shell/ClockPanel'
import ControlsBar from './shell/ControlsBar'
import Dock from './shell/Dock'
import HealthPanel from './shell/HealthPanel'
import SystemPanel from './shell/SystemPanel'
import WorkspacePanel from './shell/WorkspacePanel'
import { TOOL_CATALOG } from './tools/catalog'
import './shell/shell.css'

export default function App(): React.JSX.Element {
  const { state, setPreferences, wake } = useEnvironment()
  const [active, setActive] = useState('chat')

  const workspace = useMemo(() => {
    switch (active) {
      case 'tools':
        return {
          title: 'Tools',
          subtitle: `${TOOL_CATALOG.length} integrated slots — expanding from the companion checklist + OSS`,
          body: (
            <div className="placeholder-grid">
              {TOOL_CATALOG.slice(0, 9).map((tool) => (
                <div key={tool.id} className="placeholder-tile">
                  {tool.name}
                </div>
              ))}
            </div>
          )
        }
      case 'files':
        return {
          title: 'Files',
          subtitle: 'Local file browser (Phase 2)',
          body: <p className="notes-line">Workspace files stay on this machine.</p>
        }
      case 'agents':
        return {
          title: 'Agents',
          subtitle: 'Local agent runner (Phase 2)',
          body: <p className="notes-line">Sandboxed agents — offline-first.</p>
        }
      case 'vault':
        return {
          title: 'Knowledge Vault',
          subtitle: 'Local notes & knowledge (Phase 2)',
          body: <p className="notes-line">Dream bigger… the machine is the sky.</p>
        }
      case 'browse':
        return {
          title: 'Browse',
          subtitle: 'Optional local browser pane (Phase 2)',
          body: <p className="notes-line">No required cloud services for the living desk.</p>
        }
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'Desk preferences',
          body: (
            <p className="notes-line">
              Use the controls bar for motion, celestial art, and adaptation pause. Deeper settings
              land with companion feature packs.
            </p>
          )
        }
      case 'chat':
      default:
        return {
          title: 'Chat',
          subtitle: 'Local LLM chat (Phase 2) — shell is live',
          body: (
            <p className="notes-line">
              Living environment is reactive to this PC’s CPU, RAM, GPU, temps and processes. Chat /
              agents / vault / browse come next — then dozens of integrated tools.
            </p>
          )
        }
    }
  }, [active])

  return (
    <>
      <LivingScene state={state} />
      <div className={`desk-ui ${state.activity.workspaceState}`}>
        <div className="brand-mark">
          <h1>Tri-Cass Desk</h1>
          <p>Local living companion</p>
        </div>
        <ClockPanel state={state} />
        <HealthPanel state={state} />
        <WorkspacePanel title={workspace.title} subtitle={workspace.subtitle}>
          {workspace.body}
        </WorkspacePanel>
        <SystemPanel state={state} />
        <ControlsBar
          state={state}
          onChange={(prefs) => {
            void setPreferences(prefs)
          }}
          onWake={() => {
            void wake()
          }}
        />
        <Dock
          activeId={active}
          onSelect={setActive}
          dimmed={state.activity.workspaceState !== 'active'}
        />
      </div>
    </>
  )
}
