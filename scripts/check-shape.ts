// Run with: npm run test:shape
// Checks that a program saved by an older version of the app (missing fields) is filled in so no screen can crash on it.
import { programDataWithDefaults } from '../src/lib/programShape'
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import type { IntakeAnswers } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, ok: boolean) => {
  if (!ok) problems.push(label)
}

// Nothing at all, or nothing useful
for (const bad of [undefined, null, {}, { days: null }, { days: 'x' }]) {
  const p = programDataWithDefaults(bad as never)
  check(`empty input ${JSON.stringify(bad)}: all lists exist`, [p.personalizationNotes, p.nutritionTips, p.recoveryAdvice, p.warmup, p.cooldown, p.days].every(Array.isArray))
  check(`empty input ${JSON.stringify(bad)}: text fields are strings`, [p.programName, p.tagline, p.overview, p.weeklyVolume, p.progressionStrategy].every((t) => typeof t === 'string'))
}

// An old day with missing pieces
const old = programDataWithDefaults({ days: [{ day: 1, name: 'Day 1', exercises: [{ name: 'Squat', sets: 3, reps: 10 as never }, {} as never] }, null as never] })
check('old day: exercises kept', old.days[0].exercises.length === 2)
check('old day: reps become text', old.days[0].exercises[0].reps === '10')
check('old day: missing notes become empty text', old.days[0].exercises[0].notes === '')
check('old day: an empty exercise gets a name and sets', old.days[0].exercises[1].name === 'Exercise' && old.days[0].exercises[1].sets === 3)
check('a missing day becomes an empty day', old.days[1].exercises.length === 0 && old.days[1].day === 2)

// A real, current program passes through unchanged
const answers = { sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience: '2-3', activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate', trainingDays: 4, goal: 'build-muscle', equipment: 'full-gym', focusAreas: [], injuries: 'none' } as IntakeAnswers
const fresh = generateProgram(answers, calculateNutrition(answers))
const same = programDataWithDefaults(fresh)
check('a current program is not changed', JSON.stringify(same) === JSON.stringify(fresh))

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: programs from older versions are filled in, and current programs are left as they are.')
