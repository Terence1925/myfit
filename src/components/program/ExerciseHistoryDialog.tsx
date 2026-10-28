import { Trophy } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { WeightChart } from '@/components/progress/WeightChart'
import { getExerciseHistory, isLatestAPR } from '@/lib/progressiveOverload'
import type { WorkoutSession } from '@/lib/types'
import { fmtNumber, toUnit, unitLabel, useWeightUnit } from '@/lib/weightUnit'

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

  return (
    <Dialog open={open} onClose={onClose} title={`${exerciseName} — Progress`}>
      {history.length < 2 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Log this exercise as completed in at least 2 sessions to see your progression chart.
        </p>
      ) : (
        <div className="space-y-6">
          {newPR && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
              <Trophy className="h-4 w-4 shrink-0" /> New estimated 1-rep-max personal record!
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Estimated 1-Rep Max Trend
            </h4>
            <WeightChart points={points} unitLabel={unitLabel(unit)} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Session History
            </h4>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {[...history].reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <span className="shrink-0 text-muted-foreground">{new Date(h.date).toLocaleDateString()}</span>
                  <span className="font-semibold">
                    {fmtNumber(toUnit(h.topWeight, unit))} × {h.topReps}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    ~{fmtNumber(toUnit(h.estimated1RM, unit))} {unitLabel(unit)} est. max
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}
