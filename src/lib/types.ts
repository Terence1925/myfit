export type Sex = 'male' | 'female'

export type ExperienceLevel = '0-1' | '2-3' | '3-5' | '5+'

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'athlete'

export type SleepHours = '<5' | '5-6' | '6-7' | '7-8' | '8+'

export type SleepQuality = 'excellent' | 'good' | 'fair' | 'poor'

export type StressLevel = 'low' | 'moderate' | 'high' | 'very-high'

export type TrainingDays = 3 | 4 | 5 | 6

export type Goal =
  | 'lose-weight'
  | 'build-muscle'
  | 'strength-power'
  | 'body-recomposition'

export type Equipment =
  | 'full-gym'
  | 'barbells-racks'
  | 'dumbbells-only'
  | 'machines-only'
  | 'home-workout'
  | 'calisthenics'
  | 'resistance-bands'

export type FocusArea =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full-body'

export type InjuryLimitation =
  | 'none'
  | 'knee'
  | 'shoulder'
  | 'lower-back'
  | 'other'

export interface IntakeAnswers {
  sex: Sex
  age: number
  weight: number
  weightUnit: 'lbs' | 'kg'
  heightFeet: number
  heightInches: number
  experience: ExperienceLevel
  activityLevel: ActivityLevel
  sleepHours: SleepHours
  sleepQuality: SleepQuality
  stressLevel: StressLevel
  trainingDays: TrainingDays
  goal: Goal
  equipment: Equipment
  focusAreas: FocusArea[]
  injuries: InjuryLimitation
}

export interface RecoveryTier {
  tier: 'Poor' | 'Moderate' | 'Good' | 'Elite'
  score: number
  volumeAdjustment: string
  extraRest: boolean
  targetRIR: string
}

export interface NutritionPlan {
  bmr: number
  tdee: number
  calorieTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  weeklyShiftKcal: number
  recoveryScore: number
  recoveryTier: RecoveryTier['tier']
}

export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionPeriod = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'canceled' | 'none'

export interface Profile {
  id: string
  displayName: string
  email: string
  sex?: Sex
  age?: number
  weightKg?: number
  heightCm?: number
  sleepHours?: SleepHours
  sleepQuality?: SleepQuality
  stressLevel?: StressLevel
  activityLevel?: ActivityLevel
  goal?: Goal
  bmr?: number
  tdee?: number
  calorieTarget?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  recoveryScore?: number
  subscriptionTier: SubscriptionTier
  subscriptionPeriod?: SubscriptionPeriod
  subscriptionStatus: SubscriptionStatus
  subscriptionRenewsAt?: string
  subscriptionStartedAt?: string
  createdAt: string
}

export type Role = 'admin' | 'user'

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes: string
}

export interface ProgramDay {
  day: number
  name: string
  focus: string
  duration: string
  exercises: Exercise[]
}

export interface ProgramData {
  programName: string
  tagline: string
  overview: string
  weeklyVolume: string
  progressionStrategy: string
  nutritionTips: string[]
  recoveryAdvice: string[]
  warmup: string[]
  cooldown: string[]
  days: ProgramDay[]
}

export interface WorkoutProgram {
  id: string
  userId: string
  programName: string
  programData: ProgramData
  answers: IntakeAnswers
  nutrition: NutritionPlan
  recoveryScore: number
  createdAt: string
  expiresAt: string
}

export interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface BodyMetricEntry {
  id: string
  userId: string
  date: string
  weightKg: number
  bodyFatPercent?: number
  notes?: string
}

export interface SetLog {
  setNumber: number
  weight: number | null
  reps: number | null
  completed: boolean
}

export interface ExerciseLog {
  name: string
  sets: SetLog[]
}

export interface WorkoutSession {
  id: string
  userId: string
  programId: string
  day: number
  dayName: string
  date: string
  exercises: ExerciseLog[]
}
