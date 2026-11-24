import { app, BrowserWindow, dialog, ipcMain, screen } from 'electron'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { EnvironmentEngine } from './environmentEngine'
import { IPC } from '../shared/ipc'
import type { EnvironmentState } from '../shared/environment'
import {
  chatSend,
  chatGenerate,
  chatGenerateStream,
  clearChatHistory,
  listModels,
  loadChatHistory,
  ollamaStatus
} from './services/ollama'
import { runAgent, runAgentLoop } from './services/agent'
import { randomUUID } from 'node:crypto'
import {
  getHomeDir,
  listDirectory,
  mkdirDir,
  openExternal,
  openPath,
  readTextFile,
  renamePath,
  userFolder,
  writeTextFile
} from './services/files'
import { deleteNote, getNote, listNotes, saveNote } from './services/vault'
import {
  clipboardRead,
  clipboardWrite,
  envVars,
  hashText,
  listDisks,
  listPorts,
  listProcesses,
  listSafeCommands,
  runSafeCommand
} from './services/systemExtras'
import { deleteSnapshot, listSnapshots, restoreSnapshot, saveSnapshot } from './services/snapshots'
import { loadPreferences, savePreferences } from './services/preferences'
import { deskDataDir, workspaceRoot } from './services/paths'
import {
  binList,
  binEntries,
  binMove,
  binRestore,
  binDelete,
  binEmpty,
  binDir
} from './services/bin'

const engine = new EnvironmentEngine()
let mainWindow: BrowserWindow | null = null
let pollTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  // Ensure local data dirs exist early
  deskDataDir()
  workspaceRoot()

  const { workArea } = screen.getPrimaryDisplay()
  const margin = 40
  const width = Math.max(720, Math.min(1280, workArea.width - margin * 2))
  const height = Math.max(520, Math.min(800, workArea.height - margin * 2))
  const x = Math.round(workArea.x + (workArea.width - width) / 2)
  const y = Math.round(workArea.y + (workArea.height - height) / 2)

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: '#0a1220',
    transparent: false,
    show: false,
    title: 'Tri-Cass OS · Desk',
    icon: join(__dirname, '../../build/icon.png'),
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      backgroundThrottling: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    // Never open larger than the usable desktop
    const area = screen.getDisplayMatching(mainWindow.getBounds()).workArea
    const b = mainWindow.getBounds()
    if (b.width > area.width - 24 || b.height > area.height - 24) {
      mainWindow.setBounds({
        x: area.x + 12,
        y: area.y + 12,
        width: Math.min(b.width, area.width - 24),
        height: Math.min(b.height, area.height - 24)
      })
    }
    mainWindow.show()
  })

  mainWindow.on('focus', () => engine.noteActivity())

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function broadcastEnvironment(): Promise<void> {
  const state = await engine.tick()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.environmentUpdated, state)
  }
}

function startPolling(): void {
  if (pollTimer) clearInterval(pollTimer)
  void broadcastEnvironment()
  // Lite: slow poll — old 1s systeminformation stack pegged Windows CPUs
  pollTimer = setInterval(() => {
    void broadcastEnvironment()
  }, 15_000)
}

