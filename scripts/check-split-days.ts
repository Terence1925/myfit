// Run with: npm run test:splits
// Checks that every exercise sits on a day that trains its muscle:
//  1. the main muscle of each exercise is one of the muscles that day is meant to train
//     (no core move on a leg day, no row on a push day, no chest press on a pull day)
//  2. on strict Push / Pull days, no triceps work on a pull day and no biceps or back work on a push day
// The 4-day plan's mixed "Upper Body" days are only held to rule 1.
import { generateProgram } from '../src/lib/backend/programGenerator'
import { EXERCISES } from '../src/lib/backend/exerciseLibrary'
import { calculateNutrition } from '../src/lib/tdee'

const byName = new Map(EXERCISES.map((e) => [e.name, e]))
const goals = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition'] as const
const dayCounts = [3, 4, 5, 6] as const
const foci: string[][] = [[], ['glutes'], ['chest'], ['arms'], ['back', 'arms'], ['legs', 'core'], ['back', 'shoulders'], ['full-body']]
const injuries = ['none', 'knee', 'shoulder', 'lower-back'] as const
const equipments = ['full-gym', 'dumbbells-only', 'calisthenics', 'resistance-bands'] as const

let programs = 0
let dayTotal = 0
let checked = 0
const wrong = new Map<string, number>()
const note = (key: string) => wrong.set(key, (wrong.get(key) ?? 0) + 1)

for (const equipment of equipments)
  for (const goal of goals)
    for (const d of dayCounts)
      for (const focusAreas of foci)
        for (const injuries_ of injuries)
          for (const experience of ['0-1', '5+']) {
            const answers: any = {
              sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience,
              activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
              trainingDays: d, goal, equipment, focusAreas, injuries: injuries_,
            }
            const program = generateProgram(answers, calculateNutrition(answers))
            programs++
            for (const day of program.days) {
              dayTotal++
              const trains = new Set(day.focus.split('/').map((s: string) => s.trim().toLowerCase().replace(' ', '-')))
              // Leg day work and glute work go together (a Romanian deadlift is a glute and hamstring lift)
              if (trains.has('legs') || trains.has('glutes')) {
                trains.add('legs')
                trains.add('glutes')
              }
              const pull = /^pull day/i.test(day.name)
              const push = /^push day/i.test(day.name)
              for (const ex of day.exercises) {
                const lib = byName.get(ex.name)
                if (!lib) continue
                checked++
                const primary = lib.muscle[0]
                const sub = lib.subgroup
                if (!trains.has(primary)) note(`"${day.name}" trains ${[...trains].join('/')} but has "${ex.name}" (${primary})`)
                if (pull && (sub === 'triceps' || primary === 'chest')) note(`PULL day has "${ex.name}" (${sub ?? primary})`)
                if (push && (sub === 'biceps' || sub === 'forearms' || primary === 'back')) note(`PUSH day has "${ex.name}" (${sub ?? primary})`)
              }
            }
          }

console.log(`Programs built: ${programs}  |  training days: ${dayTotal}  |  exercises checked: ${checked}`)
if (wrong.size) {
  const total = [...wrong.values()].reduce((a, b) => a + b, 0)
  console.log(`\nFAILED: ${total} exercises on the wrong day`)
  for (const [k, n] of [...wrong].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(` - ${k}: ${n} times`)
  process.exit(1)
}
console.log('\nPASSED: every exercise is on a day that trains its muscle.')
