import { greeting } from './encouragement'
import { computeStreak, countedDates, type SavedWorkout } from './streak'
import { nextWorkoutDay, weekDots } from './todayPlan'
import type { ProgramDay } from './types'

// What the home-screen widget shows, worked out from the person's program and saved workouts. The phone app sends this
// summary to the Android widget (src/lib/widgetSync.ts); the widget only draws it.

export interface WidgetDot {
  /** M, T, W ... */
  l: string
  /** A workout counted on this day. */
  d: boolean
  /** Today. */
  t: boolean
}

export interface WidgetData {
  greeting: string
  streakWeeks: number
  /** "NEXT UP · DAY 2" */
  label: string
  /** "Lower Power" */
  name: string
  /** "Legs / Glutes · 4 exercises · 45-55 min" */
  meta: string
  /** Workout days done this week, and planned. */
  done: number
  planned: number
  /** "1 of 4 workouts · 🔥 1 week" */
  caption: string
  dots: WidgetDot[]
  /** Every planned day of the week is done. */
  allDone: boolean
  updatedAt: number
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

export function buildWidgetData(opts: {
  firstName?: string
  days: ProgramDay[]
  programId: string
  saved: SavedWorkout[]
  now?: Date
}): WidgetData {
  const now = opts.now ?? new Date()
  const planned = opts.days.length
  const counted = countedDates(opts.saved)
  const streak = computeStreak(counted, planned, now)
  const done = Math.min(streak.doneThisWeek, planned)
  const nextDay = nextWorkoutDay(opts.saved, opts.programId, opts.days.map((d) => d.day), now)
  const next = opts.days.find((d) => d.day === nextDay)
  const weeks = streak.weeks

  let label: string
  let name: string
  let meta: string
  if (next) {
    const mind = next.exercises.some((e) => e.format === 'yoga' || e.format === 'pilates')
    label = `NEXT UP · DAY ${next.day}`
    name = next.name
    meta = `${titleCase(next.focus)} · ${next.exercises.length} ${mind ? 'moves' : 'exercises'} · ${next.duration}`
  } else {
    label = 'THIS WEEK'
    name = 'All done!'
    meta = 'Great week. Rest up.'
  }

  return {
    greeting: greeting(opts.firstName, now, false),
    streakWeeks: weeks,
    label,
    name,
    meta,
    done,
    planned,
    caption: `${done} of ${planned} ${planned === 1 ? 'workout' : 'workouts'} · 🔥 ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`,
    dots: weekDots(opts.saved, now).map((d) => ({ l: d.label, d: d.done, t: d.isToday })),
    allDone: !next,
    updatedAt: now.getTime(),
  }
}
