import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Trash2, Eye, X, CalendarClock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ProgramView } from '@/components/program/ProgramView'
import { programs } from '@/lib/backend/api'
import { goalLabelOf } from '@/lib/goalLabel'
import type { WorkoutProgram } from '@/lib/types'

function daysRemaining(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function SavedPrograms() {
  const { profile } = useAuth()
  const [list, setList] = React.useState<WorkoutProgram[]>([])
  const [viewing, setViewing] = React.useState<WorkoutProgram | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  // The program waiting for a yes or no before it is deleted
  const [toDelete, setToDelete] = React.useState<WorkoutProgram | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!profile) return
    setList(await programs.listForUser(profile.id))
    setLoaded(true)
  }, [profile])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  if (!profile) return null

  if (viewing) {
    return (
      <div className="container py-8 sm:py-12">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => setViewing(null)}>
          <X className="h-4 w-4" /> Close
        </Button>
        <ProgramView program={viewing} userId={profile.id} onProgramUpdate={setViewing} />
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="container space-y-4 py-8 sm:py-12" aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">My programs</h1>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground font-body">
            No saved programs yet. Complete the intake form to generate one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p, i) => {
            const remaining = daysRemaining(p.expiresAt)
            const expired = remaining <= 0
            const badgeVariant = expired ? 'danger' : remaining >= 14 ? 'default' : 'warning'
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Card className="h-full flex flex-col">
                  <CardContent className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-body text-lg font-bold text-foreground">{p.programName}</h3>
                      <Badge variant={badgeVariant} className="shrink-0 gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {expired ? 'Expired' : `${remaining}d left`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{goalLabelOf(p.answers)}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{p.nutrition.calorieTarget} kcal</Badge>
                      <Badge variant="cyan">Recovery {p.recoveryScore}/100</Badge>
                    </div>
                    <div className="mt-auto flex gap-2 pt-3">
                      <Button size="sm" className="flex-1 gap-1.5" onClick={() => setViewing(p)}>
                        <Eye className="h-3.5 w-3.5" /> View
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
