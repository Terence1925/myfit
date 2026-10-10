import * as React from 'react'
import { cancelRestAlert, scheduleRestAlert } from './restTimer'

export interface RestState {
  endsAt: number
  totalSeconds: number
  /** Short text for what's next, e.g. "start set 2". */
  nextLabel: string
  exerciseName: string
  /** Set when the phone alert could not be scheduled, so the bar can say so. */
  alertProblem?: string
  /** True when the fix is switching on Android's "Alarms & reminders" for this app. */
  needsExactPermission?: boolean
}

// The running rest lives here (not inside a screen) so it keeps going when the user switches tabs or
// pages, and it's saved to localStorage so the bar comes back if Android restarts the app in the
// background. The phone-side alarm is independent of all this and fires regardless.
const STORAGE_KEY = 'myfit_rest_timer'
const FORGET_AFTER_MS = 30 * 60 * 1000

function load(): RestState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as RestState
    if (typeof saved.endsAt !== 'number' || Date.now() - saved.endsAt > FORGET_AFTER_MS) return null
    return saved
  } catch {
    return null
  }
}

function save(value: RestState | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked — the timer still works for this session.
  }
}

let state: RestState | null = load()
const listeners = new Set<() => void>()

function set(next: RestState | null) {
  state = next
  save(next)
  listeners.forEach((l) => l())
}

function alertText(s: RestState) {
  return { title: `Rest over — ${s.nextLabel}`, body: s.exerciseName }
}

function schedule(next: RestState) {
  const { title, body } = alertText(next)
  void scheduleRestAlert(next.endsAt, title, body).then((result) => {
    // Only if this is still the same rest (it may have been skipped or extended meanwhile).
    if (result.problem && state && state.endsAt === next.endsAt) {
      set({ ...state, alertProblem: result.problem, needsExactPermission: result.needsExactPermission })
    }
  })
}

export function startRestTimer(next: RestState) {
  set(next)
  schedule(next)
}

export function addRestTime() {
  if (!state) return
  const next = {
    ...state,
    endsAt: Math.max(state.endsAt, Date.now()) + 15_000,
    totalSeconds: state.totalSeconds + 15,
    alertProblem: undefined,
    needsExactPermission: undefined,
  }
  set(next)
  schedule(next)
}

/** Ends the rest: removes the bar, cancels the pending alarm, and silences one that's already ringing. */
export function stopRestTimer() {
  set(null)
  void cancelRestAlert()
}

export function useRestTimer(): RestState | null {
  return React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
