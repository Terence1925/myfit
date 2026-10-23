// Warm-up sets, the way a coach programs them: only on the heavy lifts that open the workout, worked out from the weight
// the person is about to lift, and never counted as work sets (they are shown, not logged).
import { EXERCISES } from './backend/exerciseLibrary'
import type { Exercise } from './types'
import type { WeekTarget } from './weekPlan'
import { unitShort, type WeightUnit } from './weightUnit'

export interface WarmupRow {
  /** "Empty bar" for the bar on its own, otherwise the weight in pounds. */
  label: string
  weight: number | null
  reps: number
}

export interface WarmupPlan {
  rows: WarmupRow[]
  /** The line under the table. */
  note: string
}

/** Below this the weights are too light to need a ramp: the first work set does the job. */
export const WARMUP_FROM_LB = 60
const BAR = 45

// Per unit: where warm-ups start, the empty bar, the rounding, and where a fourth (90%) set is added
const CFG = {
  lbs: { from: WARMUP_FROM_LB, bar: BAR, round: 5, fourth: 185, tiny: 10 },
  kg: { from: 27, bar: 20, round: 2.5, fourth: 85, tiny: 5 },
} as const

const byName = new Map(EXERCISES.map((e) => [e.name, e]))

/** Heavy barbell, machine and cable lifts. Dumbbell, band and bodyweight moves are warmed up by their first lighter set. */
const HEAVY = /barbell|smith|deadlift|squat|leg press|hack squat|hip thrust|machine|lat pulldown|bench press|overhead press|row/i
const NOT_HEAVY = /dumbbell|band|push-up|pull-up|chin-up|dip|plank|crunch|raise|curl|extension|fly|kickback|pushdown|face pull|lunge|split squat|goblet/i

export function isHeavyLift(name: string): boolean {
  return HEAVY.test(name) && !NOT_HEAVY.test(name)
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const usesBar = (name: string) => /^barbell|^deadlift|^squat|^front squat|^sumo deadlift|^stiff-leg|^romanian/i.test(name)

/**
 * The warm-up for one exercise of the day, or null when it does not need one.
 * - only the first two lifts of the day, and only heavy ones
 * - the second lift for the same muscle as the first is already warm: a short ramp only
 * - with a known work weight (60 lb or more): 40%, 60%, 80% (and 90% from 185 lb), rounded to 5 lb
 * - with no weight yet: how to warm up by feel
 * - no warm-up in the deload week, for timed moves, yoga or Pilates
 */
export function warmupFor(
  exercises: Exercise[],
  index: number,
  workWeight: number | null | undefined,
  target: WeekTarget,
  unit: WeightUnit = 'lbs',
): WarmupPlan | null {
  const cfg = CFG[unit]
  const short = unitShort(unit)
  const ex = exercises[index]
  if (!ex || index > 1 || target.deload) return null
  if (ex.format === 'yoga' || ex.format === 'pilates' || /sec|min|pump/i.test(ex.reps)) return null
  if (!isHeavyLift(ex.name)) return null

  // Same muscle as the lift before it? Then that one already did most of the warming up
  const muscleOf = (name: string) => byName.get(name)?.muscle[0]
  const first = exercises[0]
  const warmAlready = index === 1 && !!first && isHeavyLift(first.name) && muscleOf(first.name) !== undefined && muscleOf(first.name) === muscleOf(ex.name)

  if (!workWeight || workWeight < cfg.from) {
    return {
      rows: [],
      note: warmAlready
        ? 'You are already warm from the lift before. Start your first work set a little lighter than your target.'
        : 'Do 2 or 3 light sets first: an easy weight for 8 reps, then a bit more for 5, then 3 reps close to your work weight. Then start your work sets.',
    }
  }

  const steps = warmAlready
    ? [{ pct: 0.6, reps: 4 }, { pct: 0.8, reps: 2 }]
    : workWeight >= cfg.fourth
      ? [{ pct: 0.4, reps: 8 }, { pct: 0.6, reps: 5 }, { pct: 0.8, reps: 3 }, { pct: 0.9, reps: 1 }]
      : [{ pct: 0.4, reps: 8 }, { pct: 0.6, reps: 5 }, { pct: 0.8, reps: 3 }]

  const rows: WarmupRow[] = []
  for (const { pct, reps } of steps) {
    let weight = roundTo(workWeight * pct, cfg.round)
    if (weight >= workWeight) continue
    if (usesBar(ex.name) && weight <= cfg.bar) {
      // On a barbell the lightest set cannot go below the empty bar
      if (rows.some((r) => r.weight === null)) continue
      rows.push({ label: `Empty bar (${cfg.bar} ${short})`, weight: null, reps: warmAlready ? reps : 10 })
      continue
    }
    if (weight < cfg.tiny) continue
    if (rows.length && rows[rows.length - 1].weight === weight) continue
    rows.push({ label: `${fmt(weight)} ${short}`, weight, reps })
  }
  return { rows, note: `Warm-up sets are not counted in your work sets. Then do your work sets at ${fmt(workWeight)} ${short}.` }
}
