// Run with: npm run test:swap
// Swap must give a different exercise that is the same kind of movement for the same muscle, never one that is already in the
// day, and when nothing similar exists it must give the same exercise back (the screen then says so).
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram, generateAlternate, NO_SWAP_NOTE } from '../src/lib/backend/programGenerator'
import { EXERCISES } from '../src/lib/backend/exerciseLibrary'
import { swapFamily, RELATED_FAMILIES } from '../src/lib/backend/swapFamily'
import type { Equipment, FocusArea, InjuryLimitation, IntakeAnswers, MindBodyStyleId, TrainingDays } from '../src/lib/types'

const byName = new Map(EXERCISES.map((e) => [e.name, e]))
const problems: string[] = []
const fail = (m: string) => problems.length < 25 && problems.push(m)
let tried = 0
let swapped = 0
let kept = 0

const base = { sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, sleepHours: '6-7', sleepQuality: 'fair', stressLevel: 'moderate', activityLevel: 'moderate' } as const

function sweep(a: IntakeAnswers, label: string, tries: number, strength: boolean) {
  const p = generateProgram(a, calculateNutrition(a))
  for (const day of p.days) {
    const today = day.exercises.map((e) => e.name)
    for (const ex of day.exercises) {
      const lib = byName.get(ex.name)
      if (!lib) { fail(`${label}: ${ex.name} is not in the library`); continue }
      const muscle = lib.muscle[0] as FocusArea
      for (let t = 0; t < tries; t++) {
        tried++
        const sw = generateAlternate(ex.name, muscle, a, today)
        const ctx = `${label}: ${ex.name} -> ${sw.name}`
        if (sw.name === ex.name) {
          kept++
          if (strength && sw.notes !== NO_SWAP_NOTE) fail(`${ctx}: gave the same exercise without saying there was no swap`)
          continue
        }
        swapped++
        if (today.includes(sw.name)) fail(`${ctx}: already in this day`)
        const swLib = byName.get(sw.name)
        if (!swLib) { fail(`${ctx}: replacement is not in the library`); continue }
        if (!strength) continue
        if (!lib.muscle.some((m) => swLib.muscle.includes(m))) fail(`${ctx}: a different muscle (${lib.muscle} vs ${swLib.muscle})`)
        const from = swapFamily(lib)
        const to = swapFamily(swLib)
        if (from !== to && !RELATED_FAMILIES[from]?.includes(to)) fail(`${ctx}: not the same kind of movement (${from} vs ${to})`)
      }
    }
  }
}

const gear: Equipment[] = ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands']
const injuries: InjuryLimitation[] = ['none', 'knee', 'shoulder', 'lower-back']
for (const equipment of gear)
  for (const injuries_ of injuries)
    for (const [goal, trainingDays, focusAreas] of [
      ['build-muscle', 4, []],
      ['lose-weight', 5, ['legs', 'glutes']],
      ['strength-power', 3, ['chest']],
    ] as [IntakeAnswers['goal'], TrainingDays, FocusArea[]][])
      sweep({ ...base, experience: '2-3', trainingDays, goal, equipment, focusAreas, injuries: injuries_ } as IntakeAnswers, `${equipment}/${injuries_}/${trainingDays}d`, 6, true)

const yoga: MindBodyStyleId[] = ['yoga-beginner', 'yoga-flexibility', 'yoga-stress-relief']
const pilates: MindBodyStyleId[] = ['pilates-beginner', 'pilates-core', 'pilates-full-body']
for (const [equipment, styles] of [['yoga', yoga], ['pilates', pilates]] as const)
  for (const mindBodyStyle of styles)
    for (const injuries_ of ['none', 'knee', 'lower-back'] as InjuryLimitation[])
      sweep({ ...base, sex: 'female', experience: '0-1', trainingDays: 3, goal: 'lose-weight', equipment, focusAreas: [], injuries: injuries_, mindBodyStyle } as IntakeAnswers, `${mindBodyStyle}/${injuries_}`, 6, false)

if (swapped < 1000) fail(`only ${swapped} swaps were made, the check is not testing enough`)
if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log(`PASSED: ${tried} swaps tried; every one was a different, related exercise that was not already in the day (${kept} had nothing similar and said so).`)
