// Run with: npm run test:warmup
// Checks the warm-up sets: only heavy opening lifts get them, worked out from the weight about to be lifted.
import { EXERCISES } from '../src/lib/backend/exerciseLibrary'
import { isHeavyLift, warmupFor } from '../src/lib/warmup'
import { weekTarget } from '../src/lib/weekPlan'
import type { Exercise } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}
const ex = (name: string, reps = '8-10', format: Exercise['format'] = 'strength'): Exercise => ({ name, sets: 4, reps, rest: '90 sec', notes: '', format })
const wk = weekTarget(6)
const rows = (list: Exercise[], i: number, w: number | null, t = wk) => warmupFor(list, i, w, t)?.rows.map((r) => `${r.label} x ${r.reps}`) ?? null

// Which lifts count as heavy
const heavy = ['Barbell Bench Press', 'Barbell Row', 'Barbell Squat', 'Deadlift', 'Leg Press', 'Lat Pulldown', 'Chest Press Machine', 'Barbell Hip Thrust', 'Barbell Overhead Press']
const light = ['Dumbbell Bench Press', 'Dumbbell Curl', 'Push-Up', 'Pull-Up', 'Leg Extension', 'Barbell Curl', 'Bulgarian Split Squat', 'Goblet Squat', 'Face Pull', 'Standing Calf Raise', 'Plank', 'Lateral Raise', 'Tricep Pushdown']
for (const n of heavy) check(`${n} is heavy`, isHeavyLift(n), true)
for (const n of light) check(`${n} is not heavy`, isHeavyLift(n), false)

// The ramp
const day = [ex('Barbell Bench Press'), ex('Barbell Row'), ex('Dumbbell Shoulder Press'), ex('Dumbbell Curl')]
check('137.5 lb: three sets', rows(day, 0, 137.5), ['55 lb x 8', '85 lb x 5', '110 lb x 3'])
check('225 lb: four sets, ending at 90%', rows(day, 0, 225), ['90 lb x 8', '135 lb x 5', '180 lb x 3', '205 lb x 1'])
check('95 lb on a barbell starts with the empty bar', rows(day, 0, 95), ['Empty bar (45 lb) x 10', '55 lb x 5', '75 lb x 3'])
check('60 lb on a machine has no bar', rows([ex('Chest Press Machine')], 0, 60), ['25 lb x 8', '35 lb x 5', '50 lb x 3'])
check('under 60 lb: no table, just how to warm up', [rows(day, 0, 50), warmupFor(day, 0, 50, wk)?.note.startsWith('Do 2 or 3 light sets')], [[], true])
check('no weight yet: warm up by feel', [rows(day, 0, null), warmupFor(day, 0, null, wk)?.note.startsWith('Do 2 or 3 light sets')], [[], true])

// Who gets one
check('the second lift for a different muscle gets the full ramp', rows(day, 1, 120), ['50 lb x 8', '70 lb x 5', '95 lb x 3'])
check('the third lift gets none', warmupFor(day, 2, 100, wk), null)
check('dumbbell lifts get none', warmupFor([ex('Dumbbell Bench Press')], 0, 80, wk), null)
check('the deload week gets none', warmupFor(day, 0, 100, weekTarget(13)), null)
check('yoga gets none', warmupFor([ex('Barbell Squat', '30 sec', 'yoga')], 0, 100, wk), null)
check('timed moves get none', warmupFor([ex('Barbell Row', '30 sec')], 0, 100, wk), null)
check('a second lift for the same muscle is short', rows([ex('Barbell Bench Press'), ex('Incline Bench Press')], 1, 135), ['80 lb x 4', '110 lb x 2'])

// Every heavy lift in the library at real weights: rows go up, stay under the work weight and are never counted as work
for (const e of EXERCISES.filter((x) => isHeavyLift(x.name))) {
  for (const w of [60, 95, 135, 185, 225, 315]) {
    const plan = warmupFor([ex(e.name)], 0, w, wk)
    if (!plan) { problems.push(`${e.name} at ${w}: no plan`); continue }
    const weights = plan.rows.map((r) => r.weight ?? 45)
    if (weights.some((x, i) => i > 0 && x < weights[i - 1])) problems.push(`${e.name} at ${w}: weights do not go up (${weights.join(', ')})`)
    if (weights.some((x) => x >= w)) problems.push(`${e.name} at ${w}: a warm-up set is not lighter than the work weight`)
    if (plan.rows.length < 2 || plan.rows.length > 4) problems.push(`${e.name} at ${w}: ${plan.rows.length} warm-up sets`)
  }
}

if (problems.length) {
  console.log('FAILED')
  for (const p of problems.slice(0, 25)) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: only heavy opening lifts get warm-up sets, and they ramp up to the work weight.')
