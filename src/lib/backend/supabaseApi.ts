import { calculateNutrition } from '../tdee'
import { isPro } from '../billing'
import type {
  ActivityLogEntry,
  BodyMetricEntry,
  IntakeAnswers,
  NutritionPlan,
  Profile,
  Role,
  SubscriptionPeriod,
  WorkoutProgram,
  WorkoutSession,
} from '../types'
import type { BillingResult } from './types'
import { generateAlternate, generateProgram } from './programGenerator'
import { EXERCISES } from './exerciseLibrary'
import { supabase } from './supabaseClient'

const PROGRAM_LIFETIME_MS = 12 * 7 * 24 * 60 * 60 * 1000

function sb() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    email: row.email as string,
    sex: row.sex as Profile['sex'],
    age: row.age as number | undefined,
    weightKg: row.weight_kg as number | undefined,
    heightCm: row.height_cm as number | undefined,
    sleepHours: row.sleep_hours as Profile['sleepHours'],
    sleepQuality: row.sleep_quality as Profile['sleepQuality'],
    stressLevel: row.stress_level as Profile['stressLevel'],
    activityLevel: row.activity_level as Profile['activityLevel'],
    goal: row.goal as Profile['goal'],
    bmr: row.bmr as number | undefined,
    tdee: row.tdee as number | undefined,
    calorieTarget: row.calorie_target as number | undefined,
    proteinG: row.protein_g as number | undefined,
    carbsG: row.carbs_g as number | undefined,
    fatG: row.fat_g as number | undefined,
    recoveryScore: row.recovery_score as number | undefined,
    subscriptionTier: (row.subscription_tier as Profile['subscriptionTier']) ?? 'free',
    subscriptionPeriod: row.subscription_period as Profile['subscriptionPeriod'],
    subscriptionStatus: (row.subscription_status as Profile['subscriptionStatus']) ?? 'none',
    subscriptionRenewsAt: row.subscription_renews_at as string | undefined,
    subscriptionStartedAt: row.subscription_started_at as string | undefined,
    createdAt: row.created_at as string,
  }
}

function mapProgram(row: Record<string, unknown>): WorkoutProgram {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    programName: row.program_name as string,
    programData: row.program_data as WorkoutProgram['programData'],
    answers: row.answers as WorkoutProgram['answers'],
    nutrition: row.nutrition as WorkoutProgram['nutrition'],
    recoveryScore: row.recovery_score as number,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  }
}

function mapActivity(row: Record<string, unknown>): ActivityLogEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    action: row.action as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }
}

function mapMetric(row: Record<string, unknown>): BodyMetricEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    date: row.date as string,
    weightKg: row.weight_kg as number,
    bodyFatPercent: row.body_fat_percent as number | undefined,
    notes: row.notes as string | undefined,
  }
}

function mapSession(row: Record<string, unknown>): WorkoutSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    programId: row.program_id as string,
    day: row.day as number,
    dayName: row.day_name as string,
    date: row.date as string,
    exercises: row.exercises as WorkoutSession['exercises'],
  }
}

async function logActivity(userId: string, action: string, metadata: Record<string, unknown> = {}) {
  await sb().from('activity_log').insert({ user_id: userId, action, metadata })
}

export const auth = {
  async signUp(email: string, password: string, displayName: string): Promise<Profile> {
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw new Error(error.message)
    if (!data.session || !data.user) {
      throw new Error('EMAIL_CONFIRMATION_REQUIRED')
    }
    const profile = await profiles.get(data.user.id)
    if (!profile) throw new Error('Profile not found — the signup trigger may not have run yet.')
    return profile
  },

  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await sb().auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const profile = await profiles.get(data.user.id)
    if (!profile) throw new Error('Profile not found.')
    return profile
  },

  async signOut(): Promise<void> {
    await sb().auth.signOut()
  },

  async currentSession(): Promise<Profile | null> {
    const { data } = await sb().auth.getSession()
    if (!data.session) return null
    return profiles.get(data.session.user.id)
  },
}

