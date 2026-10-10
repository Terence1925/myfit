import { GOAL_LABELS, getRecoveryTier } from '../tdee'
import type { Exercise, FocusArea, IntakeAnswers, NutritionPlan, ProgramData, ProgramDay } from '../types'
import { EXERCISES, isAllowed, poolFor, type LibraryExercise } from './exerciseLibrary'
import { disciplineOf, normalizeEquipment } from '../discipline'
import { generateMindBodyAlternate, generateMindBodyProgram } from './mindBodyGenerator'

function pick<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined
  return arr[seed % arr.length]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
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

function splitForDays(days: number): { name: string; muscles: FocusArea[] }[][] {
  if (days === 3) {
    return [
      [
        { name: 'Full Body A', muscles: ['legs', 'chest', 'back', 'core'] },
        { name: 'Full Body B', muscles: ['legs', 'shoulders', 'back', 'arms'] },
        { name: 'Full Body C', muscles: ['legs', 'chest', 'back', 'core'] },
      ],
    ]
  }
  if (days === 4) {
    return [
      [
        { name: 'Upper Body - Push Focus', muscles: ['chest', 'shoulders', 'arms'] },
        { name: 'Lower Body - Quad Focus', muscles: ['legs', 'core'] },
        { name: 'Upper Body - Pull Focus', muscles: ['back', 'arms', 'shoulders'] },
        { name: 'Lower Body - Posterior Chain', muscles: ['legs', 'glutes', 'core'] },
      ],
    ]
  }
  if (days === 5) {
    return [
      [
        { name: 'Push Day', muscles: ['chest', 'shoulders', 'arms'] },
        { name: 'Pull Day', muscles: ['back', 'arms'] },
        { name: 'Leg Day', muscles: ['legs', 'glutes'] },
        { name: 'Upper Body Volume', muscles: ['chest', 'back', 'shoulders'] },
        { name: 'Lower Body & Core', muscles: ['legs', 'glutes', 'core'] },
      ],
    ]
  }
  return [
    [
      { name: 'Push Day', muscles: ['chest', 'shoulders', 'arms'] },
      { name: 'Pull Day', muscles: ['back', 'arms'] },
      { name: 'Leg Day', muscles: ['legs', 'glutes'] },
      { name: 'Push Day II', muscles: ['chest', 'shoulders', 'arms'] },
      { name: 'Pull Day II', muscles: ['back', 'arms'] },
      { name: 'Leg Day II', muscles: ['legs', 'glutes', 'core'] },
    ],
  ]
}

function repSchemeFor(goal: IntakeAnswers['goal'], experience: IntakeAnswers['experience']) {
  if (goal === 'strength-power') {
    return { compoundReps: '3-5', accessoryReps: '6-8', rest: '2-3 min', compoundSets: experience === '0-1' ? 3 : 4 }
  }
  if (goal === 'lose-weight') {
    return { compoundReps: '8-12', accessoryReps: '12-15', rest: '45-60 sec', compoundSets: 3 }
  }
  if (goal === 'body-recomposition') {
    return { compoundReps: '6-10', accessoryReps: '10-14', rest: '60-90 sec', compoundSets: 3 }
  }
  return { compoundReps: '6-10', accessoryReps: '8-12', rest: '75-90 sec', compoundSets: experience === '5+' ? 4 : 3 }
}

function volumeMultiplier(recoveryTier: string): number {
  if (recoveryTier === 'Poor') return 0.75
  if (recoveryTier === 'Moderate') return 0.88
  if (recoveryTier === 'Elite') return 1.12
  return 1
}

function exercisesPerMuscle(experience: IntakeAnswers['experience'], recoveryTier: string, isFocus: boolean): number {
  const base = experience === '0-1' ? 2 : experience === '2-3' ? 3 : 3
  const adjusted = Math.round(base * volumeMultiplier(recoveryTier)) + (isFocus ? 1 : 0)
  return Math.max(1, Math.min(4, adjusted))
}

function holdTimeFor(experience: IntakeAnswers['experience']): string {
  if (experience === '0-1') return '20-30 sec'
  if (experience === '2-3') return '30-45 sec'
  return '45-60 sec'
}

