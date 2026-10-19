import { calculateNutrition } from '../tdee'
import { isPro } from '../billing'
import type {
  AppliedCode,
  CodeRedemption,
  DiscountCode,
  NewDiscountCode,
  ActivityLogEntry,
  BodyMetricEntry,
  FoodItem,
  FoodLogEntry,
  IntakeAnswers,
  NutritionPlan,
  ProgramData,
  Profile,
  Role,
  WorkoutProgram,
  WorkoutSession,
} from '../types'
import { EXERCISES } from './exerciseLibrary'
import { generateAlternate, generateProgram } from './programGenerator'
import { readAll, readOne, removeKey, uid, writeAll, writeOne } from './storage'

interface StoredUser {
  id: string
  email: string
  password: string
}

interface RoleRow {
  userId: string
  role: Role
}

const SESSION_KEY = 'session'
const USERS_KEY = 'users'
const PROFILES_KEY = 'profiles'
const ROLES_KEY = 'roles'
const PROGRAMS_KEY = 'programs'
const ACTIVITY_KEY = 'activity'
const METRICS_KEY = 'metrics'
const SESSIONS_KEY = 'sessions'

const PROGRAM_LIFETIME_MS = 100 * 365 * 24 * 60 * 60 * 1000

function ensureSeedAdmin() {
  const users = readAll<StoredUser>(USERS_KEY)
  if (users.length > 0) return
  const adminId = uid()
  writeAll<StoredUser>(USERS_KEY, [
    { id: adminId, email: 'admin@myfit.app', password: 'admin123' },
  ])
  const profiles = readAll<Profile>(PROFILES_KEY)
  profiles.push({
    id: adminId,
    displayName: 'Founder Admin',
    email: 'admin@myfit.app',
    createdAt: new Date().toISOString(),
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionPeriod: 'yearly',
    subscriptionStartedAt: new Date().toISOString(),
  })
  writeAll(PROFILES_KEY, profiles)
  writeAll<RoleRow>(ROLES_KEY, [{ userId: adminId, role: 'admin' }])
}
ensureSeedAdmin()

function logActivity(userId: string, action: string, metadata: Record<string, unknown> = {}) {
  const log = readAll<ActivityLogEntry>(ACTIVITY_KEY)
  log.unshift({
    id: uid(),
    userId,
    action,
    metadata,
    createdAt: new Date().toISOString(),
  })
  writeAll(ACTIVITY_KEY, log.slice(0, 500))
}

