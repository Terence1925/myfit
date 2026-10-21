import { motion } from 'framer-motion'
import { Check, Moon, Trophy } from 'lucide-react'
import { BLOCK_NOTE, BLOCK_WEEKS, TOTAL_WEEKS, blockStatus, type BlockStatus } from '@/lib/programBlock'
import { cn } from '@/lib/utils'

/** Thirteen small bars: 12 weeks of training, then the deload week. The current week is marked. */
export function BlockBars({ status }: { status: BlockStatus }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${status.label}. ${BLOCK_WEEKS} weeks of training, then a deload week.`}>
      {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
        const week = i + 1
        const deload = week === TOTAL_WEEKS
        const done = status.complete || week < status.week
        const current = !status.complete && week === status.week
        return (
          <motion.span
            key={week}
            initial={{ scaleY: 0.4, opacity: 0.4 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              'h-2.5 flex-1 rounded-full',
              deload ? (done || current ? 'bg-accent' : 'bg-accent/30') : done ? 'bg-primary' : current ? 'bg-primary ring-2 ring-primary/40' : 'bg-secondary',
            )}
          />
        )
      })}
    </div>
  )
}

/** The Overview note: this program is built for 12 weeks, then a deload week, then a new program. */
export function BlockOverviewCard({ createdAt, block }: { createdAt: string; block?: { number: number; name: string; summary: string } }) {
  const status = blockStatus(createdAt)
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">{block ? `Block ${block.number} of 4 · ${block.name}` : '12-week program'}</div>
        <div className="text-sm font-semibold">{status.label}</div>
      </div>
      <div className="mt-3">
        <BlockBars status={status} />
        <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Week 1</span>
          <span>Week 12 · Deload</span>
        </div>
      </div>
      {block && <p className="mt-3 font-body text-sm font-semibold text-foreground">{block.summary}</p>}
      <p className={cn('font-body text-sm leading-relaxed text-foreground/90', block ? 'mt-1' : 'mt-3')}>{BLOCK_NOTE}</p>
      <p className="mt-1 font-body text-sm text-muted-foreground">
        A deload week means lighter training (about 40-60% of your usual weights) so your body can recover and come back stronger.
      </p>
    </div>
  )
}

const PHASE_STYLE = {
  final: { icon: Trophy, title: 'Final week', className: 'border-primary/40 bg-primary/10' },
  deload: { icon: Moon, title: 'Deload week', className: 'border-accent/40 bg-accent/10' },
} as const

/** A short banner on the program during the final week and the deload week. Nothing during weeks 1-11. */
export function BlockBanner({ status, note }: { status: BlockStatus; note: string }) {
  if (status.phase !== 'final' && status.phase !== 'deload') return null
  const { icon: Icon, title, className } = PHASE_STYLE[status.phase]
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border p-4', className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <div className="font-display text-xl tracking-wide">{title.toUpperCase()}</div>
        <p className="mt-0.5 font-body text-sm text-foreground/90">{note}</p>
        <p className="mt-1 text-xs text-muted-foreground">{status.daysLeft} {status.daysLeft === 1 ? 'day' : 'days'} left in this program.</p>
      </div>
    </div>
  )
}

/** A one-line "Week 5 of 12" chip row shown above the program tabs. */
export function BlockChip({ status }: { status: BlockStatus }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-widest text-muted-foreground">{status.complete ? 'Program complete' : status.label}</span>
          {!status.complete && status.phase === 'training' && (
            <span className="text-muted-foreground">{BLOCK_WEEKS - status.week + 1} {BLOCK_WEEKS - status.week + 1 === 1 ? 'week' : 'weeks'} of training left</span>
          )}
          {status.complete && <Check className="h-4 w-4 text-primary" />}
        </div>
        <BlockBars status={status} />
      </div>
    </div>
  )
}
