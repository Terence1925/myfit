// Run with: npm run test:mindbody
// Checks the yoga and Pilates styles (src/lib/backend/mindBodyStyles.ts):
//  1. every pose and move in every style exists in the library
//  2. a program has one session per training day, on the right weekdays, every session being the style's sequence in order
//  3. yoga hold times add up to about the minutes the style promises
//  4. with an injury, every move is safe for it (an unsafe one is swapped, never kept)
import { generateProgram } from '../src/lib/backend/programGenerator'
import { EXERCISES, injuryAllows } from '../src/lib/backend/exerciseLibrary'
import { MIND_BODY_DAY_OPTIONS, MIND_BODY_STYLES, weekdaysFor } from '../src/lib/backend/mindBodyStyles'
import { calculateNutrition } from '../src/lib/tdee'

const byName = new Map(EXERCISES.map((e) => [e.name, e]))
const problems: string[] = []
const swaps = new Map<string, number>()
let programs = 0

/** "45-60 sec" or "1.5-2.5 min" -> middle, in seconds. */
function seconds(reps: string): number | null {
  const m = reps.match(/^([\d.]+)-([\d.]+) (sec|min)$/)
  if (!m) return null
  return ((Number(m[1]) + Number(m[2])) / 2) * (m[3] === 'min' ? 60 : 1)
}

for (const style of MIND_BODY_STYLES) {
  // The style is also the person's goal: weight loss styles cut calories, the rest keep weight steady
  const wantGoal = style.id.endsWith('weight-loss') ? 'lose-weight' : 'body-recomposition'
  if (style.goal !== wantGoal) problems.push(`${style.label}: goal is ${style.goal} instead of ${wantGoal}`)
  for (const name of style.poses) if (!byName.has(name)) problems.push(`${style.label}: "${name}" is not in the library`)

  for (const days of MIND_BODY_DAY_OPTIONS[style.discipline])
    for (const injuries of ['none', 'knee', 'shoulder', 'lower-back', 'other'] as const)
      for (const goal of [style.goal] as const) {
        const answers: any = {
          sex: 'female', age: 30, weight: 140, weightUnit: 'lbs', heightFeet: 5, heightInches: 5, experience: style.experience,
          activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
          trainingDays: days, goal, equipment: style.discipline, focusAreas: [], injuries, mindBodyStyle: style.id,
        }
        const program = generateProgram(answers, calculateNutrition(answers))
        programs++
        const label = `${style.label} / ${days} days / injury ${injuries}`
        const weekdays = weekdaysFor(days)
        if (program.days.length !== days) problems.push(`${label}: ${program.days.length} sessions instead of ${days}`)
        program.days.forEach((day, i) => {
          if (day.name !== weekdays[i]) problems.push(`${label}: session ${i + 1} is "${day.name}" instead of "${weekdays[i]}"`)
          const names = day.exercises.map((e) => e.name)
          if (names.join('|') !== program.days[0].exercises.map((e) => e.name).join('|')) problems.push(`${label}: sessions are not all the same sequence`)
        })
        const names = program.days[0].exercises.map((e) => e.name)

        if (injuries === 'none') {
          if (names.join('|') !== style.poses.join('|')) problems.push(`${label}: got ${names.join(', ')} instead of ${style.poses.join(', ')}`)
        } else {
          for (const n of names) {
            const ex = byName.get(n)
            if (!ex) problems.push(`${label}: "${n}" is not in the library`)
            else if (!injuryAllows(ex, injuries)) problems.push(`${label}: "${n}" is not safe for ${injuries}`)
            else if (!ex.equipment.includes(style.discipline)) problems.push(`${label}: "${n}" is not a ${style.discipline} move`)
          }
          for (const p of style.poses) if (!names.includes(p)) swaps.set(`${style.label}: ${p}`, (swaps.get(`${style.label}: ${p}`) ?? 0) + 1)
        }

        if (style.discipline === 'yoga' && injuries === 'none' && days === 3) {
          let total = 0
          for (const e of program.days[0].exercises) {
            const s = seconds(e.reps) ?? (/^\d/.test(e.reps) ? 0 : 0)
            const eachSide = !!e.eachSide
            total += (s || (e.reps === '2-3 min' ? 150 : e.reps === '3-5 min' ? 240 : 0)) * (eachSide ? 2 : 1)
          }
          const minutes = total / 60
          if (minutes < style.minutes[0] * 0.8 || minutes > style.minutes[1] * 1.2)
            problems.push(`${label}: holds add up to about ${minutes.toFixed(0)} min, but the style says ${style.minutes[0]}-${style.minutes[1]} min`)
        }
      }
}

console.log(`Styles: ${MIND_BODY_STYLES.length}  |  programs built: ${programs}`)
if (swaps.size) {
  console.log('Moves swapped for a gentler one when an injury is selected (count):')
  for (const [k, v] of [...swaps].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`  ${k}: ${v}`)
}
if (problems.length) {
  console.log('\nFAILED')
  for (const p of problems.slice(0, 30)) console.log(' - ' + p)
  process.exit(1)
}
console.log('\nPASSED: every yoga and Pilates style builds the right sessions on the right days, in time, and safely.')
