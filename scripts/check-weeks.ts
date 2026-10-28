// Run with: npm run test:weeks
// Checks the week-by-week targets: effort per week, half the sets in the deload week, and the weight to aim for.
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import { effortSentence, plainEffort } from '../src/lib/effortWords'
import { LOAD_STEP, dayForWeek, suggestFor, weekTarget } from '../src/lib/weekPlan'
import type { Exercise, IntakeAnswers, WorkoutSession } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const aimOf = (...args: Parameters<typeof suggestFor>) => suggestFor(...args)?.aim ?? null
const coachOf = (...args: Parameters<typeof suggestFor>) => suggestFor(...args)?.coach ?? ''

// The weeks
check('week 1', [weekTarget(1).phase, weekTarget(1).rir], ['base', '3'])
check('week 4', [weekTarget(4).phase, weekTarget(4).rir], ['base', '3'])
check('week 5', [weekTarget(5).phase, weekTarget(5).rir], ['build', '2'])
check('week 8', [weekTarget(8).phase, weekTarget(8).rir], ['build', '2'])
check('week 9', [weekTarget(9).phase, weekTarget(9).rir], ['push', '1-2'])
check('week 11', [weekTarget(11).phase, weekTarget(11).rir], ['push', '1-2'])
check('week 12', [weekTarget(12).phase, weekTarget(12).deload], ['test', false])
check('week 13', [weekTarget(13).phase, weekTarget(13).deload], ['deload', true])
check('out-of-range weeks are held', [weekTarget(0).week, weekTarget(40).week], [1, 13])
check('deload advice names 40-60% and half the sets', /40-60%/.test(weekTarget(13).advice) && /half the sets/.test(weekTarget(13).advice), true)

// A day in the deload week
const ex = (name: string, sets: number, reps: string, notes = 'Target 1-2 RIR. Focus on controlled tempo.'): Exercise => ({ name, sets, reps, rest: '90 sec', notes, format: 'strength' })
const day = { day: 1, name: 'Upper', focus: 'chest', duration: '45 min', exercises: [ex('Barbell Bench Press', 4, '6-10'), ex('Dumbbell Curl', 3, '10-12'), ex('Lat Pulldown', 2, '8-12'), ex('Plank', 3, '30 sec')] }
const deload = dayForWeek(day, weekTarget(13))
check('deload halves the sets', deload.exercises.map((e) => e.sets), [2, 2, 1, 2])
check('deload note says stop 4 or more reps early', deload.exercises[0].notes, 'Stop each set 4 or more reps before you cannot do more. Focus on controlled tempo.')
check('week 5 keeps the sets and says stop about 2 reps early', [dayForWeek(day, weekTarget(5)).exercises.map((e) => e.sets), dayForWeek(day, weekTarget(5)).exercises[0].notes], [[4, 3, 2, 3], 'Stop each set about 2 reps before you cannot do more. Focus on controlled tempo.'])
check('the original day is not changed', day.exercises[0].sets, 4)

// Effort notes read in plain words, whichever way the program wrote them (no "RIR" is ever shown)
check('a range', plainEffort('Target 1-2 RIR. Focus on controlled tempo and full range of motion.'), 'Stop each set 1 to 2 reps before you cannot do more. Focus on controlled tempo and full range of motion.')
check('one rep', plainEffort('Target 1 RIR.'), 'Stop each set about 1 rep before you cannot do more.')
check('an isolation note', plainEffort('Isolation work — squeeze at peak contraction, 2-3 RIR.'), 'Isolation work — squeeze at peak contraction, stop each set 2 to 3 reps before you cannot do more.')
check('a home note with a bracket', plainEffort('Controlled tempo and full range of motion, 3+ RIR (leave 3+ reps in the tank every set).'), 'Controlled tempo and full range of motion, stop each set 3 or more reps before you cannot do more.')
check('the last-set note is not said twice', plainEffort('On the last set go close to failure but stop with 1-2 reps left, 2 RIR.'), 'On the last set go close to failure but stop with 1-2 reps left.')
check('a note without a marker is unchanged', plainEffort('Hold with a neutral spine and braced core.'), 'Hold with a neutral spine and braced core.')
check('the effort line: strength', effortSentence('2-3 RIR'), 'Stop each set 2 to 3 reps before you cannot do more.')
check('the effort line: top sets', effortSentence('0-1 RIR on top sets'), 'Stop each set 0 to 1 reps before you cannot do more.')
check('the effort line: yoga', effortSentence('a gentle, easy effort'), 'Aim for a gentle, easy effort.')
for (const w of [1, 5, 9, 12, 13]) {
  const shown = dayForWeek(day, weekTarget(w)).exercises.map((e) => e.notes).join(' ')
  check(`week ${w} shows no RIR`, /RIR/.test(shown), false)
}

