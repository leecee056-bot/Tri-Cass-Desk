import type { EnvironmentState } from '../../../shared/environment'
import type { DeskWindow } from './types'
import ChatView from '../features/ChatView'
import AgentsView from '../features/AgentsView'
import FilesView from '../features/FilesView'
import VaultView from '../features/VaultView'
import SettingsView from '../features/SettingsView'
import BrowserSurface from '../surfaces/BrowserSurface'
import MediaSurface from '../surfaces/MediaSurface'
import TerminalSurface from '../surfaces/TerminalSurface'
import EditorSurface from '../surfaces/EditorSurface'
import ToolsHub from '../tools/ToolsHub'
import SystemPanel from '../shell/SystemPanel'
import HealthPanel from '../shell/HealthPanel'
import ClockPanel from '../shell/ClockPanel'
import AtmospherePanel from '../shell/AtmospherePanel'
import NotesView from '../features/NotesView'
import ProjectsView from '../features/ProjectsView'
import { TOOL_CATALOG } from '../tools/catalog'
import UniversalTool from '../tools/engines/UniversalTool'
import '../features/features.css'

type Props = {
  win: DeskWindow
  state: EnvironmentState
  setPreferences: (prefs: Partial<EnvironmentState['userPreferences']>) => Promise<void>
  openApp: (appId: string, title?: string, payload?: Record<string, string>) => void
  close: () => void
}

export default function AppHost({
  win,
  state,
  setPreferences,
  openApp,
  close
}: Props): React.JSX.Element {
  const toolId = win.payload?.toolId
  if (toolId) {
    const tool = TOOL_CATALOG.find((t) => t.id === toolId)
    if (tool) {
      return (
        <UniversalTool
          tool={tool}
          state={state}
          onOpenDock={(id) => openApp(id)}
          onClose={close}
        />
      )
    }
  }

  switch (win.appId) {
    case 'chat':
      return <ChatView onCloseWindow={close} />
    case 'agents':
      return <AgentsView />
    case 'files':
      return <FilesView />
    case 'vault':
      return <VaultView />
    case 'browse':
      return <BrowserSurface onClose={close} />
    case 'media':
      return <MediaSurface onClose={close} />
    case 'terminal':
      return <TerminalSurface onClose={close} />
    case 'editor':
      return <EditorSurface onClose={close} />
    case 'tools':
    case 'launcher':
      return (
        <ToolsHub
          state={state}
          onOpenDock={(id) => openApp(id)}
          onOpenTool={(tool) => openApp('tool', tool.name, { toolId: tool.id })}
        />
      )
    case 'tool':
      {
        const t = TOOL_CATALOG.find((x) => x.id === win.payload?.toolId)
        return t ? (
          <UniversalTool tool={t} state={state} onOpenDock={(id) => openApp(id)} onClose={close} />
        ) : (
          <p className="status-line">Unknown tool</p>
        )
      }
    case 'bin': {
      const recycle = TOOL_CATALOG.find((t) => t.name.toLowerCase().includes('recycle'))
      return recycle ? (
        <UniversalTool
          tool={recycle}
          state={state}
          onOpenDock={(id) => openApp(id)}
          onClose={close}
        />
      ) : (
        <p className="status-line">Bin</p>
      )
    }
    case 'settings':
      return (
        <SettingsView
          state={state}
          activeDock={win.appId}
          onChange={(prefs) => {
            void setPreferences(prefs)
          }}
          onRestoreDock={(id) => openApp(id)}
        />
      )
    case 'system':
      return <SystemPanel state={state} />
    case 'health':
      return <HealthPanel state={state} />
    case 'clock':
      return <ClockPanel state={state} />
    case 'atmosphere':
      return <AtmospherePanel state={state} />
    case 'notes':
      return <NotesView />
    case 'projects':
      return <ProjectsView />
    default:
      return <p className="status-line">App “{win.appId}” not mounted.</p>
  }
}
