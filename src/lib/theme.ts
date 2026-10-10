import * as React from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'myfit_theme'
const listeners = new Set<() => void>()

export function getThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // Storage blocked: fall through to the default.
  }
  return 'system'
}

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function resolveTheme(choice: ThemeChoice): 'light' | 'dark' {
  return choice === 'system' ? (prefersDark() ? 'dark' : 'light') : choice
}

/** Puts the chosen theme on the page. index.html does the same before the app loads, so there is no flash. */
export function applyTheme(choice: ThemeChoice = getThemeChoice()): void {
  const dark = resolveTheme(choice) === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191a1f' : '#f3f4f7')
}

export function setThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    // The theme still changes for this session.
  }
  applyTheme(choice)
  listeners.forEach((l) => l())
}

// Keep "system" in step when the phone switches between light and dark.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemeChoice() === 'system') {
      applyTheme('system')
      listeners.forEach((l) => l())
    }
  })
}

export function useTheme() {
  const choice = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getThemeChoice,
  )
  return { choice, resolved: resolveTheme(choice), setChoice: setThemeChoice }
}
