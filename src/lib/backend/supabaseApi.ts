import { calculateNutrition } from '../tdee'
import { isPro } from '../billing'
import { isNativeApp } from '../platform'
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
  SubscriptionPeriod,
  WorkoutProgram,
  WorkoutSession,
} from '../types'
import { generateAlternate, generateProgram } from './programGenerator'
import { EXERCISES } from './exerciseLibrary'
import { supabase } from './supabaseClient'
import { getGoogleIdToken, googleSignOut } from './googleAuth'

// Public website URL — must also be listed under Supabase → Authentication → URL Configuration
// → Redirect URLs (as `<this>/reset-password`) or password-reset links will be rejected.
const WEB_APP_URL = 'https://getmyfit.vercel.app'

// Programs effectively never expire. Everyone builds their program before subscribing, so a short
// lifetime would delete it out from under someone who subscribes on day 3. A 100-year lifetime
// avoids nullable-column edge cases in the .gt('expires_at', ...) queries below.
const PROGRAM_LIFETIME_MS = 100 * 365 * 24 * 60 * 60 * 1000

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
    subscriptionIsTrial: (row.subscription_is_trial as boolean | null) ?? false,
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

  async signInWithGoogle(): Promise<Profile | null> {
    if (!isNativeApp()) {
      // In a normal browser, Google's own page handles the sign-in and sends the person back here.
      const { error } = await sb().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw new Error(error.message)
      return null
    }
    // The phone app can't use Google's web page (Google blocks sign-in inside an embedded WebView),
    // so it uses the phone's own account picker and trades the signed token for a session.
    const token = await getGoogleIdToken()
    const { data, error } = await sb().auth.signInWithIdToken({ provider: 'google', token })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Google sign-in did not return an account.')
    // The profile is created by a database trigger; give it a moment if it is not visible yet.
    for (let attempt = 0; attempt < 4; attempt++) {
      const profile = await profiles.get(data.user.id)
      if (profile) return profile
      await new Promise((r) => setTimeout(r, 300))
    }
    throw new Error('Signed in with Google, but your profile is not ready yet. Please try again.')
  },

  async signOut(): Promise<void> {
    await sb().auth.signOut()
    // Also forget the Google account on this phone, so the next sign-in shows the account picker.
    void googleSignOut()
  },

  async currentSession(): Promise<Profile | null> {
    const { data } = await sb().auth.getSession()
    if (!data.session) return null
    return profiles.get(data.session.user.id)
  },

  async requestPasswordReset(email: string): Promise<void> {
    // The native app's WebView origin is https://localhost, which doesn't exist on the user's
    // phone — so a reset link built from it would be dead. Send native users to the real website
    // instead, where they can set a new password in their browser.
    const baseUrl = isNativeApp() ? WEB_APP_URL : window.location.origin
    const { error } = await sb().auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    })
    if (error) throw new Error(error.message)
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await sb().auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
  },

  async deleteMember(userId: string): Promise<void> {
    const { data, error } = await sb().functions.invoke('admin-delete-member', { body: { userId } })
    // A failed function call hides the server's message inside the error, so read it back out
    if (error) {
      let message = error.message
      try {
        const detail = await (error as { context?: Response }).context?.json()
        if (detail?.error) message = detail.error
      } catch {
        /* keep the generic message */
      }
      throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
  },

  async deleteAccount(): Promise<void> {
    const { error } = await sb().functions.invoke('delete-account', { body: {} })
    if (error) throw new Error(error.message)
    await sb().auth.signOut()
  },
}

