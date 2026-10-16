// Run with: npm run test:home
// Checks that the home (bodyweight) plan follows the owner's home program: the same days, the same exercises in the same
// order, the same reps or seconds, and the number of sets set by the person's level (beginner 2, intermediate 4, advanced 5).
import { generateProgram } from '../src/lib/backend/programGenerator'
import { HOME_SLOTS, HOME_TEMPLATES } from '../src/lib/backend/homeProgram'
import { ANIMATED_DEMOS } from '../src/lib/animatedDemos'
import { EXERCISE_VIDEOS } from '../src/lib/exerciseVideos'
import { calculateNutrition } from '../src/lib/tdee'

const problems: string[] = []
const key = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const levels: [string, number][] = [
  ['0-1', 2],
  ['2-3', 4],
  ['5+', 5],
]
const status = new Map<string, string>()

for (const [experience, sets] of levels)
  for (const trainingDays of [3, 4, 5, 6]) {
    const template = HOME_TEMPLATES[trainingDays]
    const answers: any = {
      sex: 'female', age: 28, weight: 140, weightUnit: 'lbs', heightFeet: 5, heightInches: 5, experience,
      activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
      trainingDays, goal: 'build-muscle', equipment: 'calisthenics', focusAreas: [], injuries: 'none',
    }
    const program = generateProgram(answers, calculateNutrition(answers))
    const label = `${experience} / ${trainingDays} days`
    if (program.days.length !== template.days.length) problems.push(`${label}: ${program.days.length} days instead of ${template.days.length}`)
    template.days.forEach((day, i) => {
      const got = program.days[i]
      if (!got) return
      if (got.name !== day.name) problems.push(`${label}: day ${i + 1} is "${got.name}" instead of "${day.name}"`)
      if (got.exercises.length !== day.exercises.length) problems.push(`${label} / ${day.name}: ${got.exercises.length} exercises instead of ${day.exercises.length}`)
      day.exercises.forEach((line, n) => {
        const m = line.match(/^(.*?)\s+(\d+)x(\d+)(\/leg| sec)?$/)!
        const have = got.exercises[n]
        if (!have) return
        const want = HOME_SLOTS[key(m[1])]
        if (have.name !== want) problems.push(`${label} / ${day.name}: "${have.name}" instead of "${want}"`)
        if (have.sets !== sets) problems.push(`${label} / ${day.name} / ${have.name}: ${have.sets} sets instead of ${sets}`)
        const wantReps = m[4] === ' sec' ? `${m[3]} sec` : m[3]
        if (have.reps !== wantReps) problems.push(`${label} / ${day.name} / ${have.name}: reps "${have.reps}" instead of "${wantReps}"`)
        if ((m[4] === '/leg') !== !!have.eachSide) problems.push(`${label} / ${day.name} / ${have.name}: each-side flag is wrong`)
        status.set(have.name, ANIMATED_DEMOS[have.name] ? 'animation' : EXERCISE_VIDEOS[have.name] ? 'saved YouTube video' : 'YouTube search (no saved video)')
      })
    })
  }

const groups = new Map<string, string[]>()
for (const [name, how] of status) groups.set(how, [...(groups.get(how) ?? []), name])
console.log('How each home exercise is shown:')
for (const [how, names] of groups) console.log(`  ${how} (${names.length}): ${names.join(', ')}`)
if (problems.length) {
  console.log('\nFAILED')
  for (const p of problems.slice(0, 30)) console.log(' - ' + p)
  process.exit(1)
}
console.log('\nPASSED: the home plan follows the home program (days, order, reps, seconds and sets by level).')
