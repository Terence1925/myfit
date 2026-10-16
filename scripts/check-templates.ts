// Run with: npm run test:templates
// Checks that the generator really follows the reference programs for the Full Gym, Dumbbells Only and Resistance Bands plans
// (src/lib/backend/programTemplates.ts and dumbbellTemplates.ts):
//  1. every exercise name written in a reference program is known to the generator
//  2. with no injury, no focus area and good recovery, each day has the same exercises count, and each line keeps its
//     sets, reps (or seconds) and each-side flag exactly as written
//  3. lists which lines had to use a stand-in because the named exercise cannot be used
import { generateProgram } from '../src/lib/backend/programGenerator'
import { PROGRAM_TEMPLATES, SLOT_SPECS, parseTemplateLine, slotKey, templateKeyFor, type TemplateProgram, type SlotSpec } from '../src/lib/backend/programTemplates'
import { DUMBBELL_SLOT_SPECS, DUMBBELL_TEMPLATES, dumbbellKeyFor } from '../src/lib/backend/dumbbellTemplates'
import { BAND_SLOT_SPECS, BAND_TEMPLATES, bandKeyFor } from '../src/lib/backend/bandTemplates'
import { calculateNutrition } from '../src/lib/tdee'

interface Plan {
  equipment: 'full-gym' | 'dumbbells-only' | 'resistance-bands'
  templates: Record<string, TemplateProgram>
  specs: Record<string, SlotSpec>
  keyFor: (experience: string, days: number) => string | null
}
const plans: Plan[] = [
  { equipment: 'full-gym', templates: PROGRAM_TEMPLATES, specs: SLOT_SPECS, keyFor: templateKeyFor },
  { equipment: 'dumbbells-only', templates: DUMBBELL_TEMPLATES, specs: DUMBBELL_SLOT_SPECS, keyFor: dumbbellKeyFor },
  { equipment: 'resistance-bands', templates: BAND_TEMPLATES, specs: BAND_SLOT_SPECS, keyFor: bandKeyFor },
]

const problems: string[] = []
const standIns = new Map<string, Set<string>>()

for (const plan of plans) {
  for (const [key, template] of Object.entries(plan.templates))
    for (const day of template.days)
      for (const line of day.exercises) {
        const name = parseTemplateLine(line).name
        if (!plan.specs[slotKey(name)]) problems.push(`${plan.equipment} ${key} / ${day.name}: "${name}" is not known to the generator`)
      }

  for (const experience of ['0-1', '2-3', '5+'])
    for (const trainingDays of [3, 4, 5, 6]) {
      const key = plan.keyFor(experience, trainingDays)
      const template = key ? plan.templates[key] : undefined
      const label = `${plan.equipment} / ${experience} / ${trainingDays} days`
      if (!key || !template) {
        problems.push(`${label}: no reference program`)
        continue
      }
      const answers: any = {
        sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience,
        activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
        trainingDays, goal: 'build-muscle', equipment: plan.equipment, focusAreas: [], injuries: 'none',
      }
      const program = generateProgram(answers, calculateNutrition(answers))
      if (program.days.length !== template.days.length) problems.push(`${label}: ${program.days.length} days instead of ${template.days.length}`)
      template.days.forEach((day, i) => {
        const got = program.days[i]
        if (!got) return
        if (got.name !== day.name) problems.push(`${label}: day ${i + 1} is "${got.name}" instead of "${day.name}"`)
        if (got.exercises.length !== day.exercises.length)
          problems.push(`${label} / ${day.name}: ${got.exercises.length} exercises instead of ${day.exercises.length}`)
        day.exercises.forEach((line, n) => {
          const want = parseTemplateLine(line)
          const have = got.exercises[n]
          if (!have) return
          if (want.sets !== undefined && have.sets !== want.sets) problems.push(`${label} / ${day.name} / ${want.name}: ${have.sets} sets instead of ${want.sets}`)
          const wantReps = want.reps === 'Failure' ? '10-15' : want.seconds ? `${want.reps} sec` : want.reps
          if (wantReps !== undefined && have.reps !== wantReps) problems.push(`${label} / ${day.name} / ${want.name}: reps "${have.reps}" instead of "${wantReps}"`)
          if (!!want.eachSide !== !!have.eachSide) problems.push(`${label} / ${day.name} / ${want.name}: each-side flag is wrong`)
          const spec = plan.specs[slotKey(want.name)]
          if (spec && have.name !== spec.picks[0]) {
            const k = `${plan.equipment}: ${want.name} -> ${spec.picks[0]}`
            standIns.set(k, (standIns.get(k) ?? new Set<string>()).add(have.name))
          }
        })
      })
    }
}

console.log('Lines that use a stand-in (the first-choice exercise cannot be used):')
for (const [k, v] of [...standIns].sort()) console.log(`  ${k}  =>  ${[...v].join(' / ')}`)
if (problems.length) {
  console.log('\nFAILED')
  for (const p of problems.slice(0, 30)) console.log(' - ' + p)
  process.exit(1)
}
console.log('\nPASSED: all three plans follow the reference programs (days, order, sets, reps and each-side).')