// The weight to aim for
const session = (daysAgo: number, name: string, sets: [number, number][]): WorkoutSession => ({
  id: 's' + daysAgo + name, userId: 'u', programId: 'p', day: 1, dayName: 'Upper', date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  exercises: [{ name, sets: sets.map(([weight, reps], i) => ({ setNumber: i + 1, weight, reps, completed: true })) }],
})
const bench = ex('Barbell Bench Press', 4, '6-10')
const wk = weekTarget(6)
check('no history: how to pick a weight', aimOf([], bench, wk), 'Pick a weight that leaves about 2 reps in the tank on your last set.')
check('no history in the deload week: nothing', aimOf([], bench, weekTarget(13)), null)
check('every set hit the top: add weight', aimOf([session(3, bench.name, [[135, 10], [135, 10], [135, 10], [135, 10]])], bench, wk), 'Aim for 137.5 lb × 6. Last time: 135 × 10.')
check('short of the top: same weight, one more rep', aimOf([session(3, bench.name, [[135, 8], [135, 7], [135, 7]])], bench, wk), 'Aim for 135 lb × 8. Last time: 135 × 7.')
check('uses the most recent session', aimOf([session(10, bench.name, [[100, 10]]), session(2, bench.name, [[125, 8]])], bench, wk), 'Aim for 125 lb × 9. Last time: 125 × 8.')
check('top rep is never passed', aimOf([session(3, bench.name, [[135, 9], [135, 9]])], bench, wk), 'Aim for 135 lb × 10. Last time: 135 × 9.')
check('ignores sets that were not ticked', aimOf([{ ...session(3, bench.name, [[135, 10]]), exercises: [{ name: bench.name, sets: [{ setNumber: 1, weight: 135, reps: 10, completed: false }] }] }], bench, wk), 'Pick a weight that leaves about 2 reps in the tank on your last set.')
check('deload: about half of the usual weight', aimOf([session(20, bench.name, [[135, 8]]), session(3, bench.name, [[140, 8]])], bench, weekTarget(13)), 'Use about 70 lb, half of your usual 140 lb. Keep it easy.')
check('timed move: no weight', aimOf([], ex('Plank', 3, '30 sec'), wk), null)
check('yoga: no weight', aimOf([], { ...ex('Downward Dog', 1, '30 sec'), format: 'yoga' }, wk), null)
check('the step is 2.5 lb for every exercise', LOAD_STEP, 2.5)


