// Run with: npm run test:polish
// Checks the "lifted more than last month" sentence, the weekly ring text and the soft sounds (volume and defaults).
import { formatLbs, liftedComparison } from '../src/lib/lifted'
import { ringText } from '../src/lib/todayPlan'
import { SOUNDS, soundOn } from '../src/lib/sound'
import type { WorkoutSession } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

// Wednesday 21 Oct 2026 at noon. This month so far = 1-21 Oct. The same stretch last month = 1-21 Sep.
const now = new Date(2026, 9, 21, 12, 0, 0)
const session = (month: number, day: number, weight: number, reps = 10, sets = 3): WorkoutSession => ({
  id: `${month}-${day}`, userId: 'u', programId: 'p', day: 1, dayName: 'Day', date: new Date(2026, month, day, 9).toISOString(),
  exercises: [{ name: 'Squat', sets: Array.from({ length: sets }, (_, i) => ({ setNumber: i + 1, weight, reps, completed: true })) }],
})

check('nothing lifted: no message', liftedComparison([], now).message, null)
check('only last month: no message yet', liftedComparison([session(8, 5, 100)], now).message, null)
check('first month: a great start', liftedComparison([session(9, 5, 100)], now).message, '3,000 lbs lifted this month. A great start!')

// 3,000 lbs in the same stretch last month, 3,600 now: 20% more
const more = liftedComparison([session(8, 10, 100), session(9, 6, 120)], now)
check('this month', more.thisMonth, 3600)
check('last month, same stretch', more.lastMonthSameSpan, 3000)
check('percent more', more.percent, 20)
check('message when more', more.message, '3,600 lbs lifted this month, 20% more than this time last month.')

// Last month's lifts after the 21st do not count against this month so far
check('later last month is left out', liftedComparison([session(8, 25, 500), session(9, 6, 100)], now).percent, null)
check('equal is on pace', liftedComparison([session(8, 10, 100), session(9, 6, 100)], now).message, '3,000 lbs lifted this month, right on pace with last month.')
check('less is never discouraging', liftedComparison([session(8, 10, 200), session(9, 6, 100)], now).message, '3,000 lbs lifted this month so far. Every set counts!')
check('an unticked set does not count', liftedComparison([{ ...session(9, 6, 100), exercises: [{ name: 'Squat', sets: [{ setNumber: 1, weight: 100, reps: 10, completed: false }] }] }], now).message, null)
check('thousands separator', formatLbs(12400), '12,400')

// ring text
check('ring: none done', ringText(0, 3, 4), { title: '0 of 4 workouts this week', note: '3 more workouts keeps your streak going.' })
check('ring: one to go for the streak', ringText(2, 3, 4).note, '1 more workout keeps your streak going.')
check('ring: streak secured', ringText(3, 3, 4).note, 'Streak secured this week. 1 more for a perfect week.')
check('ring: perfect', ringText(4, 3, 4).note, 'Perfect week! Every workout done.')
check('ring: one planned day', ringText(0, 1, 1).title, '0 of 1 workout this week')

// sounds: soft, short, and on unless switched off
check('sound is on by default', soundOn(), true)
for (const [name, s] of Object.entries(SOUNDS)) {
  if (s.gain > 0.1) problems.push(`sound ${name} is too loud (${s.gain})`)
  if (s.notes.length === 0) problems.push(`sound ${name} has no notes`)
  if (s.notes.length * s.step + s.length > 1.2) problems.push(`sound ${name} is too long`)
}

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the "lifted more" sentence, the weekly ring text and the soft sounds are right.')
