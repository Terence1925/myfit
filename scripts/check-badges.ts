// Run with: npm run test:badges
// Checks the badges (what earns them, what counts as new) and the weekly recap (which week, the numbers, the wording).
import { BADGES, computeBadgeStats, countPerfectWeeks, countRecords, earnedIds, isEarned, newlyEarned, type BadgeStats } from '../src/lib/badges'
import { buildRecap, dateKey, recapRange } from '../src/lib/weeklyRecap'
import type { FoodLogEntry, WorkoutSession } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const iso = (month: number, day: number, hour = 9) => new Date(2026, month, day, hour, 0, 0).toISOString()
const session = (date: string, opts: { day?: number; program?: string; name?: string; weight?: number; reps?: number; sets?: number } = {}): WorkoutSession => {
  const sets = opts.sets ?? 6
  return {
    id: `${date}-${opts.day ?? 1}`, userId: 'u', programId: opts.program ?? 'p1', day: opts.day ?? 1, dayName: 'Day', date,
    exercises: [{ name: opts.name ?? 'Barbell Squat', sets: Array.from({ length: sets }, (_, i) => ({ setNumber: i + 1, weight: opts.weight ?? 100, reps: opts.reps ?? 5, completed: true })) }],
  }
}
const stats = (over: Partial<BadgeStats> = {}): BadgeStats => ({ workouts: 0, bestStreakWeeks: 0, records: 0, foodDays: 0, benchWeight: 0, perfectWeeks: 0, ...over })

// ---- which badges a set of numbers earns ----
check('nothing earned at the start', earnedIds(stats()), [])
check('first workout', earnedIds(stats({ workouts: 1 })), ['first-workout'])
check('10 workouts also keeps the first', earnedIds(stats({ workouts: 10 })), ['first-workout', 'workouts-10'])
check('100 workouts earns all five', earnedIds(stats({ workouts: 100 })).length, 5)
check('streak badges', earnedIds(stats({ bestStreakWeeks: 4 })), ['streak-2', 'streak-4'])
check('bench 219 lbs is not 100 kg', earnedIds(stats({ benchWeight: 219 })), [])
check('bench 220 lbs is 100 kg', earnedIds(stats({ benchWeight: 220 })), ['bench-100kg'])
check('food badges', earnedIds(stats({ foodDays: 7 })), ['first-meal', 'food-7'])
check('ids are unique', new Set(BADGES.map((b) => b.id)).size, BADGES.length)
check('isEarned matches the target', isEarned(BADGES[1], stats({ workouts: 9 })), false)

// ---- what is new ----
check('new = earned and not yet seen', newlyEarned(['first-workout'], stats({ workouts: 10 })).map((b) => b.id), ['workouts-10'])
check('nothing new when all seen', newlyEarned(['first-workout'], stats({ workouts: 1 })), [])

// ---- the numbers behind the badges ----
const three = [session(iso(8, 7)), session(iso(8, 14)), session(iso(8, 21))]
check('records: same weight is not a record', countRecords(three), 0)
check('records: heavier is one', countRecords([session(iso(8, 7), { weight: 100 }), session(iso(8, 14), { weight: 110 }), session(iso(8, 21), { weight: 110 })]), 1)
check('records: two in a row', countRecords([session(iso(8, 7), { weight: 100 }), session(iso(8, 14), { weight: 110 }), session(iso(8, 21), { weight: 120 })]), 2)
check('records: each exercise on its own', countRecords([session(iso(8, 7), { name: 'A', weight: 50 }), session(iso(8, 14), { name: 'B', weight: 200 }), session(iso(8, 21), { name: 'A', weight: 55 })]), 1)