export const profiles = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await sb().from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error || !data) return null
    return mapProfile(data)
  },

  async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    const { data, error } = await sb()
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
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

  async alternate(userId: string, exerciseName: string, dayFocus: string, answers: IntakeAnswers, avoid: string[] = []) {
    await new Promise((r) => setTimeout(r, 700))
    const muscle = (EXERCISES.find((e) => e.name === exerciseName)?.muscle[0] ??
      dayFocus.split(' / ')[0].replace(' ', '-')) as IntakeAnswers['focusAreas'][number]
    const swap = generateAlternate(exerciseName, muscle, answers, avoid)
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

  async update(id: string, programData: ProgramData): Promise<void> {
    const { error } = await sb()
      .from('workout_programs')
      .update({ program_name: programData.programName, program_data: programData })
      .eq('id', id)
    if (error) throw new Error(error.message)
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

function mapCode(row: Record<string, unknown>): DiscountCode {
  return {
    id: row.id as string,
    code: row.code as string,
    label: row.label as string,
    kind: row.kind as DiscountCode['kind'],
    ownerName: (row.owner_name as string | null) ?? undefined,
    percentOff: (row.percent_off as number | null) ?? undefined,
    offerTag: row.offer_tag as string,
    maxRedemptions: (row.max_redemptions as number | null) ?? undefined,
    expiresAt: (row.expires_at as string | null) ?? undefined,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  }
}

function mapRedemption(row: Record<string, unknown>): CodeRedemption {
  return {
    id: row.id as string,
    codeId: row.code_id as string,
    userId: row.user_id as string,
    redeemedAt: row.redeemed_at as string,
    subscribedAt: (row.subscribed_at as string | null) ?? undefined,
    plan: (row.plan as SubscriptionPeriod | null) ?? undefined,
  }
}

export const codes = {
  async listAll(): Promise<{ codes: DiscountCode[]; redemptions: CodeRedemption[] }> {
    const [c, r] = await Promise.all([
      sb().from('discount_codes').select('*').order('created_at', { ascending: false }),
      sb().from('code_redemptions').select('*'),
    ])
    if (c.error) throw new Error(c.error.message)
    if (r.error) throw new Error(r.error.message)
    return { codes: c.data.map(mapCode), redemptions: r.data.map(mapRedemption) }
  },

  async create(input: NewDiscountCode): Promise<DiscountCode> {
    const { data: userData } = await sb().auth.getUser()
    const { data, error } = await sb()
      .from('discount_codes')
      .insert({
        code: input.code.trim().toUpperCase(),
        label: input.label.trim(),
        kind: input.kind,
        owner_name: input.kind === 'influencer' ? input.ownerName?.trim() || null : null,
        percent_off: input.percentOff ?? null,
        offer_tag: input.offerTag.trim(),
        max_redemptions: input.maxRedemptions ?? null,
        expires_at: input.expiresAt ?? null,
        created_by: userData.user?.id ?? null,
      })
      .select('*')
      .single()
    if (error) {
      if (error.code === '23505') throw new Error('That code already exists. Pick a different one.')
      throw new Error(error.message)
    }
    return mapCode(data)
  },

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await sb().from('discount_codes').update({ active }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id: string): Promise<void> {
    const { error } = await sb().from('discount_codes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async apply(code: string): Promise<AppliedCode | null> {
    const { data, error } = await sb().rpc('apply_discount_code', { p_code: code })
    if (error) throw new Error(error.message)
    const row = (data as Record<string, unknown>[] | null)?.[0]
    if (!row) return null
    return {
      code: row.code as string,
      label: row.label as string,
      percentOff: (row.percent_off as number | null) ?? undefined,
      offerTag: row.offer_tag as string,
    }
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFoodLog(r: any): FoodLogEntry {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.log_date,
    meal: r.meal,
    name: r.name,
    serving: r.serving,
    servings: Number(r.servings),
    kcal: Number(r.kcal),
    proteinG: Number(r.protein_g),
    carbsG: Number(r.carbs_g),
    fatG: Number(r.fat_g),
    createdAt: r.created_at,
  }
}

export const foodLog = {
  async listForDate(userId: string, date: string): Promise<FoodLogEntry[]> {
    const { data, error } = await sb()
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapFoodLog)
  },

  async listForRange(userId: string, from: string, to: string): Promise<FoodLogEntry[]> {
    const { data, error } = await sb()
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', from)
      .lte('log_date', to)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapFoodLog)
  },

  async listLoggedDates(userId: string): Promise<string[]> {
    const { data, error } = await sb().from('food_logs').select('log_date').eq('user_id', userId).limit(5000)
    if (error) throw new Error(error.message)
    return [...new Set((data ?? []).map((r: { log_date: string }) => r.log_date))]
  },

  async listRecent(userId: string, limit = 12): Promise<FoodLogEntry[]> {
    const { data, error } = await sb()
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)
    if (error) throw new Error(error.message)
    const seen = new Set<string>()
    const out: FoodLogEntry[] = []
    for (const r of data ?? []) {
      const e = mapFoodLog(r)
      const key = `${e.name}|${e.serving}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(e)
      if (out.length >= limit) break
    }
    return out
  },

  async add(userId: string, entry: Omit<FoodLogEntry, 'id' | 'userId' | 'createdAt'>): Promise<FoodLogEntry> {
    const { data, error } = await sb()
      .from('food_logs')
      .insert({
        user_id: userId,
        log_date: entry.date,
        meal: entry.meal,
        name: entry.name,
        serving: entry.serving,
        servings: entry.servings,
        kcal: entry.kcal,
        protein_g: entry.proteinG,
        carbs_g: entry.carbsG,
        fat_g: entry.fatG,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapFoodLog(data)
  },

  async searchOnline(query: string): Promise<FoodItem[]> {
    const { data, error } = await sb().functions.invoke('food-search', { body: { query } })
    if (error) {
      // A non-2xx reply carries the server's own message in its body
      let message = 'Online food search is unavailable right now.'
      try {
        const body = await (error as { context?: Response }).context?.json()
        if (body?.error) message = String(body.error)
      } catch {
        // keep the generic message
      }
      throw new Error(message)
    }
    return (data?.foods ?? []) as FoodItem[]
  },

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await sb().from('food_logs').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
  },
}
