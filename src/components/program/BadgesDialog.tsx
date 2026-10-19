import * as React from 'react'
import { Loader2, Lock, Share2 } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BADGES, GROUP_LABELS, isEarned, type BadgeDef, type BadgeGroup, type BadgeStats } from '@/lib/badges'
import { renderBadgeCard, shareImage } from '@/lib/shareCard'
import { cn } from '@/lib/utils'

const TIER_RING: Record<BadgeDef['tier'], string> = {
  bronze: 'from-amber-400 to-amber-700',
  silver: 'from-slate-200 to-slate-500',
  gold: 'from-yellow-300 to-amber-500',
}

const GROUPS: BadgeGroup[] = ['workouts', 'streak', 'strength', 'food']

export function BadgesDialog({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: BadgeStats }) {
  const [sharing, setSharing] = React.useState<string | null>(null)
  const [note, setNote] = React.useState<string | null>(null)
  const earned = BADGES.filter((b) => isEarned(b, stats)).length

  const share = async (badge: BadgeDef) => {
    setSharing(badge.id)
    setNote(null)
    try {
      const blob = await renderBadgeCard(badge)
      const result = await shareImage(blob, `myfit-${badge.id}.png`, `I earned "${badge.title}" on MyFit!`)
      if (result === 'saved') setNote('Picture saved. Share it from your downloads.')
    } catch (err) {
      // Closing the share sheet is not a problem
      if (!/cancel|abort|dismiss/i.test(err instanceof Error ? `${err.name} ${err.message}` : '')) setNote('Could not share this one. Please try again.')
    } finally {
      setSharing(null)
    }
  }

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
                    {got && (
                      <button
                        onClick={() => void share(b)}
                        disabled={sharing !== null}
                        aria-label={`Share the ${b.title} badge`}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50"
                      >
                        {sharing === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />} Share
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {note && <p className="text-center text-xs text-muted-foreground">{note}</p>}
      </div>
    </Dialog>
  )
}
