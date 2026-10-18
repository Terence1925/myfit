import { GOAL_LABELS, getRecoveryTier } from '../tdee'
import { disciplineOf, type Discipline } from '../discipline'
import type { Exercise, FocusArea, IntakeAnswers, NutritionPlan, ProgramData, ProgramDay } from '../types'
import { EXERCISES, injuryAllows, isAllowed, type LibraryExercise, type MindBodyPhase } from './exerciseLibrary'
import { MIND_BODY_STYLE_BY_ID, weekdaysFor, type MindBodyStyle } from './mindBodyStyles'

// Yoga and mat Pilates programs. Unlike lifting, a session here is an ordered flow (warm-up, main
// poses, cool-down), moves are timed or counted gently rather than set up as sets with rest, and
// "volume" means how many poses are in a session.

type Kind = 'warmup' | 'main' | 'cooldown'
interface Section {
  kind: Kind
  phases: MindBodyPhase[]
  count: number
}
interface Theme {
  name: string
  focus: string
  /** Skip adding extra poses for focus areas (used for restorative days). */
  gentle?: boolean
  sections: Section[]
}

const warmup = (count: number): Section => ({ kind: 'warmup', phases: ['warmup'], count })
const main = (phase: MindBodyPhase, count: number): Section => ({ kind: 'main', phases: [phase], count })
const cooldown = (phase: MindBodyPhase, count: number): Section => ({ kind: 'cooldown', phases: [phase], count })

const YOGA_THEMES: Theme[] = [
  {
    name: 'Sun Salutation Flow',
    focus: 'full body / breath / mobility',
    sections: [warmup(2), main('flow', 2), main('standing', 3), main('fold', 1), cooldown('cooldown', 2)],
  },
  {
    name: 'Strength & Balance',
    focus: 'legs / core / balance',
    sections: [warmup(2), main('standing', 3), main('balance', 2), main('core', 2), cooldown('cooldown', 2)],
  },
  {
    name: 'Hips & Hamstrings',
    focus: 'hips / hamstrings / glutes',
    sections: [warmup(2), main('hips', 4), main('fold', 2), cooldown('cooldown', 2)],
  },
  {
    name: 'Core & Back Strength',
    focus: 'core / back / spine',
    sections: [warmup(2), main('core', 3), main('backbend', 3), main('twist', 1), cooldown('cooldown', 2)],
  },
  {
    name: 'Upper Body & Posture',
    focus: 'shoulders / chest / arms',
    sections: [warmup(2), main('upper', 4), main('backbend', 1), main('twist', 1), cooldown('cooldown', 2)],
  },
  {
    name: 'Restore & Stretch',
    focus: 'recovery / flexibility',
    gentle: true,
    sections: [warmup(1), main('fold', 2), main('hips', 2), main('twist', 1), cooldown('cooldown', 3)],
  },
]

const PILATES_THEMES: Theme[] = [
  {
    name: 'Core Foundations',
    focus: 'core / breath / posture',
    sections: [warmup(2), main('core', 5), cooldown('stretch', 1)],
  },
  {
    name: 'Glutes & Legs',
    focus: 'glutes / legs / hips',
    sections: [warmup(2), main('lower', 5), main('core', 1), cooldown('stretch', 1)],
  },
  {
    name: 'Full-Body Flow',
    focus: 'full body / control',
    sections: [warmup(2), main('core', 2), main('lower', 2), main('upper', 2), cooldown('stretch', 1)],
  },
  {
    name: 'Back & Posture',
    focus: 'back / shoulders / posture',
    sections: [warmup(2), main('back', 4), main('upper', 1), main('core', 1), cooldown('stretch', 2)],
  },
  {
    name: 'Core Control II',
    focus: 'core / obliques / stability',
    sections: [warmup(2), main('core', 5), main('back', 1), cooldown('stretch', 1)],
  },
  {
    name: 'Upper Body & Stretch',
    focus: 'arms / shoulders / flexibility',
    sections: [warmup(1), main('upper', 4), main('back', 2), cooldown('stretch', 2)],
  },
]

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const BY_NAME = new Map(EXERCISES.map((e) => [e.name, e]))
const MIN_PER_SESSION: Record<'yoga' | 'pilates', number> = { yoga: 8, pilates: 7 }

