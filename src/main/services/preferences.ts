import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import {
  defaultPreferences,
  type EnvironmentState
} from '../../shared/environment'
import { preferencesPath } from './paths'

type Prefs = EnvironmentState['userPreferences']

export function loadPreferences(): Prefs {
  try {
    if (!existsSync(preferencesPath())) return { ...defaultPreferences }
    const raw = JSON.parse(readFileSync(preferencesPath(), 'utf8')) as Partial<Prefs>
    return { ...defaultPreferences, ...raw }
  } catch {
    return { ...defaultPreferences }
  }
}

export function savePreferences(prefs: Prefs): void {
  writeFileSync(preferencesPath(), JSON.stringify(prefs, null, 2), 'utf8')
}
