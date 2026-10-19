// Run with: npm run test:today
// Checks the Today card's numbers (week dots, next workout, month and set counts), the personal-record check and the
// English / Taglish messages, with fixed dates.
import { allDoneMessage, doneMessage, greeting, pepTalk, recordMessage } from '../src/lib/encouragement'
import { findPersonalRecords } from '../src/lib/progressiveOverload'
import { nextWorkoutDay, setsThisWeek, weekDots, workoutsThisMonth } from '../src/lib/todayPlan'
import type { SavedWorkout } from '../src/lib/streak'
import type { WorkoutSession } from '../src/lib/types'

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
check('workouts this month', workoutsThisMonth([save(iso(9, 2), 9), save(iso(9, 19), 9), save(iso(8, 29), 9)], now), 2)
check('sets this week', setsThisWeek([save(iso(9, 19), 5), save(iso(9, 20), 4), save(iso(9, 12), 8)], now), 9)

// ---- personal records ----
const session = (date: string, weight: number, reps: number): WorkoutSession => ({
  id: date, userId: 'u', programId: 'p1', day: 1, dayName: 'Day 1', date,
  exercises: [{ name: 'Barbell Bench Press', sets: [{ setNumber: 1, weight, reps, completed: true }] }],
})
const log = (weight: number, reps: number, completed = true) => [{ name: 'Barbell Bench Press', sets: [{ setNumber: 1, weight, reps, completed }] }]
const before = [session(iso(8, 1), 100, 5), session(iso(8, 8), 110, 5)]
check('heavier than ever is a record', findPersonalRecords(before, log(120, 5)), ['Barbell Bench Press'])
check('the same is not a record', findPersonalRecords(before, log(110, 5)), [])
check('lighter is not a record', findPersonalRecords(before, log(90, 5)), [])
check('more reps at the same weight is a record', findPersonalRecords(before, log(110, 8)), ['Barbell Bench Press'])
check('first time ever is not a record', findPersonalRecords([], log(120, 5)), [])
check('an unticked set does not count', findPersonalRecords(before, log(200, 5, false)), [])
check('no weight or reps does not count', findPersonalRecords(before, [{ name: 'Barbell Bench Press', sets: [{ setNumber: 1, weight: null, reps: null, completed: true }] }]), [])

// ---- messages ----
const morning = new Date(2026, 9, 21, 8, 0, 0)
const afternoon = new Date(2026, 9, 21, 14, 0, 0)
const evening = new Date(2026, 9, 21, 20, 0, 0)
check('English morning', greeting('Ana', morning, false), 'Good morning, Ana')
check('English afternoon', greeting('Ana', afternoon, false), 'Good afternoon, Ana')
check('English evening, no name', greeting(undefined, evening, false), 'Good evening')
check('Taglish morning', greeting('Ana', morning, true), 'Magandang umaga, Ana')
check('Taglish evening', greeting('Ana', evening, true), 'Magandang gabi, Ana')
check('the pep talk is steady within a day', pepTalk(morning, true), pepTalk(evening, true))
check('the pep talk differs by language', pepTalk(morning, true) !== pepTalk(morning, false), true)
check('English done message', doneMessage(0, false).title, 'Workout done!')
check('Taglish done message', doneMessage(0, true).title, 'Tapos na ang workout!')
check('record message names the exercise', recordMessage('Squat', false).subtitle.startsWith('Squat'), true)
check('all-done message by language', [allDoneMessage(false), allDoneMessage(true)].every((m) => m.length > 10), true)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the Today card numbers, the personal-record check and the English / Taglish messages are right.')