function volumeMultiplier(tier: string): number {
  if (tier === 'Poor') return 0.75
  if (tier === 'Moderate') return 0.88
  if (tier === 'Elite') return 1.12
  return 1
}

/** One extra pose in the first matching section, so the goal changes the feel of each session. */
function bumpPhases(goal: IntakeAnswers['goal']): MindBodyPhase[] {
  if (goal === 'lose-weight') return ['flow', 'standing', 'lower', 'core']
  if (goal === 'build-muscle' || goal === 'strength-power') return ['core', 'balance', 'standing', 'upper', 'lower', 'back']
  return []
}

function holdRange(answers: IntakeAnswers): string {
  const [lo, hi] = answers.experience === '0-1' ? [20, 30] : answers.experience === '2-3' ? [30, 45] : [45, 60]
  const stronger = answers.goal === 'build-muscle' || answers.goal === 'strength-power' ? 10 : 0
  return `${lo + stronger}-${hi + stronger} sec`
}

function repRange(answers: IntakeAnswers): string {
  if (answers.experience === '0-1') return '6-8'
  if (answers.experience === '2-3') return '8-10'
  return '10-12'
}

function paceTip(answers: IntakeAnswers): string {
  if (answers.goal === 'lose-weight') return ' Keep a steady, flowing pace.'
  if (answers.goal === 'build-muscle' || answers.goal === 'strength-power') return ' Slow down: about 3 seconds up and 3 seconds down.'
  return ''
}

/** Turns a library move into a program entry, timed or counted the way that move is meant to be. */
export function buildMindBodyExercise(ex: LibraryExercise, answers: IntakeAnswers): Exercise {
  const discipline = disciplineOf(answers.equipment) === 'pilates' ? 'pilates' : 'yoga'
  const side = ex.eachSide ? ' Repeat on the other side.' : ''
  const cue = ex.cue ?? ''

  let reps: string
  switch (ex.timing) {
    case 'flow':
      reps = answers.goal === 'lose-weight' ? '90-120 sec' : '60-90 sec'
      break
    case 'restore':
      reps = '60-90 sec'
      break
    case 'final':
      reps = answers.experience === '0-1' ? '2-3 min' : '3-5 min'
      break
    case 'reps':
      reps = ex.fixedReps ?? repRange(answers)
      break
    default:
      reps = ex.fixedReps ?? holdRange(answers)
  }

  const repBased = ex.timing === 'reps' && !ex.fixedReps
  // Pilates rep moves are done in rounds; beginners do one, everyone else two.
  const sets = discipline === 'pilates' && repBased ? (answers.experience === '0-1' ? 1 : 2) : 1
  const pace = discipline === 'pilates' && (ex.timing === 'reps' || ex.timing === 'hold') ? paceTip(answers) : ''

  return {
    name: ex.name,
    sets,
    reps,
    rest: '',
    notes: `${cue}${side}${pace}`.trim(),
    format: discipline,
    eachSide: ex.eachSide,
  }
}

function themesFor(discipline: 'yoga' | 'pilates', days: number): Theme[] {
  const all = discipline === 'yoga' ? YOGA_THEMES : PILATES_THEMES
  return all.slice(0, Math.min(days, all.length))
}

function estimateDuration(count: number, discipline: 'yoga' | 'pilates'): string {
  const per = discipline === 'yoga' ? 4 : 4.5
  const low = Math.round((count * per) / 5) * 5
  return `${Math.max(25, low)}-${Math.max(25, low) + 10} min`
}

