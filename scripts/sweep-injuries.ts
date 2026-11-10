// Temporary check (not part of npm test): every exercise in a generated program must suit the person's injury.
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import { EXERCISES, injuryAllows } from '../src/lib/backend/exerciseLibrary'
import type { Equipment, FocusArea, Goal, InjuryLimitation, IntakeAnswers, MindBodyStyleId, TrainingDays } from '../src/lib/types'

const byName = new Map<string, typeof EXERCISES>()
for (const e of EXERCISES) byName.set(e.name, [...(byName.get(e.name) ?? []), e])

const goals: Goal[] = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition']
const exps = ['0-1', '2-3', '3-5', '5+'] as const
const injuries: InjuryLimitation[] = ['none', 'knee', 'shoulder', 'lower-back', 'other']
const focuses: FocusArea[][] = [[], ['legs', 'glutes'], ['chest', 'shoulders']]
const lifting: Equipment[] = ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands']
const styles: Record<string, MindBodyStyleId[]> = {
  yoga: ['yoga-beginner', 'yoga-flexibility', 'yoga-stress-relief', 'yoga-weight-loss', 'yoga-morning', 'yoga-bedtime'],
  pilates: ['pilates-beginner', 'pilates-core', 'pilates-full-body', 'pilates-weight-loss', 'pilates-flexibility'],
}

let programs = 0
let exercisesChecked = 0
const violations = new Map<string, number>()
const unmapped = new Map<string, number>()
const base = { sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate' }

function check(a: IntakeAnswers) {
  programs++
  const p = generateProgram(a, calculateNutrition(a))
  for (const d of p.days) {
    for (const ex of d.exercises) {
      exercisesChecked++
      const entries = byName.get(ex.name)
      if (!entries) { unmapped.set(ex.name, (unmapped.get(ex.name) ?? 0) + 1); continue }
      if (!entries.some((e) => injuryAllows(e, a.injuries))) {
        const key = `${a.equipment} / ${a.injuries}: ${ex.name}`
        violations.set(key, (violations.get(key) ?? 0) + 1)
      }
    }
  }
}

for (const experience of exps) for (const goal of goals) for (const injury of injuries) for (const focusAreas of focuses) {
  for (const equipment of lifting) for (const trainingDays of [3, 4, 5, 6] as TrainingDays[])
    check({ ...base, experience, trainingDays, goal, equipment, focusAreas, injuries: injury } as unknown as IntakeAnswers)
  for (const [equipment, list] of Object.entries(styles)) for (const mindBodyStyle of list) for (const trainingDays of [2, 3] as TrainingDays[])
    check({ ...base, experience, trainingDays, goal, equipment, focusAreas: [], injuries: injury, mindBodyStyle } as unknown as IntakeAnswers)
}

console.log(JSON.stringify({
  programsChecked: programs, exercisesChecked,
  notSafeForTheirInjuryOrEquipment: violations.size,
  examples: [...violations.entries()].slice(0, 12),
  namesNotInLibrary: unmapped.size, unmappedExamples: [...unmapped.entries()].slice(0, 8),
}, null, 1))
process.exit(violations.size ? 1 : 0)
