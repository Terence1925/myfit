import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Loader2, PlayCircle, RefreshCw, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ExerciseDemoDialog } from './ExerciseDemoDialog'
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog'
import { lastSessionHint } from '@/lib/progressiveOverload'
import { cn } from '@/lib/utils'
import type { Exercise, SetLog, WorkoutSession } from '@/lib/types'

export function ExerciseCard({
  exercise,
  index,
  onSwap,
  swapping,
  logging,
  setLogs,
  onSetChange,
  userSessions,
  hasProgressAccess,
}: {
  exercise: Exercise
  index: number
  onSwap: () => void
  swapping: boolean
  logging?: boolean
  setLogs?: SetLog[]
  onSetChange?: (setIndex: number, field: 'weight' | 'reps' | 'completed', value: number | boolean) => void
  userSessions: WorkoutSession[]
  hasProgressAccess: boolean
}) {
  const navigate = useNavigate()
  const [demoOpen, setDemoOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const hint = logging ? lastSessionHint(userSessions, exercise.name) : null

  const handleHistoryClick = () => {
    if (!hasProgressAccess) {
      navigate('/pricing')
      return
    }
    setHistoryOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-xl border border-border bg-card/60 p-4 sm:p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-gradient font-display text-lg text-primary-foreground">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-body text-base sm:text-lg font-bold text-foreground truncate">{exercise.name}</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="default">{exercise.sets} sets</Badge>
            <Badge variant="outline">{exercise.reps} reps</Badge>
            <Badge variant="outline">{exercise.rest} rest</Badge>
          </div>
          {exercise.notes && (
            <p className="mt-2 text-sm text-muted-foreground font-body">{exercise.notes}</p>
          )}
          {hint && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> {hint}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onSwap}
              disabled={swapping}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              {swapping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Swap
            </button>
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Demo
            </button>
            <button
              onClick={handleHistoryClick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {hasProgressAccess ? <TrendingUp className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
              History
            </button>
          </div>

          {logging && setLogs && onSetChange && (
            <div className="mt-4 space-y-2 rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Done</span>
              </div>
              {setLogs.map((s, si) => (
                <div key={si} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                  <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{s.setNumber}</span>
                  <input
                    type="number"
                    value={s.weight ?? ''}
                    onChange={(e) => onSetChange(si, 'weight', Number(e.target.value))}
                    placeholder="lbs"
                    className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <input
                    type="number"
                    value={s.reps ?? ''}
                    onChange={(e) => onSetChange(si, 'reps', Number(e.target.value))}
                    placeholder="reps"
                    className="h-9 w-full rounded-md border border-input bg-background/60 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    onClick={() => onSetChange(si, 'completed', !s.completed)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                      s.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-border text-muted-foreground',
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExerciseDemoDialog exerciseName={exercise.name} open={demoOpen} onClose={() => setDemoOpen(false)} />
      {hasProgressAccess && (
        <ExerciseHistoryDialog
          exerciseName={exercise.name}
          sessions={userSessions}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </motion.div>
  )
}
