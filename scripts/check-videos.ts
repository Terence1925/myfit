// Run with: npm run test:videos
// Every exercise in the owner's programs (Full Gym, Dumbbells, Resistance Bands, Home, and every yoga and Pilates style)
// must have a saved real-person YouTube video, so the Demo window can always show one (next to the animation when there is one).
import { generateProgram } from '../src/lib/backend/programGenerator'
import { MIND_BODY_STYLES } from '../src/lib/backend/mindBodyStyles'
import { EXERCISE_VIDEOS } from '../src/lib/exerciseVideos'
import { ANIMATED_DEMOS } from '../src/lib/animatedDemos'
import { calculateNutrition } from '../src/lib/tdee'

const used = new Map<string, Set<string>>()
const note = (name: string, where: string) => used.set(name, (used.get(name) ?? new Set<string>()).add(where))

for (const equipment of ['full-gym', 'dumbbells-only', 'resistance-bands', 'calisthenics'])
  for (const experience of ['0-1', '2-3', '5+'])
    for (const trainingDays of [3, 4, 5, 6]) {
      const answers: any = {
        sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience,
        activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
        trainingDays, goal: 'build-muscle', equipment, focusAreas: [], injuries: 'none',
      }
      for (const day of generateProgram(answers, calculateNutrition(answers)).days) for (const ex of day.exercises) note(ex.name, equipment)
    }
for (const style of MIND_BODY_STYLES) for (const pose of style.poses) note(pose, style.label)

const missing = [...used.keys()].filter((n) => !EXERCISE_VIDEOS[n])
const withBoth = [...used.keys()].filter((n) => EXERCISE_VIDEOS[n] && ANIMATED_DEMOS[n]).length
const videoOnly = [...used.keys()].filter((n) => EXERCISE_VIDEOS[n] && !ANIMATED_DEMOS[n]).length

console.log(`Exercises in the owner's programs: ${used.size}`)
console.log(`  animation + real-person video (switch shows): ${withBoth}`)
console.log(`  real-person video only: ${videoOnly}`)
console.log(`  no real-person video: ${missing.length}`)
if (missing.length) {
  console.log('\nFAILED')
  for (const n of missing) console.log(` - ${n}  [${[...used.get(n)!].join(', ')}]`)
  process.exit(1)
}
console.log('\nPASSED: every exercise in the programs has a real-person video.')
