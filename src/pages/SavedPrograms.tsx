import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Trash2, Eye, CalendarClock, Crown, FileDown, Loader2, Lock, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { programs } from '@/lib/backend/api'
import { canExportPdf, hasProAccess } from '@/lib/billing'
import { exportProgramPdf } from '@/lib/exportProgramPdf'
import { cn } from '@/lib/utils'
import type { WorkoutProgram } from '@/lib/types'

function daysRemaining(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function SavedPrograms() {
  const { profile, role } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = React.useState<WorkoutProgram[]>([])
  const [loaded, setLoaded] = React.useState(false)
  // The program waiting for a yes or no before it is deleted
  const [toDelete, setToDelete] = React.useState<WorkoutProgram | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  // The program whose PDF is being made, and a message about the last PDF that could not be made
  const [exportingId, setExportingId] = React.useState<string | null>(null)
  const [exportError, setExportError] = React.useState<{ id: string; text: string } | null>(null)

  const handleExportPdf = async (p: WorkoutProgram) => {
    if (!profile || !hasProAccess(profile, role)) {
      navigate('/pricing')
      return
    }
    if (!canExportPdf(profile, role)) {
      // Subscribed, but still inside the free trial.
      setExportError({ id: p.id, text: 'PDF export unlocks after your free trial ends and your first payment goes through.' })
      return
    }
    setExportingId(p.id)
    setExportError(null)
    try {
      await exportProgramPdf(p)
    } catch (err) {
      // Dismissing the share sheet rejects on some Android versions — that's not a failure.
      const msg = err instanceof Error ? err.message : ''
      if (!/cancel|dismiss/i.test(msg)) setExportError({ id: p.id, text: 'Could not create the PDF. Please try again.' })
    } finally {
      setExportingId(null)
    }
  }

  const refresh = React.useCallback(async () => {
    if (!profile) return
    setList(await programs.listForUser(profile.id))
    setLoaded(true)
  }, [profile])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  if (!profile) return null

  if (!loaded) {
    return (
      <div className="container space-y-4 py-8 sm:py-12" aria-busy="true">
        <Skeleton className="ml-auto h-9 w-36" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="sr-only">My programs</h1>
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/?new=1')}>
          <Plus className="h-4 w-4" /> New program
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground font-body">
            No saved programs yet. Tap New program to build one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p, i) => {
            const remaining = daysRemaining(p.expiresAt)
            const expired = remaining <= 0
            // A program that has run its 13 weeks is finished, not a problem: a calm "Completed" instead of a red warning
            const badgeVariant = expired ? 'success' : remaining >= 14 ? 'default' : 'warning'
            // With more than one program, the newest (the one the Home screen trains from) is marked Current
            const isCurrent = list.length > 1 && i === 0
            const isPrevious = list.length > 1 && i > 0
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Card className={cn('h-full flex flex-col', isCurrent && 'border-primary/60 bg-primary/10', isPrevious && 'bg-secondary/50')}>
                  <CardContent className="p-5 flex-1 flex flex-col gap-3">
                    {(isCurrent || isPrevious) && <span className="sr-only">{isCurrent ? 'Current program' : 'Previous program'}</span>}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-body text-lg font-bold text-foreground">{p.programName}</h3>
                      <Badge variant={badgeVariant} className="shrink-0 gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {expired ? 'Completed' : `${remaining}d left`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.programData.tagline}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{p.nutrition.calorieTarget} kcal</Badge>
                      <Badge variant="cyan">Recovery {p.recoveryScore}/100</Badge>
                    </div>
                    <div className="mt-auto flex gap-2 pt-3">
                      <Button size="sm" variant={isPrevious ? 'outline' : 'default'} className="flex-1 gap-1.5" onClick={() => navigate(`/saved/${p.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="Export PDF"
                        title="Export PDF"
                        onClick={() => void handleExportPdf(p)}
                        disabled={exportingId === p.id}
                      >
                        {exportingId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : canExportPdf(profile, role) ? (
                          <FileDown className="h-3.5 w-3.5" />
                        ) : hasProAccess(profile, role) ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <Crown className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="Delete program"
                        className="gap-1.5 text-destructive hover:border-destructive/50 hover:text-destructive"
                        onClick={() => setToDelete(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {exportError?.id === p.id && <p className="text-xs text-destructive">{exportError.text}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => !deleting && setToDelete(null)} title="Delete this program?" className="max-w-md">
        <p className="font-body text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{toDelete?.programName}</span> will be deleted, along with every workout you
          logged on it. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" disabled={deleting} onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={deleting}
            onClick={async () => {
              if (!toDelete) return
              setDeleting(true)
              try {
                await programs.delete(toDelete.id, profile.id)
                await refresh()
              } finally {
                setDeleting(false)
                setToDelete(null)
              }
            }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