// Muscles that get trained together on the same day in every split (push / pull / lower body).
// Used to slot a selected focus area into the day(s) it anatomically belongs on, even when the
// day template for this training-day count didn't already include it (e.g. glutes are absent
// from every day of the 3-day Full Body split).
//
// `anchors` (never includes "arms") are what actually identify a day as push/pull/lower-body —
// "arms" is deliberately excluded because it's trained on both push AND pull days in every split,
// so using it as an anchor would match either family and leak e.g. back work onto a push day.
// `members` is the full set of focus areas that belong to the family once it's been identified.
const MUSCLE_FAMILIES: { anchors: FocusArea[]; members: FocusArea[] }[] = [
  { anchors: ['chest', 'shoulders'], members: ['chest', 'shoulders', 'arms'] },
  { anchors: ['back'], members: ['back', 'arms'] },
  { anchors: ['legs'], members: ['legs', 'glutes'] },
]

function withFocusCoverage(
  templates: { name: string; muscles: FocusArea[] }[],
  focusAreas: FocusArea[],
): { name: string; muscles: FocusArea[]; injected: FocusArea[] }[] {
  return templates.map((day) => {
    const muscles = [...day.muscles]
    const injected: FocusArea[] = []
    for (const focus of focusAreas) {
      if (muscles.includes(focus)) continue
      // Full-body conditioning work (kettlebell swings, burpees, carries) fits as a finisher on
      // any training day, so it isn't restricted to a specific anatomical family like the others.
      if (focus === 'full-body') {
        muscles.push(focus)
        injected.push(focus)
        continue
      }
      const family = MUSCLE_FAMILIES.find((group) => group.members.includes(focus))
      if (family?.anchors.some((m) => muscles.includes(m))) {
        muscles.push(focus)
        injected.push(focus)
      }
    }
    return { ...day, muscles, injected }
  })
}

type DayTemplate = { name: string; muscles: FocusArea[]; injected: FocusArea[] }

/** How many days a week each focus muscle should be trained (or every day, on a 3-day plan). */
const FOCUS_DAYS_PER_WEEK = 3

/** A session longer than this is more than most people will finish. */
const MAX_EXERCISES_PER_DAY = 12

/**
 * A focus area only means something if it is trained often enough. After the anatomical placement above,
 * any focus muscle that still shows up on fewer than 3 days is added to more days as a finisher: the
 * lightest days first, and away from days that already train it so it gets recovery between sessions.
 */
function withFocusFrequency(templates: DayTemplate[], focusAreas: FocusArea[]): DayTemplate[] {
  const days = templates.map((d) => ({ ...d, muscles: [...d.muscles], injected: [...d.injected] }))
  const target = Math.min(FOCUS_DAYS_PER_WEEK, days.length)
  for (const focus of focusAreas) {
    if (focus === 'full-body') continue
    let have = days.filter((d) => d.muscles.includes(focus)).length
    while (have < target) {
      const candidates = days.filter((d) => !d.muscles.includes(focus))
      if (candidates.length === 0) break
      const neighbours = (d: DayTemplate) => {
        const i = days.indexOf(d)
        return [days[i - 1], days[i + 1]].filter((n) => n && n.muscles.includes(focus)).length
      }
      candidates.sort((a, b) => neighbours(a) - neighbours(b) || a.muscles.length - b.muscles.length)
      candidates[0].muscles.push(focus)
      candidates[0].injected.push(focus)
      have++
    }
  }
  return days
}

