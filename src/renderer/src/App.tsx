import { useEffect, useState } from 'react'
import { useEnvironment } from './hooks/useEnvironment'
import LivingScene from './scene/LivingScene'
import AgentsView from './features/AgentsView'
import BrowseView from './features/BrowseView'
import ChatView from './features/ChatView'
import FilesView from './features/FilesView'
import SettingsView from './features/SettingsView'
import VaultView from './features/VaultView'
import BrowserSurface from './surfaces/BrowserSurface'
import MediaSurface from './surfaces/MediaSurface'
import TerminalSurface from './surfaces/TerminalSurface'
import EditorSurface from './surfaces/EditorSurface'
import ClockPanel from './shell/ClockPanel'
import ControlsBar from './shell/ControlsBar'
import Dock from './shell/Dock'
import HealthPanel from './shell/HealthPanel'
import SystemPanel from './shell/SystemPanel'
import WorkspacePanel from './shell/WorkspacePanel'
import ToolsHub from './tools/ToolsHub'
import { TOOL_CATALOG } from './tools/catalog'
import UniversalTool from './tools/engines/UniversalTool'
import './shell/shell.css'
import './features/features.css'
import './surfaces/surfaces.css'

function workspaceMeta(active: string): { title: string; subtitle: string } {
  switch (active) {
    case 'tools':
    case 'launcher':
      return {
        title: 'Apps & Tools',
        subtitle: `${TOOL_CATALOG.length} glass utilities`
      }
    case 'files':
      return { title: 'Files', subtitle: 'Local workspace & home' }
    case 'agents':
      return { title: 'Agents', subtitle: 'Allowlisted local agent' }
    case 'vault':
      return { title: 'Knowledge Vault', subtitle: 'Notes on this PC' }
    case 'browse':
      return { title: 'Glass Browser', subtitle: 'In-desk browsing · frosted chrome' }
    case 'media':
      return { title: 'Media Player', subtitle: 'Local audio / video · VLC-class controls' }
    case 'terminal':
      return { title: 'Terminal', subtitle: 'xterm · allowlisted commands' }
    case 'editor':
      return { title: 'Editor', subtitle: 'Glass code desk (+ Monaco)' }
    case 'bin':
      return { title: 'Bin', subtitle: 'Soft-delete shelf' }
    case 'settings':
      return { title: 'Settings', subtitle: 'Environment + snapshots' }
    case 'chat':
    default:
      return { title: 'Chat', subtitle: 'Local Ollama chat' }
  }
}

export default function App(): React.JSX.Element {
  const { state, setPreferences, wake } = useEnvironment()
  const [active, setActive] = useState('chat')

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

  const meta = workspaceMeta(active)
  const binTool = TOOL_CATALOG.find((t) => t.name.toLowerCase().includes('recycle'))

  let body: React.ReactNode
  switch (active) {
    case 'tools':
    case 'launcher':
      body = <ToolsHub state={state} onOpenDock={setActive} />
      break
    case 'files':
      body = <FilesView />
      break
    case 'agents':
      body = <AgentsView />
      break
    case 'vault':
      body = <VaultView />
      break
    case 'browse':
      body = <BrowserSurface />
      break
    case 'media':
      body = <MediaSurface />
      break
    case 'terminal':
      body = <TerminalSurface />
      break
    case 'editor':
      body = <EditorSurface />
      break
    case 'bin':
      body = binTool ? (
        <UniversalTool
          tool={binTool}
          state={state}
          onOpenDock={setActive}
          onClose={() => setActive('tools')}
        />
      ) : (
        <p className="status-line">Bin shelf</p>
      )
      break
    case 'settings':
      body = (
        <SettingsView
          state={state}
          activeDock={active}
          onChange={(prefs) => {
            void setPreferences(prefs)
          }}
          onRestoreDock={setActive}
        />
      )
      break
    case 'chat':
    default:
      body = active === 'browse-legacy' ? <BrowseView /> : <ChatView />
      break
  }

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
        <WorkspacePanel title={meta.title} subtitle={meta.subtitle}>
          {body}
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
          activeId={active === 'launcher' ? 'launcher' : active}
          onSelect={setActive}
          dimmed={state.activity.workspaceState !== 'active'}
        />
      </div>
    </>
  )
}
