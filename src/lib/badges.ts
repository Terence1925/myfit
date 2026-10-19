import { computeStreak, countedDates, type SavedWorkout } from './streak'
import { getExerciseHistory } from './progressiveOverload'
import { mondayOf } from './todayPlan'
import type { WorkoutSession } from './types'

// Achievement badges. Every badge is worked out from what the person has already saved (workouts and food days), so
// nothing extra is stored on the server. `badgeStore.ts` remembers which ones the person has seen, to celebrate new ones.

export interface BadgeStats {
  /** Workout days that counted (at least half the sets done, or marked done). */
  workouts: number
  /** The longest run of weeks with most planned workouts done. */
  bestStreakWeeks: number
  /** Times an estimated 1-rep max beat everything before it, over all exercises. */
  records: number
  /** Different days food was logged. */
  foodDays: number
  /** Heaviest weight (lbs) lifted for the barbell bench press, in a ticked set. */
  benchWeight: number
  /** Weeks where every planned workout day was done. */
  perfectWeeks: number
}

export type BadgeGroup = 'workouts' | 'streak' | 'strength' | 'food'
export type BadgeTier = 'bronze' | 'silver' | 'gold'

export interface BadgeDef {
  id: string
  group: BadgeGroup
  title: string
  /** What it takes, in a short sentence. */
  blurb: string
  tier: BadgeTier
  /** The number the person needs to reach. */
  target: number
  /** How far along they are, from the stats. */
  value: (s: BadgeStats) => number
  /** Shown on the picture people share. */
  emoji: string
}

/** 100 kg in pounds (the app logs weights in pounds). */
export const KG100_IN_LBS = 220

export const BADGES: BadgeDef[] = [
  { id: 'first-workout', group: 'workouts', title: 'First workout', blurb: 'Finish your first workout', tier: 'bronze', target: 1, value: (s) => s.workouts, emoji: '💪' },
  { id: 'workouts-10', group: 'workouts', title: '10 workouts', blurb: 'Finish 10 workouts', tier: 'bronze', target: 10, value: (s) => s.workouts, emoji: '🔟' },
  { id: 'workouts-25', group: 'workouts', title: '25 workouts', blurb: 'Finish 25 workouts', tier: 'silver', target: 25, value: (s) => s.workouts, emoji: '🏅' },
  { id: 'workouts-50', group: 'workouts', title: '50 workouts', blurb: 'Finish 50 workouts', tier: 'silver', target: 50, value: (s) => s.workouts, emoji: '🥈' },
  { id: 'workouts-100', group: 'workouts', title: '100 workouts', blurb: 'Finish 100 workouts', tier: 'gold', target: 100, value: (s) => s.workouts, emoji: '🥇' },
  { id: 'perfect-week', group: 'streak', title: 'Perfect week', blurb: 'Do every workout in one week', tier: 'bronze', target: 1, value: (s) => s.perfectWeeks, emoji: '✅' },
  { id: 'streak-2', group: 'streak', title: '2-week streak', blurb: 'Keep a streak for 2 weeks', tier: 'bronze', target: 2, value: (s) => s.bestStreakWeeks, emoji: '🔥' },
  { id: 'streak-4', group: 'streak', title: '4-week streak', blurb: 'Keep a streak for 4 weeks', tier: 'silver', target: 4, value: (s) => s.bestStreakWeeks, emoji: '🔥' },
  { id: 'streak-8', group: 'streak', title: '8-week streak', blurb: 'Keep a streak for 8 weeks', tier: 'gold', target: 8, value: (s) => s.bestStreakWeeks, emoji: '🌋' },
  { id: 'first-record', group: 'strength', title: 'First record', blurb: 'Beat your best on any exercise', tier: 'bronze', target: 1, value: (s) => s.records, emoji: '🏆' },
  { id: 'records-10', group: 'strength', title: 'Record breaker', blurb: 'Set 10 personal records', tier: 'silver', target: 10, value: (s) => s.records, emoji: '⚡' },
  { id: 'bench-100kg', group: 'strength', title: '100 kg bench', blurb: 'Bench press 100 kg (220 lbs)', tier: 'gold', target: KG100_IN_LBS, value: (s) => s.benchWeight, emoji: '🏋️' },
  { id: 'first-meal', group: 'food', title: 'First meal logged', blurb: 'Log your first food', tier: 'bronze', target: 1, value: (s) => s.foodDays, emoji: '🍽️' },
  { id: 'food-7', group: 'food', title: '7 days of food', blurb: 'Log food on 7 different days', tier: 'silver', target: 7, value: (s) => s.foodDays, emoji: '🥗' },
  { id: 'food-30', group: 'food', title: '30 days of food', blurb: 'Log food on 30 different days', tier: 'gold', target: 30, value: (s) => s.foodDays, emoji: '📒' },
]

