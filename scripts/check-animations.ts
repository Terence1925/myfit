// Run with: npm run test:animations
// Builds thousands of programs with every mix of answers and checks that each strength exercise has an animation,
// so no new program sends anyone to YouTube. Yoga and Pilates are allowed to use YouTube.
import { generateProgram } from '../src/lib/backend/programGenerator'
import { calculateNutrition } from '../src/lib/tdee'
import { ANIMATED_DEMOS, ANIMATED_ONLY_STRENGTH, SHOW_ANIMATED_DEMOS, YOUTUBE_NEXT_TO_ANIMATION } from '../src/lib/animatedDemos'

const goals = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition'] as const
const days = [3, 4, 5, 6] as const
const foci: string[][] = [[], ['glutes'], ['chest'], ['arms'], ['legs', 'core'], ['back', 'shoulders'], ['full-body']]
const injuries = ['none', 'knee', 'shoulder', 'lower-back', 'other'] as const
const equipments = ['full-gym', 'dumbbells-only', 'calisthenics', 'resistance-bands', 'yoga', 'pilates'] as const

let programs = 0
let exercises = 0
let strength = 0
let mindBody = 0
const missing = new Map<string, number>()
const errors: string[] = []

for (const equipment of equipments)
  for (const goal of goals)
    for (const d of days)
      for (const focusAreas of foci)
        for (const injuries_ of injuries)
          for (const experience of ['0-1', '5+']) {
            const answers: any = {
              sex: 'female', age: 28, weight: 140, weightUnit: 'lbs', heightFeet: 5, heightInches: 5, experience,
              activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
              trainingDays: d, goal, equipment, focusAreas, injuries: injuries_,
            }
            try {
              const program = generateProgram(answers, calculateNutrition(answers))
              programs++
              for (const day of program.days)
                for (const ex of day.exercises) {
                  exercises++
                  if (ex.format === 'yoga' || ex.format === 'pilates' || equipment === 'yoga' || equipment === 'pilates') {
                    mindBody++
                    continue
                  }
                  strength++
                  if (!ANIMATED_DEMOS[ex.name]) missing.set(ex.name, (missing.get(ex.name) ?? 0) + 1)
                }
            } catch (e) {
              errors.push(`${equipment} ${goal} ${d}d: ${(e as Error).message}`)
            }
          }

const problems: string[] = []
if (!SHOW_ANIMATED_DEMOS) problems.push('SHOW_ANIMATED_DEMOS is off')
if (!ANIMATED_ONLY_STRENGTH) problems.push('ANIMATED_ONLY_STRENGTH is off')
if (YOUTUBE_NEXT_TO_ANIMATION) problems.push('YOUTUBE_NEXT_TO_ANIMATION is on (the "Real person" tab would show)')
if (errors.length) problems.push(`${errors.length} programs failed to build, first: ${errors[0]}`)
if (missing.size) problems.push(`${missing.size} strength exercises have no animation: ${[...missing.keys()].slice(0, 10).join(', ')}`)

console.log(`Programs built:            ${programs}`)
console.log(`Exercises checked:         ${exercises}`)
console.log(`  strength, with animation: ${strength - [...missing.values()].reduce((a, b) => a + b, 0)} of ${strength}`)
console.log(`  yoga / Pilates (YouTube): ${mindBody}`)
if (problems.length) {
  console.log('\nFAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('\nPASSED: every strength exercise in every generated program has an animation.')