// When the weight will not go up
check('one rep short of the range: just find one more rep', aimOf([session(3, bench.name, [[135, 5], [135, 5]])], bench, wk), 'Aim for 135 lb × 6. Last time: 135 × 5.')
const dayAgo = (n: number, sets: [number, number][]) => session(n, bench.name, sets)
check('missed the range once: stay at the weight', aimOf([session(3, bench.name, [[135, 4], [135, 3], [135, 3]])], bench, wk), 'Stay at 135 lb and aim for 6-10 reps. Last time: 135 × 3.')
check('missed the range twice: go down', aimOf([session(10, bench.name, [[135, 5], [135, 4]]), session(3, bench.name, [[135, 4], [135, 3]])], bench, wk), '135 was too heavy twice. Drop to 130 lb and aim for 6-10 reps, then build back up.')
check('a miss after an easier weight: stay, not drop', aimOf([session(10, bench.name, [[130, 9]]), session(3, bench.name, [[135, 4]])], bench, wk), 'Stay at 135 lb and aim for 6-10 reps. Last time: 135 × 4.')
check('squat drop is two steps', aimOf([session(10, 'Barbell Squat', [[225, 4]]), session(3, 'Barbell Squat', [[225, 3]])], ex('Barbell Squat', 4, '6-10'), wk), '225 was too heavy twice. Drop to 220 lb and aim for 6-10 reps, then build back up.')
check('a fixed 5 reps: one missed rep is not too heavy', aimOf([session(3, bench.name, [[135, 4], [135, 5], [135, 5]])], ex(bench.name, 4, '5'), wk), 'Aim for 135 lb × 5. Last time: 135 × 4.')
const stuck = [dayAgo(14, [[135, 8], [135, 8]]), dayAgo(7, [[135, 8], [135, 7]]), dayAgo(2, [[135, 8], [135, 8]])]
check('stuck for 3 workouts: a way out', aimOf(stuck, bench, wk), 'Stuck at 135 lb for 3 workouts? That happens. Try 120 lb × 10 and build back up, or keep 135 lb and slow each rep down.')
const zigzag = [dayAgo(14, [[135, 8], [135, 8]]), dayAgo(7, [[130, 10], [130, 9]]), dayAgo(2, [[135, 8], [135, 8]])]
check('switching between two weights with no better set is still stuck', /^Stuck at 135 lb/.test(aimOf(zigzag, bench, wk) ?? ''), true)
const slipped = [dayAgo(14, [[135, 10]]), dayAgo(7, [[135, 9]]), dayAgo(2, [[135, 8]])]
check('getting worse over 3 workouts is stuck too', /^Stuck at 135 lb/.test(aimOf(slipped, bench, wk) ?? ''), true)
const upThenDown = [dayAgo(14, [[135, 8]]), dayAgo(7, [[135, 10]]), dayAgo(2, [[135, 9]])]
check('a better set in the middle is not stuck', /^Aim for 135 lb × 10/.test(aimOf(upThenDown, bench, wk) ?? ''), true)
const climbing = [dayAgo(14, [[135, 7]]), dayAgo(7, [[135, 8]]), dayAgo(2, [[135, 9]])]
check('adding reps is not stuck', aimOf(climbing, bench, wk), 'Aim for 135 lb × 10. Last time: 135 × 9.')
const twice = [dayAgo(7, [[135, 8]]), dayAgo(2, [[135, 8]])]
check('two workouts at the same weight is not stuck yet', aimOf(twice, bench, wk), 'Aim for 135 lb × 9. Last time: 135 × 8.')
const moved = [dayAgo(14, [[125, 8]]), dayAgo(7, [[130, 8]]), dayAgo(2, [[135, 8]])]
check('a rising weight is not stuck', aimOf(moved, bench, wk), 'Aim for 135 lb × 9. Last time: 135 × 8.')
check('the deload week ignores a stall', aimOf(stuck, bench, weekTarget(13)), 'Use about 70 lb, half of your usual 135 lb. Keep it easy.')

// The progression the owner described: 10-12 reps. Hit 12, add 2.5 lb and start again at 10, then 11, then 12, then add 2.5 again
{
  const curl = ex('Dumbbell Curl', 3, '10-12')
  const logged: WorkoutSession[] = []
  let day = 10
  const log = (w: number, r: number) => logged.push(session(day--, curl.name, [[w, r], [w, r], [w, r]]))
  log(30, 12)
  check('hit 12: add 2.5 lb and go back to 10', aimOf(logged, curl, wk), 'Aim for 32.5 lb × 10. Last time: 30 × 12.')
  log(32.5, 10)
  check('then 11 at the new weight', aimOf(logged, curl, wk), 'Aim for 32.5 lb × 11. Last time: 32.5 × 10.')
  log(32.5, 11)
  check('then 12', aimOf(logged, curl, wk), 'Aim for 32.5 lb × 12. Last time: 32.5 × 11.')
  log(32.5, 12)
  check('then add 2.5 lb again', aimOf(logged, curl, wk), 'Aim for 35 lb × 10. Last time: 32.5 × 12.')
}

