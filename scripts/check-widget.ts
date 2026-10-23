// Run with: npm run test:widget
// Checks what the Android home-screen widget is told to show (next workout, week dots, streak, "all done" state).
import { buildWidgetData } from '../src/lib/widgetData'
import type { SavedWorkout } from '../src/lib/streak'
import type { ProgramDay } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const ex = (n: number, format?: 'yoga' | 'pilates') =>
  Array.from({ length: n }, (_, i) => ({ name: 'x' + i, sets: 3, reps: '10', rest: '60 sec', notes: '', ...(format ? { format } : {}) }))
const days: ProgramDay[] = [
  { day: 1, name: 'Upper Power', focus: 'chest / back / shoulders', duration: '45-55 min', exercises: ex(6) },
  { day: 2, name: 'Lower Power', focus: 'legs / glutes', duration: '45-55 min', exercises: ex(4) },
  { day: 3, name: 'Upper Hypertrophy', focus: 'chest / back', duration: '60-70 min', exercises: ex(7) },
  { day: 4, name: 'Lower Hypertrophy', focus: 'legs', duration: '60-70 min', exercises: ex(5) },
]

// Wednesday 21 Oct 2026. This week: Mon 19 - Sun 25 Oct.
const now = new Date(2026, 9, 21, 12, 0, 0)
const save = (month: number, day: number, dayNumber: number): SavedWorkout => ({
  date: new Date(2026, month, day, 9).toISOString(), programId: 'p1', day: dayNumber,
  exercises: [{ sets: Array.from({ length: 10 }, () => ({ completed: true })) }],
})

const fresh = buildWidgetData({ firstName: 'Ana', days, programId: 'p1', saved: [], now })
check('greeting', fresh.greeting, 'Good afternoon, Ana')
check('next up is day 1', [fresh.label, fresh.name], ['NEXT UP · DAY 1', 'Upper Power'])
check('meta is title case with counts', fresh.meta, 'Chest / Back / Shoulders · 6 exercises · 45-55 min')
check('seven dots, Monday first', fresh.dots.map((d) => d.l).join(''), 'MTWTFSS')
check('today is Wednesday', fresh.dots.map((d) => d.t), [false, false, true, false, false, false, false])
check('nothing done yet', [fresh.done, fresh.planned, fresh.allDone, fresh.streakWeeks], [0, 4, false, 0])
check('caption', fresh.caption, '0 of 4 workouts · 🔥 0 weeks')

// Monday and Tuesday done: next is day 3, two dots filled, caption singular/plural right
const half = buildWidgetData({ days, programId: 'p1', saved: [save(9, 19, 1), save(9, 20, 2)], now })
check('half: next day 3', [half.label, half.name], ['NEXT UP · DAY 3', 'Upper Hypertrophy'])
check('half: dots', half.dots.map((d) => d.d), [true, true, false, false, false, false, false])
check('half: done 2 of 4', [half.done, half.planned], [2, 4])
check('no name: plain greeting', half.greeting, 'Good afternoon')

// last week counted twice => a 1-week streak
const streak = buildWidgetData({ days, programId: 'p1', saved: [save(9, 12, 1), save(9, 14, 2), save(9, 15, 3), save(9, 19, 1)], now })
check('streak weeks', streak.streakWeeks, 1)
check('caption singular week', streak.caption, '1 of 4 workouts · 🔥 1 week')

// everything done this week
const all = buildWidgetData({ days, programId: 'p1', saved: [1, 2, 3, 4].map((n) => save(9, 18 + n, n)), now })
check('all done: flag and text', [all.allDone, all.label, all.name, all.meta], [true, 'THIS WEEK', 'All done', 'All workouts done this week.'])

// yoga counts moves, a one-day plan says "workout"
const yoga = buildWidgetData({ days: [{ ...days[0], exercises: ex(5, 'yoga') }], programId: 'p1', saved: [], now })
check('yoga says moves', yoga.meta.includes('5 moves'), true)
check('one planned day', yoga.caption.startsWith('0 of 1 workout '), true)

// the summary is plain data that survives being sent as JSON
check('JSON round trip', JSON.parse(JSON.stringify(half)).name, 'Upper Hypertrophy')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the widget gets the right next workout, week dots, streak and captions.')
