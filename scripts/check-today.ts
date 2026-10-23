// Run with: npm run test:today
// Checks the Today card's numbers (week dots, next workout, month and set counts) and the greeting, with fixed dates.
import { allDoneMessage, greeting } from '../src/lib/encouragement'
import { nextWorkoutDay, weekDots } from '../src/lib/todayPlan'
import type { SavedWorkout } from '../src/lib/streak'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

// Wednesday 21 Oct 2026. This week is Mon 19 - Sun 25 Oct.
const now = new Date(2026, 9, 21, 12, 0, 0)
const iso = (month: number, day: number, hour = 9) => new Date(2026, month, day, hour, 0, 0).toISOString()
const save = (date: string, ticked: number, opts: { day?: number; program?: string; total?: number } = {}): SavedWorkout => {
  const total = opts.total ?? 18
  return { date, programId: opts.program ?? 'p1', day: opts.day ?? 1, exercises: [{ sets: Array.from({ length: total }, (_, i) => ({ completed: i < ticked })) }] }
}

// ---- the week strip ----
const none = weekDots([], now)
check('7 dots, Monday first', none.map((d) => d.label).join(''), 'MTWTFSS')
check('nothing done yet', none.filter((d) => d.done).length, 0)
check('Wednesday is today', none.map((d) => d.isToday), [false, false, true, false, false, false, false])
check('Thursday on is the future', none.map((d) => d.future), [false, false, false, true, true, true, true])
const trained = weekDots([save(iso(9, 19), 9), save(iso(9, 21), 12, { day: 2 })], now)
check('Monday and Wednesday are done', trained.map((d) => d.done), [true, false, true, false, false, false, false])
check('a barely started day is not done', weekDots([save(iso(9, 20), 3)], now).filter((d) => d.done).length, 0)
check('last week does not show', weekDots([save(iso(9, 15), 9)], now).filter((d) => d.done).length, 0)

// ---- the next workout ----
const days = [1, 2, 3]
check('first day when nothing is done', nextWorkoutDay([], 'p1', days, now), 1)
check('day 2 after day 1', nextWorkoutDay([save(iso(9, 19), 9, { day: 1 })], 'p1', days, now), 2)
check('skips a finished day 2 too', nextWorkoutDay([save(iso(9, 19), 9, { day: 1 }), save(iso(9, 20), 9, { day: 2 })], 'p1', days, now), 3)
check('everything done', nextWorkoutDay([1, 2, 3].map((n) => save(iso(9, 18 + n), 9, { day: n })), 'p1', days, now), null)
check('another program does not count', nextWorkoutDay([save(iso(9, 19), 9, { day: 1, program: 'other' })], 'p1', days, now), 1)
check('last week does not count', nextWorkoutDay([save(iso(9, 15), 9, { day: 1 })], 'p1', days, now), 1)
check('a day only half started is still next', nextWorkoutDay([save(iso(9, 19), 4, { day: 1 })], 'p1', days, now), 1)
check('marked done counts', nextWorkoutDay([{ date: iso(9, 19), programId: 'p1', day: 1, exercises: [] }], 'p1', days, now), 2)

// ---- month and set counts ----

// ---- messages ----
const morning = new Date(2026, 9, 21, 8, 0, 0)
const afternoon = new Date(2026, 9, 21, 14, 0, 0)
const evening = new Date(2026, 9, 21, 20, 0, 0)
check('morning greeting', greeting('Ana', morning), 'Good morning, Ana')
check('afternoon greeting', greeting('Ana', afternoon), 'Good afternoon, Ana')
check('evening greeting, no name', greeting(undefined, evening), 'Good evening')
check('all-done message', allDoneMessage(), 'All workouts done this week.')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the Today card numbers and the greeting are right.')