function registerIpc(): void {
  ipcMain.handle(IPC.getEnvironment, async () => engine.tick())
  ipcMain.handle(
    IPC.setPreferences,
    async (_e, prefs: Partial<EnvironmentState['userPreferences']>) => {
      engine.setPreferences(prefs)
      return engine.tick()
    }
  )
  ipcMain.handle(IPC.resetPreferences, async () => {
    engine.resetPreferences()
    return engine.tick()
  })
  ipcMain.handle(IPC.wakeWorkspace, async () => {
    engine.wake()
    await broadcastEnvironment()
  })
  ipcMain.handle(IPC.noteActivity, async () => {
    engine.noteActivity()
  })
  ipcMain.handle(IPC.windowClose, async () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close()
  })
  ipcMain.handle(IPC.windowMinimize, async () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize()
  })
  ipcMain.handle(IPC.windowMaximize, async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })

  ipcMain.handle(IPC.chatHistory, async () => loadChatHistory())
  ipcMain.handle(IPC.chatSend, async (_e, content: string, model?: string) =>
    chatSend(content, model)
  )
  ipcMain.handle(IPC.chatClear, async () => clearChatHistory())
  ipcMain.handle(
    IPC.chatGenerate,
    async (
      _e,
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      opts?: { model?: string; temperature?: number; system?: string; numPredict?: number }
    ) => chatGenerate(messages, opts)
  )

  const chatStreamAborts = new Map<string, AbortController>()
  ipcMain.handle(
    IPC.chatStreamStart,
    async (
      e,
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
      opts?: { model?: string; temperature?: number; system?: string; numPredict?: number }
    ) => {
      const streamId = randomUUID()
      const ac = new AbortController()
      chatStreamAborts.set(streamId, ac)
      const sender = e.sender
      void (async () => {
        try {
          await chatGenerateStream(messages, opts ?? {}, {
            signal: ac.signal,
            onDelta: (delta) => {
              if (!sender.isDestroyed()) {
                sender.send(IPC.chatStreamChunk, { streamId, delta })
              }
            }
          })
          if (!sender.isDestroyed()) {
            sender.send(IPC.chatStreamChunk, { streamId, delta: '', done: true })
          }
        } catch (err) {
          const message =
            err instanceof Error && err.name === 'AbortError'
              ? 'stopped'
              : err instanceof Error
                ? err.message
                : String(err)
          if (!sender.isDestroyed()) {
            sender.send(IPC.chatStreamChunk, {
              streamId,
              delta: '',
              done: true,
              error: message === 'stopped' ? undefined : message
            })
          }
        } finally {
          chatStreamAborts.delete(streamId)
        }
      })()
      return { streamId }
    }
  )
  ipcMain.handle(IPC.chatStreamAbort, async (_e, streamId: string) => {
    chatStreamAborts.get(streamId)?.abort()
    chatStreamAborts.delete(streamId)
  })

  ipcMain.handle(IPC.ollamaModels, async () => listModels())
  ipcMain.handle(IPC.ollamaStatus, async () => ollamaStatus())

  ipcMain.handle(IPC.agentRun, async (_e, prompt: string) => runAgent(prompt))
  ipcMain.handle(
    IPC.agentLoop,
    async (
      _e,
      prompt: string,
      opts?: { mode?: 'inspect' | 'plan' | 'build'; model?: string; temperature?: number }
    ) => runAgentLoop(prompt, opts)
  )

  ipcMain.handle(IPC.listDir, async (_e, dirPath?: string) => listDirectory(dirPath))
  ipcMain.handle(IPC.readTextFile, async (_e, filePath: string) => readTextFile(filePath))
  ipcMain.handle(IPC.writeTextFile, async (_e, filePath: string, content: string) =>
    writeTextFile(filePath, content)
  )
  ipcMain.handle(IPC.mkdirDir, async (_e, dirPath: string) => mkdirDir(dirPath))
  ipcMain.handle(IPC.renamePath, async (_e, fromPath: string, newName: string) =>
    renamePath(fromPath, newName)
  )
  ipcMain.handle(
    IPC.userFolder,
    async (_e, name: 'Desktop' | 'Documents' | 'Downloads') => userFolder(name)
  )
  ipcMain.handle(IPC.homeDir, async () => getHomeDir())
  ipcMain.handle(IPC.openPath, async (_e, target: string) => openPath(target))
  ipcMain.handle(IPC.openExternal, async (_e, url: string) => openExternal(url))

  ipcMain.handle(IPC.vaultList, async () => listNotes())
  ipcMain.handle(IPC.vaultGet, async (_e, id: string) => getNote(id))
  ipcMain.handle(
    IPC.vaultSave,
    async (_e, note: Parameters<typeof saveNote>[0]) => saveNote(note)
  )
  ipcMain.handle(IPC.vaultDelete, async (_e, id: string) => deleteNote(id))

  ipcMain.handle(IPC.processes, async () => listProcesses())
  ipcMain.handle(IPC.disks, async () => listDisks())
  ipcMain.handle(IPC.ports, async () => listPorts())
  ipcMain.handle(IPC.envVars, async () => envVars())
  ipcMain.handle(IPC.clipboardRead, async () => clipboardRead())
  ipcMain.handle(IPC.clipboardWrite, async (_e, text: string) => clipboardWrite(text))

  ipcMain.handle(IPC.snapshotsList, async () => listSnapshots())
  ipcMain.handle(IPC.snapshotsSave, async (_e, activeDock: string, label?: string) =>
    saveSnapshot(activeDock, label)
  )
  ipcMain.handle(IPC.snapshotsRestore, async (_e, id: string) => restoreSnapshot(id))
  ipcMain.handle(IPC.snapshotsDelete, async (_e, id: string) => deleteSnapshot(id))

  ipcMain.handle(
    IPC.hashText,
    async (_e, text: string, algo: 'sha256' | 'sha1' | 'md5') => hashText(text, algo)
  )
  ipcMain.handle(IPC.runSafeCommand, async (_e, commandId: string) => runSafeCommand(commandId))
  ipcMain.handle(IPC.safeCommandsList, async () => listSafeCommands())

  ipcMain.handle(IPC.pickMediaFile, async () => {
    const res = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Media',
          extensions: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac']
        }
      ]
    })
    if (res.canceled || !res.filePaths.length) return []
    return res.filePaths.map((filePath) => ({
      path: filePath,
      name: basename(filePath),
      url: pathToFileURL(filePath).href
    }))
  })

  ipcMain.handle(IPC.binList, async () => binList())
  ipcMain.handle(IPC.binEntries, async () => binEntries())
  ipcMain.handle(IPC.binMove, async (_e, targetPath: string) => binMove(targetPath))
  ipcMain.handle(IPC.binRestore, async (_e, name: string) => binRestore(name, workspaceRoot()))
  ipcMain.handle(IPC.binDelete, async (_e, name: string) => binDelete(name))
  ipcMain.handle(IPC.binEmpty, async () => binEmpty())

  void binDir()
}

// Hardware acceleration stays on so optional Living 3D WebGL can run.
// Heavy systeminformation polling (the 100% CPU culprit) is already removed.

app.whenReady().then(() => {
  engine.hydrate(loadPreferences(), savePreferences)
  registerIpc()
  createWindow()
  startPolling()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (pollTimer) clearInterval(pollTimer)
  if (process.platform !== 'darwin') app.quit()
})
