// The weekly streak: how many weeks in a row a person did "most" of their planned workouts.
// A week (Monday to Sunday, in the phone's own time zone) counts when they finish at least two thirds of their planned
// days, rounded up (3 planned days: 2, 4 planned: 3, 5 planned: 4, 6 planned: 4). Counting weeks and not days means one
// missed day does not wipe out their progress. The week still in progress never breaks the streak: it only adds to it once
// they have done enough, and it only ends when a whole week finishes without enough workouts.

const DAY_MS = 24 * 60 * 60 * 1000

/** A workout day counts once this share of its sets is done (all the saves from that day add up). A day marked done always counts. */
export const DAY_COUNTS_AT = 0.5

/** The parts of a saved workout these helpers need. */
export interface SavedWorkout {
  date: string
  programId: string
  day: number
  exercises: { sets: { completed: boolean }[] }[]
}

export interface DayProgress {
  /** Sets ticked, across every save for this day. */
  done: number
  /** Sets the day has in total. */
  planned: number
  /** The person tapped "Mark as done" (a save with no sets). */
  markedDone: boolean
  /** Enough of the day is done for it to count toward the streak. */
  counts: boolean
}

/** Adds up the saves of one workout day. Saving exercise by exercise (several saves in a day) is fine: the sets are added together. */
export function dayProgress(saves: SavedWorkout[]): DayProgress {
  let done = 0
  let planned = 0
  let markedDone = false
  for (const w of saves) {
    if (w.exercises.length === 0) {
      markedDone = true
      continue
    }
    const total = w.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    planned = Math.max(planned, total)
    done += w.exercises.reduce((sum, e) => sum + e.sets.filter((x) => x.completed).length, 0)
  }
  done = Math.min(done, planned)
  const counts = markedDone || (planned > 0 && done >= Math.ceil(planned * DAY_COUNTS_AT))
  return { done, planned, markedDone, counts }
}

const localDay = (iso: string) => new Date(iso).toDateString()

/** The days that count toward the streak: one ISO date for each workout day (same date, program and day number) that is far enough along. */
export function countedDates(saved: SavedWorkout[]): string[] {
  const groups = new Map<string, SavedWorkout[]>()
  for (const w of saved) {
    if (Number.isNaN(new Date(w.date).getTime())) continue
    const key = `${localDay(w.date)}|${w.programId}|${w.day}`
    groups.set(key, [...(groups.get(key) ?? []), w])
  }
  const out: string[] = []
  for (const group of groups.values()) if (dayProgress(group).counts) out.push(group[0].date)
  return out
}

export interface HistoryRow extends DayProgress {
  date: string
}

/** One row per day for the session history, with the day's sets added up (newest first). */
export function historyRows(saved: SavedWorkout[]): HistoryRow[] {
  const groups = new Map<string, SavedWorkout[]>()
  for (const w of saved) {
    const key = localDay(w.date)
    groups.set(key, [...(groups.get(key) ?? []), w])
  }
  return [...groups.values()]
    .map((group) => ({ date: group.map((g) => g.date).sort().reverse()[0], ...dayProgress(group) }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** How many workouts a person must do in a week for it to count. */
export function neededPerWeek(plannedDays: number): number {
  return Math.max(1, Math.ceil((Math.max(1, plannedDays) * 2) / 3))
}

/** Midnight on the Monday of the week this moment falls in, in local time. */
function weekStart(d: Date): number {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const sinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - sinceMonday)
  return start.getTime()
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export interface StreakInfo {
  /** Weeks in a row that count, ending with this week (if it already counts) or last week. */
  weeks: number
  /** The longest run ever. */
  best: number
  /** Different days they trained this week. */
  doneThisWeek: number
  /** How many they need this week for it to count. */
  needed: number
  thisWeekCounts: boolean
}

/** `sessionDates` are the ISO dates of saved workouts; two on the same day count once. */
export function computeStreak(sessionDates: string[], plannedDays: number, now: Date = new Date()): StreakInfo {
  const needed = neededPerWeek(plannedDays)
  const daysPerWeek = new Map<number, Set<string>>()
  for (const iso of sessionDates) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) continue
    const key = weekStart(d)
    const set = daysPerWeek.get(key) ?? new Set<string>()
    set.add(dayKey(d))
    daysPerWeek.set(key, set)
  }
  const counts = (weekKey: number) => (daysPerWeek.get(weekKey)?.size ?? 0) >= needed

  const thisWeek = weekStart(now)
  const doneThisWeek = daysPerWeek.get(thisWeek)?.size ?? 0
  const thisWeekCounts = doneThisWeek >= needed

  // Current streak: go back one week at a time. Weeks are 7 days apart; use Date math so daylight saving cannot skew it.
  let weeks = 0
  let cursor = new Date(thisWeek)
  if (!thisWeekCounts) cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7)
  while (counts(cursor.getTime())) {
    weeks++
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7)
  }

  // Best run: look through every week that has workouts
  let best = 0
  const starts = [...daysPerWeek.keys()].sort((a, b) => a - b)
  let run = 0
  let previous: number | null = null
  for (const start of starts) {
    if (!counts(start)) {
      run = 0
      previous = null
      continue
    }
    const gapWeeks = previous === null ? 1 : Math.round((start - previous) / (7 * DAY_MS))
    run = gapWeeks === 1 ? run + 1 : 1
    best = Math.max(best, run)
    previous = start
  }

  return { weeks, best: Math.max(best, weeks), doneThisWeek, needed, thisWeekCounts }
}
