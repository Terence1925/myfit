// Run with: npm run test:animations
// Builds thousands of programs with every mix of answers and checks how each exercise is shown:
//  - an animation (every strength exercise should have one),
//  - or, only where the owner allowed it, a saved YouTube video (a few Full Gym list exercises and the home program).
// Yoga and Pilates use YouTube. Anything else with no animation and no saved video is a failure.
import { generateProgram } from '../src/lib/backend/programGenerator'
import { calculateNutrition } from '../src/lib/tdee'
import { ANIMATED_DEMOS, ANIMATED_ONLY_STRENGTH, SHOW_ANIMATED_DEMOS } from '../src/lib/animatedDemos'
import { COMMON_GYM_YOUTUBE } from '../src/lib/backend/commonGym'
import { HOME_PROGRAM_NAMES } from '../src/lib/backend/homeProgram'
import { EXERCISE_VIDEOS } from '../src/lib/exerciseVideos'
import { HOME_NEW_EXERCISES } from '../src/lib/backend/homeExercises'
import { DUMBBELL_YOUTUBE } from '../src/lib/backend/dumbbellExercises'
import { BAND_YOUTUBE } from '../src/lib/backend/bandExercises'

const goals = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition'] as const
const days = [3, 4, 5, 6] as const
const experiences = ['0-1', '2-3', '5+'] as const
const foci: string[][] = [[], ['glutes'], ['chest'], ['arms'], ['legs', 'core'], ['back', 'shoulders'], ['full-body']]
const injuries = ['none', 'knee', 'shoulder', 'lower-back', 'other'] as const
const equipments = ['full-gym', 'dumbbells-only', 'calisthenics', 'resistance-bands', 'yoga', 'pilates'] as const

// Moves the owner's home program asks for that have neither an animation nor a saved video yet (the app searches YouTube)
const HOME_NO_VIDEO = new Set(HOME_NEW_EXERCISES.map((e) => e.name))

let programs = 0
let exercises = 0
let animated = 0
let savedVideo = 0
let mindBody = 0
const noVideoYet = new Map<string, number>()
const missing = new Map<string, number>()
const errors: string[] = []

for (const equipment of equipments)
  for (const goal of goals)
    for (const d of days)
      for (const focusAreas of foci)
        for (const injuries_ of injuries)
          for (const experience of experiences) {
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
                  if (ANIMATED_DEMOS[ex.name]) {
                    animated++
                    continue
                  }
                  const allowedYoutube =
                    (equipment === 'full-gym' && COMMON_GYM_YOUTUBE.has(ex.name)) ||
                    (equipment === 'calisthenics' && HOME_PROGRAM_NAMES.has(ex.name)) ||
                    (equipment === 'dumbbells-only' && DUMBBELL_YOUTUBE.has(ex.name)) ||
                    (equipment === 'resistance-bands' && BAND_YOUTUBE.has(ex.name))
                  if (!allowedYoutube) {
                    missing.set(`${equipment}: ${ex.name}`, (missing.get(`${equipment}: ${ex.name}`) ?? 0) + 1)
                  } else if (EXERCISE_VIDEOS[ex.name]) {
                    savedVideo++
                  } else if (HOME_NO_VIDEO.has(ex.name)) {
                    noVideoYet.set(ex.name, (noVideoYet.get(ex.name) ?? 0) + 1)
                  } else {
                    missing.set(`no saved video: ${ex.name}`, (missing.get(`no saved video: ${ex.name}`) ?? 0) + 1)
                  }
                }
            } catch (e) {
              errors.push(`${equipment} ${goal} ${d}d: ${(e as Error).message}`)
            }
          }

const problems: string[] = []
if (!SHOW_ANIMATED_DEMOS) problems.push('SHOW_ANIMATED_DEMOS is off')
if (!ANIMATED_ONLY_STRENGTH) problems.push('ANIMATED_ONLY_STRENGTH is off')
if (errors.length) problems.push(`${errors.length} programs failed to build, first: ${errors[0]}`)
if (missing.size) problems.push(`${missing.size} exercises have no animation and no allowed saved video: ${[...missing.keys()].slice(0, 10).join(', ')}`)

const strength = animated + savedVideo + [...noVideoYet.values()].reduce((a, b) => a + b, 0)
console.log(`Programs built:             ${programs}`)
console.log(`Exercises checked:          ${exercises}`)
console.log(`  with an animation:        ${animated} (${((animated / strength) * 100).toFixed(1)}% of strength exercises)`)
console.log(`  with a saved YouTube video: ${savedVideo}`)
console.log(`  YouTube search (no saved video yet): ${[...noVideoYet.values()].reduce((a, b) => a + b, 0)}  ${[...noVideoYet.keys()].join(', ')}`)
console.log(`  yoga / Pilates (YouTube): ${mindBody}`)
if (problems.length) {
  console.log('\nFAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('\nPASSED: every exercise has an animation, or is one the owner allowed to use a YouTube video.')
