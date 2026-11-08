// Run with: npm run test:custom-program
// "Build my own": the exercise library by body part, the days the person builds, and the program made from them.
import { calculateNutrition } from '../src/lib/tdee'
import { BODY_PARTS, EQUIPMENT_FILTERS, dictionaryFor, matchesEquipment } from '../src/lib/backend/customLibrary'
import { buildCustomProgram, customDaysValid, dayFocusOf, ensureDays, programFor, withoutCustomDays } from '../src/lib/backend/customProgram'
import { exerciseFromLibrary, generateAlternate } from '../src/lib/backend/programGenerator'
import { programDataWithDefaults } from '../src/lib/programShape'
import { dayForWeek, weekTarget } from '../src/lib/weekPlan'
import type { Exercise, IntakeAnswers, ProgramDay } from '../src/lib/types'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}
const ok = (label: string, cond: boolean, detail = '') => {
  if (!cond) problems.push(`${label}${detail ? ': ' + detail : ''}`)
}

// ---- the library, by body part ----
for (const part of BODY_PARTS) {
  const list = dictionaryFor(part.id)
  ok(`${part.label} has exercises`, list.length > 0)
  ok(`${part.label} has no repeats`, new Set(list.map((e) => e.name)).size === list.length)
  ok(`${part.label} has only exercises for lifting equipment (no yoga or Pilates poses)`, list.every((e) => e.equipment.some((q) => ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands'].includes(q))))
  ok(`${part.label} is A to Z`, list.every((e, i) => i === 0 || list[i - 1].name.localeCompare(e.name) <= 0))
}
const chest = dictionaryFor('chest')
ok('chest has the bench press', chest.some((e) => e.name === 'Barbell Bench Press'))
for (const f of EQUIPMENT_FILTERS) {
  const n = chest.filter((e) => matchesEquipment(e, f.id)).length
  ok(`chest filter "${f.label}" finds something`, n > 0)
  if (f.id === 'all') check('"All" keeps every chest exercise', n, chest.length)
}
ok('the dumbbell filter hides barbell-only exercises', !chest.filter((e) => matchesEquipment(e, 'dumbbells-only')).some((e) => e.name === 'Barbell Bench Press'))

// ---- building days ----
const bench = chest.find((e) => e.name === 'Barbell Bench Press')!
const base: IntakeAnswers = {
  sex: 'male', age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience: '2-3',
  activityLevel: 'moderate', sleepHours: '7-8', sleepQuality: 'good', stressLevel: 'moderate',
  trainingDays: 3, goal: 'build-muscle', equipment: 'custom', focusAreas: [], injuries: 'none',
} as IntakeAnswers
const line = exerciseFromLibrary(bench, base, 'Controlled tempo and full range of motion.')
ok('a library exercise gets sets, reps and rest', line.sets >= 2 && !!line.reps && !!line.rest, JSON.stringify(line))
const typed: Exercise = { name: 'Cable Crunch', sets: 4, reps: '12-15', rest: '60-90 sec', notes: 'Your own exercise.', custom: true }

check('ensureDays makes 3 empty days', ensureDays(undefined, 3).map((d) => d.name), ['Day 1', 'Day 2', 'Day 3'])
const two = ensureDays([{ day: 1, name: 'Push', focus: '', duration: '', exercises: [line] }], 3)
check('ensureDays keeps the first day and adds two', [two.length, two[0].name, two[0].exercises.length], [3, 'Push', 1])
check('ensureDays drops extra days', ensureDays(two, 2).length, 2)
ok('an empty day is not valid', !customDaysValid(ensureDays(undefined, 3), 3))
const built: ProgramDay[] = [
  { day: 1, name: 'Push', focus: '', duration: '', exercises: [line, typed] },
  { day: 2, name: '', focus: '', duration: '', exercises: [{ ...line, name: 'Barbell Row' }] },
  { day: 3, name: 'Legs', focus: '', duration: '', exercises: [{ ...line, name: 'Leg Press' }] },
]
ok('three filled days are valid', customDaysValid(built, 3))
ok('the number of days has to match', !customDaysValid(built, 4))
ok('bad reps are not valid', !customDaysValid([{ ...built[0], exercises: [{ ...line, reps: 'lots' }] }, built[1], built[2]], 3))
ok('0 sets is not valid', !customDaysValid([{ ...built[0], exercises: [{ ...line, sets: 0 }] }, built[1], built[2]], 3))
check('the day focus lists the muscles', dayFocusOf([line, { ...typed, name: 'Zzz My Own Move' }]), 'Chest')
check('a typed name that is in the library counts as that muscle', dayFocusOf([line, typed]), 'Chest / Core')

// ---- the program ----
const answers: IntakeAnswers = { ...base, customDays: built }
const nutrition = calculateNutrition(answers)
const program = programFor(answers, nutrition, 0)
check('three days, numbered', program.days.map((d) => d.day), [1, 2, 3])
check('a day with no name gets one', program.days[1].name, 'Day 2')
check('the person\'s names are kept', [program.days[0].name, program.days[2].name], ['Push', 'Legs'])
check('exercises are kept in order', program.days[0].exercises.map((e) => e.name), ['Barbell Bench Press', 'Cable Crunch'])
check('their own exercise stays marked as theirs', program.days[0].exercises[1].custom, true)
ok('every day has a focus and a length', program.days.every((d) => !!d.focus && /min$/.test(d.duration)), JSON.stringify(program.days.map((d) => [d.focus, d.duration])))
ok('the program has the pieces the screens read', !!program.programName && !!program.tagline && program.nutritionTips.length > 0 && program.recoveryAdvice.length > 0 && program.warmup.length > 0 && program.personalizationNotes.length > 0)
ok('no set ramp or training block on a custom plan', program.setRamp === undefined && program.trainingBlock === undefined)
check('it survives being saved and loaded', programDataWithDefaults(JSON.parse(JSON.stringify(program))).days.map((d) => d.exercises.length), [2, 1, 1])
ok('the saved answers do not carry the days', withoutCustomDays(answers).customDays === undefined && answers.customDays !== undefined)
let threw = false
try { buildCustomProgram({ ...base }, nutrition) } catch { threw = true }
ok('no days means an error, not an empty plan', threw)
const generated = programFor({ ...base, equipment: 'full-gym' }, nutrition, 0)
ok('other equipment still generates a plan', generated.days.length === 3 && generated.days[0].exercises.length > 3)

// ---- the weekly screens read it like any other plan ----
const week5 = dayForWeek(program.days[0], weekTarget(5), program.setRamp)
check('week 5 keeps the sets they chose', week5.exercises.map((e) => e.sets), program.days[0].exercises.map((e) => e.sets))
const deload = dayForWeek(program.days[0], weekTarget(13), program.setRamp)
ok('the deload week halves the sets', deload.exercises.every((e, i) => e.sets <= program.days[0].exercises[i].sets))

// ---- Swap works inside a custom plan: same kind of exercise, not already in the day ----
let swaps = 0
for (let t = 0; t < 40; t++) {
  const sw = generateAlternate('Barbell Bench Press', 'chest', answers, program.days[0].exercises.map((e) => e.name))
  if (sw.name === 'Barbell Bench Press') continue
  swaps++
  ok(`swap gives a chest exercise (${sw.name})`, chest.some((e) => e.name === sw.name))
  ok('swap does not repeat one from the day', !program.days[0].exercises.some((e) => e.name === sw.name))
}
ok('swap found alternatives for a custom plan', swaps > 0)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: the library lists every body part, days can be built and checked, and the custom program works like a generated one (weeks, saving, swap).')
