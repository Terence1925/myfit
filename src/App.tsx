import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { GlowBackground } from '@/components/layout/GlowBackground'
import { NavBar } from '@/components/layout/NavBar'
import AuthPage from '@/pages/AuthPage'
import Home from '@/pages/Home'
import SavedPrograms from '@/pages/SavedPrograms'
import AdminPage from '@/pages/AdminPage'
import PricingPage from '@/pages/PricingPage'
import AccountPage from '@/pages/AccountPage'
import ProgressPage from '@/pages/ProgressPage'
import TermsPage from '@/pages/legal/TermsPage'
import PrivacyPage from '@/pages/legal/PrivacyPage'
import RefundPage from '@/pages/legal/RefundPage'
import { Footer } from '@/components/layout/Footer'
import NotFound from '@/pages/NotFound'

function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AppShell() {
  const { profile } = useAuth()
  return (
    <div className="min-h-screen">
      <GlowBackground />
      {profile && <NavBar />}
      <Routes>
        <Route path="/auth" element={profile ? <Navigate to="/" replace /> : <AuthPage />} />
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
            <RequireAuth>
              <SavedPrograms />
            </RequireAuth>
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
            <RequireAuth>
              <ProgressPage />
            </RequireAuth>
          }
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPage />} />
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
