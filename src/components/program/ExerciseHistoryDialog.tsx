import { Trophy } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { WeightChart } from '@/components/progress/WeightChart'
import { getExerciseHistory, isLatestAPR } from '@/lib/progressiveOverload'
import type { WorkoutSession } from '@/lib/types'
import { fmtNumber, toUnit, unitLabel, useWeightUnit } from '@/lib/weightUnit'

/** The history of one exercise: every saved workout with each set, and a chart of the estimated max over time. */
export function ExerciseHistoryDialog({
  exerciseName,
  sessions,
  open,
  onClose,
}: {
  exerciseName: string
  sessions: WorkoutSession[]
  open: boolean
  onClose: () => void
}) {
  const [unit] = useWeightUnit()
  const history = getExerciseHistory(sessions, exerciseName)
  const points = history.map((h) => ({ date: h.date, value: toUnit(h.estimated1RM, unit) }))
  const newPR = isLatestAPR(history)
  const label = unitLabel(unit)

  return (
    <Dialog open={open} onClose={onClose} title={`${exerciseName} — History`}>
      {history.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Save a workout with this exercise and its sets will show up here.
        </p>
      ) : (
        <div className="space-y-6">
          {newPR && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
              <Trophy className="h-4 w-4 shrink-0" /> New estimated max personal record!
            </div>
          )}

          {history.length >= 2 ? (
            <div>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Estimated max over time</h4>
              <p className="mb-2 text-xs text-muted-foreground">
                Your estimated max is the most you could lift for one rep, worked out from your best set. If the line goes up, you are getting stronger.
              </p>
              <WeightChart points={points} unitLabel={label} />
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              Save this exercise in one more workout and a chart of your progress will appear here.
            </p>
          )}

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Past workouts</h4>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {[...history].reverse().map((h, i) => (
                <div key={i} className="rounded-xl border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{new Date(h.date).toLocaleDateString()}</span>
                    <Badge variant="outline" className="shrink-0">
                      Est. max ~{fmtNumber(toUnit(h.estimated1RM, unit))} {label}
                    </Badge>
                  </div>
                  <ul className="mt-2 divide-y divide-border">
                    {h.sets.map((s) => (
                      <li key={s.setNumber} className="flex items-center justify-between py-1.5">
                        <span className="text-muted-foreground">Set {s.setNumber}</span>
                        <span className="font-semibold">
                          {fmtNumber(toUnit(s.weight, unit))} {label} × {s.reps} {s.reps === 1 ? 'rep' : 'reps'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
