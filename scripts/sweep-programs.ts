// Temporary sweep (not part of npm test): builds a program for thousands of answer combinations and checks each one.
import { calculateNutrition, getRecoveryTier } from '../src/lib/tdee'
import { generateProgram } from '../src/lib/backend/programGenerator'
import { dayForWeek, weekTarget } from '../src/lib/weekPlan'
import { effortSentence, plainEffort } from '../src/lib/effortWords'
import type { Equipment, FocusArea, Goal, InjuryLimitation, IntakeAnswers, MindBodyStyleId, TrainingDays } from '../src/lib/types'

const problems: string[] = []
const warnings = new Map<string, number>()
const fail = (msg: string) => { if (problems.length < 40) problems.push(msg) }
const warn = (k: string) => warnings.set(k, (warnings.get(k) ?? 0) + 1)

const JARGON = /\b(RIR|RPE|TDEE|BMR|1RM|periodi[sz]ation|hypertrophy|macros?|compound lifts?|mesocycle|AMRAP|undulating)\b/i
const SOFT = /(isolation work|peak contraction|working sets|training age|time under tension)/i

const goals: Goal[] = ['lose-weight', 'build-muscle', 'strength-power', 'body-recomposition']
const exps = ['0-1', '2-3', '3-5', '5+'] as const
const injuries: InjuryLimitation[] = ['none', 'knee', 'shoulder', 'lower-back', 'other']
const focuses: FocusArea[][] = [[], ['chest'], ['legs', 'glutes'], ['full-body']]
const recov = [
  { sleepHours: '<5', sleepQuality: 'poor', stressLevel: 'very-high', activityLevel: 'sedentary' },
  { sleepHours: '6-7', sleepQuality: 'fair', stressLevel: 'moderate', activityLevel: 'moderate' },
  { sleepHours: '8+', sleepQuality: 'excellent', stressLevel: 'low', activityLevel: 'athlete' },
] as const
const lifting: Equipment[] = ['full-gym', 'dumbbells-only', 'home-workout', 'calisthenics', 'resistance-bands']
const yogaStyles: MindBodyStyleId[] = ['yoga-beginner', 'yoga-flexibility', 'yoga-stress-relief', 'yoga-weight-loss', 'yoga-morning', 'yoga-bedtime']
const pilatesStyles: MindBodyStyleId[] = ['pilates-beginner', 'pilates-core', 'pilates-full-body', 'pilates-weight-loss', 'pilates-flexibility']

