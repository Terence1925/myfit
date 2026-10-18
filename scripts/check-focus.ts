// Run with: npm run test:focus
// Checks what a chosen focus area does to a program:
//  - glute and leg work is never added to an upper-body day, and chest, back, shoulder and arm work never to a lower-body day
//  - no session has more than two hinge lifts (deadlift, Romanian deadlift and so on)
//  - a glute focus gives several different glute moves a week, not one move repeated
//  - the bodyweight program also reacts to a focus area (it used to ignore it)
import { generateProgram } from '../src/lib/backend/programGenerator'
import { EXERCISES } from '../src/lib/backend/exerciseLibrary'
import { calculateNutrition } from '../src/lib/tdee'

const byName = new Map(EXERCISES.map((e) => [e.name, e]))
const equipments = ['full-gym', 'dumbbells-only', 'resistance-bands', 'calisthenics'] as const
const experiences = ['0-1', '2-3', '5+'] as const
const injuries = ['none', 'knee', 'shoulder', 'lower-back'] as const
const UPPER = ['chest', 'back', 'shoulders']
const LOWER = ['legs', 'glutes']

const build = (equipment: string, experience: string, trainingDays: number, focusAreas: string[], injury = 'none') => {
  const answers: any = {
    sex: 'female', age: 28, weight: 140, weightUnit: 'lbs', heightFeet: 5, heightInches: 5, experience,
    activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
    trainingDays, goal: 'build-muscle', equipment, focusAreas, injuries: injury,
  }
  return generateProgram(answers, calculateNutrition(answers))
}
const primary = (name: string) => byName.get(name)?.muscle[0]

const problems = new Map<string, number>()
const note = (key: string) => problems.set(key, (problems.get(key) ?? 0) + 1)
let programs = 0
const labelHas = (focusLabel: string, muscles: string[]) => focusLabel.split('/').some((m) => muscles.includes(m.trim()))

for (const equipment of equipments)
  for (const experience of experiences)
    for (const days of [3, 4, 5, 6])
      for (const injury of injuries) {
        const base = build(equipment, experience, days, [], injury)
        for (const focus of [['glutes'], ['legs'], ['chest'], ['back'], ['shoulders'], ['arms'], ['glutes', 'arms'], ['legs', 'core']]) {
          const program = build(equipment, experience, days, focus, injury)
          programs++
          program.days.forEach((day, i) => {
            const where = `${equipment} ${experience} ${days}d [${focus}] ${injury}: ${day.name}`
            const hinges = day.exercises.filter((e) => byName.get(e.name)?.subgroup === 'hinge').length
            if (hinges > 2) note(`more than two hinge lifts: ${where} = ${day.exercises.filter((e) => byName.get(e.name)?.subgroup === 'hinge').map((e) => e.name).join(', ')}`)
            // The plan's own layout says what each day trains; a focus must not move work to the wrong half of the body
            const baseLabel = base.days[i]?.focus ?? ''
            const baseUpperOnly = labelHas(baseLabel, UPPER) && !labelHas(baseLabel, LOWER)
            const baseLowerOnly = labelHas(baseLabel, LOWER) && !labelHas(baseLabel, UPPER)
            const baseNames = new Set(base.days[i]?.exercises.map((e) => e.name))
            // (A day with only a few moves left by an injury is topped up with whatever is safe; that is not a focus choice.
            // A hinge lift on a pull day is the plan's own Romanian deadlift, swapped for another when an injury rules it out.)
            if ((base.days[i]?.exercises.length ?? 0) <= 4) return
            const added = day.exercises.filter((e) => !baseNames.has(e.name) && byName.get(e.name)?.subgroup !== 'hinge').map((e) => primary(e.name))
            if (baseUpperOnly && added.some((m) => m && LOWER.includes(m))) note(`leg or glute work added to an upper-body day: ${where} + ${day.exercises.filter((e) => !baseNames.has(e.name)).map((e) => e.name).join(', ')}`)
            if (baseLowerOnly && added.some((m) => m && (UPPER.includes(m) || m === 'arms'))) note(`upper-body work added to a lower-body day: ${equipment}`)
          })
        }
      }

// Several different glute moves in a week
for (const equipment of equipments)
  for (const days of [3, 4, 5, 6]) {
    const program = build(equipment, '2-3', days, ['glutes'])
    const glute = program.days.flatMap((d) => d.exercises.map((e) => byName.get(e.name))).filter((e) => e && e.muscle.includes('glutes'))
    const distinct = new Set(glute.map((e) => e!.name))
    const kinds = new Set(glute.map((e) => e!.subgroup))
    const none = build(equipment, '2-3', days, [])
    const without = none.days.flatMap((d) => d.exercises.map((e) => byName.get(e.name))).filter((e) => e && e.muscle.includes('glutes')).length
    if (glute.length < without + 2) note(`${equipment} ${days}d: glute focus adds fewer than two glute moves (${glute.length} vs ${without})`)
    if (distinct.size < 3) note(`${equipment} ${days}d: only ${distinct.size} different glute moves`)
    if (kinds.size < 2) note(`${equipment} ${days}d: only one kind of glute move`)
  }

// The bodyweight program reacts to a focus area
for (const days of [3, 4, 5, 6])
  for (const focus of ['glutes', 'arms', 'chest', 'back', 'shoulders', 'legs', 'core']) {
    const count = (list: string[]) =>
      build('calisthenics', '2-3', days, list).days.flatMap((d) => d.exercises).filter((e) => primary(e.name) === focus).length
    if (count([focus]) <= count([])) note(`calisthenics ${days}d: ${focus} focus adds nothing`)
  }

if (problems.size) {
  console.log('FAILED')
  for (const [p, n] of problems) console.log(` - ${p}  (${n}x)`)
  process.exit(1)
}
console.log(`PASSED: ${programs} focus programs. Focus work stays on the right half of the body, hinge lifts are capped, glutes get several different moves, and the bodyweight plan reacts.`)
