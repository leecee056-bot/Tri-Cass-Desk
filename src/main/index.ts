import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { EnvironmentEngine } from './environmentEngine'
import { IPC } from '../shared/ipc'
import type { EnvironmentState } from '../shared/environment'
import {
  chatSend,
  clearChatHistory,
  listModels,
  loadChatHistory,
  ollamaStatus
} from './services/ollama'
import { runAgent } from './services/agent'
import {
  getHomeDir,
  listDirectory,
  openExternal,
  openPath,
  readTextFile,
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
  runSafeCommand
} from './services/systemExtras'
import { listSnapshots, restoreSnapshot, saveSnapshot } from './services/snapshots'
import { deskDataDir, workspaceRoot } from './services/paths'

const engine = new EnvironmentEngine()
let mainWindow: BrowserWindow | null = null
let pollTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  // Ensure local data dirs exist early
  deskDataDir()
  workspaceRoot()

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#050814',
    title: 'Tri-Cass Desk',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('focus', () => engine.noteActivity())
  mainWindow.webContents.on('before-input-event', () => engine.noteActivity())

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
  pollTimer = setInterval(() => {
    void broadcastEnvironment()
  }, 2000)
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
  ipcMain.handle(IPC.wakeWorkspace, async () => {
    engine.wake()
    await broadcastEnvironment()
  })
  ipcMain.handle(IPC.noteActivity, async () => {
    engine.noteActivity()
  })

  ipcMain.handle(IPC.chatHistory, async () => loadChatHistory())
  ipcMain.handle(IPC.chatSend, async (_e, content: string, model?: string) =>
    chatSend(content, model)
  )
  ipcMain.handle(IPC.chatClear, async () => clearChatHistory())
  ipcMain.handle(IPC.ollamaModels, async () => listModels())
  ipcMain.handle(IPC.ollamaStatus, async () => ollamaStatus())

  ipcMain.handle(IPC.agentRun, async (_e, prompt: string) => runAgent(prompt))

  ipcMain.handle(IPC.listDir, async (_e, dirPath?: string) => listDirectory(dirPath))
  ipcMain.handle(IPC.readTextFile, async (_e, filePath: string) => readTextFile(filePath))
  ipcMain.handle(IPC.writeTextFile, async (_e, filePath: string, content: string) =>
    writeTextFile(filePath, content)
  )
  ipcMain.handle(IPC.homeDir, async () => getHomeDir())
  ipcMain.handle(IPC.openPath, async (_e, target: string) => openPath(target))
  ipcMain.handle(IPC.openExternal, async (_e, url: string) => openExternal(url))

  ipcMain.handle(IPC.vaultList, async () => listNotes())
  ipcMain.handle(IPC.vaultGet, async (_e, id: string) => getNote(id))
  ipcMain.handle(
    IPC.vaultSave,
    async (_e, note: { id?: string; title: string; body: string }) => saveNote(note)
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

  ipcMain.handle(
    IPC.hashText,
    async (_e, text: string, algo: 'sha256' | 'sha1' | 'md5') => hashText(text, algo)
  )
  ipcMain.handle(IPC.runSafeCommand, async (_e, commandId: string) => runSafeCommand(commandId))
}

app.whenReady().then(() => {
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
