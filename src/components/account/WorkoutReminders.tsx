import * as React from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { weekdaysFor } from '@/lib/backend/mindBodyStyles'
import { programs } from '@/lib/backend/api'
import { isNativeApp } from '@/lib/platform'
import { formatReminderTime, loadReminderSettings, setWorkoutReminders, type ReminderResult } from '@/lib/workoutReminder'
import { cn } from '@/lib/utils'

const MESSAGES: Partial<Record<ReminderResult, string>> = {
  'no-permission': 'MyFit is not allowed to send notifications. Turn them on for MyFit in your phone settings, then try again.',
  'no-program': 'Create a program first, then reminders will use its workout days.',
  unavailable: 'Reminders could not be set up on this device.',
}

/** Account page: turn workout reminders on or off and choose the time. The reminders themselves live on the phone. */
export function WorkoutReminders({ userId }: { userId: string }) {
  const native = isNativeApp()
  const [settings, setSettings] = React.useState(() => loadReminderSettings(userId))
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [plannedDays, setPlannedDays] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    programs.listForUser(userId).then((list) => {
      const latest = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
      if (!cancelled) setPlannedDays(latest ? latest.programData.days.length : null)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const apply = async (enabled: boolean, time?: string) => {
    setBusy(true)
    setMessage(null)
    const result = await setWorkoutReminders(userId, enabled, time)
    setSettings(loadReminderSettings(userId))
    setMessage(MESSAGES[result] ?? null)
    setBusy(false)
  }

  const daysText = plannedDays ? weekdaysFor(plannedDays).map((d) => d.slice(0, 3)).join(', ') : null

  return (
    <Card id="reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Workout reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body text-sm">
        <p className="text-muted-foreground">
          A reminder on your workout days, like "Today: Pull Day A. 5 exercises, about 50 min." It only shows up on days you train.
        </p>

        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Remind me</div>
            {daysText && <div className="text-xs text-muted-foreground">{daysText}</div>}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            disabled={busy || !native}
            onClick={() => void apply(!settings.enabled)}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
              settings.enabled ? 'bg-primary' : 'bg-secondary',
            )}
          >
            <span
              className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', settings.enabled ? 'translate-x-6' : 'translate-x-1')}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="reminder-time" className="font-semibold">
            Time
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="reminder-time"
              type="time"
              value={settings.time}
              disabled={busy || !native}
              onChange={(e) => {
                const value = e.target.value
                if (!value) return
                setSettings({ ...settings, time: value })
                if (settings.enabled) void apply(true, value)
                else void apply(false, value)
              }}
              className="h-10 w-32"
            />
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        {settings.enabled && native && (
          <p className="text-xs text-muted-foreground">
            You'll get a reminder at {formatReminderTime(settings.time)} on your workout days. If you've already trained that day, it
            skips.
          </p>
        )}
        {!native && (
          <p className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            Reminders are sent by the MyFit phone app. Open MyFit on your phone, go to Account, and turn them on there.
          </p>
        )}
        {message && <p className="text-xs text-destructive">{message}</p>}
      </CardContent>
    </Card>
  )
}
