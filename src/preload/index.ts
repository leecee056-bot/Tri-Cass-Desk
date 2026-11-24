import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type DeskApi } from '../shared/ipc'
import type { EnvironmentState } from '../shared/environment'

const api: DeskApi = {
  getEnvironment: () => ipcRenderer.invoke(IPC.getEnvironment),
  setPreferences: (prefs) => ipcRenderer.invoke(IPC.setPreferences, prefs),
  resetPreferences: () => ipcRenderer.invoke(IPC.resetPreferences),
  wakeWorkspace: () => ipcRenderer.invoke(IPC.wakeWorkspace),
  noteActivity: () => ipcRenderer.invoke(IPC.noteActivity),
  windowClose: () => ipcRenderer.invoke(IPC.windowClose),
  windowMinimize: () => ipcRenderer.invoke(IPC.windowMinimize),
  windowMaximize: () => ipcRenderer.invoke(IPC.windowMaximize),
  onEnvironmentUpdated: (cb) => {
    const listener = (_event: Electron.IpcRendererEvent, state: EnvironmentState): void => {
      cb(state)
    }
    ipcRenderer.on(IPC.environmentUpdated, listener)
    return () => ipcRenderer.removeListener(IPC.environmentUpdated, listener)
  },

  chatHistory: () => ipcRenderer.invoke(IPC.chatHistory),
  chatSend: (content, model) => ipcRenderer.invoke(IPC.chatSend, content, model),
  chatClear: () => ipcRenderer.invoke(IPC.chatClear),
  chatGenerate: (messages, opts) => ipcRenderer.invoke(IPC.chatGenerate, messages, opts),
  chatStreamStart: (messages, opts) => ipcRenderer.invoke(IPC.chatStreamStart, messages, opts),
  chatStreamAbort: (streamId) => ipcRenderer.invoke(IPC.chatStreamAbort, streamId),
  onChatStreamChunk: (cb) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { streamId: string; delta: string; done?: boolean; error?: string }
    ): void => {
      cb(payload)
    }
    ipcRenderer.on(IPC.chatStreamChunk, listener)
    return () => ipcRenderer.removeListener(IPC.chatStreamChunk, listener)
  },
  ollamaModels: () => ipcRenderer.invoke(IPC.ollamaModels),
  ollamaStatus: () => ipcRenderer.invoke(IPC.ollamaStatus),

  agentRun: (prompt) => ipcRenderer.invoke(IPC.agentRun, prompt),
  agentLoop: (prompt, opts) => ipcRenderer.invoke(IPC.agentLoop, prompt, opts),

  listDir: (dirPath) => ipcRenderer.invoke(IPC.listDir, dirPath),
  readTextFile: (filePath) => ipcRenderer.invoke(IPC.readTextFile, filePath),
  writeTextFile: (filePath, content) => ipcRenderer.invoke(IPC.writeTextFile, filePath, content),
  mkdirDir: (dirPath) => ipcRenderer.invoke(IPC.mkdirDir, dirPath),
  renamePath: (fromPath, newName) => ipcRenderer.invoke(IPC.renamePath, fromPath, newName),
  userFolder: (name) => ipcRenderer.invoke(IPC.userFolder, name),
  homeDir: () => ipcRenderer.invoke(IPC.homeDir),
  openPath: (target) => ipcRenderer.invoke(IPC.openPath, target),
  openExternal: (url) => ipcRenderer.invoke(IPC.openExternal, url),

  vaultList: () => ipcRenderer.invoke(IPC.vaultList),
  vaultGet: (id) => ipcRenderer.invoke(IPC.vaultGet, id),
  vaultSave: (note) => ipcRenderer.invoke(IPC.vaultSave, note),
  vaultDelete: (id) => ipcRenderer.invoke(IPC.vaultDelete, id),

  processes: () => ipcRenderer.invoke(IPC.processes),
  disks: () => ipcRenderer.invoke(IPC.disks),
  ports: () => ipcRenderer.invoke(IPC.ports),
  envVars: () => ipcRenderer.invoke(IPC.envVars),
  clipboardRead: () => ipcRenderer.invoke(IPC.clipboardRead),
  clipboardWrite: (text) => ipcRenderer.invoke(IPC.clipboardWrite, text),

  snapshotsList: () => ipcRenderer.invoke(IPC.snapshotsList),
  snapshotsSave: (activeDock, label) => ipcRenderer.invoke(IPC.snapshotsSave, activeDock, label),
  snapshotsRestore: (id) => ipcRenderer.invoke(IPC.snapshotsRestore, id),
  snapshotsDelete: (id) => ipcRenderer.invoke(IPC.snapshotsDelete, id),

  hashText: (text, algo) => ipcRenderer.invoke(IPC.hashText, text, algo),
  runSafeCommand: (commandId) => ipcRenderer.invoke(IPC.runSafeCommand, commandId),
  safeCommandsList: () => ipcRenderer.invoke(IPC.safeCommandsList),
  pickMediaFile: () => ipcRenderer.invoke(IPC.pickMediaFile),
  binList: () => ipcRenderer.invoke(IPC.binList),
  binEntries: () => ipcRenderer.invoke(IPC.binEntries),
  binMove: (targetPath) => ipcRenderer.invoke(IPC.binMove, targetPath),
  binRestore: (name) => ipcRenderer.invoke(IPC.binRestore, name),
  binDelete: (name) => ipcRenderer.invoke(IPC.binDelete, name),
  binEmpty: () => ipcRenderer.invoke(IPC.binEmpty)
}

contextBridge.exposeInMainWorld('desk', api)
