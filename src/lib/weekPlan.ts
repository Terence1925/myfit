// Week-by-week targets inside a 12-week block (see programBlock.ts): how hard each week should feel, what to aim for on
// each exercise from what the person logged last time, and the lighter deload week. Everything is worked out from the
// program's start date and the saved workouts, so there is nothing extra to store.
import { BLOCK_WEEKS, DELOAD_ADVICE, TOTAL_WEEKS } from './programBlock'
import { estimated1RM } from './progressiveOverload'
import type { Exercise, ProgramDay, SetLog, WorkoutSession } from './types'
import { toUnit, unitShort, type WeightUnit } from './weightUnit'

export type WeekPhase = 'base' | 'build' | 'push' | 'test' | 'deload'

export interface WeekTarget {
  /** 1 to 13. */
  week: number
  phase: WeekPhase
  /** "Base", "Build", "Push", "Test week" or "Deload week". */
  title: string
  /** Reps to leave in the tank at the end of a set, as text ("3", "1-2"). */
  rir: string
  /** One or two plain sentences about this week. */
  advice: string
  deload: boolean
}

export function weekTarget(week: number): WeekTarget {
  const w = Math.min(TOTAL_WEEKS, Math.max(1, Math.round(week)))
  if (w === TOTAL_WEEKS) return { week: w, phase: 'deload', title: 'Deload week', rir: '4+', advice: DELOAD_ADVICE, deload: true }
  if (w === BLOCK_WEEKS) {
    return {
      week: w,
      phase: 'test',
      title: 'Test week',
      rir: '0-1',
      advice: 'Test week. On your main lifts, work up to your best sets for the target reps with 0 to 1 reps left. Keep the other exercises comfortable. A deload week follows.',
      deload: false,
    }
  }
  if (w <= 2) {
    return { week: w, phase: 'base', title: 'Base', rir: '3', advice: 'Find your starting weights. Stop each set with about 3 reps left. Clean, smooth reps matter more than heavy ones right now.', deload: false }
  }
  if (w <= 4) {
    return { week: w, phase: 'base', title: 'Base', rir: '3', advice: 'Add a little weight, or one more rep, than last time. It is fine to stay at the same weight until a set feels easy. Keep about 3 reps left.', deload: false }
  }
  if (w <= 8) {
    return { week: w, phase: 'build', title: 'Build', rir: '2', advice: 'Add weight or reps when you can. If you cannot, repeat the same weight and chase one more rep. Stop each set with about 2 reps left.', deload: false }
  }
  return { week: w, phase: 'push', title: 'Push', rir: '1-2', advice: 'The hardest stretch of the block. Stop each set with 1 to 2 reps left and keep your form clean.', deload: false }
}

/** The day as it is trained this week: in the deload week about half the sets, and the effort note matches the week. */
export function dayForWeek(day: ProgramDay, target: WeekTarget): ProgramDay {
  return {
    ...day,
    exercises: day.exercises.map((e) => {
      const mindBody = e.format === 'yoga' || e.format === 'pilates'
      if (mindBody) return e
      return {
        ...e,
        sets: target.deload ? Math.max(1, Math.round(e.sets / 2)) : e.sets,
        notes: e.notes ? e.notes.replace(/\b\d(?:[-+]\d)?\+? RIR\b/, `${target.rir} RIR`) : e.notes,
      }
    }),
  }
}

/** How much to add when every set reached the top of the rep range: small jumps (pounds, the unit the log uses). */
export const LOAD_STEP = 2.5

