import type {
  ActivityLevel,
  Goal,
  IntakeAnswers,
  NutritionPlan,
  RecoveryTier,
  SleepHours,
  SleepQuality,
  StressLevel,
} from './types'

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary (desk job, little movement)' },
  light: { factor: 1.375, label: 'Lightly Active (light exercise 1-3 days/wk)' },
  moderate: { factor: 1.55, label: 'Moderately Active (on your feet most of the day)' },
  active: { factor: 1.725, label: 'Active (physical job or daily training)' },
  athlete: { factor: 1.9, label: 'Athlete (intense daily training)' },
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.453592
}

export function kgToLbs(kg: number): number {
  return kg / 0.453592
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54
}

export function calculateBMR(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel].factor)
}

const SLEEP_HOURS_SCORE: Record<SleepHours, number> = {
  '<5': -10,
  '5-6': 0,
  '6-7': 10,
  '7-8': 20,
  '8+': 30,
}

const SLEEP_QUALITY_SCORE: Record<SleepQuality, number> = {
  poor: -10,
  fair: 0,
  good: 10,
  excellent: 20,
}

const STRESS_SCORE: Record<StressLevel, number> = {
  low: 10,
  moderate: 0,
  high: -8,
  'very-high': -16,
}

export function calculateRecoveryScore(
  sleepHours: SleepHours,
  sleepQuality: SleepQuality,
  stressLevel: StressLevel,
): number {
  const raw =
    50 + SLEEP_HOURS_SCORE[sleepHours] + SLEEP_QUALITY_SCORE[sleepQuality] + STRESS_SCORE[stressLevel]
  return Math.max(0, Math.min(100, raw))
}

/** Points each answer contributed to the recovery score — used to show users the math. */
export function getRecoveryBreakdown(answers: Pick<IntakeAnswers, 'sleepHours' | 'sleepQuality' | 'stressLevel'>) {
  const sleepHours = SLEEP_HOURS_SCORE[answers.sleepHours]
  const sleepQuality = SLEEP_QUALITY_SCORE[answers.sleepQuality]
  const stress = STRESS_SCORE[answers.stressLevel]
  return { base: 50, sleepHours, sleepQuality, stress, raw: 50 + sleepHours + sleepQuality + stress }
}

export type RecoveryStyle = 'strength' | 'mind-body'

export function getRecoveryTier(score: number, style: RecoveryStyle = 'strength'): RecoveryTier {
  const mindBody = style === 'mind-body'
  if (score < 50) {
    return {
      tier: 'Poor',
      score,
      volumeAdjustment: mindBody
        ? 'About 25% fewer poses per session, with gentler poses and more restorative holds. Skip anything that feels forced.'
        : 'Cut training volume by 25%. Prioritize compound lifts, drop isolation work.',
      extraRest: true,
      targetRIR: mindBody
        ? 'a gentle, easy effort. You should be able to breathe slowly and talk comfortably'
        : '3+ RIR (leave 3+ reps in the tank every set)',
    }
  }
  if (score < 70) {
    return {
      tier: 'Moderate',
      score,
      volumeAdjustment: mindBody
        ? 'About 10 to 15% fewer poses per session. Keep the effort comfortable and the breathing steady.'
        : 'Cut training volume by 10-15%. Keep intensity, trim total sets.',
      extraRest: true,
      targetRIR: mindBody ? 'a comfortable effort with steady breathing' : '2-3 RIR',
    }
  }
  if (score < 85) {
    return {
      tier: 'Good',
      score,
      volumeAdjustment: mindBody
        ? 'The standard program. Progress as planned.'
        : 'Standard programmed volume. Progress as planned.',
      extraRest: false,
      targetRIR: mindBody ? 'a moderate effort: challenging, but smooth and controlled' : '1-2 RIR',
    }
  }
  return {
    tier: 'Elite',
    score,
    volumeAdjustment: mindBody
      ? 'Room for a few extra poses per session and slightly longer holds.'
      : 'Cleared for +10-15% extra volume and higher training density.',
    extraRest: false,
    targetRIR: mindBody ? 'a strong effort, always controlled and never rushed' : '0-1 RIR on top sets',
  }
}

