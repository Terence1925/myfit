import type {
  ActivityLogEntry,
  AppliedCode,
  BodyMetricEntry,
  CodeRedemption,
  DiscountCode,
  Exercise,
  IntakeAnswers,
  NewDiscountCode,
  NutritionPlan,
  ProgramData,
  Profile,
  Role,
  SubscriptionPeriod,
  WorkoutProgram,
  WorkoutSession,
} from '../types'

export interface BillingResult {
  redirectUrl?: string
}

export interface AuthApi {
  signUp(email: string, password: string, displayName: string): Promise<Profile>
  signIn(email: string, password: string): Promise<Profile>
  /** Phone app: the Google account picker. Web: redirects to Google and returns null. */
  signInWithGoogle(): Promise<Profile | null>
  signOut(): Promise<void>
  currentSession(): Promise<Profile | null>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
  deleteAccount(): Promise<void>
}

export interface ProfilesApi {
  get(userId: string): Promise<Profile | null>
  saveIntake(userId: string, answers: IntakeAnswers, nutrition: NutritionPlan): Promise<Profile>
  listAll(): Promise<Profile[]>
}

export interface RolesApi {
  getRole(userId: string): Promise<Role>
  isAdmin(userId: string): Promise<boolean>
  listAdmins(): Promise<Profile[]>
  promote(userId: string): Promise<void>
  demote(userId: string): Promise<void>
}

export interface ProgramsApi {
  generate(userId: string, answers: IntakeAnswers): Promise<WorkoutProgram>
  alternate(userId: string, exerciseName: string, dayFocus: string, answers: IntakeAnswers, avoid?: string[]): Promise<Exercise>
  listForUser(userId: string): Promise<WorkoutProgram[]>
  listAll(): Promise<WorkoutProgram[]>
  get(id: string): Promise<WorkoutProgram | null>
  update(id: string, programData: ProgramData): Promise<void>
  delete(id: string, userId: string): Promise<void>
}

export interface ActivityApi {
  listForUser(userId: string): Promise<ActivityLogEntry[]>
  listAll(): Promise<ActivityLogEntry[]>
}

export interface MetricsApi {
  log(userId: string, entry: Omit<BodyMetricEntry, 'id' | 'userId'>): Promise<BodyMetricEntry>
  listForUser(userId: string): Promise<BodyMetricEntry[]>
  delete(id: string, userId: string): Promise<void>
}

export interface SessionsApi {
  save(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession>
  listForProgramDay(programId: string, day: number): Promise<WorkoutSession[]>
  listForUser(userId: string): Promise<WorkoutSession[]>
}

export interface BillingApi {
  subscribe(userId: string, period: SubscriptionPeriod): Promise<BillingResult>
  listActiveSubscribers(): Promise<Profile[]>
}

export interface CodesApi {
  /** Admin only. */
  listAll(): Promise<{ codes: DiscountCode[]; redemptions: CodeRedemption[] }>
  create(input: NewDiscountCode): Promise<DiscountCode>
  setActive(id: string, active: boolean): Promise<void>
  remove(id: string): Promise<void>
  /** Any signed-in user. Returns null for an unknown / expired / used-up code. */
  apply(code: string): Promise<AppliedCode | null>
}
