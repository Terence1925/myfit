import { GOAL_LABELS, getRecoveryTier } from '../tdee'
import type { Exercise, FocusArea, IntakeAnswers, NutritionPlan, ProgramData, ProgramDay } from '../types'
import { poolFor } from './exerciseLibrary'

function pick<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined
  return arr[seed % arr.length]
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

function exercisesPerMuscle(experience: IntakeAnswers['experience'], recoveryTier: string): number {
  const base = experience === '0-1' ? 2 : experience === '2-3' ? 3 : 3
  const adjusted = Math.round(base * volumeMultiplier(recoveryTier))
  return Math.max(1, Math.min(4, adjusted))
}

export function generateProgram(answers: IntakeAnswers, nutrition: NutritionPlan): ProgramData {
  const tier = getRecoveryTier(nutrition.recoveryScore)
  const scheme = repSchemeFor(answers.goal, answers.experience)
  const perMuscleCount = exercisesPerMuscle(answers.experience, tier.tier)

  const templates = splitForDays(answers.trainingDays)[0]
  const usedNames = new Set<string>()

  const days: ProgramDay[] = templates.map((template, dayIdx) => {
    const exercises: Exercise[] = []
    template.muscles.forEach((muscle, muscleIdx) => {
      const pool = poolFor(muscle, answers.equipment, answers.injuries).filter((e) => !usedNames.has(e.name))
      const count = muscle === 'core' ? Math.max(1, perMuscleCount - 1) : perMuscleCount
      const compounds = pool.filter((e) => e.compound)
      const isolations = pool.filter((e) => !e.compound)
      const chosenPool = [...compounds, ...isolations]

      for (let i = 0; i < count && i < chosenPool.length; i++) {
        const seed = dayIdx * 7 + muscleIdx * 3 + i
        const ex = chosenPool[i] ?? pick(chosenPool, seed)
        if (!ex) continue
        usedNames.add(ex.name)
        const isCompound = ex.compound && i === 0
        exercises.push({
          name: ex.name,
          sets: isCompound ? scheme.compoundSets : Math.max(2, scheme.compoundSets - 1),
          reps: isCompound ? scheme.compoundReps : scheme.accessoryReps,
          rest: isCompound ? scheme.rest : '60-75 sec',
          notes: isCompound
            ? `Target ${tier.targetRIR}. Focus on controlled tempo and full range of motion.`
            : `Isolation work — squeeze at peak contraction, ${tier.targetRIR}.`,
        })
      }
    })

    if (tier.extraRest && dayIdx % 2 === 1 && exercises.length > 4) {
      exercises.pop()
    }

    return {
      day: dayIdx + 1,
      name: template.name,
      focus: template.muscles.map((m) => m.replace('-', ' ')).join(' / '),
      duration: exercises.length > 6 ? '60-70 min' : '45-55 min',
      exercises,
    }
  })

  const goalLabel = GOAL_LABELS[answers.goal]
  const equipmentLabel = answers.equipment.replace(/-/g, ' ')

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

export function generateAlternate(
  exerciseName: string,
  muscle: FocusArea,
  answers: IntakeAnswers,
): Exercise {
  const pool = poolFor(muscle, answers.equipment, answers.injuries).filter((e) => e.name !== exerciseName)
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
  return {
    name: replacement.name,
    sets: replacement.compound ? scheme.compoundSets : Math.max(2, scheme.compoundSets - 1),
    reps: replacement.compound ? scheme.compoundReps : scheme.accessoryReps,
    rest: replacement.compound ? scheme.rest : '60-75 sec',
    notes: 'Swapped to match your equipment and target muscle group.',
  }
}
