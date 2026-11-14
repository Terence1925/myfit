import * as React from 'react'
import { Bell, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { weekdaysFor } from '@/lib/backend/mindBodyStyles'
import { programs } from '@/lib/backend/api'
import { isNativeApp } from '@/lib/platform'
import { formatReminderTime, loadReminderSettings, setWorkoutReminders, type ReminderResult } from '@/lib/workoutReminder'
import { cn } from '@/lib/utils'
import { TimeWheel } from './TimeWheel'

/** The day circles, Sunday first. The numbers are JavaScript getDay values (0 = Sunday). */
const DAY_CIRCLES: Array<{ day: number; label: string; short: string; letter: string }> = [
  { day: 0, label: 'Sunday', short: 'Sun', letter: 'S' },
  { day: 1, label: 'Monday', short: 'Mon', letter: 'M' },
  { day: 2, label: 'Tuesday', short: 'Tue', letter: 'T' },
  { day: 3, label: 'Wednesday', short: 'Wed', letter: 'W' },
  { day: 4, label: 'Thursday', short: 'Thu', letter: 'T' },
  { day: 5, label: 'Friday', short: 'Fri', letter: 'F' },
  { day: 6, label: 'Saturday', short: 'Sat', letter: 'S' },
]
const DAY_SHORT: Record<number, string> = Object.fromEntries(DAY_CIRCLES.map((b) => [b.day, b.short]))
const WEEKDAY_NUMBER: Record<string, number> = Object.fromEntries(DAY_CIRCLES.map((b) => [b.label, b.day]))
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

const MESSAGES: Partial<Record<ReminderResult, string>> = {
  'no-permission': 'MyFit is not allowed to send notifications. Turn them on for MyFit in your phone settings, then try again.',
  'no-program': 'Create a program first, then reminders will use its workout days.',
  unavailable: 'Reminders could not be set up on this device.',
}

/** Account page: turn workout reminders on or off, then choose the time and the days. The reminders themselves live on the phone. */
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

  const apply = async (enabled: boolean, time?: string, weekdays?: number[] | null) => {
    setBusy(true)
    setMessage(null)
    const result = await setWorkoutReminders(userId, enabled, time, weekdays)
    setSettings(loadReminderSettings(userId))
    setMessage(MESSAGES[result] ?? null)
    setBusy(false)
  }

  // The program's usual days, as getDay numbers (0 = Sunday)
  const programDays = plannedDays ? weekdaysFor(plannedDays).map((name) => WEEKDAY_NUMBER[name]) : []
  const selectedDays = settings.weekdays ?? programDays
  const chosenCustom = settings.weekdays !== undefined
  const everyDay = selectedDays.length === 7

  const toggleDay = (day: number) => {
    const next = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day]
    if (next.length === 0) {
      setMessage('Pick at least one day.')
      return
    }
    void apply(settings.enabled, undefined, next)
  }

  // The "Daily" checkbox picks every day; unticking goes back to the program's days (or Mon to Fri)
  const toggleDaily = () => {
    const back = programDays.length > 0 && programDays.length < 7 ? programDays : [1, 2, 3, 4, 5]
    void apply(settings.enabled, undefined, everyDay ? back : ALL_DAYS)
  }

  // Monday-first for the text, so it reads "Mon, Wed, Fri"
  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => selectedDays.includes(d))
  const daysText = everyDay ? 'Daily' : orderedDays.length ? orderedDays.map((d) => DAY_SHORT[d]).join(', ') : null

  return (
    <Card id="reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Workout reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body text-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Remind me</div>
            {daysText && <div className="text-xs text-muted-foreground">{daysText}</div>}
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Workout reminders"
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

        {settings.enabled && (
          <>
            <TimeWheel
              value={settings.time}
              disabled={busy || !native}
              onChange={(value) => {
                setSettings({ ...settings, time: value })
                void apply(settings.enabled, value)
              }}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground">{daysText ?? 'Pick your days'}</span>
              <button
                type="button"
                role="checkbox"
                aria-checked={everyDay}
                disabled={busy || !native}
                onClick={toggleDaily}
                className="flex items-center gap-2 disabled:opacity-50"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                    everyDay ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/50',
                  )}
                >
                  {everyDay && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="text-foreground">Daily</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-1" role="group" aria-label="Reminder days">
              {DAY_CIRCLES.map((b) => {
                const on = selectedDays.includes(b.day)
                return (
                  <button
                    key={b.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={b.label}
                    disabled={busy || !native}
                    onClick={() => toggleDay(b.day)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-colors disabled:opacity-50',
                      on ? 'border-primary/40 bg-primary/15 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground',
                    )}
                  >
                    {b.letter}
                  </button>
                )
              })}
            </div>

            {chosenCustom && plannedDays && selectedDays.length !== plannedDays && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                Your program has {plannedDays} {plannedDays === 1 ? 'day' : 'days'} and you picked {selectedDays.length}.{' '}
                {selectedDays.length < plannedDays
                  ? 'Some workouts will not get a reminder.'
                  : 'Some workouts will repeat in the reminders.'}
              </p>
            )}
          </>
        )}

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
