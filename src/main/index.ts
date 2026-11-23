import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { EnvironmentEngine } from './environmentEngine'
import { IPC } from '../shared/ipc'
import type { EnvironmentState } from '../shared/environment'

const engine = new EnvironmentEngine()
let mainWindow: BrowserWindow | null = null
let pollTimer: NodeJS.Timeout | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
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

app.whenReady().then(() => {
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
