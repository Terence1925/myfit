import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crown, Lock, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { IntakeWizard } from '@/components/intake/IntakeWizard'
import { ProgramView } from '@/components/program/ProgramView'
import { ProgramPaywall } from '@/components/program/ProgramPaywall'
import { Button } from '@/components/ui/button'
import { programs } from '@/lib/backend/api'
import { hasProAccess } from '@/lib/billing'
import type { IntakeAnswers, WorkoutProgram } from '@/lib/types'

type Mode = 'loading' | 'intake' | 'program' | 'limit'

export default function Home() {
  const { profile, role, roleLoading } = useAuth()
  const navigate = useNavigate()
  const proAccess = hasProAccess(profile, role)
  const [mode, setMode] = React.useState<Mode>('loading')
  const [program, setProgram] = React.useState<WorkoutProgram | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Keyed on the user's id, not the whole profile object: the profile is re-fetched whenever the app
  // resumes or the session refreshes, and reloading the program each time would hand every screen below a
  // brand-new copy of it and wipe whatever was being typed.
  const profileId = profile?.id
  React.useEffect(() => {
    if (!profileId) return
    let cancelled = false
    ;(async () => {
      const existing = await programs.listForUser(profileId)
      if (cancelled) return
      if (existing.length > 0) {
        setProgram(existing[0])
        setMode('program')
      } else {
        setMode('intake')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profileId])

  if (!profile) return null

  const handleComplete = async (answers: IntakeAnswers) => {
    setError(null)
    setSubmitting(true)
    try {
      const created = await programs.generate(profile.id, answers)
      setProgram(created)
      setMode('program')
    } catch (err) {
      if (err instanceof Error && err.message === 'PROGRAM_LIMIT_REACHED') {
        setMode('limit')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate program.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'loading') return null

  if (mode === 'limit') {
    return (
      <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
            <Lock className="h-9 w-9 text-destructive" />
          </div>
          <h2 className="font-display text-4xl tracking-wide text-foreground">PROGRAM LIMIT REACHED</h2>
          <p className="mt-3 max-w-md font-body text-muted-foreground">
            Free accounts can keep one active program at a time. Upgrade to Pro for unlimited programs, or delete
            your current one from My Programs to generate a new one.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate('/pricing')}>
              <Crown className="h-4 w-4" /> Upgrade to Pro
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/saved')}>
              Go to My Programs
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (mode === 'intake') {
    return (
      <div className="container">
        <IntakeWizard onComplete={handleComplete} submitting={submitting} error={error} />
      </div>
    )
  }

  if (mode === 'program' && program) {
    // Wait for the role lookup so an admin never sees a flash of the paywall.
    if (roleLoading) return null
    // Everyone can build their program (that's the hook); using it needs a subscription.
    if (!proAccess) return <ProgramPaywall program={program} />
    return (
      <div className="container py-8 sm:py-12">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => (proAccess ? setMode('intake') : setMode('limit'))}
          >
            <Plus className="h-4 w-4" /> New Program
          </Button>
        </div>
        <ProgramView program={program} userId={profile.id} onProgramUpdate={setProgram} />
      </div>
    )
  }

  return null
}
