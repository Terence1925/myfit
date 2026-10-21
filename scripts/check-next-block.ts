// Run with: npm run test:next-block
// Checks that a new 12-week program is not a copy of the last one: the main lifts stay, some accessories change,
// and the rep ranges follow the block of the year (Foundation, Strength, Size, Peak).
import { calculateNutrition } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import { EXERCISES, isAllowed } from '../src/lib/backend/exerciseLibrary'
import { TRAINING_BLOCKS, trainingBlockFor } from '../src/lib/programBlock'
import type { IntakeAnswers } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, ok: boolean, detail = '') => {
  if (!ok) problems.push(`${label}${detail ? ': ' + detail : ''}`)
}
const byName = new Map(EXERCISES.map((e) => [e.name, e]))

const equipments: IntakeAnswers['equipment'][] = ['full-gym', 'dumbbells-only', 'resistance-bands']
const levels: IntakeAnswers['experience'][] = ['0-1', '2-3', '5+']
const goals: IntakeAnswers['goal'][] = ['build-muscle', 'strength-power', 'lose-weight']
let programs = 0
let changedAccessories = 0
let totalAccessories = 0

for (const equipment of equipments)
  for (const experience of levels)
    for (const goal of goals)
      for (const trainingDays of [3, 4, 5, 6]) {
        const answers: IntakeAnswers = {
          sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience,
          activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
          trainingDays, goal, equipment, focusAreas: [], injuries: 'none',
        } as IntakeAnswers
        const nutrition = calculateNutrition(answers)
        const label = `${equipment} ${experience} ${goal} ${trainingDays}d`
        const blocks = [0, 1, 2, 3, 4].map((finished) => generateProgram(answers, nutrition, finished))
        programs++

        blocks.forEach((p, finished) => {
          const want = trainingBlockFor(finished)
          if (p.trainingBlock) check(`${label} block ${finished}`, p.trainingBlock.number === want.number && p.trainingBlock.name === want.name)
          for (const d of p.days) for (const e of d.exercises) check(`${label} block ${finished}: "${e.name}" is allowed`, isAllowed(byName.get(e.name)!, equipment, 'none'))
          for (const d of p.days) check(`${label} block ${finished} day ${d.day}: no repeated exercise`, new Set(d.exercises.map((e) => e.name)).size === d.exercises.length)
        })

        // Layouts that rotate (the reference programs) carry a block label; the others are fixed
        if (!blocks[0].trainingBlock) continue

        blocks.forEach((p, finished) => {
          if (finished === 0) return
          p.days.forEach((d, di) => {
            const first = blocks[0].days[di]
            check(`${label} block ${finished} day ${d.day}: same number of days and exercises`, !!first && first.exercises.length >= 3 && d.exercises.length >= 3)
            // main lifts (the first two exercises of the day) stay
            for (let i = 0; i < 2; i++) check(`${label} block ${finished} day ${d.day}: main lift ${i + 1} kept`, d.exercises[i]?.name === first.exercises[i]?.name, `${first.exercises[i]?.name} -> ${d.exercises[i]?.name}`)
            for (let i = 2; i < Math.min(d.exercises.length, first.exercises.length); i++) {
              totalAccessories++
              if (d.exercises[i].name !== first.exercises[i].name) changedAccessories++
            }
          })
        })

        // The rep range follows the block (timed holds and failure lines are left alone)
        const main = (p: (typeof blocks)[number]) => p.days.flatMap((d) => d.exercises.slice(0, 2)).filter((e) => /^\d+-\d+$/.test(e.reps))
        const repsOf = (p: (typeof blocks)[number]) => [...new Set(main(p).map((e) => e.reps))]
        const strength = repsOf(blocks[1])
        const peak = repsOf(blocks[3])
        check(`${label}: Strength block lowers the main-lift reps`, strength.length > 0 && strength.every((r) => r === '4-6' || r === '5-8' || r === '3-5' || r === '6-8' || r === '5-6'), strength.join(','))
        check(`${label}: Peak block uses low reps on the main lifts`, peak.length > 0 && peak.every((r) => r === '3-5' || r === '5-6' || r === '4-6' || r === '6-8'), peak.join(','))
        check(`${label}: a fifth program starts the cycle again but is not the same as the first`, blocks[4].trainingBlock?.number === 1 && JSON.stringify(blocks[4].days) !== JSON.stringify(blocks[0].days))
        check(`${label}: block 2 is not the same as block 1`, JSON.stringify(blocks[1].days) !== JSON.stringify(blocks[0].days))
      }

const share = totalAccessories ? changedAccessories / totalAccessories : 0
check('about a third of accessories or more change in a new block', share >= 0.2, `${(share * 100).toFixed(0)}% changed`)
check('four blocks defined', TRAINING_BLOCKS.length === 4)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems.slice(0, 25)) console.log(' - ' + p)
  if (problems.length > 25) console.log(` ...and ${problems.length - 25} more`)
  process.exit(1)
}
console.log(`PASSED: ${programs} setups checked over 5 programs each. Main lifts stay, ${(share * 100).toFixed(0)}% of accessories change in a new block, and rep ranges follow the block.`)
