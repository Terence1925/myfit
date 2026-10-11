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
  | 'dumbbells-only'
  | 'home-workout'
  | 'calisthenics'
  | 'resistance-bands'
  | 'yoga'
  | 'pilates'

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
  /** True while the Pro subscription is still inside its free trial (no payment taken yet). */
  subscriptionIsTrial?: boolean
  createdAt: string
}

export type Role = 'admin' | 'user'

export type ExerciseFormat = 'strength' | 'yoga' | 'pilates'

export interface Exercise {
  name: string
  /** Strength: working sets. Pilates: rounds. Yoga: always 1 (poses are held for time). */
  sets: number
  /** Strength / Pilates: rep range. Yoga (and timed Pilates moves): a time like "30-45 sec". */
  reps: string
  /** Empty for yoga and Pilates, which flow from one move to the next. */
  rest: string
  notes: string
  /** How to present it. Missing means strength (programs saved before yoga and Pilates existed). */
  format?: ExerciseFormat
  /** Do this on both sides, one after the other. */
  eachSide?: boolean
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
  /** Bullet points explaining how specific intake answers shaped this program. */
  personalizationNotes: string[]
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

export type DiscountCodeKind = 'campaign' | 'influencer'

export interface DiscountCode {
  id: string
  /** Always upper-case. What the customer types. */
  code: string
  /** Admin-facing name, e.g. "Summer sale". */
  label: string
  kind: DiscountCodeKind
  /** For influencer codes: who the code belongs to. */
  ownerName?: string
  /** Shown to users; the real price comes from the Google Play offer. */
  percentOff?: number
  /** Tag of the discounted offer created in Google Play Console. */
  offerTag: string
  maxRedemptions?: number
  expiresAt?: string
  active: boolean
  createdAt: string
}

export type NewDiscountCode = Omit<DiscountCode, 'id' | 'createdAt' | 'active'>

export interface CodeRedemption {
  id: string
  codeId: string
  userId: string
  redeemedAt: string
  /** Set once the user actually completes a purchase using the code. */
  subscribedAt?: string
  /** Which plan they bought with the code. */
  plan?: SubscriptionPeriod
}

/** What the app gets back after a customer enters a valid code. */
export interface AppliedCode {
  code: string
  label: string
  percentOff?: number
  offerTag: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** A food a person can pick, with its numbers for ONE serving. */
export interface FoodItem {
  id: string
  name: string
  /** What one serving is, e.g. "1 cup" or "1 piece". */
  serving: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  /** How much ONE serving weighs (grams) or measures (ml), when known. Lets people enter an exact amount. */
  amount?: number
  unit?: 'g' | 'ml'
  /** For a plate: what is on it, shown under the name. */
  note?: string
  source: 'ph' | 'fatsecret' | 'custom'
}

/** One thing a person ate. The numbers are already multiplied by `servings`. */
export interface FoodLogEntry {
  id: string
  userId: string
  /** The day it belongs to, as YYYY-MM-DD in the person's own time zone. */
  date: string
  meal: MealType
  name: string
  serving: string
  servings: number
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  createdAt: string
}