export const profiles = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error || !data) return null
    return mapProfile(data)
  },

  async saveIntake(userId: string, answers: IntakeAnswers, nutrition: NutritionPlan): Promise<Profile> {
    const weightKg = answers.weightUnit === 'lbs' ? answers.weight * 0.453592 : answers.weight
    const heightCm = (answers.heightFeet * 12 + answers.heightInches) * 2.54
    const { data, error } = await sb()
      .from('profiles')
      .update({
        sex: answers.sex,
        age: answers.age,
        weight_kg: Math.round(weightKg * 10) / 10,
        height_cm: Math.round(heightCm),
        sleep_hours: answers.sleepHours,
        sleep_quality: answers.sleepQuality,
        stress_level: answers.stressLevel,
        activity_level: answers.activityLevel,
        goal: answers.goal,
        bmr: nutrition.bmr,
        tdee: nutrition.tdee,
        calorie_target: nutrition.calorieTarget,
        protein_g: nutrition.proteinG,
        carbs_g: nutrition.carbsG,
        fat_g: nutrition.fatG,
        recovery_score: nutrition.recoveryScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logActivity(userId, 'completed_intake', { goal: answers.goal, recoveryScore: nutrition.recoveryScore })
    return mapProfile(data)
  },

  async listAll(): Promise<Profile[]> {
    const { data, error } = await sb().from('profiles').select('*')
    if (error) throw new Error(error.message)
    return data.map(mapProfile)
  },
}

export const roles = {
  async getRole(userId: string): Promise<Role> {
    const { data } = await sb().from('user_roles').select('role').eq('user_id', userId)
    if (data?.some((r) => r.role === 'admin')) return 'admin'
    return 'user'
  },

  async isAdmin(userId: string): Promise<boolean> {
    return (await roles.getRole(userId)) === 'admin'
  },

  async listAdmins(): Promise<Profile[]> {
    const { data: roleRows, error } = await sb().from('user_roles').select('user_id').eq('role', 'admin')
    if (error || !roleRows?.length) return []
    const ids = roleRows.map((r) => r.user_id as string)
    const { data } = await sb().from('profiles').select('*').in('id', ids)
    return (data ?? []).map(mapProfile)
  },

  async promote(userId: string): Promise<void> {
    await sb().from('user_roles').upsert({ user_id: userId, role: 'admin' })
    await logActivity(userId, 'promoted_to_admin', {})
  },

  async demote(userId: string): Promise<void> {
    await sb().from('user_roles').delete().eq('user_id', userId).eq('role', 'admin')
    await logActivity(userId, 'demoted_to_user', {})
  },
}

export const programs = {
  async generate(userId: string, answers: IntakeAnswers): Promise<WorkoutProgram> {
    await sb().from('workout_programs').delete().lt('expires_at', new Date().toISOString()).eq('user_id', userId)

    const isAdmin = await roles.isAdmin(userId)
    const profile = await profiles.get(userId)
    const existing = await programs.listForUser(userId)
    if (!isAdmin && !isPro(profile) && existing.length >= 1) {
      throw new Error('PROGRAM_LIMIT_REACHED')
    }

    const nutrition = calculateNutrition(answers)
    await profiles.saveIntake(userId, answers, nutrition)
    await new Promise((r) => setTimeout(r, 1400))
    const programData = generateProgram(answers, nutrition)
    const now = Date.now()

    const { data, error } = await sb()
      .from('workout_programs')
      .insert({
        user_id: userId,
        program_name: programData.programName,
        program_data: programData,
        answers,
        nutrition,
        recovery_score: nutrition.recoveryScore,
        expires_at: new Date(now + PROGRAM_LIFETIME_MS).toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    await logActivity(userId, 'generated_program', { programName: programData.programName })
    return mapProgram(data)
  },

  async alternate(userId: string, exerciseName: string, dayFocus: string, answers: IntakeAnswers) {
    await new Promise((r) => setTimeout(r, 700))
    const muscle = (EXERCISES.find((e) => e.name === exerciseName)?.muscle[0] ??
      dayFocus.split(' / ')[0].replace(' ', '-')) as IntakeAnswers['focusAreas'][number]
    const swap = generateAlternate(exerciseName, muscle, answers)
    await logActivity(userId, 'swapped_exercise', { from: exerciseName, to: swap.name })
    return swap
  },

  async listForUser(userId: string): Promise<WorkoutProgram[]> {
    const { data, error } = await sb()
      .from('workout_programs')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapProgram)
  },

  async listAll(): Promise<WorkoutProgram[]> {
    const { data, error } = await sb()
      .from('workout_programs')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapProgram)
  },

  async get(id: string): Promise<WorkoutProgram | null> {
    const { data, error } = await sb().from('workout_programs').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return mapProgram(data)
  },

  async delete(id: string, userId: string): Promise<void> {
    await sb().from('workout_programs').delete().eq('id', id)
    await logActivity(userId, 'deleted_program', { programId: id })
  },
}

export const activity = {
  async listForUser(userId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await sb()
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapActivity)
  },

  async listAll(): Promise<ActivityLogEntry[]> {
    const { data, error } = await sb().from('activity_log').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return data.map(mapActivity)
  },
}

