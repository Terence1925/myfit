import * as React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crown, Lock, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { IntakeWizard } from '@/components/intake/IntakeWizard'
import { WelcomeTour } from '@/components/intake/WelcomeTour'
import { markTourSeen, tourSeen } from '@/lib/tour'
import { ProgramView } from '@/components/program/ProgramView'
import { ProgramPaywall } from '@/components/program/ProgramPaywall'
import { ProgramComplete } from '@/components/program/ProgramComplete'
import { BLOCK_WEEKS, blockStatus } from '@/lib/programBlock'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { programs } from '@/lib/backend/api'
import { adoptWeightUnit } from '@/lib/weightUnit'
import { hasProAccess } from '@/lib/billing'
import type { IntakeAnswers, WorkoutProgram } from '@/lib/types'

type Mode = 'loading' | 'intake' | 'program' | 'limit' | 'error'

export default function Home() {
  const { profile, role, roleLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const proAccess = hasProAccess(profile, role)
  const [mode, setMode] = React.useState<Mode>('loading')
  const [program, setProgram] = React.useState<WorkoutProgram | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tourOpen, setTourOpen] = React.useState(true)
  const [lookingBack, setLookingBack] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)

  // Keyed on the user's id, not the whole profile object: the profile is re-fetched whenever the app
  // resumes or the session refreshes, and reloading the program each time would hand every screen below a
  // brand-new copy of it and wipe whatever was being typed.
  const profileId = profile?.id
  React.useEffect(() => {
    if (!profileId) return
    let cancelled = false
    ;(async () => {
      try {
        const existing = await programs.listForUser(profileId)
        if (cancelled) return
        if (existing.length > 0) {
          adoptWeightUnit(existing[0].answers?.weightUnit)
          setProgram(existing[0])
          setMode('program')
        } else {
          setMode('intake')
        }
      } catch {
        // A failed lookup (no signal, a server hiccup) should show a way to retry, not an endless loading screen
        if (!cancelled) setMode('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profileId, attempt])

  if (!profile) return null

  const handleComplete = async (answers: IntakeAnswers) => {
    setError(null)
    setSubmitting(true)
    try {
      const created = await programs.generate(profile.id, answers)
      adoptWeightUnit(answers.weightUnit)
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

  if (mode === 'loading') {
    return (
      <div className="container space-y-4 py-8" aria-busy="true">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-12" />
      </div>
    )
  }

  if (mode === 'error') {
    return (
      <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h2 className="font-display text-3xl tracking-wide text-foreground">Could not load your program</h2>
        <p className="mt-3 max-w-sm font-body text-sm text-muted-foreground">
          Check your connection and try again. Your data is safe.
        </p>
        <Button
          size="lg"
          className="mt-5"
          onClick={() => {
            setMode('loading')
            setAttempt((n) => n + 1)
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (mode === 'limit') {
    return (
      <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
            <Lock className="h-9 w-9 text-destructive" />
          </div>
          <h2 className="font-display text-4xl tracking-wide text-foreground">Program limit reached</h2>
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

  // The three-screen tour: once, before the very first plan (or again with ?tour=1 from the Account page)
  const forceTour = searchParams.get('tour') === '1'
  const showTour = tourOpen && (forceTour || (mode === 'intake' && !tourSeen(profile.id)))
  const closeTour = () => {
    markTourSeen(profile.id)
    setTourOpen(false)
    if (forceTour) setSearchParams({}, { replace: true })
  }

  const tour = showTour ? <WelcomeTour onDone={closeTour} /> : null

  if (mode === 'intake') {
    return (
      <div className="container">
        {tour}
        <IntakeWizard onComplete={handleComplete} submitting={submitting} error={error} />
      </div>
    )
  }

  if (mode === 'program' && program) {
    // Wait for the role lookup so an admin never sees a flash of the paywall.
    if (roleLoading) return null
    // After the 12 weeks and the deload week: a summary, a way to the next program, and a view-only look back.
    if (blockStatus(program.createdAt).complete) {
      if (!lookingBack) {
        return (
          <ProgramComplete program={program} userId={profile.id} onGenerate={() => setMode('intake')} onView={() => setLookingBack(true)} />
        )
      }
      return (
        <div className="container py-8 sm:py-12">
          <div className="mb-4 flex flex-wrap justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setLookingBack(false)}>
              Back
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setMode('intake')}>
              <Plus className="h-4 w-4" /> Generate your next {BLOCK_WEEKS} weeks
            </Button>
          </div>
          <ProgramView program={program} userId={profile.id} onProgramUpdate={setProgram} readOnly />
        </div>
      )
    }
    // Everyone can build their program (that's the hook); using it needs a subscription.
    if (!proAccess) {
      return (
        <>
          {tour}
          <ProgramPaywall program={program} />
        </>
      )
    }
    return (
      <div className="container py-8 sm:py-12">
        {tour}
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
