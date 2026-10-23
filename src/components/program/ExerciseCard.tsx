import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Crown, Flame, Loader2, PlayCircle, RefreshCw, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { ExerciseDemoDialog } from './ExerciseDemoDialog'
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog'
import { lastSessionHint } from '@/lib/progressiveOverload'
import type { Suggestion } from '@/lib/weekPlan'
import type { WarmupPlan } from '@/lib/warmup'
import { cn } from '@/lib/utils'
import type { Exercise, SetLog, WorkoutSession } from '@/lib/types'
import { fmtNumber, toLbs, toUnit, unitShort, useWeightUnit, type WeightUnit } from '@/lib/weightUnit'

/** The weight box: shows and takes the chosen unit, while the workout is saved in pounds. */
function WeightInput({ valueLb, unit, onChange }: { valueLb: number | null | undefined; unit: WeightUnit; onChange: (lbs: number) => void }) {
  const shown = valueLb ? fmtNumber(toUnit(valueLb, unit)) : ''
  const [text, setText] = React.useState(shown)
  // Follow changes from outside (a restored draft, or switching the unit) without fighting what is being typed
  React.useEffect(() => {
    const typed = Number(text)
    if (!(text !== '' && Math.abs(toLbs(typed, unit) - (valueLb ?? 0)) < 0.01)) setText(shown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueLb, unit])
  return (
    <input
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(e.target.value === '' ? 0 : toLbs(Number(e.target.value), unit))
      }}
      placeholder={unitShort(unit)}
      aria-label={`Weight in ${unitShort(unit)}`}
      className="h-12 w-full rounded-md border border-input bg-background/60 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  )
}

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
  readOnly,
  suggestion,
  warmup,
}: {
  exercise: Exercise
  index: number
  /** A finished program is view only: no swapping. */
  readOnly?: boolean
  /** This week's aim for the exercise, worked out from what was logged before. */
  suggestion?: Suggestion | null
  /** Warm-up sets for a heavy opening lift (shown, not logged). */
  warmup?: WarmupPlan | null
  onSwap: () => void
  swapping: boolean
  logging?: boolean
  setLogs?: SetLog[]
  onSetChange?: (setIndex: number, field: 'weight' | 'reps' | 'completed', value: number | boolean) => void
  userSessions: WorkoutSession[]
  hasProgressAccess: boolean
}) {
  const navigate = useNavigate()
  const [unit] = useWeightUnit()
  const [demoOpen, setDemoOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [warmupOpen, setWarmupOpen] = React.useState(false)
  // Yoga and Pilates flow from move to move: no sets table, no rest, no weights to track.
  const mindBody = exercise.format === 'yoga' || exercise.format === 'pilates'
  const hint = logging && !mindBody ? lastSessionHint(userSessions, exercise.name, unit) : null

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
            {!mindBody && <Badge variant="default">{exercise.sets} sets</Badge>}
            {/* Timed moves (Plank, yoga poses) store a time like "30-45 sec" in `reps`, and a few
                Pilates moves a count like "100 pumps" — appending "reps" to those reads wrong, so
                only add the suffix for plain rep counts. */}
            <Badge variant={mindBody ? 'default' : 'outline'}>
              {exercise.reps}
              {/sec|min|pumps/.test(exercise.reps) ? '' : ' reps'}
            </Badge>
            {exercise.eachSide && <Badge variant="outline">each side</Badge>}
            {exercise.format === 'pilates' && exercise.sets > 1 && <Badge variant="outline">{exercise.sets} rounds</Badge>}
            {!mindBody && <Badge variant="outline">{exercise.rest} rest</Badge>}
          </div>
          {exercise.notes && (
            <p className="mt-2 text-sm text-muted-foreground font-body">{exercise.notes}</p>
          )}
          {suggestion && (
            <div className="mt-2">
              <p className="flex items-start gap-1.5 text-xs font-semibold text-primary">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>This week: {suggestion.aim}</span>
              </p>
              {suggestion.coach && <p className="mt-1 pl-5 text-xs leading-relaxed text-muted-foreground">{suggestion.coach}</p>}
            </div>
          )}
          {warmup && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setWarmupOpen((o) => !o)}
                aria-expanded={warmupOpen}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Flame className="h-3.5 w-3.5" /> Warm up first
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', warmupOpen && 'rotate-180')} />
              </button>
              {warmupOpen && (
                <div className="mt-2 rounded-lg border border-border/60 bg-background/40 p-3">
                  {warmup.rows.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          <th className="py-1 pr-2">Set</th>
                          <th className="py-1 pr-2">Weight</th>
                          <th className="py-1">Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warmup.rows.map((r, n) => (
                          <tr key={n} className="border-t border-border/60">
                            <td className="py-2 pr-2">{n + 1}</td>
                            <td className="py-2 pr-2">{r.label}</td>
                            <td className="py-2">{r.reps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className={cn('text-xs text-muted-foreground', warmup.rows.length > 0 && 'mt-2')}>{warmup.note}</p>
                </div>
              )}
            </div>
          )}
          {hint && !suggestion && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> {hint}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {!readOnly && (
              <button
                onClick={onSwap}
                disabled={swapping}
                className="inline-flex items-center gap-1.5 min-h-[44px] rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
              >
                {swapping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Swap
              </button>
            )}
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-[44px] rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Demo
            </button>
            {!mindBody && (
            <button
              onClick={handleHistoryClick}
              className="inline-flex items-center gap-1.5 min-h-[44px] rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {hasProgressAccess ? <TrendingUp className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
              History
            </button>
            )}
          </div>

          {logging && mindBody && setLogs?.[0] && onSetChange && (
            <button
              type="button"
              onClick={() => onSetChange(0, 'completed', !setLogs[0].completed)}
              className={cn(
                'mt-4 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold transition-colors',
                setLogs[0].completed
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {setLogs[0].completed ? 'Done' : 'Mark as done'}
              <Check className="h-4 w-4" />
            </button>
          )}

          {logging && !mindBody && setLogs && onSetChange && (
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
                  <WeightInput valueLb={s.weight} unit={unit} onChange={(lbs) => onSetChange(si, 'weight', lbs)} />
                  <input
                    type="number"
                    value={s.reps ?? ''}
                    onChange={(e) => onSetChange(si, 'reps', Number(e.target.value))}
                    placeholder="reps"
                    className="h-12 w-full rounded-md border border-input bg-background/60 px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <motion.button
                    onClick={() => onSetChange(si, 'completed', !s.completed)}
                    whileTap={{ scale: 0.85 }}
                    // a quick pop when a set is ticked
                    animate={s.completed ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    aria-label={s.completed ? `Set ${s.setNumber} done` : `Mark set ${s.setNumber} done`}
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-md border transition-colors',
                      s.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground',
                    )}
                  >
                    <Check className="h-5 w-5" />
                  </motion.button>
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
