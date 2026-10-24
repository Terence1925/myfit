import type {
  ActivityLogEntry,
  AppliedCode,
  BodyMetricEntry,
  CodeRedemption,
  DiscountCode,
  Exercise,
  FoodItem,
  FoodLogEntry,
  IntakeAnswers,
  NewDiscountCode,
  NutritionPlan,
  ProgramData,
  Profile,
  Role,
  WorkoutProgram,
  WorkoutSession,
} from '../types'

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
  /** Admin only: permanently deletes another member and all of their data. */
  deleteMember(userId: string): Promise<void>
}

export interface ProfilesApi {
  get(userId: string): Promise<Profile | null>
  saveIntake(userId: string, answers: IntakeAnswers, nutrition: NutritionPlan): Promise<Profile>
  updateDisplayName(userId: string, displayName: string): Promise<Profile>
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

export interface FoodLogApi {
  listForDate(userId: string, date: string): Promise<FoodLogEntry[]>
  /** Everything logged from one date to another (both included, YYYY-MM-DD), oldest first. */
  listForRange(userId: string, from: string, to: string): Promise<FoodLogEntry[]>
  /** Every day the person has logged food on (YYYY-MM-DD), for badges. */
  listLoggedDates(userId: string): Promise<string[]>
  /** Recently logged foods (newest first, one per food), for quick re-adding. */
  listRecent(userId: string, limit?: number): Promise<FoodLogEntry[]>
  add(userId: string, entry: Omit<FoodLogEntry, 'id' | 'userId' | 'createdAt'>): Promise<FoodLogEntry>
  delete(id: string, userId: string): Promise<void>
  /** Search the online food databases (USDA FoodData Central and Open Food Facts). Rejects with a readable message when it can't. */
  searchOnline(query: string): Promise<FoodItem[]>
  /** The product behind a scanned barcode (free for everyone), or null when the databases do not know it. Rejects with a readable message when it can't look. */
  lookupBarcode(barcode: string): Promise<FoodItem | null>
}
