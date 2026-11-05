// Run with: npm run test:set-ramp
// Beginner home programs say "weeks 1-2: 2 sets, weeks 3-4: 3 sets, from week 5: 4 sets". The week screens must really do that.
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import { dayForWeek, weekTarget } from '../src/lib/weekPlan'
import type { Equipment, IntakeAnswers, TrainingDays } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const answers = (equipment: Equipment, experience: string, trainingDays: TrainingDays): IntakeAnswers =>
  ({
    sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience,
    sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', activityLevel: 'light',
    trainingDays, goal: 'build-muscle', equipment, focusAreas: [], injuries: 'none',
  }) as IntakeAnswers

const build = (a: IntakeAnswers) => generateProgram(a, calculateNutrition(a))
const weeks = Array.from({ length: 13 }, (_, i) => i + 1)

for (const equipment of ['home-workout', 'calisthenics'] as Equipment[]) {
  for (const days of [3, 4, 5, 6] as TrainingDays[]) {
    const p = build(answers(equipment, '0-1', days))
    check(`${equipment} ${days}d beginner: flagged for the ramp`, p.setRamp, true)
    const first = p.days[0]
    const perWeek = weeks.map((w) => [...new Set(dayForWeek(first, weekTarget(w), p.setRamp).exercises.map((e) => e.sets))])
    check(`${equipment} ${days}d beginner: sets by week`, perWeek, [[2], [2], [3], [3], [4], [4], [4], [4], [4], [4], [4], [4], [2]])
    check(`${equipment} ${days}d beginner: the note matches`, /Weeks 1-2: 2 sets\. Weeks 3-4: 3 sets\. From week 5: 4 sets/.test(JSON.stringify(p.days)), true)
    // an exercise the person typed in keeps their own sets, apart from the easy deload week
    const custom = { ...first, exercises: first.exercises.map((e, i) => (i === 0 ? { ...e, name: 'My Move', sets: 3, custom: true } : e)) }
    check(`${equipment} ${days}d beginner: custom keeps its sets`, weeks.map((w) => dayForWeek(custom, weekTarget(w), p.setRamp).exercises[0].sets), [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2])
  }
}

for (const experience of ['2-3', '5+']) {
  const p = build(answers('calisthenics', experience, 4))
  check(`home ${experience}: no ramp`, p.setRamp, undefined)
  const base = p.days[0].exercises[0].sets
  check(`home ${experience}: sets stay put`, weeks.slice(0, 12).map((w) => dayForWeek(p.days[0], weekTarget(w), p.setRamp).exercises[0].sets), Array(12).fill(base))
}

const gym = build(answers('full-gym', '0-1', 4))
check('gym beginner: no ramp', gym.setRamp, undefined)
check('gym beginner: sets stay put', weeks.slice(0, 12).map((w) => dayForWeek(gym.days[0], weekTarget(w), gym.setRamp).exercises[0].sets), Array(12).fill(gym.days[0].exercises[0].sets))

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: beginner home programs go 2, 3, then 4 sets and halve in the deload week; everything else keeps its sets.')
