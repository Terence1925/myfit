// Run with: npm run test:units
// Checks the pounds / kilograms switch: conversions, and the weekly weights and warm-ups in kilograms.
import { fmtNumber, toLbs, toUnit, unitLabel, unitShort } from '../src/lib/weightUnit'
import { suggestFor, weekTarget } from '../src/lib/weekPlan'
import { warmupFor } from '../src/lib/warmup'
import type { Exercise, WorkoutSession } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

// Conversions
check('60 kg saves as about 132.28 lb', Math.round(toLbs(60, 'kg') * 100) / 100, 132.28)
check('and comes back as exactly 60 kg', toUnit(toLbs(60, 'kg'), 'kg'), 60)
check('62.5 kg round trip', toUnit(toLbs(62.5, 'kg'), 'kg'), 62.5)
check('pounds are saved as typed', [toLbs(135, 'lbs'), toUnit(135, 'lbs')], [135, 135])
check('135 lb in kg', toUnit(135, 'kg'), 61.23)
check('numbers show without a trailing zero', [fmtNumber(60), fmtNumber(62.5), fmtNumber(61.234)], ['60', '62.5', '61.2'])
check('unit names', [unitShort('kg'), unitShort('lbs'), unitLabel('kg'), unitLabel('lbs')], ['kg', 'lb', 'kg', 'lbs'])

// Weekly weights in kilograms
const ex = (name: string, reps: string): Exercise => ({ name, sets: 4, reps, rest: '90 sec', notes: '', format: 'strength' })
const bench = ex('Barbell Bench Press', '6-10')
const session = (daysAgo: number, kg: number, reps: number[]): WorkoutSession => ({
  id: 's' + daysAgo, userId: 'u', programId: 'p', day: 1, dayName: 'Upper', date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  exercises: [{ name: bench.name, sets: reps.map((r, i) => ({ setNumber: i + 1, weight: toLbs(kg, 'kg'), reps: r, completed: true })) }],
})
const wk = weekTarget(6)
const aim = (s: WorkoutSession[], unit: 'kg' | 'lbs') => suggestFor(s, bench, wk, { unit })?.aim
check('kg: top of the range adds 2.5 kg', aim([session(3, 60, [10, 10, 10, 10])], 'kg'), 'Aim for 62.5 kg × 6. Last time: 60 × 10.')
check('kg: one more rep', aim([session(3, 60, [8, 7, 7])], 'kg'), 'Aim for 60 kg × 8. Last time: 60 × 7.')
// A workout saved in pounds, viewed in kilograms: 135 lb is about 61 kg
const inLb: WorkoutSession = { ...session(3, 60, [10, 10]), exercises: [{ name: bench.name, sets: [10, 10].map((r, i) => ({ setNumber: i + 1, weight: 135, reps: r, completed: true })) }] }
check('kg: a pound workout gives plate-friendly kilograms', aim([inLb], 'kg'), 'Aim for 63.5 kg × 6. Last time: 61 × 10.')
check('lb: the same workout still reads in pounds', aim([inLb], 'lbs'), 'Aim for 137.5 lb × 6. Last time: 135 × 10.')
check('kg: the deload week names kilograms', /kg/.test(suggestFor([session(20, 80, [8, 8]), session(3, 80, [8, 8])], bench, weekTarget(13), { unit: 'kg' })?.aim ?? ''), true)

// Warm-ups in kilograms
const rows = (w: number | null) => warmupFor([bench], 0, w, wk, 'kg')?.rows.map((r) => `${r.label} x ${r.reps}`)
check('kg: 62.5 kg ramp', rows(62.5), ['25 kg x 8', '37.5 kg x 5', '50 kg x 3'])
check('kg: a light barbell lift starts with the empty 20 kg bar', rows(40), ['Empty bar (20 kg) x 10', '25 kg x 5', '32.5 kg x 3'])
check('kg: under 27 kg there is no table', rows(25), [])
check('kg: 100 kg gets a fourth set', rows(100), ['40 kg x 8', '60 kg x 5', '80 kg x 3', '90 kg x 1'])
check('kg: the note names kilograms', warmupFor([bench], 0, 62.5, wk, 'kg')?.note.endsWith('at 62.5 kg.'), true)
check('pounds are unchanged', warmupFor([bench], 0, 137.5, wk)?.rows.map((r) => r.label), ['55 lb', '85 lb', '110 lb'])

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the pounds / kilograms switch converts correctly, and the weekly weights and warm-ups work in kilograms.')
