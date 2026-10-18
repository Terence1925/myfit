// Run with: npm run test:streak
// Checks the weekly streak rules and the reminder schedule with fixed dates (no phone needed).
import { computeStreak, countedDates, dayProgress, historyRows, neededPerWeek, type SavedWorkout } from '../src/lib/streak'
import { planReminders } from '../src/lib/reminderPlan'
import type { ProgramDay } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

// ---- how many workouts a week must have ----
check('needed for 2 planned days', neededPerWeek(2), 2)
check('needed for 3 planned days', neededPerWeek(3), 2)
check('needed for 4 planned days', neededPerWeek(4), 3)
check('needed for 5 planned days', neededPerWeek(5), 4)
check('needed for 6 planned days', neededPerWeek(6), 4)
check('needed for 7 planned days', neededPerWeek(7), 5)

// Wednesday 21 Oct 2026. Weeks (Mon-Sun): 5-11 Oct, 12-18 Oct, 19-25 Oct (this week).
const now = new Date(2026, 9, 21, 12, 0, 0)
const d = (month: number, day: number, hour = 9) => new Date(2026, month, day, hour, 0, 0).toISOString()

// ---- nothing yet ----
check('no workouts', computeStreak([], 3, now), { weeks: 0, best: 0, doneThisWeek: 0, needed: 2, thisWeekCounts: false })

// ---- this week only, not enough yet: no streak yet, and nothing is broken ----
check('1 of 2 this week', computeStreak([d(9, 19)], 3, now).weeks, 0)
check('1 of 2 this week (done count)', computeStreak([d(9, 19)], 3, now).doneThisWeek, 1)

// ---- last week counted, this week still in progress: the streak stands ----
check('last week counted, this week open', computeStreak([d(9, 12), d(9, 14)], 3, now).weeks, 1)

// ---- this week counts too ----
check('last week and this week counted', computeStreak([d(9, 12), d(9, 14), d(9, 19), d(9, 20)], 3, now).weeks, 2)
check('this week counted flag', computeStreak([d(9, 19), d(9, 20)], 3, now).thisWeekCounts, true)

// ---- two workouts on one day count once ----
check('same day twice', computeStreak([d(9, 19, 8), d(9, 19, 18)], 3, now).doneThisWeek, 1)

// ---- a whole week missed ends the streak, the older run is still the best ----
const gap = computeStreak([d(8, 21), d(8, 23), d(8, 28), d(8, 30)], 3, now) // late September, nothing in October
check('missed weeks: current streak', gap.weeks, 0)
check('missed weeks: best streak kept', gap.best, 2)

// ---- a week in the middle missed splits the run ----
const split = computeStreak([d(9, 5), d(9, 7), d(9, 19), d(9, 21)], 3, now)
check('split run: current', split.weeks, 1)
check('split run: best', split.best, 1)

// ---- Sunday belongs to the week that started on the Monday before ----
const sundayNow = new Date(2026, 9, 25, 20, 0, 0)
check('sunday still in the same week', computeStreak([d(9, 19), d(9, 21)], 3, sundayNow).thisWeekCounts, true)
// ...and Monday morning starts a fresh week without breaking last week's streak
const mondayNow = new Date(2026, 9, 26, 7, 0, 0)
const monday = computeStreak([d(9, 19), d(9, 21)], 3, mondayNow)
check('monday morning: streak kept', monday.weeks, 1)
check('monday morning: new week empty', monday.doneThisWeek, 0)

// ---- the reminder schedule ----
const mk = (name: string, n: number, format?: 'yoga' | 'pilates'): ProgramDay => ({
  day: 1, name, focus: 'Stress Relief Yoga', duration: '45-55 min',
  exercises: Array.from({ length: n }, (_, i) => ({ name: 'x' + i, sets: 3, reps: '10', rest: '60 sec', notes: '', ...(format ? { format } : {}) })),
})
const three = [mk('Full Body A', 6), mk('Full Body B', 7), mk('Full Body C', 6)]
const fromWed = planReminders({ now, days: three, time: '18:00', doneToday: false })
const dayNames = (rs: { at: Date }[]) => rs.map((r) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][r.at.getDay()])
check('3-day plan: weekdays (next 14 days)', dayNames(fromWed), ['Wed', 'Fri', 'Mon', 'Wed', 'Fri', 'Mon'])
check('3-day plan: today is Day 2 (Wed)', fromWed[0].body.startsWith('Today: Full Body B'), true)
check('3-day plan: ids are unique', new Set(fromWed.map((r) => r.id)).size, fromWed.length)
check('reminders at 6 PM', fromWed.every((r) => r.at.getHours() === 18 && r.at.getMinutes() === 0), true)