function buildDay(
  theme: Theme,
  dayNumber: number,
  answers: IntakeAnswers,
  tierName: string,
  discipline: 'yoga' | 'pilates',
  usedAcrossDays: Set<string>,
): ProgramDay {
  const inDay = new Set<string>()
  const chosen: LibraryExercise[] = []
  const closing: LibraryExercise[] = []

  const allowed = (ex: LibraryExercise) =>
    isAllowed(ex, answers.equipment, answers.injuries) && (answers.experience !== '0-1' || ex.level !== 'intermediate')

  const focusScore = (ex: LibraryExercise) => answers.focusAreas.filter((f) => ex.muscle.includes(f)).length

  const poolFor = (phases: MindBodyPhase[]) =>
    EXERCISES.filter(
      (ex) => ex.phases?.some((p) => phases.includes(p)) && allowed(ex) && !inDay.has(ex.name) && ex.name !== 'Savasana',
    )

  // Shuffled, then stably sorted so poses that match a focus area come first.
  const rank = (pool: LibraryExercise[]) => shuffle(pool).sort((a, b) => focusScore(b) - focusScore(a))

  const take = (list: LibraryExercise[], target: LibraryExercise[]) => {
    for (const ex of list) {
      inDay.add(ex.name)
      target.push(ex)
    }
  }

  const multiplier = volumeMultiplier(tierName)
  const bump = bumpPhases(answers.goal)
  let bumped = false

  for (const section of theme.sections) {
    if (section.kind === 'cooldown') continue
    let count = section.count
    if (section.kind === 'main') {
      count = Math.max(1, Math.round(count * multiplier))
      if (!bumped && section.phases.some((p) => bump.includes(p))) {
        count += 1
        bumped = true
      }
    }
    const pool = poolFor(section.phases)
    // Warm-ups can repeat from day to day, and always open with one calm breathing or rest move.
    // Main poses prefer ones not used on an earlier day.
    let ordered: LibraryExercise[]
    if (section.kind === 'warmup') {
      const calm = shuffle(pool.filter((e) => e.timing === 'restore')).slice(0, 1)
      ordered = [...calm, ...shuffle(pool.filter((e) => !calm.includes(e)))]
    } else {
      ordered = [...rank(pool.filter((e) => !usedAcrossDays.has(e.name))), ...rank(pool.filter((e) => usedAcrossDays.has(e.name)))]
    }
    take(ordered.slice(0, count), chosen)
  }

  // Make sure each focus area the person picked shows up in the session (restorative days stay gentle).
  if (!theme.gentle) {
    for (const focus of answers.focusAreas) {
      const covered = chosen.some((e) => e.muscle.includes(focus))
      if (covered) continue
      const candidates = EXERCISES.filter(
        (ex) =>
          allowed(ex) &&
          !inDay.has(ex.name) &&
          ex.name !== 'Savasana' &&
          ex.muscle.includes(focus) &&
          ex.phases?.some((p) => p !== 'warmup' && p !== 'cooldown'),
      )
      const fresh = candidates.filter((e) => !usedAcrossDays.has(e.name))
      const pick = shuffle(fresh.length > 0 ? fresh : candidates)[0]
      if (pick) take([pick], chosen)
    }
  }

  // Closing poses, finishing with the final rest in yoga.
  const closeSection = theme.sections.find((s) => s.kind === 'cooldown')
  if (closeSection) {
    const wantFinalRest = discipline === 'yoga'
    const finalRest = wantFinalRest ? BY_NAME.get('Savasana') : undefined
    const slots = Math.max(0, closeSection.count - (finalRest && allowed(finalRest) ? 1 : 0))
    take(shuffle(poolFor(closeSection.phases)).slice(0, slots), closing)
    if (finalRest && allowed(finalRest)) take([finalRest], closing)
  }

  // If an injury filtered out most of a section, top the session up so it doesn't feel empty.
  const minimum = MIN_PER_SESSION[discipline]
  if (chosen.length + closing.length < minimum) {
    const themePhases = theme.sections.filter((s) => s.kind === 'main').flatMap((s) => s.phases)
    const extras = EXERCISES.filter(
      (ex) =>
        allowed(ex) &&
        !inDay.has(ex.name) &&
        ex.name !== 'Savasana' &&
        ex.phases?.some((p) => p !== 'warmup' && p !== 'cooldown' && p !== 'stretch'),
    )
    const nearTheme = shuffle(extras.filter((e) => e.phases?.some((p) => themePhases.includes(p))))
    const rest = shuffle(extras.filter((e) => !e.phases?.some((p) => themePhases.includes(p))))
    for (const ex of [...nearTheme, ...rest]) {
      if (chosen.length + closing.length >= minimum) break
      take([ex], chosen)
    }
  }

  chosen.forEach((e) => {
    if (e.phases?.some((p) => p !== 'warmup' && p !== 'cooldown')) usedAcrossDays.add(e.name)
  })

  const exercises = [...chosen, ...closing].map((ex) => buildMindBodyExercise(ex, answers))
  return {
    day: dayNumber,
    name: theme.name,
    focus: theme.focus,
    duration: estimateDuration(exercises.length, discipline),
    exercises,
  }
}