export function generateProgram(answers: IntakeAnswers, nutrition: NutritionPlan): ProgramData {
  // Yoga and Pilates are timed, flowing sessions rather than sets and reps, so they have their own builder.
  if (disciplineOf(answers.equipment) !== 'strength') return generateMindBodyProgram(answers, nutrition)

  const tier = getRecoveryTier(nutrition.recoveryScore)
  const scheme = repSchemeFor(answers.goal, answers.experience)
  const holdTime = holdTimeFor(answers.experience)

  const templates = withFocusFrequency(
    withFocusCoverage(splitForDays(answers.trainingDays)[0], answers.focusAreas),
    answers.focusAreas,
  )
  const usedNames = new Set<string>()

  const makeEntry = (ex: LibraryExercise, isCompound: boolean, extraSet = false): Exercise => {
    if (ex.holdBased) {
      return {
        name: ex.name,
        sets: Math.max(2, scheme.compoundSets - 1),
        reps: holdTime,
        rest: '45-60 sec',
        notes: `Hold with a neutral spine and braced core — stop the set early if form breaks down.`,
        format: 'strength',
      }
    }
    return {
      name: ex.name,
      sets: Math.min(5, (isCompound ? scheme.compoundSets : Math.max(2, scheme.compoundSets - 1)) + (extraSet ? 1 : 0)),
      reps: isCompound ? scheme.compoundReps : scheme.accessoryReps,
      rest: isCompound ? scheme.rest : '60-75 sec',
      notes: isCompound
        ? `Target ${tier.targetRIR}. Focus on controlled tempo and full range of motion.`
        : `Isolation work — squeeze at peak contraction, ${tier.targetRIR}.`,
      format: 'strength',
    }
  }

  // A focus muscle gets an extra set on its exercises, unless recovery is poor and volume is being cut.
  const focusExtraSet = tier.tier !== 'Poor'

  interface Entry {
    exercise: Exercise
    muscle: FocusArea
    focus: boolean
    /** First exercise for its muscle that day (the main lift); never trimmed. */
    main: boolean
    injected: boolean
  }

  const days: ProgramDay[] = templates.map((template, dayIdx) => {
    const entries: Entry[] = []
    const natural = template.muscles.filter((m) => !template.injected.includes(m))
    const isFocusMuscle = (m: FocusArea) => answers.focusAreas.includes(m)
    // Focus muscles first, while you are fresh; core next-to-last; extra "finisher" work for focus
    // muscles that were added to this day comes last.
    const orderedMuscles: FocusArea[] = [
      ...natural.filter((m) => isFocusMuscle(m)),
      ...natural.filter((m) => !isFocusMuscle(m) && m !== 'core'),
      ...natural.filter((m) => !isFocusMuscle(m) && m === 'core'),
      ...template.injected,
    ]

    orderedMuscles.forEach((muscle, muscleIdx) => {
      const isFocus = isFocusMuscle(muscle)
      const injected = template.injected.includes(muscle)
      const perMuscleCount = exercisesPerMuscle(answers.experience, tier.tier, isFocus)
      const dayNames = new Set(entries.map((e) => e.exercise.name))
      const allForMuscle = poolFor(muscle, answers.equipment, answers.injuries).filter((e) => !dayNames.has(e.name))
      // Prefer exercises no earlier day has used. With limited equipment (or an injury) the fresh
      // pool runs out on 5-6 day splits, so fall back to reusing one rather than leaving a day empty.
      const fresh = allForMuscle.filter((e) => !usedNames.has(e.name))
      const reused = allForMuscle.filter((e) => usedNames.has(e.name))
      // A focus muscle added to a day that would not naturally train it is a finisher: 2 exercises
      // (1 when recovery is poor, and 1 for full-body conditioning). It stays small so the first day
      // to process the muscle cannot grab the whole exercise pool and starve the other days.
      const count = injected
        ? muscle === 'full-body' || tier.tier === 'Poor'
          ? 1
          : 2
        : muscle === 'core'
          ? Math.max(1, perMuscleCount - 1)
          : perMuscleCount
      // Shuffled (not just filtered) so two people with identical stats, or the same person
      // hitting Regenerate, do not get the exact same exercise selection every time. Compounds
      // stay ordered before isolations so slot 0 is reliably a compound lift when one is available.
      const ordered = (list: LibraryExercise[]) => [
        ...shuffle(list.filter((e) => e.compound)),
        ...shuffle(list.filter((e) => !e.compound)),
      ]
      // Exercises where this muscle is the main target come first. One that only works it as a side
      // effect (a back row also tagged "core") is a last resort, so a leg day does not fill up with
      // back work just because the muscle tags overlap.
      const isPrimary = (e: LibraryExercise) => e.muscle[0] === muscle
      const chosenPool = [
        ...ordered(fresh.filter(isPrimary)),
        ...ordered(reused.filter(isPrimary)),
        ...ordered(fresh.filter((e) => !isPrimary(e))),
        ...ordered(reused.filter((e) => !isPrimary(e))),
      ]

      for (let i = 0; i < count && i < chosenPool.length; i++) {
        const seed = dayIdx * 7 + muscleIdx * 3 + i
        const ex = chosenPool[i] ?? pick(chosenPool, seed)
        if (!ex) continue
        usedNames.add(ex.name)
        const isCompound = ex.compound && i === 0
        entries.push({
          exercise: makeEntry(ex, isCompound, isFocus && focusExtraSet),
          muscle,
          focus: isFocus,
          main: i === 0,
          injected,
        })
      }
    })

    // Focus work added to this day takes time, so trim the same number of accessory exercises for
    // other muscles from the end of the session (never a main lift, never a focus muscle).
    let toTrim = entries.filter((e) => e.injected).length
    while (toTrim > 0 && entries.length > 4) {
      let idx = -1
      for (let i = entries.length - 1; i >= 0; i--) {
        if (!entries[i].focus && !entries[i].main) {
          idx = i
          break
        }
      }
      if (idx === -1) break
      entries.splice(idx, 1)
      toTrim--
    }

    // Remove the last exercise that is neither a main lift nor focus work (or, failing that, the last
    // focus accessory), so cutting volume never removes the main lifts.
    const dropOne = () => {
      for (const keepFocus of [false, true]) {
        for (let i = entries.length - 1; i >= 0; i--) {
          const e = entries[i]
          if (!e.main && (keepFocus || !e.focus)) {
            entries.splice(i, 1)
            return true
          }
        }
      }
      return false
    }

    // Poor / moderate recovery: drop one exercise from every other session.
    if (tier.extraRest && dayIdx % 2 === 1 && entries.length > 4) dropOne()
    // Many focus areas can stack up; keep a session to a length people will actually finish.
    while (entries.length > MAX_EXERCISES_PER_DAY && dropOne()) {
      // dropOne() does the trimming
    }

    const exercises: Exercise[] = entries.map((e) => e.exercise)

    // Very limited equipment plus an injury can leave a day nearly empty. Top it up with whatever is
    // still safe and available instead of handing over an empty day.
    const addedMuscles: FocusArea[] = []
    if (exercises.length < 3) {
      const inDay = new Set(exercises.map((e) => e.name))
      const extras = shuffle(
        EXERCISES.filter(
          (e) =>
            isAllowed(e, answers.equipment, answers.injuries) &&
            !inDay.has(e.name) &&
            e.muscle.some((m) => m === 'core' || m === 'legs' || m === 'glutes' || m === 'full-body'),
        ),
      )
      const ordered = [...extras.filter((e) => e.compound), ...extras.filter((e) => !e.compound)]
      for (const ex of ordered) {
        if (exercises.length >= 4) break
        exercises.push(makeEntry(ex, ex.compound && exercises.length === 0))
        usedNames.add(ex.name)
        for (const m of ex.muscle) if (!addedMuscles.includes(m)) addedMuscles.push(m)
      }
    }

    return {
      day: dayIdx + 1,
      name: template.name,
      focus: [...orderedMuscles, ...addedMuscles.filter((m) => !orderedMuscles.includes(m))]
        .map((m) => m.replace('-', ' '))
        .join(' / '),
      duration: exercises.length > 6 ? '60-70 min' : '45-55 min',
      exercises,
    }
  })

  const goalLabel = GOAL_LABELS[answers.goal]
  const equipmentLabel = normalizeEquipment(answers.equipment).replace(/-/g, ' ')

  const splitTypeLabel =
    answers.trainingDays === 3
      ? 'Full Body'
      : answers.trainingDays === 4
        ? 'Upper/Lower'
        : answers.trainingDays === 5
          ? 'Push/Pull/Legs plus an accessory day'
          : 'Push/Pull/Legs, twice through the week'

  const goalReasoning: Record<IntakeAnswers['goal'], string> = {
    'lose-weight': `Your goal is Lose Weight, so compound lifts sit at ${scheme.compoundReps} reps with shorter ${scheme.rest} rest — that keeps training density high and calories burned per session up, while the rep range still protects the muscle you already have.`,
    'build-muscle': `Your goal is Build Muscle, so compound lifts are programmed at ${scheme.compoundReps} reps with ${scheme.rest} rest — the rep and rest ranges most associated with hypertrophy (muscle growth) rather than pure strength or endurance.`,
    'strength-power': `Your goal is Strength & Power, so compound lifts use a heavier ${scheme.compoundReps} rep range with a longer ${scheme.rest} rest — enough recovery between sets to lift closer to your max each time.`,
    'body-recomposition': `Your goal is Body Recomposition, so reps sit at a middle-ground ${scheme.compoundReps} with ${scheme.rest} rest — intense enough to build or hold onto muscle while your nutrition targets (Nutrition tab) handle the fat-loss side.`,
  }

  const experienceReasoning =
    answers.experience === '0-1'
      ? `You're early in structured training (0-1 years), so each muscle group gets fewer total exercises — more focus per movement while your technique and movement patterns build up.`
      : answers.experience === '5+'
        ? `You have 5+ years of training experience, so compound lifts carry an extra working set (${scheme.compoundSets} sets) to match the higher volume your training age can recover from.`
        : `You have ${answers.experience} years of training experience, so volume is set for steady, sustainable progress without overreaching.`

  const personalizationNotes: string[] = [
    goalReasoning[answers.goal],
    experienceReasoning,
    `With ${equipmentLabel} equipment across ${answers.trainingDays} training days a week, your split follows a ${splitTypeLabel} structure — the standard way to fit that many sessions in without hitting the same muscles on back-to-back days.`,
  ]

  if (answers.focusAreas.length > 0) {
    const labels = answers.focusAreas.map((f) => FOCUS_LABELS[f]).join(', ')
    const perWeek = Math.min(FOCUS_DAYS_PER_WEEK, answers.trainingDays)
    const frequency = perWeek >= answers.trainingDays ? 'in every session' : `at least ${perWeek} times a week`
    personalizationNotes.push(
      `You flagged ${labels} as a focus area, so ${answers.focusAreas.length > 1 ? 'those muscles are' : 'it is'} trained ${frequency}, placed early in the session while you are fresh, with an extra exercise and an extra set on its lifts. To keep sessions a reasonable length, a few accessory exercises for other muscles were trimmed to make room.`,
    )
  }

  if (answers.injuries !== 'none') {
    personalizationNotes.push(
      answers.injuries === 'other'
        ? `You noted a limitation outside our specific categories — the highest-load, highest-impact movements (heavy squats, deadlifts, plyometrics) have been excluded as a precaution, but always stop anything that doesn't feel right and check with a professional about your specific case.`
        : `You noted a ${INJURY_LABELS[answers.injuries]} limitation — exercises that load that area under heavy or unstable conditions have been filtered out in favor of joint-friendlier alternatives throughout every day of this program.`,
    )
  }

  personalizationNotes.push(
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier), calculated from your sleep, stress, and activity answers — ${tier.volumeAdjustment.charAt(0).toLowerCase()}${tier.volumeAdjustment.slice(1)}`,
  )

  const nutritionTips = [
    `Hit ${nutrition.calorieTarget} kcal/day with ${nutrition.proteinG}g protein to support this program's recovery demands.`,
    `Split protein evenly across 3-4 meals — roughly ${Math.round(nutrition.proteinG / 4)}g per meal keeps synthesis elevated all day.`,
    `Carbs (${nutrition.carbsG}g) are timed around training to fuel the ${goalLabel.toLowerCase()} workload without excess fat gain.`,
    `Fat intake of ${nutrition.fatG}g supports hormone production — don't drop it further even in a deficit.`,
  ]

  const recoveryAdvice = [
    `Your recovery score is ${nutrition.recoveryScore}/100 (${tier.tier} tier) — ${tier.volumeAdjustment}`,
    tier.extraRest
      ? 'An extra rest or active-recovery day has been built into this split — use it for walking, mobility, or light cardio.'
      : 'Your recovery capacity supports the full programmed volume — no extra rest days needed.',
    'Prioritize 7-9 hours of sleep on training nights; recovery score recalculates each time you regenerate a program.',
  ]

  return {
    programName: `${goalLabel} Protocol`,
    tagline: `${answers.trainingDays}-day ${equipmentLabel} program built for your ${tier.tier.toLowerCase()} recovery capacity`,
    overview: `This program is built around ${goalLabel.toLowerCase()} as the primary objective, using ${equipmentLabel} equipment across ${answers.trainingDays} training days per week. Volume and intensity are calibrated to your ${answers.experience === '0-1' ? 'beginner' : answers.experience} experience level and your current recovery score of ${nutrition.recoveryScore}/100.`,
    personalizationNotes,
    weeklyVolume: `${days.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0)} total working sets/week across ${answers.trainingDays} sessions`,
    progressionStrategy:
      answers.experience === '5+'
        ? 'Undulating periodization: alternate heavier/lower-rep weeks with volume weeks every 3-4 weeks, tracking RPE/RIR per set.'
        : answers.experience === '0-1'
          ? 'Linear progression: add weight or reps every session on compound lifts once all sets hit the top of the rep range.'
          : 'Double progression: increase reps within the target range first, then increase load and reset to the bottom of the range.',
    nutritionTips,
    recoveryAdvice,
    warmup: [
      '5 minutes light cardio (bike, row, or brisk walk) to raise core temperature',
      'Dynamic mobility for the joints trained that day (leg swings, arm circles, hip openers)',
      '1-2 light warm-up sets of the first compound lift before working weight',
    ],
    cooldown: [
      '5 minutes static stretching for the muscle groups trained',
      'Deep breathing / brief walk to bring heart rate down',
      'Log session RPE and how you felt for tomorrow\'s auto-regulation',
    ],
    days,
  }
}

