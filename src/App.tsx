import * as React from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { GlowBackground } from '@/components/layout/GlowBackground'
import { NavBar } from '@/components/layout/NavBar'
import AuthPage from '@/pages/AuthPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import Home from '@/pages/Home'
import SavedPrograms from '@/pages/SavedPrograms'
import AdminPage from '@/pages/AdminPage'
import PricingPage from '@/pages/PricingPage'
import AccountPage from '@/pages/AccountPage'
import ProgressPage from '@/pages/ProgressPage'
import TermsPage from '@/pages/legal/TermsPage'
import PrivacyPage from '@/pages/legal/PrivacyPage'
import RefundPage from '@/pages/legal/RefundPage'
import DeleteAccountPage from '@/pages/legal/DeleteAccountPage'
import { Footer } from '@/components/layout/Footer'
import { hasProAccess } from '@/lib/billing'
import { syncTrialReminder } from '@/lib/trialReminder'
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
  const { profile } = useAuth()
  const profileId = profile?.id

  // Re-check the trial on every app open so the "trial ends tomorrow" reminder always reflects reality
  // (e.g. it disappears if the user cancelled in Google Play).
  React.useEffect(() => {
    if (profileId) void syncTrialReminder(profileId)
  }, [profileId])

  return (
    <div className="min-h-screen">
      <GlowBackground />
      {profile && <NavBar />}
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
      <Footer />
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
