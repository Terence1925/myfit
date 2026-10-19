import type { ExerciseLog, SetLog, WorkoutSession } from './types'

export interface ExerciseHistoryPoint {
  date: string
  topWeight: number
  topReps: number
  estimated1RM: number
  totalVolume: number
}

/** Epley formula — the standard estimated-1-rep-max calculation used across the fitness industry. */
export function estimated1RM(weight: number, reps: number): number {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0
  if (reps === 1) return Math.round(weight)
  return Math.round(weight * (1 + reps / 30))
}

/** Builds a chronological per-session history for one exercise, across every program the user has ever run. */
export function getExerciseHistory(sessions: WorkoutSession[], exerciseName: string): ExerciseHistoryPoint[] {
  const points: ExerciseHistoryPoint[] = []

  for (const session of sessions) {
    const exerciseLog = session.exercises.find((e) => e.name === exerciseName)
    if (!exerciseLog) continue

    const completedSets = exerciseLog.sets.filter(
      (s): s is SetLog & { weight: number; reps: number } => s.completed && !!s.weight && !!s.reps,
    )
    if (completedSets.length === 0) continue

    let topSet = completedSets[0]
    let topE1RM = estimated1RM(topSet.weight, topSet.reps)
    let totalVolume = 0

    for (const s of completedSets) {
      totalVolume += s.weight * s.reps
      const e1rm = estimated1RM(s.weight, s.reps)
      if (e1rm > topE1RM) {
        topE1RM = e1rm
        topSet = s
      }
    }

    points.push({
      date: session.date,
      topWeight: topSet.weight,
      topReps: topSet.reps,
      estimated1RM: topE1RM,
      totalVolume,
    })
  }

  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function lastSessionHint(sessions: WorkoutSession[], exerciseName: string): string | null {
  const history = getExerciseHistory(sessions, exerciseName)
  if (history.length === 0) return null
  const last = history[history.length - 1]
  return `Last time: ${last.topWeight} × ${last.topReps}`
}

/**
 * Exercises in a workout that was just logged where an estimated 1-rep max beats everything saved before.
 * A first-ever log of an exercise is not a "record" (nothing to beat yet).
 */
export function findPersonalRecords(previous: WorkoutSession[], log: ExerciseLog[]): string[] {
  const records: string[] = []
  for (const ex of log) {
    const best = Math.max(0, ...ex.sets.filter((s) => s.completed).map((s) => estimated1RM(s.weight ?? 0, s.reps ?? 0)))
    if (best <= 0) continue
    const before = getExerciseHistory(previous, ex.name)
    if (before.length === 0) continue
    if (best > Math.max(...before.map((h) => h.estimated1RM))) records.push(ex.name)
  }
  return records
}

export function isLatestAPR(history: ExerciseHistoryPoint[]): boolean {
  if (history.length < 2) return false
  const latest = history[history.length - 1]
  const priorBest = Math.max(...history.slice(0, -1).map((h) => h.estimated1RM))
  return latest.estimated1RM > priorBest
}
