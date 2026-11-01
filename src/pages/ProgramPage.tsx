import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgramTabs } from '@/components/program/ProgramTabs'
import { programs } from '@/lib/backend/api'
import { blockStatus } from '@/lib/programBlock'
import type { WorkoutProgram } from '@/lib/types'

/** One program with its four tabs. Opened with View on My programs, or Start workout on Home. It has no tab of its own in the bottom bar. */
export default function ProgramPage() {
  const { programId } = useParams<{ programId: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const profileId = profile?.id
  const [program, setProgram] = React.useState<WorkoutProgram | null>(null)
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'missing'>('loading')

  React.useEffect(() => {
    if (!programId || !profileId) return
    let cancelled = false
    programs
      .get(programId)
      .then((p) => {
        if (cancelled) return
        // A program that belongs to someone else is treated as not found
        if (p && p.userId === profileId) {
          setProgram(p)
          setStatus('ready')
        } else {
          setStatus('missing')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('missing')
      })
    return () => {
      cancelled = true
    }
  }, [programId, profileId])

  if (!profile) return null

  // Back to where the person came from (Home or My programs); My programs when the page was opened directly
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/saved'))

  if (status === 'loading') {
    return (
      <div className="container space-y-4 py-8 sm:py-12" aria-busy="true">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (status === 'missing' || !program) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl tracking-wide">Program not found</h1>
        <p className="mt-3 max-w-sm font-body text-sm text-muted-foreground">It may have been deleted. You can see your programs in My programs.</p>
        <Button className="mt-5" onClick={() => navigate('/saved')}>
          Go to My programs
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-12">
      <Button variant="ghost" size="sm" className="mb-3 gap-1.5" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <h1 className="mb-6 font-display text-3xl tracking-wide sm:text-4xl">{program.programData.programName}</h1>
      <ProgramTabs program={program} userId={profile.id} onProgramUpdate={setProgram} readOnly={blockStatus(program.createdAt).complete} />
    </div>
  )
}
