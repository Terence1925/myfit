import type { Exercise, FocusArea, IntakeAnswers, NutritionPlan, ProgramData, ProgramDay } from '../types'
import { EXERCISES } from './exerciseLibrary'
import { generateProgram } from './programGenerator'
import { goalLabelOf } from '../goalLabel'

const MUSCLE_BY_NAME = new Map(EXERCISES.map((e) => [e.name, e.muscle[0]]))

/** Reps as a number ("10"), a range ("8-12") or a time ("30 sec", "1 min"). */
export const REPS_PATTERN = /^(\d{1,3}(\s*-\s*\d{1,3})?|\d{1,3}\s*(sec|min))$/i

export function emptyDay(index: number): ProgramDay {
  return { day: index + 1, name: `Day ${index + 1}`, focus: '', duration: '', exercises: [] }
}

/** The days list made exactly `count` long: new empty days are added or the last ones dropped, and the rest are kept. */
export function ensureDays(days: ProgramDay[] | undefined, count: number): ProgramDay[] {
  const kept = (days ?? []).slice(0, count)
  while (kept.length < count) kept.push(emptyDay(kept.length))
  return kept
}

export function exerciseIsValid(e: Exercise): boolean {
  return !!e.name.trim() && Number.isInteger(e.sets) && e.sets >= 1 && e.sets <= 10 && REPS_PATTERN.test(e.reps.trim())
}

/** Every day has at least one exercise, and every exercise has sensible sets and reps. */
export function customDaysValid(days: ProgramDay[] | undefined, count: number | undefined): boolean {
  if (!days || !count || days.length !== count) return false
  return days.every((d) => d.exercises.length > 0 && d.exercises.every(exerciseIsValid))
}

const MUSCLE_LABELS: Record<FocusArea, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  'full-body': 'Full body',
}

/** "Chest / Back" for the muscles a day trains (exercises the person typed in have no known muscle). */
export function dayFocusOf(exercises: Exercise[]): string {
  const parts: FocusArea[] = []
  for (const e of exercises) {
    const m = MUSCLE_BY_NAME.get(e.name)
    if (m && !parts.includes(m)) parts.push(m)
  }
  return parts.length > 0 ? parts.map((m) => MUSCLE_LABELS[m]).join(' / ') : 'Your choice'
}

/** A rough session length from the number of sets, as a range ("35-45 min"). */
export function dayDurationOf(exercises: Exercise[]): string {
  const sets = exercises.reduce((sum, e) => sum + e.sets, 0)
  const low = Math.max(20, Math.round((5 + sets * 2.5) / 5) * 5)
  return `${low}-${low + 10} min`
}

/** The answers without the days built in the last step (those belong to the program, not to the saved answers). */
export function withoutCustomDays(answers: IntakeAnswers): IntakeAnswers {
  const copy = { ...answers }
  delete copy.customDays
  return copy
}

/** A program from the days the person built themselves, with the same nutrition and recovery pieces as a generated one. */
export function buildCustomProgram(answers: IntakeAnswers, nutrition: NutritionPlan): ProgramData {
  const built = answers.customDays ?? []
  if (built.length === 0) throw new Error('Build at least one day first.')
  const days: ProgramDay[] = built.map((d, i) => ({
    day: i + 1,
    name: d.name.trim() || `Day ${i + 1}`,
    focus: dayFocusOf(d.exercises),
    duration: dayDurationOf(d.exercises),
    exercises: d.exercises,
  }))
  const goal = goalLabelOf(answers)
  const totalSets = days.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0)
  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)
  return {
    programName: 'My Custom Plan',
    tagline: `${days.length}-day plan you built yourself`,
    overview: `You built this ${days.length}-day program yourself, with ${totalExercises} exercises. Your calories and macros are set for ${goal.toLowerCase()}, and your recovery score is ${nutrition.recoveryScore}/100.`,
    personalizationNotes: [
      'You chose every exercise yourself, so this plan trains exactly what you wanted.',
      `Your goal is ${goal}, so the calorie and macro targets in your Nutrition tab are set to match it.`,
      `Your recovery score is ${nutrition.recoveryScore}/100 (${nutrition.recoveryTier} tier), calculated from your sleep, stress and activity answers.`,
    ],
    weeklyVolume: `${totalSets} sets a week across ${days.length} sessions`,
    progressionStrategy:
      'Add reps within your rep range first. When every set reaches the top of the range, add a little weight and start from the bottom of the range again.',
    nutritionTips: [
      `Hit ${nutrition.calorieTarget} kcal/day with ${nutrition.proteinG}g protein to support your training.`,
      `Split protein evenly across 3-4 meals, roughly ${Math.round(nutrition.proteinG / 4)}g per meal.`,
      `Carbs (${nutrition.carbsG}g) fuel your workouts and your recovery.`,
      `Fat intake of ${nutrition.fatG}g supports hormone production, so do not drop it further even in a deficit.`,
    ],
    recoveryAdvice: [
      `Your recovery score is ${nutrition.recoveryScore}/100 (${nutrition.recoveryTier} tier), calculated from your sleep, stress and activity.`,
      'Leave at least one full rest day a week, and avoid training the same muscles on back-to-back days.',
      'Prioritize 7-9 hours of sleep on training nights.',
    ],
    warmup: [
      '5 minutes light cardio (bike, row, or brisk walk) to raise core temperature',
      'Dynamic mobility for the joints trained that day (leg swings, arm circles, hip openers)',
      'Do 1-2 light warm-up sets of your first big lift before you add working weight',
    ],
    cooldown: [
      '5 minutes static stretching for the muscle groups trained',
      'Deep breathing / brief walk to bring heart rate down',
      'Note how hard the session felt and how your body feels, so you can adjust tomorrow',
    ],
    days,
  }
}

/** Builds the program for these answers: the person's own days for "Build my own", a generated plan for everything else. */
export function programFor(answers: IntakeAnswers, nutrition: NutritionPlan, finished: number): ProgramData {
  return answers.equipment === 'custom' ? buildCustomProgram(answers, nutrition) : generateProgram(answers, nutrition, finished)
}