const skipToday = planReminders({ now, days: three, time: '18:00', doneToday: true })
check('workout done today: today is skipped', dayNames(skipToday)[0], 'Fri')

const lateNight = planReminders({ now: new Date(2026, 9, 21, 19, 0, 0), days: three, time: '18:00', doneToday: false })
check('after the reminder time: today is skipped', dayNames(lateNight)[0], 'Fri')

const five = Array.from({ length: 5 }, (_, i) => mk('Day ' + (i + 1), 5))
check('5-day plan: Mon-Fri only', new Set(dayNames(planReminders({ now, days: five, time: '07:30', doneToday: false }))).size, 5)
check('no days, no reminders', planReminders({ now, days: [], time: '18:00', doneToday: false }).length, 0)
check('yoga body names the style', planReminders({ now, days: [mk('Monday', 5, 'yoga'), mk('Wednesday', 5, 'yoga'), mk('Friday', 5, 'yoga')], time: '18:00', doneToday: false })[0].body, 'Today: Stress Relief Yoga. 5 poses, about 45-55 min.')

// ---- which workout days count (at least half of the day's sets, all the saves of the day added up) ----
// A day of 6 exercises x 3 sets = 18 sets. A save lists every set, ticked or not.
const save = (date: string, ticked: number, opts: { day?: number; program?: string; total?: number } = {}): SavedWorkout => {
  const total = opts.total ?? 18
  return {
    date,
    programId: opts.program ?? 'p1',
    day: opts.day ?? 1,
    exercises: [{ sets: Array.from({ length: total }, (_, i) => ({ completed: i < ticked })) }],
  }
}
check('3 of 18 sets: not enough yet', dayProgress([save(d(9, 19), 3)]).counts, false)
check('9 of 18 sets: counts', dayProgress([save(d(9, 19), 9)]).counts, true)
check('8 of 18 sets: not yet', dayProgress([save(d(9, 19), 8)]).counts, false)
check('1 set only: does not count', dayProgress([save(d(9, 19), 1)]).counts, false)
// saving exercise by exercise: the sets of every save that day add up
const stepByStep = dayProgress([save(d(9, 19, 9), 3), save(d(9, 19, 12), 3), save(d(9, 19, 17), 3)])
check('three saves of 3 sets add up', [stepByStep.done, stepByStep.planned, stepByStep.counts], [9, 18, true])
check('two saves of 3 sets: still not enough', dayProgress([save(d(9, 19, 9), 3), save(d(9, 19, 12), 3)]).counts, false)
check('ticking the same sets in two saves cannot pass the total', dayProgress([save(d(9, 19, 9), 18), save(d(9, 19, 12), 18)]).done, 18)
check('marked as done always counts', dayProgress([{ date: d(9, 19), programId: 'p1', day: 1, exercises: [] }]).counts, true)
check('marked done after a few sets', dayProgress([save(d(9, 19, 9), 2), { date: d(9, 19, 12), programId: 'p1', day: 1, exercises: [] }]).markedDone, true)
check('a day with no sets saved at all', dayProgress([]).counts, false)

// days are told apart by date, program and day number
const week = [save(d(9, 19, 9), 9, { day: 1 }), save(d(9, 19, 18), 9, { day: 2 }), save(d(9, 20, 9), 2, { day: 3 }), save(d(9, 21, 9), 9, { day: 1, program: 'p2' })]
check('only days far enough along are counted', countedDates(week).length, 3)
check('two partial saves of one day count once', countedDates([save(d(9, 19, 9), 5), save(d(9, 19, 18), 5)]).length, 1)
check('streak counts days that are far enough along', computeStreak(countedDates([save(d(9, 12), 9), save(d(9, 14), 9), save(d(9, 19), 3)]), 3, now).weeks, 1)

// history: one row per day, sets added up, newest first
const rows = historyRows([save(d(9, 19, 9), 3), save(d(9, 19, 12), 4), save(d(9, 18, 9), 18)])
check('history: one row per day', rows.length, 2)
check('history: sets added up', [rows[0].done, rows[0].planned], [7, 18])
check('history: newest first', rows[0].date.slice(0, 10) >= rows[1].date.slice(0, 10), true)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the streak counts weeks correctly and reminders land on the right days at the right time.')