// Subgroups that train an opposing/antagonist muscle despite sharing a broader `muscle` label
// (e.g. "legs" covers both quads and hamstrings). When the original exercise's subgroup has no
// same-subgroup alternative to fall back to, these are excluded before falling back further —
// better to offer a less-precise-but-still-quad match than to silently flip to hamstrings.
const OPPOSING_SUBGROUPS: Record<string, string[]> = {
  'quad-isolation': ['hamstring-isolation'],
  'hamstring-isolation': ['quad-isolation'],
}

export function generateAlternate(
  exerciseName: string,
  muscle: FocusArea,
  answers: IntakeAnswers,
  /** Names already in today's session, so a swap doesn't repeat one. */
  avoid: string[] = [],
): Exercise {
  if (disciplineOf(answers.equipment) !== 'strength') return generateMindBodyAlternate(exerciseName, answers, avoid)
  let pool = poolFor(muscle, answers.equipment, answers.injuries).filter((e) => e.name !== exerciseName)
  const withoutToday = pool.filter((e) => !avoid.includes(e.name))
  if (withoutToday.length > 0) pool = withoutToday
  // Prefer staying within the same specific movement (e.g. biceps vs triceps within "arms", or
  // which deltoid head within "shoulders") so a swap still feels like a reasonable substitute —
  // otherwise "arms" alone would happily swap a triceps exercise like Dip for a biceps one like
  // Barbell Curl, which share a muscle-group label but train opposite, unrelated movements.
  const original = EXERCISES.find((e) => e.name === exerciseName)
  if (original?.subgroup) {
    const narrowed = pool.filter((e) => e.subgroup === original.subgroup)
    if (narrowed.length > 0) {
      pool = narrowed
    } else {
      const opposing = OPPOSING_SUBGROUPS[original.subgroup]
      if (opposing) {
        const avoided = pool.filter((e) => !e.subgroup || !opposing.includes(e.subgroup))
        if (avoided.length > 0) pool = avoided
      }
    }
  }
  const replacement = pool[Math.floor(Math.random() * pool.length)]
  const scheme = repSchemeFor(answers.goal, answers.experience)
  if (!replacement) {
    return {
      name: exerciseName,
      sets: scheme.compoundSets,
      reps: scheme.compoundReps,
      rest: scheme.rest,
      notes: 'No equipment-compatible swap found — keep current exercise.',
    }
  }
  if (replacement.holdBased) {
    return {
      name: replacement.name,
      sets: Math.max(2, scheme.compoundSets - 1),
      reps: holdTimeFor(answers.experience),
      rest: '45-60 sec',
      notes: 'Swapped to match your equipment and target muscle group — hold with a neutral spine and braced core.',
    }
  }
  return {
    name: replacement.name,
    sets: replacement.compound ? scheme.compoundSets : Math.max(2, scheme.compoundSets - 1),
    reps: replacement.compound ? scheme.compoundReps : scheme.accessoryReps,
    rest: replacement.compound ? scheme.rest : '60-75 sec',
    notes: 'Swapped to match your equipment and target muscle group.',
  }
}