export const auth = {
  async signUp(email: string, password: string, displayName: string): Promise<Profile> {
    const users = readAll<StoredUser>(USERS_KEY)
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.')
    }
    const id = uid()
    users.push({ id, email, password })
    writeAll(USERS_KEY, users)

    const allProfiles = readAll<Profile>(PROFILES_KEY)
    const profile: Profile = {
      id,
      displayName,
      email,
      createdAt: new Date().toISOString(),
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
    }
    allProfiles.push(profile)
    writeAll(PROFILES_KEY, allProfiles)

    const roleRows = readAll<RoleRow>(ROLES_KEY)
    roleRows.push({ userId: id, role: 'user' })
    writeAll(ROLES_KEY, roleRows)

    writeOne(SESSION_KEY, { userId: id })
    logActivity(id, 'signed_up', { displayName })
    return profile
  },

  async signIn(email: string, password: string): Promise<Profile> {
    const users = readAll<StoredUser>(USERS_KEY)
    const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!match) throw new Error('Invalid email or password.')
    writeOne(SESSION_KEY, { userId: match.id })
    const profile = await profiles.get(match.id)
    if (!profile) throw new Error('Profile not found.')
    logActivity(match.id, 'signed_in', {})
    return profile
  },

  async signInWithGoogle(): Promise<Profile | null> {
    throw new Error('Google sign-in needs the real backend and is not available in the demo.')
  },

  async signOut(): Promise<void> {
    const session = readOne<{ userId: string }>(SESSION_KEY)
    if (session) logActivity(session.userId, 'signed_out', {})
    removeKey(SESSION_KEY)
  },

  async currentSession(): Promise<Profile | null> {
    const session = readOne<{ userId: string }>(SESSION_KEY)
    if (!session) return null
    return profiles.get(session.userId)
  },

  // Demo mode has no real email delivery or recovery-session flow, so password reset can't
  // actually work here — surface a clear message instead of pretending it sent something.
  async requestPasswordReset(): Promise<void> {
    throw new Error('DEMO_MODE_NOT_SUPPORTED')
  },

  async updatePassword(): Promise<void> {
    throw new Error('DEMO_MODE_NOT_SUPPORTED')
  },

  async deleteMember(userId: string): Promise<void> {
    const session = readOne<{ userId: string }>(SESSION_KEY)
    if (!session) throw new Error('Not signed in.')
    const roleRows = readAll<RoleRow>(ROLES_KEY)
    if (!roleRows.some((r) => r.userId === session.userId && r.role === 'admin')) throw new Error('Only an admin can delete other members.')
    if (roleRows.some((r) => r.userId === userId && r.role === 'admin')) {
      throw new Error('This member is an admin. Remove their admin rights first, then delete them.')
    }
    const target = readAll<Profile>(PROFILES_KEY).find((p) => p.id === userId)
    if (!target) throw new Error('That member no longer exists.')

    writeAll(USERS_KEY, readAll<StoredUser>(USERS_KEY).filter((u) => u.id !== userId))
    writeAll(PROFILES_KEY, readAll<Profile>(PROFILES_KEY).filter((p) => p.id !== userId))
    writeAll(ROLES_KEY, readAll<RoleRow>(ROLES_KEY).filter((r) => r.userId !== userId))
    writeAll(PROGRAMS_KEY, readAll<WorkoutProgram>(PROGRAMS_KEY).filter((p) => p.userId !== userId))
    writeAll(ACTIVITY_KEY, readAll<ActivityLogEntry>(ACTIVITY_KEY).filter((a) => a.userId !== userId))
    writeAll(METRICS_KEY, readAll<BodyMetricEntry>(METRICS_KEY).filter((m) => m.userId !== userId))
    writeAll(SESSIONS_KEY, readAll<WorkoutSession>(SESSIONS_KEY).filter((s) => s.userId !== userId))
    logActivity(session.userId, 'deleted_member', { email: target.email, name: target.displayName })
  },

  async deleteAccount(): Promise<void> {
    const session = readOne<{ userId: string }>(SESSION_KEY)
    if (!session) throw new Error('Not signed in.')
    const userId = session.userId

    writeAll(USERS_KEY, readAll<StoredUser>(USERS_KEY).filter((u) => u.id !== userId))
    writeAll(PROFILES_KEY, readAll<Profile>(PROFILES_KEY).filter((p) => p.id !== userId))
    writeAll(ROLES_KEY, readAll<RoleRow>(ROLES_KEY).filter((r) => r.userId !== userId))
    writeAll(PROGRAMS_KEY, readAll<WorkoutProgram>(PROGRAMS_KEY).filter((p) => p.userId !== userId))
    writeAll(ACTIVITY_KEY, readAll<ActivityLogEntry>(ACTIVITY_KEY).filter((a) => a.userId !== userId))
    writeAll(METRICS_KEY, readAll<BodyMetricEntry>(METRICS_KEY).filter((m) => m.userId !== userId))
    writeAll(SESSIONS_KEY, readAll<WorkoutSession>(SESSIONS_KEY).filter((s) => s.userId !== userId))
    removeKey(SESSION_KEY)
  },
}

