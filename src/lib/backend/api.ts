import { isSupabaseConfigured } from './supabaseClient'
import * as mock from './mockApi'
import * as real from './supabaseApi'
import type {
  ActivityApi,
  AuthApi,
  BillingApi,
  MetricsApi,
  ProfilesApi,
  ProgramsApi,
  RolesApi,
  SessionsApi,
} from './types'

const impl = isSupabaseConfigured ? real : mock

export const auth: AuthApi = impl.auth
export const profiles: ProfilesApi = impl.profiles
export const roles: RolesApi = impl.roles
export const programs: ProgramsApi = impl.programs
export const activity: ActivityApi = impl.activity
export const metrics: MetricsApi = impl.metrics
export const sessions: SessionsApi = impl.sessions
export const billing: BillingApi = impl.billing

export { isSupabaseConfigured }
