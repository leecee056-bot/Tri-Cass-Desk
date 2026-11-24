import type { DeskThemeId } from '../../../shared/environment'
import earth from '../assets/themes/theme-earth.jpg'
import space from '../assets/themes/theme-space.jpg'
import nature from '../assets/themes/theme-nature.jpg'
import cosmic from '../assets/themes/theme-cosmic.jpg'

export type DeskTheme = {
  id: DeskThemeId
  label: string
  hint: string
  image: string
  wash: string
}

export const DESK_THEMES: DeskTheme[] = [
  {
    id: 'earth',
    label: 'Earth',
    hint: 'Blue marble from altitude',
    image: earth,
    wash: 'rgba(70, 140, 200, 0.12)'
  },
  {
    id: 'space',
    label: 'Space',
    hint: 'Deep starfield & nebula',
    image: space,
    wash: 'rgba(40, 60, 140, 0.14)'
  },
  {
    id: 'nature',
    label: 'Nature',
    hint: 'Misty lakeside forest',
    image: nature,
    wash: 'rgba(90, 160, 100, 0.1)'
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    hint: 'Aurora ribbons at night',
    image: cosmic,
    wash: 'rgba(120, 80, 200, 0.12)'
  }
]

export function themeById(id: DeskThemeId | undefined): DeskTheme {
  return DESK_THEMES.find((t) => t.id === id) ?? DESK_THEMES[2]!
}
