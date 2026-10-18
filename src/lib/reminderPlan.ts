import { weekdaysFor } from './backend/mindBodyStyles'
import type { ProgramDay } from './types'

// The pure part of the workout reminders (no phone plugins), so it can be tested anywhere. See workoutReminder.ts.

export const DEFAULT_REMINDER_TIME = '18:00'
export const ID_BASE = 4200
export const HORIZON_DAYS = 14

/** "18:00" -> "6:00 PM" */
export function formatReminderTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`
}

export interface PlannedReminder {
  id: number
  at: Date
  title: string
  body: string
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Which reminders to schedule. The first training day of the program goes on the first weekday of the plan, and so on
 * (3 days = Mon/Wed/Fri, 4 = Mon/Tue/Thu/Fri, 5 = Mon-Fri, 6 = Mon-Sat, the same weekdays the yoga and Pilates plans use).
 * Pure, so it can be tested without a phone.
 */
export function planReminders(opts: {
  now: Date
  days: ProgramDay[]
  time: string
  doneToday: boolean
}): PlannedReminder[] {
  const { now, days, time, doneToday } = opts
  if (days.length === 0) return []
  const schedule = weekdaysFor(days.length)
  const [hour, minute] = time.split(':').map(Number)
  const out: PlannedReminder[] = []
  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0)
    if (at.getTime() <= now.getTime() + 30 * 1000) continue
    if (offset === 0 && doneToday) continue
    const index = schedule.indexOf(WEEKDAY_NAMES[at.getDay()])
    if (index === -1) continue
    const day = days[index]
    const mindBody = day.exercises[0]?.format === 'yoga' || day.exercises[0]?.format === 'pilates'
    const count = day.exercises.length
    const unit = day.exercises[0]?.format === 'yoga' ? 'poses' : day.exercises[0]?.format === 'pilates' ? 'moves' : 'exercises'
    out.push({
      id: ID_BASE + out.length,
      at,
      title: 'Time to train',
      body: mindBody
        ? `Today: ${day.focus}. ${count} ${unit}, about ${day.duration}.`
        : `Today: ${day.name}. ${count} ${unit}, about ${day.duration}.`,
    })
  }
  return out
}