const FOCUS_LABELS: Record<FocusArea, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  'full-body': 'Full Body',
}

const INJURY_LABELS: Record<Exclude<IntakeAnswers['injuries'], 'none'>, string> = {
  knee: 'knee',
  shoulder: 'shoulder',
  'lower-back': 'lower-back',
  other: 'unspecified',
}

// ---------------------------------------------------------------------------------------------------------------------
// Styled sessions (see mindBodyStyles.ts): the person picks a style (Beginner Yoga, Core Strength Pilates, ...) and how many
// days a week. Every session is that style's list of poses or moves, in order, on the plan's weekdays. Hold times are set
// so the whole session takes about as long as the style says.
// ---------------------------------------------------------------------------------------------------------------------

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/** "45-60 sec" for short holds, "1.5-2 min" for long ones. */
function holdLabel(seconds: number): string {
  const lo = seconds * 0.85
  const hi = seconds * 1.15
  if (hi >= 110) {
    const fmt = (s: number) => String(roundTo(s / 60, 0.5))
    return `${fmt(lo)}-${fmt(hi)} min`
  }
  return `${roundTo(lo, 5)}-${roundTo(hi, 5)} sec`
}

/** Swaps a move for a gentler one from the same part of a session when an injury rules it out. */
function styledStandIn(
  ex: LibraryExercise,
  style: MindBodyStyle,
  answers: IntakeAnswers,
  used: Set<string>,
): LibraryExercise | undefined {
  const pool = EXERCISES.filter(
    (e) =>
      e.equipment.includes(style.discipline) &&
      injuryAllows(e, answers.injuries) &&
      !used.has(e.name) &&
      !style.poses.includes(e.name) &&
      e.name !== 'Savasana' &&
      e.phases?.some((p) => ex.phases?.includes(p)) &&
      (style.experience !== '0-1' || e.level !== 'intermediate'),
  )
  const sameMuscle = pool.filter((e) => e.muscle.some((m) => ex.muscle.includes(m)))
  return shuffle(sameMuscle.length > 0 ? sameMuscle : pool)[0]
}

function styledSession(style: MindBodyStyle, answers: IntakeAnswers): { exercises: Exercise[]; swapped: number } {
  const used = new Set<string>()
  const moves: LibraryExercise[] = []
  let swapped = 0
  for (const name of style.poses) {
    const ex = BY_NAME.get(name)
    if (!ex) throw new Error(`${style.label}: "${name}" is not in the library`)
    let use: LibraryExercise | undefined = ex
    if (!injuryAllows(ex, answers.injuries)) {
      use = styledStandIn(ex, style, answers, used)
      swapped++
    }
    if (use) {
      used.add(use.name)
      moves.push(use)
    }
  }

  // The style sets the person's level (it decides the hold times and rounds)
  const asAnswers: IntakeAnswers = { ...answers, experience: style.experience }
  const built = moves.map((ex) => buildMindBodyExercise(ex, asAnswers))

  if (style.discipline === 'yoga') {
    const weight = (ex: LibraryExercise) => (ex.timing === 'flow' || ex.timing === 'restore' ? 1.5 : 1)
    const finalSeconds = style.minutes[0] < 20 ? 150 : 240
    const targetSeconds = ((style.minutes[0] + style.minutes[1]) / 2) * 60
    const timed = moves.filter((ex) => ex.timing !== 'final')
    const units = timed.reduce((sum, ex) => sum + weight(ex) * (ex.eachSide ? 2 : 1), 0)
    const finals = moves.length - timed.length
    const base = Math.min(150, Math.max(30, roundTo((targetSeconds - finals * finalSeconds) / Math.max(1, units), 5)))
    moves.forEach((ex, i) => {
      if (ex.timing === 'final') built[i].reps = finalSeconds === 150 ? '2-3 min' : '3-5 min'
      else built[i].reps = holdLabel(base * weight(ex))
    })
  }
  return { exercises: built, swapped }
}