export const billing = {
  async subscribe(userId: string, period: SubscriptionPeriod): Promise<BillingResult> {
    const { data, error } = await sb().functions.invoke('create-checkout-session', {
      body: { userId, period },
    })
    if (error) throw new Error(error.message)
    return { redirectUrl: data.url }
  },

  async cancel(userId: string): Promise<BillingResult> {
    const { data, error } = await sb().functions.invoke('billing-portal', { body: { userId } })
    if (error) throw new Error(error.message)
    return { redirectUrl: data.url }
  },

  async listActiveSubscribers(): Promise<Profile[]> {
    const { data, error } = await sb()
      .from('profiles')
      .select('*')
      .eq('subscription_tier', 'pro')
      .eq('subscription_status', 'active')
    if (error) throw new Error(error.message)
    return data.map(mapProfile)
  },
}

export const metrics = {
  async log(userId: string, entry: Omit<BodyMetricEntry, 'id' | 'userId'>): Promise<BodyMetricEntry> {
    const { data, error } = await sb()
      .from('body_metrics')
      .insert({
        user_id: userId,
        date: entry.date,
        weight_kg: entry.weightKg,
        body_fat_percent: entry.bodyFatPercent,
        notes: entry.notes,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logActivity(userId, 'logged_body_metric', { weightKg: entry.weightKg })
    return mapMetric(data)
  },

  async listForUser(userId: string): Promise<BodyMetricEntry[]> {
    const { data, error } = await sb()
      .from('body_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    if (error) throw new Error(error.message)
    return data.map(mapMetric)
  },

  async delete(id: string, userId: string): Promise<void> {
    await sb().from('body_metrics').delete().eq('id', id)
    await logActivity(userId, 'deleted_body_metric', { metricId: id })
  },
}

export const sessions = {
  async save(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> {
    const { data, error } = await sb()
      .from('workout_sessions')
      .insert({
        user_id: session.userId,
        program_id: session.programId,
        day: session.day,
        day_name: session.dayName,
        date: session.date,
        exercises: session.exercises,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await logActivity(session.userId, 'logged_workout_session', { day: session.day, dayName: session.dayName })
    return mapSession(data)
  },

  async listForProgramDay(programId: string, day: number): Promise<WorkoutSession[]> {
    const { data, error } = await sb()
      .from('workout_sessions')
      .select('*')
      .eq('program_id', programId)
      .eq('day', day)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapSession)
  },

  async listForUser(userId: string): Promise<WorkoutSession[]> {
    const { data, error } = await sb()
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(mapSession)
  },
}
