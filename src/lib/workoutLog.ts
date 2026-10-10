import type { ExerciseLog, ProgramData } from './types'

type Exercises = ProgramData['days'][number]['exercises']

/** A blank log for a day: one row per set (yoga and Pilates moves are ticked off once). */
export function buildLog(exercises: Exercises): ExerciseLog[] {
  return exercises.map((ex) => ({
    name: ex.name,
    sets: Array.from({ length: ex.format === 'yoga' || ex.format === 'pilates' ? 1 : ex.sets }, (_, i) => ({
      setNumber: i + 1,
      weight: null,
      reps: null,
      completed: false,
    })),
  }))
}

/**
 * Builds a log for the day's current exercises, keeping whatever was already entered for the ones that
 * are still there (matched by name). A swapped exercise starts blank; the rest keep their numbers.
 */
export function reconcileLog(exercises: Exercises, previous: ExerciseLog[] | null): ExerciseLog[] {
  const fresh = buildLog(exercises)
  if (!previous) return fresh
  const byName = new Map(previous.map((entry) => [entry.name, entry]))
  return fresh.map((entry) => {
    const old = byName.get(entry.name)
    if (!old) return entry
    return {
      ...entry,
      sets: entry.sets.map((set, i) => (old.sets[i] ? { ...set, ...old.sets[i], setNumber: set.setNumber } : set)),
    }
  })
}

// An unsaved workout is kept on the phone so it survives leaving the app: Android may close or reload
// the app while it is in the background, and anything held only in memory would be lost.
const DRAFT_PREFIX = 'myfit_workout_draft_'
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000

const draftKey = (programId: string, day: number) => `${DRAFT_PREFIX}${programId}_${day}`

export function saveDraft(programId: string, day: number, log: ExerciseLog[]): void {
  try {
    localStorage.setItem(draftKey(programId, day), JSON.stringify({ savedAt: Date.now(), log }))
  } catch {
    // Storage full or blocked — the in-memory log still works.
  }
}

export function loadDraft(programId: string, day: number): ExerciseLog[] | null {
  try {
    const raw = localStorage.getItem(draftKey(programId, day))
    if (!raw) return null
    const draft = JSON.parse(raw) as { savedAt?: number; log?: ExerciseLog[] }
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS || !Array.isArray(draft.log)) return null
    return draft.log
  } catch {
    return null
  }
}

export function clearDraft(programId: string, day: number): void {
  try {
    localStorage.removeItem(draftKey(programId, day))
  } catch {
    // Nothing to clear.
  }
}

// Where the person was in a program (which tab, which day), so coming back lands them in the same place.
const VIEW_PREFIX = 'myfit_view_'
const VIEW_MAX_AGE_MS = 12 * 60 * 60 * 1000

export function loadView(programId: string): { tab: string; day: number } | null {
  try {
    const raw = localStorage.getItem(VIEW_PREFIX + programId)
    if (!raw) return null
    const view = JSON.parse(raw) as { savedAt?: number; tab?: string; day?: number }
    if (!view.savedAt || Date.now() - view.savedAt > VIEW_MAX_AGE_MS) return null
    if (typeof view.tab !== 'string' || typeof view.day !== 'number') return null
    return { tab: view.tab, day: view.day }
  } catch {
    return null
  }
}

export function saveView(programId: string, tab: string, day: number): void {
  try {
    localStorage.setItem(VIEW_PREFIX + programId, JSON.stringify({ savedAt: Date.now(), tab, day }))
  } catch {
    // Not worth interrupting anything over.
  }
}