export function generateStyledMindBodyProgram(answers: IntakeAnswers, nutrition: NutritionPlan): ProgramData | null {
  const style = answers.mindBodyStyle ? MIND_BODY_STYLE_BY_ID.get(answers.mindBodyStyle) : undefined
  if (!style || style.discipline !== (disciplineOf(answers.equipment) === 'pilates' ? 'pilates' : 'yoga')) return null

  const tier = getRecoveryTier(nutrition.recoveryScore, 'mind-body')
  const isYoga = style.discipline === 'yoga'
  const weekdays = weekdaysFor(answers.trainingDays)
  const { exercises, swapped } = styledSession(style, answers)
  if (exercises.length < 3) return null

  const [lo, hi] = style.minutes
  const days: ProgramDay[] = weekdays.map((weekday, i) => ({
    day: i + 1,
    name: weekday,
    focus: style.label,
    duration: `${lo}-${hi} min`,
    exercises: exercises.map((e) => ({ ...e })),
  }))

  const moveWord = isYoga ? 'poses' : 'moves'
  const personalizationNotes: string[] = [
    `You chose ${style.label}: ${style.blurb} Each session takes about ${lo}-${hi} minutes and uses ${exercises.length} ${moveWord} in this order, so you can learn the sequence and flow through it.`,
    `${style.label} is usually done ${style.recommended}. Your ${answers.trainingDays} sessions a week fall on ${weekdays.join(', ')}.`,
    isYoga
      ? `Yoga needs only a mat. Poses are held for a set time (or flowed through) instead of counting sets and reps, and each pose comes with a note on how to make it easier.`
      : `Mat Pilates needs only a mat. Moves are counted in slow, controlled reps, and each move flows into the next, so there is no rest timer.`,
    style.goal === 'lose-weight'
      ? `Your calorie target on the Nutrition tab is a small deficit for weight loss. ${isYoga ? 'Yoga' : 'Pilates'} adds movement, strength and better recovery on top of it.`
      : `Your calorie target on the Nutrition tab keeps your weight steady. ${isYoga ? 'Yoga' : 'Pilates'} builds strength, control and recovery.`,
  ]
  if (answers.injuries !== 'none') {
    personalizationNotes.push(
      answers.injuries === 'other'
        ? `You noted a limitation outside our specific categories, so only the gentlest moves are used. Always stop anything that doesn't feel right and check with a professional about your case.`
        : `You noted a ${INJURY_LABELS[answers.injuries]} limitation, so ${swapped > 0 ? `${swapped} ${swapped === 1 ? 'move that loads' : 'moves that load'} that area ${swapped === 1 ? 'was' : 'were'} swapped for a gentler one from the same part of the session` : 'every move in this session is already gentle on that area'}. Always stop anything that causes sharp pain.`,
    )
  }
  personalizationNotes.push(
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier), calculated from your sleep, stress, and activity answers. ${tier.volumeAdjustment}`,
  )

  const nutritionTips = [
    `Hit ${nutrition.calorieTarget} kcal/day with ${nutrition.proteinG}g protein to support this program's recovery demands.`,
    `Split protein evenly across 3-4 meals, roughly ${Math.round(nutrition.proteinG / 4)}g per meal keeps muscle repair going all day.`,
    `Carbs (${nutrition.carbsG}g) fuel your ${style.label.toLowerCase()} sessions without excess fat gain.`,
    `Fat intake of ${nutrition.fatG}g supports hormone production, so don't drop it further even in a deficit.`,
  ]
  const recoveryAdvice = [
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier). ${tier.volumeAdjustment}`,
    tier.extraRest
      ? 'An extra rest or active-recovery day is a good idea this week: a walk or some gentle stretching is perfect.'
      : 'Your recovery capacity supports the full program, so no extra rest days are needed.',
    'Prioritize 7-9 hours of sleep. Your recovery score recalculates each time you create a new program.',
    'Move into each pose slowly and stop if you feel sharp or pinching pain. A stretch should feel like gentle pulling, never pain.',
  ]

  return {
    programName: `${style.label} Program`,
    tagline: `${answers.trainingDays} sessions a week of ${style.label.toLowerCase()}, about ${lo}-${hi} minutes each`,
    overview: `This program is ${style.label} (${lo}-${hi} minutes a session), ${answers.trainingDays} days a week on ${weekdays.join(', ')}. Every session follows the same ${exercises.length}-${isYoga ? 'pose' : 'move'} sequence so it becomes familiar and you can go deeper each week.`,
    personalizationNotes,
    weeklyVolume: `${exercises.length} ${moveWord} a session, ${answers.trainingDays} sessions a week (about ${lo * answers.trainingDays}-${hi * answers.trainingDays} minutes)`,
    progressionStrategy: isYoga
      ? 'Do the same sequence each session and add 5-10 seconds to each hold every week or two as the poses feel steadier. Move on to the harder variation of a pose only when it feels easy.'
      : 'Once you can do every rep with control, add 2 reps, then a second round, before trying harder variations such as straightening your legs.',
    nutritionTips,
    recoveryAdvice,
    warmup: isYoga
      ? [
          'Arrive on your mat and take 5 slow breaths to settle in',
          'Gentle neck and shoulder rolls to loosen up',
          'Move slowly at first. Your body is warmer and more flexible after a few minutes',
        ]
      : [
          'Lie on your back and take 5 deep breaths into your ribs',
          'Gentle knee hugs and hip circles to wake up your hips',
          'Move slowly at first and keep your lower back comfortable on the mat',
        ],
    cooldown: isYoga
      ? [
          'Finish in Savasana (lying flat) and let your body fully relax',
          'Take a few slow breaths and notice how you feel',
          'Drink some water, and eat protein within about an hour if you are hungry',
        ]
      : [
          'Finish with a gentle stretch and a few deep breaths',
          'Roll slowly onto your side before you sit up',
          'Drink some water, and eat protein within about an hour if you are hungry',
        ],
    days,
  }
}

export function generateMindBodyProgram(answers: IntakeAnswers, nutrition: NutritionPlan): ProgramData {
  // A person who picked a style gets that style's session; programs saved before styles existed use the themed builder below.
  const styled = generateStyledMindBodyProgram(answers, nutrition)
  if (styled) return styled
  const discipline: 'yoga' | 'pilates' = disciplineOf(answers.equipment) === 'pilates' ? 'pilates' : 'yoga'
  const tier = getRecoveryTier(nutrition.recoveryScore, 'mind-body')
  const goalLabel = GOAL_LABELS[answers.goal]
  const themes = themesFor(discipline, answers.trainingDays)
  const usedAcrossDays = new Set<string>()
  const days = themes.map((theme, i) => buildDay(theme, i + 1, answers, tier.tier, discipline, usedAcrossDays))
  const isYoga = discipline === 'yoga'
  const styleName = isYoga ? 'Yoga' : 'Mat Pilates'
  const totalMoves = days.reduce((sum, d) => sum + d.exercises.length, 0)

  const goalReasoning: Record<Discipline, Record<IntakeAnswers['goal'], string>> = {
    yoga: {
      'lose-weight': `Your goal is Lose Weight, so your sessions lean on flowing sequences and standing poses that keep your heart rate up, with longer flows between holds. Pair this with the calorie target on the Nutrition tab.`,
      'build-muscle': `Your goal is Build Muscle, so holds are longer and sessions include more standing, balance and core poses that challenge your muscles. Yoga builds lean strength and control rather than maximum size, so it works best alongside good nutrition.`,
      'strength-power': `Your goal is Strength & Power, so holds are longer and sessions emphasize standing, balance, core and arm-supported poses that build strength and stability.`,
      'body-recomposition': `Your goal is Body Recomposition, so sessions mix flowing movement with longer strength holds, while your nutrition targets (Nutrition tab) handle the fat-loss side.`,
    },
    pilates: {
      'lose-weight': `Your goal is Lose Weight, so moves are done at a steady, flowing pace with two rounds once you are past the beginner level. Pair this with the calorie target on the Nutrition tab.`,
      'build-muscle': `Your goal is Build Muscle, so each rep is slow and controlled (about 3 seconds up and 3 seconds down), which makes small-muscle work much harder. Pilates builds lean strength and control rather than maximum size.`,
      'strength-power': `Your goal is Strength & Power, so each rep is slow and controlled to build deep core and hip strength. Pilates builds stability and control rather than maximal strength.`,
      'body-recomposition': `Your goal is Body Recomposition, so sessions balance controlled strength work with flowing movement, while your nutrition targets (Nutrition tab) handle the fat-loss side.`,
    },
    strength: {} as Record<IntakeAnswers['goal'], string>,
  }

  const experienceNote =
    answers.experience === '0-1'
      ? `You're new to structured training, so the harder moves are left out and every move comes with an easier option. Focus on smooth breathing and good alignment before holding longer.`
      : answers.experience === '5+'
        ? `You have 5+ years of experience, so holds and reps are at the upper end and harder moves are included.`
        : `You have ${answers.experience} years of experience, so the program includes a mix of foundational and more challenging moves.`

  const personalizationNotes: string[] = [
    goalReasoning[discipline][answers.goal],
    experienceNote,
    isYoga
      ? `Yoga needs only a mat. Poses are held for a set time (or flowed through for about a minute) instead of counting sets and reps, and each session runs in order: warm-up, main poses, then a cool-down that ends in Savasana (a final lying-down rest).`
      : `Mat Pilates needs only a mat. Moves are counted in slow, controlled reps (a few are timed), and each move flows into the next, so there is no rest timer.`,
    `With ${answers.trainingDays} sessions a week, each day has its own theme (${days.map((d) => d.name).join(', ')}) so every part of the body gets attention without repeating the same session.`,
  ]

  if (answers.focusAreas.length > 0) {
    const labels = answers.focusAreas.map((f) => FOCUS_LABELS[f]).join(', ')
    personalizationNotes.push(
      `You flagged ${labels} as a focus area, so ${answers.focusAreas.length > 1 ? 'those areas get' : 'it gets'} extra moves that target ${answers.focusAreas.length > 1 ? 'them' : 'it'}, and the moves are added to sessions where they fit.`,
    )
  }

  if (answers.injuries !== 'none') {
    personalizationNotes.push(
      answers.injuries === 'other'
        ? `You noted a limitation outside our specific categories, so only the gentlest moves are included. Always stop anything that doesn't feel right and check with a professional about your case.`
        : `You noted a ${INJURY_LABELS[answers.injuries]} limitation, so moves that load that area have been filtered out of every day. Always stop anything that causes sharp pain.`,
    )
  }

  personalizationNotes.push(
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier), calculated from your sleep, stress, and activity answers. ${tier.volumeAdjustment}`,
  )

  const nutritionTips = [
    `Hit ${nutrition.calorieTarget} kcal/day with ${nutrition.proteinG}g protein to support this program's recovery demands.`,
    `Split protein evenly across 3-4 meals, roughly ${Math.round(nutrition.proteinG / 4)}g per meal keeps muscle repair going all day.`,
    `Carbs (${nutrition.carbsG}g) fuel your sessions for your ${goalLabel.toLowerCase()} goal without excess fat gain.`,
    `Fat intake of ${nutrition.fatG}g supports hormone production, so don't drop it further even in a deficit.`,
  ]

  const recoveryAdvice = [
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier). ${tier.volumeAdjustment}`,
    tier.extraRest
      ? 'An extra rest or active-recovery day is a good idea this week: a walk or some gentle stretching is perfect.'
      : 'Your recovery capacity supports the full program, so no extra rest days are needed.',
    'Prioritize 7-9 hours of sleep. Your recovery score recalculates each time you create a new program.',
    'Move into each pose slowly and stop if you feel sharp or pinching pain. A stretch should feel like gentle pulling, never pain.',
  ]

  return {
    programName: `${goalLabel} ${styleName} Program`,
    tagline: `${answers.trainingDays}-day ${isYoga ? 'yoga' : 'mat Pilates'} program built for your ${tier.tier.toLowerCase()} recovery capacity`,
    overview: `This program uses ${isYoga ? 'yoga' : 'mat Pilates'} across ${answers.trainingDays} sessions a week with ${goalLabel.toLowerCase()} as the main goal. Session length and intensity are matched to your ${answers.experience === '0-1' ? 'beginner' : answers.experience} experience level and your recovery score of ${nutrition.recoveryScore}/100.`,
    personalizationNotes,
    weeklyVolume: `${totalMoves} ${isYoga ? 'poses' : 'moves'} per week across ${answers.trainingDays} sessions`,
    progressionStrategy: isYoga
      ? answers.experience === '0-1'
        ? 'Add 5 seconds to each hold every week or two as poses feel steadier, before moving to harder variations.'
        : 'Increase hold times by 5-10 seconds over a few weeks, then try the harder variations of poses you already know.'
      : 'Once you can do every rep with control, add 2 reps, then a second round, before trying harder variations such as straightening your legs.',
    nutritionTips,
    recoveryAdvice,
    warmup: isYoga
      ? [
          'Arrive on your mat and take 5 slow breaths to settle in',
          'Gentle neck and shoulder rolls to loosen up',
          'Move slowly at first. Your body is warmer and more flexible after a few minutes',
        ]
      : [
          'Lie on your back and take 5 deep breaths into your ribs',
          'Gentle knee hugs and hip circles to wake up your hips',
          'Move slowly at first and keep your lower back comfortable on the mat',
        ],
    cooldown: isYoga
      ? [
          'Finish in Savasana (lying flat) and let your body fully relax',
          'Take a few slow breaths and notice how you feel',
          'Drink some water, and eat protein within about an hour if you are hungry',
        ]
      : [
          'Finish with a gentle stretch and a few deep breaths',
          'Roll slowly onto your side before you sit up',
          'Drink some water, and eat protein within about an hour if you are hungry',
        ],
    days,
  }
}

/**
 * A replacement for one move: from the same part of the session (so a warm-up is swapped for a warm-up),
 * preferring the same muscle area, and never one already in today's session.
 */
export function generateMindBodyAlternate(exerciseName: string, answers: IntakeAnswers, avoid: string[] = []): Exercise {
  const original = BY_NAME.get(exerciseName)
  const allowed = (ex: LibraryExercise) =>
    isAllowed(ex, answers.equipment, answers.injuries) &&
    (answers.experience !== '0-1' || ex.level !== 'intermediate') &&
    ex.name !== exerciseName &&
    !avoid.includes(ex.name)

  let pool = EXERCISES.filter(allowed)
  if (original?.phases) {
    const samePhase = pool.filter((ex) => ex.phases?.some((p) => original.phases?.includes(p)))
    if (samePhase.length > 0) pool = samePhase
    const sameMuscle = pool.filter((ex) => ex.muscle.some((m) => original.muscle.includes(m)))
    if (sameMuscle.length > 0) pool = sameMuscle
  }
  // The closing rest stays a closing pose.
  if (original?.timing === 'final') pool = pool.filter((ex) => ex.phases?.includes('cooldown'))

  const replacement = shuffle(pool)[0]
  if (!replacement || !original) {
    return {
      name: exerciseName,
      sets: 1,
      reps: '',
      rest: '',
      notes: 'No other move fits your goal and injury filter here. Keep the current one.',
      format: disciplineOf(answers.equipment) === 'pilates' ? 'pilates' : 'yoga',
    }
  }
  const built = buildMindBodyExercise(replacement, answers)
  return { ...built, notes: `${built.notes} (Swapped to fit the same part of your session.)`.trim() }
}