let count = 0
function run(a: IntakeAnswers, label: string) {
  count++
  let p
  try {
    p = generateProgram(a, calculateNutrition(a))
  } catch (e) {
    fail(`${label}: threw ${(e as Error).message}`)
    return
  }
  const n = calculateNutrition(a)
  if (![n.calorieTarget, n.proteinG, n.carbsG, n.fatG, n.bmr, n.tdee].every((x) => Number.isFinite(x) && x > 0)) fail(`${label}: bad nutrition ${JSON.stringify(n)}`)
  const kcal = n.proteinG * 4 + n.carbsG * 4 + n.fatG * 9
  if (Math.abs(kcal - n.calorieTarget) / n.calorieTarget > 0.08) fail(`${label}: macros ${kcal} vs target ${n.calorieTarget}`)
  if (!p.days.length) fail(`${label}: no days`)
  if (p.days.length !== a.trainingDays) warn('days != trainingDays')
  for (const d of p.days) {
    if (!d.exercises.length) fail(`${label} day ${d.day}: no exercises`)
    const names = d.exercises.map((e) => e.name)
    if (new Set(names).size !== names.length) fail(`${label} day ${d.day}: duplicate exercise ${names.join(', ')}`)
    for (const e of d.exercises) {
      if (!e.name || !e.reps || (!e.rest && e.format === 'strength') || !Number.isInteger(e.sets) || e.sets < 1 || e.sets > 8) fail(`${label} ${e.name}: bad fields ${JSON.stringify({ sets: e.sets, reps: e.reps, rest: e.rest })}`)
      for (let w = 1; w <= 13; w++) {
        const shown = dayForWeek({ ...d, exercises: [e] }, weekTarget(w)).exercises[0]
        if (shown.notes && JARGON.test(shown.notes)) fail(`${label} week ${w} ${e.name}: jargon in note "${shown.notes}"`)
        if (shown.notes && SOFT.test(shown.notes)) warn('soft jargon in note: ' + (shown.notes.match(SOFT)?.[0] ?? '').toLowerCase())
        if (w === 13 && shown.sets > e.sets) fail(`${label} ${e.name}: deload added sets`)
        if (shown.sets < 1) fail(`${label} ${e.name}: week ${w} has ${shown.sets} sets`)
      }
    }
  }
  const anyP = p as unknown as Record<string, unknown>
  const text = [p.programName, anyP.personalizationNotes, p.progressionStrategy, p.weeklyVolume, p.warmup, p.cooldown, p.nutritionTips, p.recoveryAdvice, p.days.map((d) => d.exercises.map((e) => plainEffort(e.notes ?? '')))]
    .flat(3)
    .map((x) => (typeof x === 'string' ? x : JSON.stringify(x ?? '')))
    .join('\n')
  const m = text.match(JARGON)
  if (m) fail(`${label}: jargon "${m[0]}" in program text`)
  const soft = text.match(SOFT)
  if (soft) warn('soft jargon in program text: ' + soft[0].toLowerCase())
  JSON.parse(JSON.stringify(p))
}

for (const sex of ['male', 'female'] as const)
  for (const experience of exps)
    for (const goal of goals)
      for (const injuriesV of injuries)
        for (const [ri, r] of recov.entries())
          for (const focusAreas of focuses) {
            for (const equipment of lifting)
              for (const trainingDays of [3, 4, 5, 6] as TrainingDays[]) {
                if (focusAreas.length > 1 && trainingDays === 3 && ri === 1) continue
                run({ sex, age: 30, weight: 170, weightUnit: 'lbs', heightFeet: 5, heightInches: 10, experience, ...r, trainingDays, goal, equipment, focusAreas, injuries: injuriesV } as IntakeAnswers, `${equipment} ${trainingDays}d ${sex} ${experience} ${goal} ${injuriesV} rec${ri} [${focusAreas}]`)
              }
          }
for (const [equipment, styles, dayset] of [['yoga', yogaStyles, [2, 3, 5, 7]], ['pilates', pilatesStyles, [2, 3, 4, 5, 6]]] as const)
  for (const mindBodyStyle of styles)
    for (const trainingDays of dayset)
      for (const experience of exps)
        for (const [ri, r] of recov.entries())
          for (const injuriesV of injuries)
            run({ sex: 'female', age: 40, weight: 140, weightUnit: 'lbs', heightFeet: 5, heightInches: 5, experience, ...r, trainingDays, goal: 'lose-weight', equipment, focusAreas: [], injuries: injuriesV, mindBodyStyle } as IntakeAnswers, `${mindBodyStyle} ${trainingDays}d ${experience} rec${ri} ${injuriesV}`)

// every recovery score reads in plain words
for (let s = 0; s <= 100; s++) for (const style of ['strength', 'mind-body'] as const) {
  const t = getRecoveryTier(s, style)
  const line = effortSentence(t.targetRIR)
  if (JARGON.test(line) || JARGON.test(t.volumeAdjustment)) fail(`score ${s} ${style}: jargon in "${line}" / "${t.volumeAdjustment}"`)
}
// odd notes never crash the converter
for (const n of ['', 'RIR', '5 RIR', 'Target RIR', '0-1 RIR on top sets', 'x'.repeat(2000)]) plainEffort(n)

console.log(JSON.stringify({ programsChecked: count, problems: problems.length, firstProblems: problems.slice(0, 12), warnings: Object.fromEntries(warnings) }, null, 1))
process.exit(problems.length ? 1 : 0)
