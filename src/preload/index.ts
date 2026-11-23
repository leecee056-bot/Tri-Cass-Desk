import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type DeskApi } from '../shared/ipc'
import type { EnvironmentState } from '../shared/environment'

const api: DeskApi = {
  getEnvironment: () => ipcRenderer.invoke(IPC.getEnvironment),
  setPreferences: (prefs) => ipcRenderer.invoke(IPC.setPreferences, prefs),
  wakeWorkspace: () => ipcRenderer.invoke(IPC.wakeWorkspace),
  onEnvironmentUpdated: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, state: EnvironmentState): void => {
      cb(state)
    }
    ipcRenderer.on(IPC.environmentUpdated, listener)
    return () => ipcRenderer.removeListener(IPC.environmentUpdated, listener)
  }
}

contextBridge.exposeInMainWorld('desk', api)
