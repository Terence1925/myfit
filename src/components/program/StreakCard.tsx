import * as React from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Flame, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { sessions } from '@/lib/backend/api'
import { isNativeApp } from '@/lib/platform'
import { computeStreak, countedDates, type StreakInfo } from '@/lib/streak'
import { formatReminderTime, loadReminderSettings, setWorkoutReminders } from '@/lib/workoutReminder'
import { cn } from '@/lib/utils'

/** The weekly streak, shown on the Workout page: weeks in a row with most of the planned workouts done. */
export function StreakCard({ userId, plannedDays }: { userId: string; plannedDays: number }) {
  const [info, setInfo] = React.useState<StreakInfo | null>(null)
  const [remindersOn, setRemindersOn] = React.useState(() => loadReminderSettings(userId).enabled)
  const [busy, setBusy] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const native = isNativeApp()

  const refresh = React.useCallback(async () => {
    const saved = await sessions.listForUser(userId)
    setInfo(computeStreak(countedDates(saved), plannedDays))
    setRemindersOn(loadReminderSettings(userId).enabled)
  }, [userId, plannedDays])

  React.useEffect(() => {
    void refresh()
    // A workout saved elsewhere on the page, or the reminder settings changing, should update this card
    window.addEventListener('myfit:session-saved', refresh)
    window.addEventListener('myfit:reminders-changed', refresh)
    return () => {
      window.removeEventListener('myfit:session-saved', refresh)
      window.removeEventListener('myfit:reminders-changed', refresh)
    }
  }, [refresh])

  if (!info) return null
  const { weeks, best, doneThisWeek, needed, thisWeekCounts } = info
  const left = Math.max(0, needed - doneThisWeek)
  const message = thisWeekCounts
    ? "You're on track this week. Nice work!"
    : weeks > 0
      ? `Do ${left} more workout${left === 1 ? '' : 's'} this week to keep your streak.`
      : doneThisWeek > 0
        ? `Do ${left} more workout${left === 1 ? '' : 's'} this week to start your streak.`
        : `Finish ${needed} of your ${plannedDays} workouts this week to start your streak.`

  const turnOn = async () => {
    setBusy(true)
    setNote(null)
    const result = await setWorkoutReminders(userId, true)
    setBusy(false)
    if (result === 'unavailable') setNote('Reminders are sent by the phone app. Open MyFit on your phone to turn them on.')
    else if (result === 'no-permission') setNote('Allow notifications for MyFit in your phone settings to get reminders.')
    else setRemindersOn(true)
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
              weeks > 0 ? 'bg-orange-500/15 text-orange-500' : 'bg-secondary text-muted-foreground',
            )}
          >
            <Flame className={cn('h-8 w-8', weeks > 0 && 'fill-orange-500/30')} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl tracking-wide">{weeks > 0 ? `${weeks}-WEEK STREAK` : 'START YOUR STREAK'}</div>
            <div className="font-body text-sm text-muted-foreground">{message}</div>
          </div>
          {best > weeks && <div className="shrink-0 text-right text-xs text-muted-foreground">Best<div className="font-display text-lg text-foreground">{best} wks</div></div>}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-1.5" aria-label={`${doneThisWeek} of ${plannedDays} workouts this week`}>
            {Array.from({ length: plannedDays }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'flex h-7 flex-1 items-center justify-center rounded-lg border text-xs font-bold',
                  i < doneThisWeek ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-muted-foreground',
                  i === needed - 1 && i >= doneThisWeek && 'border-dashed border-primary/60',
                )}
              >
                {i < doneThisWeek ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </motion.div>
            ))}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            {doneThisWeek} of {plannedDays} workouts this week. Doing {needed} keeps your streak.
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          {remindersOn ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 text-primary" /> Reminders on at {formatReminderTime(loadReminderSettings(userId).time)}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" /> Remind me on workout days
              </div>
              <Button size="sm" variant="outline" onClick={turnOn} disabled={busy} className="gap-1.5">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Turn on
              </Button>
            </>
          )}
        </div>
        {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
        {!native && remindersOn && <p className="mt-2 text-xs text-muted-foreground">Reminders are delivered by the phone app.</p>}
      </CardContent>
    </Card>
  )
}