/** The macro split (share of calories) and the protein limits per kg of body weight. */
export const MACROS = { protein: 0.3, carbs: 0.4, fat: 0.3, proteinMinPerKg: 1.6, proteinMaxPerKg: 2.4 }

export function calculateNutrition(answers: IntakeAnswers): NutritionPlan {
  const weightKg = answers.weightUnit === 'lbs' ? lbsToKg(answers.weight) : answers.weight
  const heightCm = feetInchesToCm(answers.heightFeet, answers.heightInches)
  const bmr = calculateBMR(answers.sex, weightKg, heightCm, answers.age)
  const tdee = calculateTDEE(bmr, answers.activityLevel)

  const recoveryScore = calculateRecoveryScore(answers.sleepHours, answers.sleepQuality, answers.stressLevel)
  const recoveryTier = getRecoveryTier(recoveryScore)

  const goalMode = goalToMode(answers.goal)
  let calorieTarget: number
  if (goalMode === 'cutting') {
    const multiplier = recoveryTier.tier === 'Poor' ? 0.88 : 0.8
    calorieTarget = Math.round(tdee * multiplier)
  } else if (goalMode === 'bulking') {
    calorieTarget = Math.round(tdee * 1.1)
  } else {
    calorieTarget = tdee
  }

  // Macros: 30% protein, 40% carbs, 30% fat of the calories. Protein is kept within a sensible range for the person's
  // body weight (a very light person would get too little, a very heavy one far more than helps), and carbs and fat share
  // whatever calories are left in the same 40:30 proportion.
  const { proteinMinPerKg, proteinMaxPerKg } = MACROS
  const proteinG = Math.round(
    Math.min(Math.max((calorieTarget * MACROS.protein) / 4, weightKg * proteinMinPerKg), weightKg * proteinMaxPerKg),
  )
  const remainingKcal = Math.max(0, calorieTarget - proteinG * 4)
  const carbShare = MACROS.carbs / (MACROS.carbs + MACROS.fat)
  const carbsG = Math.round((remainingKcal * carbShare) / 4)
  const fatG = Math.round((remainingKcal * (1 - carbShare)) / 9)

  const weeklyShiftKcal = Math.round((calorieTarget - tdee) * 7)

  return {
    bmr,
    tdee,
    calorieTarget,
    proteinG,
    carbsG,
    fatG,
    weeklyShiftKcal,
    recoveryScore,
    recoveryTier: recoveryTier.tier,
  }
}

export function goalToMode(goal: Goal): 'cutting' | 'bulking' | 'maintenance' {
  if (goal === 'lose-weight') return 'cutting'
  if (goal === 'build-muscle') return 'bulking'
  return 'maintenance'
}

export const GOAL_LABELS: Record<Goal, string> = {
  'lose-weight': 'Lose Weight',
  'build-muscle': 'Build Muscle',
  'strength-power': 'Strength & Power',
  'body-recomposition': 'Body Recomposition',
}

export const GOAL_ACCENT_VAR: Record<Goal, string> = {
  'lose-weight': 'var(--goal-lose)',
  'build-muscle': 'var(--goal-muscle)',
  'strength-power': 'var(--goal-strength)',
  'body-recomposition': 'var(--goal-recomp)',
}

export const GOAL_TAILWIND_CLASS: Record<Goal, string> = {
  'lose-weight': 'text-goal-lose border-goal-lose/40 bg-goal-lose/10',
  'build-muscle': 'text-goal-muscle border-goal-muscle/40 bg-goal-muscle/10',
  'strength-power': 'text-goal-strength border-goal-strength/40 bg-goal-strength/10',
  'body-recomposition': 'text-goal-recomp border-goal-recomp/40 bg-goal-recomp/10',
}
