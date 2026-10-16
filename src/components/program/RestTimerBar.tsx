import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isNativeApp } from '@/lib/platform'
import { isRestAlarmRinging, openExactAlarmSettings } from '@/lib/restTimer'
import { addRestTime, stopRestTimer, useRestTimer, type RestState } from '@/lib/restTimerStore'

function fmt(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function RestTimerBar({
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

  // In the phone app, the native alarm (RestAlarmPlugin) does the buzzing — repeatedly, until "Got it".
  // On the web there's no native alarm, so buzz once if the browser supports it.
  React.useEffect(() => {
    if (isNativeApp()) return
    if (over && vibratedFor.current !== rest.endsAt) {
      vibratedFor.current = rest.endsAt
      try {
        navigator.vibrate?.([200, 100, 200])
      } catch {
        // Not supported — fine.
      }
    }
  }, [over, rest.endsAt])

  // If "Got it" was tapped on the notification while the app was in the background, the bar would
  // otherwise sit on "Rest over". Once we've seen the alarm ringing and it stops, close the bar.
  const sawRinging = React.useRef(false)
  React.useEffect(() => {
    if (!over || !isNativeApp()) return
    let cancelled = false
    const check = async () => {
      const ringing = await isRestAlarmRinging()
      if (cancelled || ringing === null) return
      if (ringing) sawRinging.current = true
      else if (sawRinging.current) onSkip()
    }
    void check()
    const id = setInterval(check, 1000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [over, onSkip])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 border-t border-border bg-card/95 backdrop-blur sm:bottom-0 sm:pb-[env(safe-area-inset-bottom)]"
      role="timer"
      aria-live="polite"
    >
      <div className="container max-w-2xl py-3">
        {rest.alertProblem && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <span>{rest.alertProblem}</span>
            {rest.needsExactPermission && (
              <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => void openExactAlarmSettings()}>
                Allow
              </Button>
            )}
          </div>
        )}
        {over ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-body text-base font-bold text-emerald-600 dark:text-emerald-400">
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

/** Mounted once for the whole app, so the timer stays on screen whichever page the user is on. */
export function RestTimerHost() {
  const rest = useRestTimer()
  return (
    <AnimatePresence>
      {rest && <RestTimerBar key={rest.exerciseName + rest.nextLabel} rest={rest} onAddTime={addRestTime} onSkip={stopRestTimer} />}
    </AnimatePresence>
  )
}
