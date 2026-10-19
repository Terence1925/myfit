import * as React from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Celebration } from '@/components/shared/Celebration'
import { BadgeWatcher } from '@/components/shared/BadgeWatcher'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { GlowBackground } from '@/components/layout/GlowBackground'
import { BottomNav } from '@/components/layout/BottomNav'
import { NavBar } from '@/components/layout/NavBar'
import AuthPage from '@/pages/AuthPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import Home from '@/pages/Home'
import SavedPrograms from '@/pages/SavedPrograms'
import AdminPage from '@/pages/AdminPage'
import PricingPage from '@/pages/PricingPage'
import AccountPage from '@/pages/AccountPage'
import ProgressPage from '@/pages/ProgressPage'
import FoodPage from '@/pages/FoodPage'
import TermsPage from '@/pages/legal/TermsPage'
import PrivacyPage from '@/pages/legal/PrivacyPage'
import RefundPage from '@/pages/legal/RefundPage'
import DeleteAccountPage from '@/pages/legal/DeleteAccountPage'
import { Footer } from '@/components/layout/Footer'
import { hasProAccess } from '@/lib/billing'
import { syncTrialReminder } from '@/lib/trialReminder'
import { stopRestTimer, useRestTimer } from '@/lib/restTimerStore'
import { syncWorkoutReminders } from '@/lib/workoutReminder'
import { RestTimerHost } from '@/components/program/RestTimerBar'
import NotFound from '@/pages/NotFound'

function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function RequirePro({ children }: { children: ReactNode }) {
  const { profile, role, loading, roleLoading } = useAuth()
  if (loading || roleLoading) return null
  if (!profile) return <Navigate to="/auth" replace />
  if (!hasProAccess(profile, role)) return <Navigate to="/pricing" replace />
  return <>{children}</>
}

function AppShell() {
  const { profile, loading } = useAuth()
  const profileId = profile?.id
  const rest = useRestTimer()
  const location = useLocation()

  // Re-check the trial on every app open so the "trial ends tomorrow" reminder always reflects reality
  // (e.g. it disappears if the user cancelled in Google Play).
  React.useEffect(() => {
    if (profileId) void syncTrialReminder(profileId)
  }, [profileId])

  // Keep the workout reminders on the phone in step with the latest program, settings and today's progress
  React.useEffect(() => {
    if (!profileId) return
    const resync = () => void syncWorkoutReminders(profileId)
    resync()
    window.addEventListener('myfit:session-saved', resync)
    window.addEventListener('myfit:reminders-changed', resync)
    return () => {
      window.removeEventListener('myfit:session-saved', resync)
      window.removeEventListener('myfit:reminders-changed', resync)
    }
  }, [profileId])

  // Signing out ends any running rest (but wait for the session check on startup before judging).
  React.useEffect(() => {
    if (!loading && !profile) stopRestTimer()
  }, [loading, profile])

  return (
    // On phones the bottom bar (3.5rem plus the safe area) must not cover the end of a page; the rest timer sits above it
    <div className={profile ? (rest ? 'min-h-screen pb-56 sm:pb-40' : 'min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0') : 'min-h-screen'}>
      <GlowBackground />
      {profile && <NavBar />}
      <Celebration />
      {profile && <BadgeWatcher />}
      {/* Each page fades in instead of snapping in (opacity only: a transform would break the pages' fixed bars) */}
      <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <Routes>
        <Route path="/auth" element={profile ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/saved"
          element={
            <RequirePro>
              <SavedPrograms />
            </RequirePro>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route
          path="/pricing"
          element={
            <RequireAuth>
              <PricingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/food"
          element={
            <RequireAuth>
              <FoodPage />
            </RequireAuth>
          }
        />
        <Route
          path="/progress"
          element={
            <RequirePro>
              <ProgressPage />
            </RequirePro>
          }
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPage />} />
        <Route path="/delete-account" element={<DeleteAccountPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </motion.div>
      <Footer />
      {profile && <RestTimerHost />}
      {profile && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
