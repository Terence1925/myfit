import { Lock } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BADGES, GROUP_LABELS, isEarned, type BadgeDef, type BadgeGroup, type BadgeStats } from '@/lib/badges'
import { cn } from '@/lib/utils'

const TIER_RING: Record<BadgeDef['tier'], string> = {
  bronze: 'from-amber-400 to-amber-700',
  silver: 'from-slate-200 to-slate-500',
  gold: 'from-yellow-300 to-amber-500',
}

const GROUPS: BadgeGroup[] = ['workouts', 'streak', 'strength', 'food']

export function BadgesDialog({ open, onClose, stats, newIds = [] }: { open: boolean; onClose: () => void; stats: BadgeStats; newIds?: string[] }) {
  const earned = BADGES.filter((b) => isEarned(b, stats)).length

  return (
    <Dialog open={open} onClose={onClose} title="Your badges" className="max-w-lg">
      <div className="max-h-[72vh] space-y-5 overflow-y-auto">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-display text-3xl tracking-wide">
              {earned} <span className="text-muted-foreground">of {BADGES.length}</span>
            </span>
            <span className="text-xs text-muted-foreground">earned</span>
          </div>
          <Progress value={(earned / BADGES.length) * 100} />
        </div>

        {GROUPS.map((group) => (
          <div key={group}>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{GROUP_LABELS[group]}</div>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.filter((b) => b.group === group).map((b) => {
                const got = isEarned(b, stats)
                const value = Math.min(b.value(stats), b.target)
                return (
                  <div
                    key={b.id}
                    className={cn(
                      'relative flex flex-col items-center rounded-2xl border px-2 pb-3 pt-3 text-center',
                      got ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30',
                    )}
                  >
                    <div className={cn('flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br p-[3px]', got ? TIER_RING[b.tier] : 'from-border to-border')}>
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-card text-3xl">
                        {got ? <span>{b.emoji}</span> : <Lock className="h-6 w-6 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className={cn('mt-2 text-xs font-bold leading-tight', !got && 'text-muted-foreground')}>{b.title}</div>
                    <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                      {got ? b.blurb : `${value} / ${b.target}`}
                    </div>
                    {got && newIds.includes(b.id) && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">New</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
