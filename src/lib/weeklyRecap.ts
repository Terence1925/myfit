import { computeStreak, countedDates, neededPerWeek } from './streak'
import { countRecords } from './badges'
import { mondayOf } from './todayPlan'
import type { FoodLogEntry, WorkoutSession } from './types'

// The weekly recap: a short, positive summary of one Monday-to-Sunday week, made to be screenshotted and shared.

export interface WeekRange {
  /** Monday 00:00 (local). */
  start: Date
  /** The Sunday of that week, 00:00 (local). */
  end: Date
  /** True when this is the week still in progress (only on a Sunday). */
  current: boolean
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Which week the recap covers: on a Sunday, the week that is just ending; any other day, the week that finished before it.
 * (So a recap is always there to read, and it is never a week with days still to come.)
 */
export function recapRange(now: Date = new Date()): WeekRange {
  const monday = mondayOf(now)
  if (now.getDay() === 0) return { start: monday, end: addDays(monday, 6), current: true }
  const start = addDays(monday, -7)
  return { start, end: addDays(start, 6), current: false }
}

export interface Recap {
  /** "Oct 12 - Oct 18" */
  label: string
  from: string
  to: string
  workouts: number
  planned: number
  sets: number
  /** Total weight lifted in ticked sets (weight x reps, in lbs). */
  volume: number
  /** Personal records set during the week. */
  records: number
  foodDays: number
  /** Average calories on the days food was logged (0 when none). */
  avgKcal: number
  streakWeeks: number
  /** One friendly sentence, e.g. "You trained 4 times and logged 6 days of food." */
  headline: string
  /** A second line that celebrates or encourages. */
  note: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const label = (a: Date, b: Date) => `${MONTHS[a.getMonth()]} ${a.getDate()} - ${MONTHS[b.getMonth()]} ${b.getDate()}`
const times = (n: number) => (n === 1 ? 'once' : `${n} times`)

export function buildRecap(
  sessions: WorkoutSession[],
  food: FoodLogEntry[],
  range: WeekRange,
  plannedDays: number,
): Recap {
  const startMs = range.start.getTime()
  const endMs = addDays(range.end, 1).getTime()
  const inWeek = sessions.filter((s) => {
    const t = new Date(s.date).getTime()
    return t >= startMs && t < endMs
  })
  const before = sessions.filter((s) => new Date(s.date).getTime() < startMs)
  const upTo = sessions.filter((s) => new Date(s.date).getTime() < endMs)

  const workouts = countedDates(inWeek).length
  let sets = 0
  let volume = 0
  for (const s of inWeek)
    for (const e of s.exercises)
      for (const x of e.sets)
        if (x.completed) {
          sets++
          volume += (x.weight ?? 0) * (x.reps ?? 0)
        }

  // A record set this week: counted over everything up to the end of the week, minus what was counted before it
  const records = Math.max(0, countRecords(upTo) - countRecords(before))

  const from = dateKey(range.start)
  const to = dateKey(range.end)
  const weekFood = food.filter((e) => e.date >= from && e.date <= to)
  const days = new Set(weekFood.map((e) => e.date))
  const kcal = weekFood.reduce((sum, e) => sum + e.kcal, 0)
  const avgKcal = days.size > 0 ? Math.round(kcal / days.size) : 0

  const streakWeeks = computeStreak(countedDates(upTo), plannedDays, addDays(range.end, 0)).weeks
  const needed = neededPerWeek(plannedDays)

  const parts: string[] = []
  if (workouts > 0) parts.push(`trained ${times(workouts)}`)
  if (days.size > 0) parts.push(`logged ${days.size} ${days.size === 1 ? 'day' : 'days'} of food`)
  const headline =
    parts.length === 2
      ? `You ${parts[0]} and ${parts[1]}.`
      : parts.length === 1
        ? `You ${parts[0]}.`
        : 'A fresh start is waiting for you.'

  let note: string
  if (records > 0) note = `${records === 1 ? 'A new personal record' : `${records} new personal records`}. You are getting stronger.`
  else if (workouts >= needed && streakWeeks > 1) note = `${streakWeeks} weeks in a row. Keep that streak going!`
  else if (workouts >= plannedDays && plannedDays > 0) note = 'Every planned workout done. A perfect week!'
  else if (workouts > 0) note = 'Every workout counts. Nice work.'
  else note = 'Your plan is ready whenever you are. One workout is all it takes to start.'

  return { label: label(range.start, range.end), from, to, workouts, planned: plannedDays, sets, volume: Math.round(volume), records, foodDays: days.size, avgKcal, streakWeeks, headline, note }
}