// A week with all 3 planned days done is perfect; 2 of 3 is not
const week = [session(iso(9, 19), { day: 1 }), session(iso(9, 20), { day: 2 }), session(iso(9, 21), { day: 3 })]
check('perfect week', countPerfectWeeks(week, { p1: 3 }), 1)
check('2 of 3 is not perfect', countPerfectWeeks(week.slice(0, 2), { p1: 3 }), 0)
check('a day done twice does not count twice', countPerfectWeeks([week[0], week[0], week[1]], { p1: 3 }), 0)
check('unknown program is never perfect', countPerfectWeeks(week, {}), 0)

const now = new Date(2026, 9, 28, 12, 0, 0)
const full = computeBadgeStats(
  [session(iso(9, 5), { name: 'Barbell Bench Press', weight: 200 }), session(iso(9, 12), { name: 'Barbell Bench Press', weight: 225 })],
  ['2026-10-01', '2026-10-01', '2026-10-02'],
  { p1: 3 },
  3,
  now,
)
check('stats: workouts', full.workouts, 2)
check('stats: bench weight', full.benchWeight, 225)
check('stats: food days are distinct', full.foodDays, 2)
check('stats: one record', full.records, 1)

// ---- the weekly recap ----
check('recap on a Wednesday covers last week', [dateKey(recapRange(new Date(2026, 9, 21, 12)).start), dateKey(recapRange(new Date(2026, 9, 21, 12)).end), recapRange(new Date(2026, 9, 21, 12)).current], ['2026-10-12', '2026-10-18', false])
check('recap on a Monday covers last week', dateKey(recapRange(new Date(2026, 9, 19, 8)).start), '2026-10-12')
check('recap on a Sunday covers this week', [dateKey(recapRange(new Date(2026, 9, 25, 20)).start), recapRange(new Date(2026, 9, 25, 20)).current], ['2026-10-19', true])

const range = recapRange(new Date(2026, 9, 21, 12)) // 12 - 18 Oct
const food = (date: string, kcal: number): FoodLogEntry => ({ id: date + kcal, userId: 'u', date, meal: 'lunch', name: 'x', serving: '1', servings: 1, kcal, proteinG: 0, carbsG: 0, fatG: 0, createdAt: date })
const weekSessions = [
  session(iso(9, 5), { weight: 100 }), // before the week
  session(iso(9, 12), { day: 1, weight: 105 }),
  session(iso(9, 14), { day: 2, weight: 100 }),
  session(iso(9, 16), { day: 3, weight: 100 }),
  session(iso(9, 19), { day: 1, weight: 100 }), // after the week
]
const foods = [food('2026-10-12', 1800), food('2026-10-12', 200), food('2026-10-13', 2200), food('2026-10-14', 2000), food('2026-10-20', 999)]
const r = buildRecap(weekSessions, foods, range, 3)
check('recap label', r.label, 'Oct 12 - Oct 18')
check('recap workouts', r.workouts, 3)
check('recap sets (3 days x 6 sets)', r.sets, 18)
check('recap food days (the day after the week is left out)', r.foodDays, 3)
check('recap average calories per logged day', r.avgKcal, Math.round((1800 + 200 + 2200 + 2000) / 3))
check('recap headline', r.headline, 'You trained 3 times and logged 3 days of food.')
check('recap volume', r.volume, 6 * 5 * 105 + 6 * 5 * 100 + 6 * 5 * 100)
check('recap record: the 105 lb day beat the 100 lb day before', r.records, 1)
check('record note', r.note.startsWith('A new personal record'), true)

const quiet = buildRecap([], [], range, 3)
check('quiet week headline is kind', quiet.headline, 'A fresh start is waiting for you.')
check('quiet week note encourages', quiet.note.includes('whenever you are'), true)
const oneDay = buildRecap([session(iso(9, 13))], [], range, 3)
check('one workout, no food', oneDay.headline, 'You trained once.')
check('perfect week note', buildRecap([session(iso(9, 12), { day: 1 }), session(iso(9, 13), { day: 2 }), session(iso(9, 14), { day: 3 })], [], range, 3).note, 'Every planned workout done. A perfect week!')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: badges are earned and detected as new correctly, and the weekly recap covers the right week with the right numbers.')
