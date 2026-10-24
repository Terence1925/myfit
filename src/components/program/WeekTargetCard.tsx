import { Moon, Target, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_WEEKS } from '@/lib/programBlock'
import type { WeekTarget } from '@/lib/weekPlan'

/** What this week asks for: how hard to train and what to aim for. Sits above the workout days. */
export function WeekTargetCard({ target }: { target: WeekTarget }) {
  const Icon = target.deload ? Moon : target.phase === 'test' ? Trophy : Target
  return (
    <div className={cn('rounded-2xl border p-4', target.deload ? 'border-border bg-secondary/60' : 'border-border bg-card')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <Icon className="h-4 w-4" />
          {target.deload ? 'Deload week' : `Week ${target.week} of ${BLOCK_WEEKS} · ${target.title}`}
        </div>
        {!target.deload && <div className="text-xs font-semibold text-muted-foreground">{target.rir} reps left</div>}
      </div>
      <p className="mt-2 font-body text-sm leading-relaxed text-foreground/90">{target.advice}</p>
    </div>
  )
}