export const profiles = {
  async get(userId: string): Promise<Profile | null> {
    return readAll<Profile>(PROFILES_KEY).find((p) => p.id === userId) ?? null
  },

  async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    const all = readAll<Profile>(PROFILES_KEY)
    const idx = all.findIndex((p) => p.id === userId)
    if (idx === -1) throw new Error('Profile not found.')
    all[idx] = { ...all[idx], displayName }
    writeAll(PROFILES_KEY, all)
    return all[idx]
  },

  async saveIntake(userId: string, answers: IntakeAnswers, nutrition: NutritionPlan): Promise<Profile> {
    const all = readAll<Profile>(PROFILES_KEY)
    const idx = all.findIndex((p) => p.id === userId)
    if (idx === -1) throw new Error('Profile not found.')
    const weightKg = answers.weightUnit === 'lbs' ? answers.weight * 0.453592 : answers.weight
    const heightCm = (answers.heightFeet * 12 + answers.heightInches) * 2.54
    all[idx] = {
      ...all[idx],
      sex: answers.sex,
      age: answers.age,
      weightKg: Math.round(weightKg * 10) / 10,
      heightCm: Math.round(heightCm),
      sleepHours: answers.sleepHours,
      sleepQuality: answers.sleepQuality,
      stressLevel: answers.stressLevel,
      activityLevel: answers.activityLevel,
      goal: answers.goal,
      bmr: nutrition.bmr,
      tdee: nutrition.tdee,
      calorieTarget: nutrition.calorieTarget,
      proteinG: nutrition.proteinG,
      carbsG: nutrition.carbsG,
      fatG: nutrition.fatG,
      recoveryScore: nutrition.recoveryScore,
    }
    writeAll(PROFILES_KEY, all)
    logActivity(userId, 'completed_intake', { goal: answers.goal, recoveryScore: nutrition.recoveryScore })
    return all[idx]
  },

  async listAll(): Promise<Profile[]> {
    return readAll<Profile>(PROFILES_KEY)
  },
}

export const roles = {
  async getRole(userId: string): Promise<Role> {
    const row = readAll<RoleRow>(ROLES_KEY).find((r) => r.userId === userId)
    return row?.role ?? 'user'
  },

  async isAdmin(userId: string): Promise<boolean> {
    return (await roles.getRole(userId)) === 'admin'
  },

  async listAdmins(): Promise<Profile[]> {
    const adminIds = new Set(
      readAll<RoleRow>(ROLES_KEY)
        .filter((r) => r.role === 'admin')
        .map((r) => r.userId),
    )
    return readAll<Profile>(PROFILES_KEY).filter((p) => adminIds.has(p.id))
  },

  async promote(userId: string): Promise<void> {
    const all = readAll<RoleRow>(ROLES_KEY)
    const idx = all.findIndex((r) => r.userId === userId)
    if (idx === -1) all.push({ userId, role: 'admin' })
    else all[idx].role = 'admin'
    writeAll(ROLES_KEY, all)
    logActivity(userId, 'promoted_to_admin', {})
  },

  async demote(userId: string): Promise<void> {
    const all = readAll<RoleRow>(ROLES_KEY)
    const idx = all.findIndex((r) => r.userId === userId)
    if (idx === -1) all.push({ userId, role: 'user' })
    else all[idx].role = 'user'
    writeAll(ROLES_KEY, all)
    logActivity(userId, 'demoted_to_user', {})
  },
}

function purgeExpired(): void {
  const all = readAll<WorkoutProgram>(PROGRAMS_KEY)
  const now = Date.now()
  const active = all.filter((p) => new Date(p.expiresAt).getTime() > now)
  if (active.length !== all.length) writeAll(PROGRAMS_KEY, active)
}