// The coach talks to the person: pushes when they progress, helps when they cannot
{
  const ago = (n: number, sets: [number, number][]) => session(n, bench.name, sets)
  const hit = [ago(3, [[135, 10], [135, 10], [135, 10], [135, 10]])]
  check('top of the range: earns the weight', /earns you 2.5 lb/.test(coachOf(hit, bench, wk)), true)
  check('first time starting: asks them to log it', /Write down every set/.test(coachOf([], bench, wk)), true)
  const nearTop = [ago(3, [[135, 9], [135, 9]])]
  check('one rep from the top: the next workout raises the weight', /weight goes up/.test(coachOf(nearTop, bench, wk)), true)
  const early = [ago(3, [[135, 6], [135, 6]])]
  check('building reps: asks for one more rep', /One more rep than last time/.test(coachOf(early, bench, wk)), true)
  const moving = [ago(10, [[135, 6]]), ago(3, [[135, 7]])]
  check('progress twice: pushes them to do it again', /moved up last time/.test(coachOf(moving, bench, wk)), true)
  check('first miss: rest and form', /Rest the full 90 sec/.test(coachOf([ago(3, [[135, 3]])], bench, wk)), true)
  check('second miss: dropping is not failing', /not failing/.test(coachOf([ago(10, [[135, 3]]), ago(3, [[135, 3]])], bench, wk)), true)
  const stuckSessions = [ago(14, [[135, 8], [135, 8]]), ago(7, [[135, 8], [135, 7]]), ago(2, [[135, 8], [135, 8]])]
  check('stuck: sleep, food, tempo and rest are named', /sleep/.test(coachOf(stuckSessions, bench, wk)) && /eating enough/.test(coachOf(stuckSessions, bench, wk)) && /rushing/.test(coachOf(stuckSessions, bench, wk)), true)
  check('the deload coach says recovery', /recovery/.test(coachOf(stuckSessions, bench, weekTarget(13))), true)
  const test = [ago(3, [[135, 6], [135, 6]])]
  check('test week: main lifts get the test line', /Test week/.test(coachOf(test, bench, weekTarget(12), { main: true })), true)
  check('test week: other lifts do not', /Test week/.test(coachOf(test, bench, weekTarget(12), { main: false })), false)

  // After a break. The sessions are built a moment after `now`, so a hair over a whole number of days keeps the count from rounding down.
  const now = new Date()
  check('15 days away: told to get back on it', /It has been 15 days/.test(coachOf([ago(15.01, [[135, 8], [135, 8]])], bench, wk, { now })), true)
  check('15 days away: the weight is not cut', aimOf([ago(15.01, [[135, 8], [135, 8]])], bench, wk, { now }), 'Aim for 135 lb × 9. Last time: 135 × 8.')
  check('30 days away: restart a little lighter', aimOf([ago(30.01, [[135, 8], [135, 8]])], bench, wk, { now }), 'Restart at 120 lb × 6. Last time: 135 × 8.')
  check('30 days away: the coach explains', /30 days since you trained this/.test(coachOf([ago(30.01, [[135, 8]])], bench, wk, { now })), true)
}

// Real programs: the deload week never adds sets, never drops below one, and still has every exercise
for (const equipment of ['full-gym', 'dumbbells-only', 'resistance-bands'] as const)
  for (const trainingDays of [3, 4, 5, 6]) {
    const answers = { sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience: '2-3', activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', trainingDays, goal: 'build-muscle', equipment, focusAreas: [], injuries: 'none' } as IntakeAnswers
    const p = generateProgram(answers, calculateNutrition(answers))
    for (const d of p.days) {
      const lighter = dayForWeek(d, weekTarget(13))
      check(`${equipment} ${trainingDays}d day ${d.day}: same exercises`, lighter.exercises.map((e) => e.name), d.exercises.map((e) => e.name))
      lighter.exercises.forEach((e, i) => {
        if (e.sets < 1 || e.sets > d.exercises[i].sets) problems.push(`${equipment} ${trainingDays}d day ${d.day} ${e.name}: ${d.exercises[i].sets} sets became ${e.sets}`)
      })
      const before = d.exercises.reduce((n, e) => n + e.sets, 0)
      const after = lighter.exercises.reduce((n, e) => n + e.sets, 0)
      if (after > before * 0.7) problems.push(`${equipment} ${trainingDays}d day ${d.day}: deload only cut ${before} sets to ${after}`)
    }
  }

if (problems.length) {
  console.log('FAILED')
  for (const p of problems.slice(0, 25)) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: each week has the right effort, the deload week halves the sets, and the weight to aim for follows what was logged.')

