import { countedDates, type SavedWorkout } from './streak'

// What to show on the "Today" card: which weekdays were trained this week, and which workout day comes next.

/** Midnight on the Monday of the week this moment falls in (local time). */
export function mondayOf(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export interface WeekDot {
  /** 'M', 'T', ... */
  label: string
  /** A workout counted on this day. */
  done: boolean
  isToday: boolean
  /** Later this week. */
  future: boolean
}

const LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Monday to Sunday, marking the days a workout counted. */
export function weekDots(saved: SavedWorkout[], now: Date = new Date()): WeekDot[] {
  const monday = mondayOf(now)
  const counted = countedDates(saved).map((iso) => new Date(iso))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return LABELS.map((label, i) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return {
      label,
      done: counted.some((c) => sameDay(c, day)),
      isToday: sameDay(day, today),
      future: day.getTime() > today.getTime(),
    }
  })
}

/**
 * The next workout day to do: the first day of the program (in order) with no counted workout this week for this program.
 * `null` when every day of the week is already done.
 */
export function nextWorkoutDay(saved: SavedWorkout[], programId: string, dayNumbers: number[], now: Date = new Date()): number | null {
  const monday = mondayOf(now).getTime()
  const thisWeek = saved.filter((s) => s.programId === programId && new Date(s.date).getTime() >= monday)
  const done = new Set<number>()
  for (const n of dayNumbers) {
    if (countedDates(thisWeek.filter((s) => s.day === n)).length > 0) done.add(n)
  }
  return dayNumbers.find((n) => !done.has(n)) ?? null
}

/** Workouts that counted so far this calendar month. */
export function workoutsThisMonth(saved: SavedWorkout[], now: Date = new Date()): number {
  return countedDates(saved).filter((iso) => {
    const d = new Date(iso)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}

/** Sets ticked this week, across everything saved. */
export function setsThisWeek(saved: SavedWorkout[], now: Date = new Date()): number {
  const monday = mondayOf(now).getTime()
  return saved
    .filter((s) => new Date(s.date).getTime() >= monday)
    .reduce((sum, s) => sum + s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed).length, 0), 0)
}

/** The two lines next to the weekly progress ring. */
export function ringText(done: number, needed: number, planned: number): { title: string; note: string } {
  const title = `${done} of ${planned} workout${planned === 1 ? '' : 's'} this week`
  if (done >= planned) return { title, note: 'Perfect week! Every workout done.' }
  if (done >= needed) {
    const left = planned - done
    return { title, note: `Streak secured this week. ${left} more for a perfect week.` }
  }
  const left = needed - done
  return { title, note: `${left} more workout${left === 1 ? '' : 's'} keeps your streak going.` }
}