export const GROUP_LABELS: Record<BadgeGroup, string> = {
  workouts: 'Workouts',
  streak: 'Streaks',
  strength: 'Strength',
  food: 'Food',
}

export function isEarned(def: BadgeDef, stats: BadgeStats): boolean {
  return def.value(stats) >= def.target
}

export function earnedIds(stats: BadgeStats): string[] {
  return BADGES.filter((b) => isEarned(b, stats)).map((b) => b.id)
}

/** Badges earned now that were not in the set the person had already seen. */
export function newlyEarned(seen: string[], stats: BadgeStats): BadgeDef[] {
  const known = new Set(seen)
  return BADGES.filter((b) => isEarned(b, stats) && !known.has(b.id))
}

const BENCH = 'Barbell Bench Press'

/** How many times an estimated 1-rep max beat all the earlier ones for the same exercise. */
export function countRecords(sessions: WorkoutSession[]): number {
  const names = new Set(sessions.flatMap((s) => s.exercises.map((e) => e.name)))
  let total = 0
  for (const name of names) {
    let best = 0
    getExerciseHistory(sessions, name).forEach((point, i) => {
      if (i > 0 && point.estimated1RM > best) total++
      best = Math.max(best, point.estimated1RM)
    })
  }
  return total
}

/** Weeks where every planned day of a program was done (a day counts as in the streak). */
export function countPerfectWeeks(saved: SavedWorkout[], plannedByProgram: Record<string, number>): number {
  const weeks = new Map<string, Set<number>>()
  const byDay = new Map<string, SavedWorkout[]>()
  for (const w of saved) {
    const key = `${w.programId}|${w.day}|${new Date(w.date).toDateString()}`
    byDay.set(key, [...(byDay.get(key) ?? []), w])
  }
  for (const group of byDay.values()) {
    if (countedDates(group).length === 0) continue
    const first = group[0]
    const week = `${first.programId}|${mondayOf(new Date(first.date)).getTime()}`
    weeks.set(week, (weeks.get(week) ?? new Set<number>()).add(first.day))
  }
  let perfect = 0
  for (const [key, days] of weeks) {
    const planned = plannedByProgram[key.split('|')[0]]
    if (planned && days.size >= planned) perfect++
  }
  return perfect
}

export function computeBadgeStats(
  sessions: WorkoutSession[],
  foodDates: string[],
  plannedByProgram: Record<string, number>,
  plannedDays: number,
  now: Date = new Date(),
): BadgeStats {
  const counted = countedDates(sessions)
  const benchWeight = Math.max(
    0,
    ...sessions.flatMap((s) =>
      s.exercises.filter((e) => e.name === BENCH).flatMap((e) => e.sets.filter((x) => x.completed && (x.reps ?? 0) > 0).map((x) => x.weight ?? 0)),
    ),
  )
  return {
    workouts: counted.length,
    bestStreakWeeks: computeStreak(counted, plannedDays, now).best,
    records: countRecords(sessions),
    foodDays: new Set(foodDates).size,
    benchWeight,
    perfectWeeks: countPerfectWeeks(sessions, plannedByProgram),
  }
}

