import type { WorkoutSession } from './types'

// "You lifted X more than last month": the weight lifted (weight x reps of every ticked set, in pounds) so far this month,
// compared with the same stretch of last month, so the unfinished month is not judged against a whole one.

export interface LiftedComparison {
  /** Pounds lifted from the 1st of this month until now. */
  thisMonth: number
  /** Pounds lifted over the same number of days at the start of last month. */
  lastMonthSameSpan: number
  /** Whole percent more (positive) or less (negative) than last month; null when last month has nothing to compare with. */
  percent: number | null
  /** A friendly sentence, or null when nothing has been lifted yet this month. Never discouraging. */
  message: string | null
}

function volumeBetween(sessions: WorkoutSession[], from: number, to: number): number {
  let total = 0
  for (const s of sessions) {
    const t = new Date(s.date).getTime()
    if (!(t >= from && t < to)) continue
    for (const e of s.exercises) for (const x of e.sets) if (x.completed) total += (x.weight ?? 0) * (x.reps ?? 0)
  }
  return Math.round(total)
}

export const formatLbs = (n: number) => n.toLocaleString('en-US')

export function liftedComparison(sessions: WorkoutSession[], now: Date = new Date()): LiftedComparison {
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() // through the end of today
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const lastEnd = Math.min(lastStart + (end - thisStart), thisStart)

  const thisMonth = volumeBetween(sessions, thisStart, end)
  const lastMonthSameSpan = volumeBetween(sessions, lastStart, lastEnd)
  const percent = lastMonthSameSpan > 0 ? Math.round(((thisMonth - lastMonthSameSpan) / lastMonthSameSpan) * 100) : null

  let message: string | null = null
  if (thisMonth > 0) {
    if (percent === null) message = `${formatLbs(thisMonth)} lbs lifted this month. A great start!`
    else if (percent > 0) message = `${formatLbs(thisMonth)} lbs lifted this month, ${percent}% more than this time last month.`
    else if (percent === 0) message = `${formatLbs(thisMonth)} lbs lifted this month, right on pace with last month.`
    else message = `${formatLbs(thisMonth)} lbs lifted this month so far. Every set counts!`
  }
  return { thisMonth, lastMonthSameSpan, percent, message }
}