function repRange(reps: string): { low: number; high: number } | null {
  if (/sec|min|pump|fail/i.test(reps)) return null
  const m = reps.match(/(\d+)\s*-\s*(\d+)/)
  if (m) return { low: Number(m[1]), high: Number(m[2]) }
  const one = reps.match(/^\s*(\d+)\s*(reps)?\s*$/i)
  return one ? { low: Number(one[1]), high: Number(one[1]) } : null
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/** The step weights are rounded to: pounds in 5s (2.5 when light), kilograms in 2.5s (1.25 when light). */
const plateRound = (w: number, unit: WeightUnit) => (unit === 'kg' ? (w >= 27 ? 2.5 : 1.25) : w >= 60 ? 5 : 2.5)
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

interface Done {
  date: string
  sets: (SetLog & { weight: number; reps: number })[]
}

function doneSets(sessions: WorkoutSession[], name: string): Done[] {
  const out: Done[] = []
  for (const s of sessions) {
    const log = s.exercises.find((e) => e.name === name)
    if (!log) continue
    const sets = log.sets.filter((x): x is SetLog & { weight: number; reps: number } => x.completed && !!x.weight && !!x.reps && x.weight > 0)
    if (sets.length) out.push({ date: s.date, sets })
  }
  return out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** The aim for an exercise this week, and a line from the coach about it. */
export interface Suggestion {
  aim: string
  coach?: string
  /** The weight (lb) to lift for the work sets, when there is one. Used to work out the warm-up. */
  weight?: number
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * What to aim for on an exercise this week, from what was logged before, said the way a coach would:
 * - training weeks: add 2.5 (lb or kg) when every set reached the top of the rep range (then back to the bottom of the range),
 *   otherwise the same weight and one more rep
 * - missed by a lot: stay once, go down after two misses in a row
 * - three workouts with no progress: a lighter way back up, and what to check
 * - a long break: ease back in
 * - deload week: about half of the usual working weight
 * - nothing logged yet: how to pick a starting weight
 * Timed holds, yoga and Pilates have no weight to suggest.
 */
export function suggestFor(
  sessions: WorkoutSession[],
  exercise: Exercise,
  target: WeekTarget,
  opts: { main?: boolean; now?: Date; unit?: WeightUnit } = {},
): Suggestion | null {
  if (exercise.format === 'yoga' || exercise.format === 'pilates') return null
  const range = repRange(exercise.reps)
  if (!range) return null
  // Saved weights are in pounds; everything below is worked out in the unit the person uses
  const unit = opts.unit ?? 'lbs'
  const u = unitShort(unit)
  // (kilograms are tidied to the nearest 0.5, so a weight saved in pounds still gives plate-friendly numbers)
  const tidy = (w: number) => (unit === 'kg' ? Math.round(w * 2) / 2 : w)
  const history = doneSets(sessions, exercise.name).map((h) => ({ ...h, sets: h.sets.map((x) => ({ ...x, weight: tidy(toUnit(x.weight, unit)) })) }))
  const now = opts.now ?? new Date()

  if (history.length === 0) {
    if (target.deload) return null
    return {
      aim: `Pick a weight that leaves about ${target.rir} reps in the tank on your last set.`,
      coach: 'Write down every set today. Next time this line gives you an exact weight and reps to beat.',
    }
  }

  const last = history[history.length - 1]
  const topWeight = Math.max(...last.sets.map((s) => s.weight))

  if (target.deload) {
    const usual = Math.max(...history.slice(-8).flatMap((h) => h.sets.map((s) => s.weight)))
    const step = plateRound(usual, unit)
    const half = Math.max(step, roundTo(usual * 0.5, step))
    return {
      aim: `Use about ${fmt(half)} ${u}, half of your usual ${fmt(usual)} ${u}. Keep it easy.`,
      coach: 'This week is for recovery. Move well and leave plenty in the tank. You come back stronger for it.',
    }
  }

  const atTop = last.sets.filter((s) => s.weight === topWeight)
  const lastReps = Math.min(...atTop.map((s) => s.reps))
  const was = `Last time: ${fmt(topWeight)} × ${lastReps}.`
  const rangeText = range.low === range.high ? `${range.low}` : `${range.low}-${range.high}`
  const daysAway = Math.floor((now.getTime() - new Date(last.date).getTime()) / DAY_MS)

  // Back after a long break: ease in instead of picking up where it stopped
  if (daysAway >= 28) {
    const step = plateRound(topWeight, unit)
    const restart = Math.max(step, roundTo(topWeight * 0.9, step))
    return {
      weight: restart,
      aim: `Restart at ${fmt(restart)} ${u} × ${range.low}. ${was}`,
      coach: `It has been ${daysAway} days since you trained this. Start a little lighter, then build back up. It comes back faster than you think.`,
    }
  }
  const away = daysAway >= 14 ? `It has been ${daysAway} days since you did this one. Get back on it. ` : ''

  // How the last workout compared with the one before it at this weight
  const before = history[history.length - 2]
  const beforeAtWeight = before?.sets.filter((s) => s.weight === topWeight).map((s) => s.reps)
  const beforeTop = before ? Math.max(...before.sets.map((s) => s.weight)) : 0
  const progressed = !!before && (topWeight > beforeTop || (!!beforeAtWeight?.length && lastReps > Math.min(...beforeAtWeight)))

  // Well below the bottom of the rep range (two or more reps short; one short just means one more rep to find).
  // Once is normal after a jump, so stay; twice in a row means this weight is too heavy for now.
  if (lastReps <= range.low - 2) {
    if (beforeAtWeight && beforeAtWeight.length > 0 && Math.min(...beforeAtWeight) <= range.low - 2) {
      return {
        weight: Math.max(LOAD_STEP, topWeight - 2 * LOAD_STEP),
        aim: `${fmt(topWeight)} was too heavy twice. Drop to ${fmt(Math.max(LOAD_STEP, topWeight - 2 * LOAD_STEP))} ${u} and aim for ${rangeText} reps, then build back up.`,
        coach: `${away}Dropping the weight is not failing. It is how you get past this. Own every rep at the lighter weight, then climb in ${fmt(LOAD_STEP)} ${u} steps.`,
      }
    }
    return {
      weight: topWeight,
      aim: `Stay at ${fmt(topWeight)} ${u} and aim for ${rangeText} reps. ${was}`,
      coach: `${away}A new weight can take a couple of workouts. Rest the full ${exercise.rest}, keep your form clean, and go again.`,
    }
  }

  if (atTop.every((s) => s.reps >= range.high)) {
    return {
      weight: topWeight + LOAD_STEP,
      aim: `Aim for ${fmt(topWeight + LOAD_STEP)} ${u} × ${range.low}. ${was}`,
      coach: `${away}You hit the top of the range on every set. That earns you ${fmt(LOAD_STEP)} ${u}. ${progressed ? 'Progress again and again, keep it going.' : 'Now win those reps back at the new weight.'}`,
    }
  }

  // Stuck: three workouts in a row with no progress. Progress means a better best set (weight and reps together, so
  // switching between two weights still counts). That happens to everyone, so give a way out
  const recent = history.slice(-3)
  if (recent.length === 3) {
    const best = recent.map((h) => Math.max(...h.sets.map((s) => estimated1RM(s.weight, s.reps))))
    if (best[2] <= best[0] && best[2] <= best[1]) {
      const step = plateRound(topWeight, unit)
      const lighter = Math.max(step, roundTo(topWeight * 0.9, step))
      return {
        weight: topWeight,
        aim: `Stuck at ${fmt(topWeight)} ${u} for 3 workouts? That happens. Try ${fmt(lighter)} ${u} × ${range.high} and build back up, or keep ${fmt(topWeight)} ${u} and slow each rep down.`,
        coach: `${away}Before you change the weight, check the usual causes: sleep, eating enough (your calories and protein are in the Nutrition tab), rushing the reps, and short rests. Fix one and go again.`,
      }
    }
  }

  const next = Math.min(range.high, lastReps + 1)
  const coach =
    target.phase === 'test' && opts.main
      ? 'Test week. This is where 12 weeks of work shows. Go for your best clean set.'
      : next === range.high
        ? `${away}One more workout at the top of the range and the weight goes up. Make it count.`
        : progressed
          ? `${away}You moved up last time. Do it again. One more rep than last time is all it takes.`
          : `${away}One more rep than last time. Squeeze out that last rep with good form.`
  return { aim: `Aim for ${fmt(topWeight)} ${u} × ${next}. ${was}`, coach, weight: topWeight }
}
