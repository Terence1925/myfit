import * as React from 'react'
import { motion } from 'framer-motion'
import { BellRing, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RestState {
  endsAt: number
  totalSeconds: number
  /** Short text for what's next, e.g. "start set 2" or "next up: Walking Lunge". */
  nextLabel: string
  exerciseName: string
}

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export function RestTimerBar({
  rest,
  onAddTime,
  onSkip,
}: {
  rest: RestState
  onAddTime: () => void
  onSkip: () => void
}) {
  const [now, setNow] = React.useState(() => Date.now())
  const vibratedFor = React.useRef<number | null>(null)

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const leftSeconds = Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
  const over = leftSeconds === 0
  const progress = Math.min(100, Math.max(0, ((rest.totalSeconds - leftSeconds) / rest.totalSeconds) * 100))

  // Buzz once when the countdown reaches zero while the app is open (the phone's own
  // notification covers the screen-off case).
  React.useEffect(() => {
    if (over && vibratedFor.current !== rest.endsAt) {
      vibratedFor.current = rest.endsAt
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // Not supported — fine.
      }
    }
  }, [over, rest.endsAt])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="timer"
      aria-live="polite"
    >
      <div className="container max-w-2xl py-3">
        {over ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-body text-base font-bold text-emerald-400">
              <BellRing className="h-5 w-5" /> Rest over — {rest.nextLabel}
            </div>
            <Button size="sm" variant="outline" onClick={onSkip}>
              Got it
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> Rest — {rest.nextLabel}
              </span>
              <span className="font-display text-3xl tracking-wide text-primary">{fmt(leftSeconds)}</span>
            </div>
            <div className="my-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={onAddTime}>
                +15 sec
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={onSkip}>
                Skip rest
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
