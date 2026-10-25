import * as React from 'react'
import { auth, isSupabaseConfigured, roles } from '@/lib/backend/api'
import { supabase } from '@/lib/backend/supabaseClient'
import type { Profile, Role } from '@/lib/types'

interface AuthContextValue {
  profile: Profile | null
  role: Role
  roleLoading: boolean
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => void
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
  usesPassword: () => Promise<boolean>
  verifyPassword: (password: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [role, setRole] = React.useState<Role>('user')
  const [roleLoading, setRoleLoading] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [refreshTick, setRefreshTick] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const p = await auth.currentSession()
      if (!cancelled) {
        setProfile(p)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  React.useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setRefreshTick((t) => t + 1)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  React.useEffect(() => {
    if (loading) return // profile fetch still in flight — don't judge role yet
    let cancelled = false
    if (!profile) {
      setRole('user')
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    ;(async () => {
      const r = await roles.getRole(profile.id)
      if (!cancelled) {
        setRole(r)
        setRoleLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile, loading])

  const refreshProfile = React.useCallback(() => {
    setRefreshTick((t) => t + 1)
  }, [])

  const signUp = React.useCallback(async (email: string, password: string, displayName: string) => {
    const p = await auth.signUp(email, password, displayName)
    setProfile(p)
  }, [])

  const signIn = React.useCallback(async (email: string, password: string) => {
    const p = await auth.signIn(email, password)
    setProfile(p)
  }, [])

  const signInWithGoogle = React.useCallback(async () => {
    // In a browser this leaves the page for Google (no profile yet); on the phone it returns the profile.
    const p = await auth.signInWithGoogle()
    if (p) setProfile(p)
  }, [])

  const signOut = React.useCallback(async () => {
    await auth.signOut()
    setProfile(null)
  }, [])

  const requestPasswordReset = React.useCallback(async (email: string) => {
    await auth.requestPasswordReset(email)
  }, [])

  const updatePassword = React.useCallback(async (newPassword: string) => {
    await auth.updatePassword(newPassword)
  }, [])

  const usesPassword = React.useCallback(() => auth.usesPassword(), [])
  const verifyPassword = React.useCallback((password: string) => auth.verifyPassword(password), [])

  const deleteAccount = React.useCallback(async () => {
    await auth.deleteAccount()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        profile,
        role,
        roleLoading,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        requestPasswordReset,
        updatePassword,
        deleteAccount,
        usesPassword,
        verifyPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
