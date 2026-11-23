import type { EnvironmentState } from './environment'

export const IPC = {
  getEnvironment: 'desk:get-environment',
  environmentUpdated: 'desk:environment-updated',
  setPreferences: 'desk:set-preferences',
  wakeWorkspace: 'desk:wake-workspace'
} as const

export type DeskApi = {
  getEnvironment: () => Promise<EnvironmentState>
  setPreferences: (
    prefs: Partial<EnvironmentState['userPreferences']>
  ) => Promise<EnvironmentState>
  wakeWorkspace: () => Promise<void>
  onEnvironmentUpdated: (cb: (state: EnvironmentState) => void) => () => void
}
