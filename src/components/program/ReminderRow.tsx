import * as React from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isNativeApp } from '@/lib/platform'
import { formatReminderTime, loadReminderSettings, setWorkoutReminders } from '@/lib/workoutReminder'

/** A small row at the bottom of the Today card: turn workout-day reminders on, or see when they are set. */
export function ReminderRow({ userId }: { userId: string }) {
  const [remindersOn, setRemindersOn] = React.useState(() => loadReminderSettings(userId).enabled)
  const [busy, setBusy] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const native = isNativeApp()

  React.useEffect(() => {
    const refresh = () => setRemindersOn(loadReminderSettings(userId).enabled)
    window.addEventListener('myfit:reminders-changed', refresh)
    return () => window.removeEventListener('myfit:reminders-changed', refresh)
  }, [userId])

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
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {remindersOn ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" /> Reminders on at {formatReminderTime(loadReminderSettings(userId).time)}
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
    </div>
  )
}