export const programs = {
  async generate(userId: string, answers: IntakeAnswers): Promise<WorkoutProgram> {
    purgeExpired()
    const isAdmin = await roles.isAdmin(userId)
    const profile = await profiles.get(userId)
    const isProUser = isAdmin || isPro(profile)
    const existing = await programs.listForUser(userId)
    if (!isProUser && existing.length >= 1) {
      throw new Error('PROGRAM_LIMIT_REACHED')
    }
    const nutrition = calculateNutrition(answers)
    await profiles.saveIntake(userId, answers, nutrition)
    await new Promise((r) => setTimeout(r, 1400))
    const programData = generateProgram(answers, nutrition)
    const now = Date.now()
    const program: WorkoutProgram = {
      id: uid(),
      userId,
      programName: programData.programName,
      programData,
      answers,
      nutrition,
      recoveryScore: nutrition.recoveryScore,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + PROGRAM_LIFETIME_MS).toISOString(),
    }
    const all = readAll<WorkoutProgram>(PROGRAMS_KEY)
    all.push(program)
    writeAll(PROGRAMS_KEY, all)
    logActivity(userId, 'generated_program', { programName: program.programName })
    return program
  },

  async alternate(userId: string, exerciseName: string, dayFocus: string, answers: IntakeAnswers, avoid: string[] = []) {
    await new Promise((r) => setTimeout(r, 700))
    const muscle = (EXERCISES.find((e) => e.name === exerciseName)?.muscle[0] ??
      dayFocus.split(' / ')[0].replace(' ', '-')) as IntakeAnswers['focusAreas'][number]
    const swap = generateAlternate(exerciseName, muscle, answers, avoid)
    logActivity(userId, 'swapped_exercise', { from: exerciseName, to: swap.name })
    return swap
  },

  async listForUser(userId: string): Promise<WorkoutProgram[]> {
    purgeExpired()
    return readAll<WorkoutProgram>(PROGRAMS_KEY)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async listAll(): Promise<WorkoutProgram[]> {
    purgeExpired()
    return readAll<WorkoutProgram>(PROGRAMS_KEY).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async get(id: string): Promise<WorkoutProgram | null> {
    return readAll<WorkoutProgram>(PROGRAMS_KEY).find((p) => p.id === id) ?? null
  },

  async update(id: string, programData: ProgramData): Promise<void> {
    const all = readAll<WorkoutProgram>(PROGRAMS_KEY)
    const idx = all.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Program not found.')
    all[idx] = { ...all[idx], programName: programData.programName, programData }
    writeAll(PROGRAMS_KEY, all)
  },

  async delete(id: string, userId: string): Promise<void> {
    const all = readAll<WorkoutProgram>(PROGRAMS_KEY)
    writeAll(
      PROGRAMS_KEY,
      all.filter((p) => p.id !== id),
    )
    logActivity(userId, 'deleted_program', { programId: id })
  },
}

export const activity = {
  async listForUser(userId: string): Promise<ActivityLogEntry[]> {
    return readAll<ActivityLogEntry>(ACTIVITY_KEY).filter((a) => a.userId === userId)
  },

  async listAll(): Promise<ActivityLogEntry[]> {
    return readAll<ActivityLogEntry>(ACTIVITY_KEY)
  },
}

export const billing = {
  async listActiveSubscribers(): Promise<Profile[]> {
    return readAll<Profile>(PROFILES_KEY).filter(
      (p) => p.subscriptionTier === 'pro' && p.subscriptionStatus === 'active',
    )
  },
}

export const metrics = {
  async log(userId: string, entry: Omit<BodyMetricEntry, 'id' | 'userId'>): Promise<BodyMetricEntry> {
    const all = readAll<BodyMetricEntry>(METRICS_KEY)
    const record: BodyMetricEntry = { id: uid(), userId, ...entry }
    all.push(record)
    writeAll(METRICS_KEY, all)
    logActivity(userId, 'logged_body_metric', { weightKg: entry.weightKg })
    return record
  },

  async listForUser(userId: string): Promise<BodyMetricEntry[]> {
    return readAll<BodyMetricEntry>(METRICS_KEY)
      .filter((m) => m.userId === userId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  async delete(id: string, userId: string): Promise<void> {
    const all = readAll<BodyMetricEntry>(METRICS_KEY)
    writeAll(
      METRICS_KEY,
      all.filter((m) => m.id !== id),
    )
    logActivity(userId, 'deleted_body_metric', { metricId: id })
  },
}

export const sessions = {
  async save(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> {
    const all = readAll<WorkoutSession>(SESSIONS_KEY)
    const record: WorkoutSession = { id: uid(), ...session }
    all.push(record)
    writeAll(SESSIONS_KEY, all)
    logActivity(session.userId, 'logged_workout_session', { day: session.day, dayName: session.dayName })
    return record
  },

  async listForProgramDay(programId: string, day: number): Promise<WorkoutSession[]> {
    return readAll<WorkoutSession>(SESSIONS_KEY)
      .filter((s) => s.programId === programId && s.day === day)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async listForUser(userId: string): Promise<WorkoutSession[]> {
    return readAll<WorkoutSession>(SESSIONS_KEY)
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
}

const CODES_KEY = 'discount_codes'
const REDEMPTIONS_KEY = 'code_redemptions'

export const codes = {
  async listAll(): Promise<{ codes: DiscountCode[]; redemptions: CodeRedemption[] }> {
    return {
      codes: readAll<DiscountCode>(CODES_KEY).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      redemptions: readAll<CodeRedemption>(REDEMPTIONS_KEY),
    }
  },

  async create(input: NewDiscountCode): Promise<DiscountCode> {
    const all = readAll<DiscountCode>(CODES_KEY)
    const code = input.code.trim().toUpperCase()
    if (all.some((c) => c.code === code)) throw new Error('That code already exists. Pick a different one.')
    const created: DiscountCode = {
      ...input,
      code,
      label: input.label.trim(),
      ownerName: input.kind === 'influencer' ? input.ownerName?.trim() || undefined : undefined,
      id: uid(),
      active: true,
      createdAt: new Date().toISOString(),
    }
    writeAll(CODES_KEY, [...all, created])
    return created
  },

  async setActive(id: string, active: boolean): Promise<void> {
    writeAll(
      CODES_KEY,
      readAll<DiscountCode>(CODES_KEY).map((c) => (c.id === id ? { ...c, active } : c)),
    )
  },

  async remove(id: string): Promise<void> {
    writeAll(CODES_KEY, readAll<DiscountCode>(CODES_KEY).filter((c) => c.id !== id))
    writeAll(REDEMPTIONS_KEY, readAll<CodeRedemption>(REDEMPTIONS_KEY).filter((r) => r.codeId !== id))
  },

  async apply(code: string): Promise<AppliedCode | null> {
    const session = readOne<{ userId: string }>(SESSION_KEY)
    if (!session) return null
    const found = readAll<DiscountCode>(CODES_KEY).find((c) => c.code === code.trim().toUpperCase())
    if (!found || !found.active) return null
    if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) return null
    const redemptions = readAll<CodeRedemption>(REDEMPTIONS_KEY)
    if (found.maxRedemptions != null) {
      const used = redemptions.filter((r) => r.codeId === found.id && r.subscribedAt).length
      if (used >= found.maxRedemptions) return null
    }
    if (!redemptions.some((r) => r.codeId === found.id && r.userId === session.userId)) {
      writeAll(REDEMPTIONS_KEY, [
        ...redemptions,
        { id: uid(), codeId: found.id, userId: session.userId, redeemedAt: new Date().toISOString() },
      ])
    }
    return { code: found.code, label: found.label, percentOff: found.percentOff, offerTag: found.offerTag }
  },
}

const FOOD_LOG_KEY = 'food_log'

export const foodLog = {
  async listForDate(userId: string, date: string): Promise<FoodLogEntry[]> {
    return readAll<FoodLogEntry>(FOOD_LOG_KEY)
      .filter((e) => e.userId === userId && e.date === date)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async listForRange(userId: string, from: string, to: string): Promise<FoodLogEntry[]> {
    return readAll<FoodLogEntry>(FOOD_LOG_KEY)
      .filter((e) => e.userId === userId && e.date >= from && e.date <= to)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async listLoggedDates(userId: string): Promise<string[]> {
    return [...new Set(readAll<FoodLogEntry>(FOOD_LOG_KEY).filter((e) => e.userId === userId).map((e) => e.date))]
  },

  async listRecent(userId: string, limit = 12): Promise<FoodLogEntry[]> {
    const mine = readAll<FoodLogEntry>(FOOD_LOG_KEY)
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const seen = new Set<string>()
    const out: FoodLogEntry[] = []
    for (const e of mine) {
      const key = `${e.name}|${e.serving}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(e)
      if (out.length >= limit) break
    }
    return out
  },

  async add(userId: string, entry: Omit<FoodLogEntry, 'id' | 'userId' | 'createdAt'>): Promise<FoodLogEntry> {
    const record: FoodLogEntry = { ...entry, id: uid(), userId, createdAt: new Date().toISOString() }
    const all = readAll<FoodLogEntry>(FOOD_LOG_KEY)
    all.push(record)
    writeAll(FOOD_LOG_KEY, all)
    return record
  },

  // The demo has no online food database.
  async searchOnline(_query: string): Promise<FoodItem[]> {
    return []
  },

  async delete(id: string, userId: string): Promise<void> {
    writeAll(
      FOOD_LOG_KEY,
      readAll<FoodLogEntry>(FOOD_LOG_KEY).filter((e) => !(e.id === id && e.userId === userId)),
    )
  },
}
