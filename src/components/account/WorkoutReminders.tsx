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
const WORK_WEEK = [1, 2, 3, 4, 5]

const MESSAGES: Partial<Record<ReminderResult, string>> = {
  'no-permission': 'MyFit is not allowed to send notifications. Turn them on for MyFit in your phone settings, then try again.',
  'no-program': 'Create a program first, then reminders will use its workout days.',
  unavailable: 'Reminders could not be set up on this device.',
}

/** "Mon, Wed, Fri", or "Daily" when every day is picked. */
function daysSummary(days: number[]): string | null {
  if (days.length === 7) return 'Daily'
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d))
  return ordered.length ? ordered.map((d) => DAY_SHORT[d]).join(', ') : null
}

/**
 * Account page: workout reminders, laid out like a phone alarm. Turning the switch on opens the editor (time wheel and
 * days) with Cancel and Save. Once saved, the card shows the time and days with the switch. The reminders live on the phone.
 */
export function WorkoutReminders({ userId }: { userId: string }) {
  const native = isNativeApp()
  const [settings, setSettings] = React.useState(() => loadReminderSettings(userId))
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [plannedDays, setPlannedDays] = React.useState<number | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [draftTime, setDraftTime] = React.useState(settings.time)
  const [draftDays, setDraftDays] = React.useState<number[]>(WORK_WEEK)

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
  const savedDays = settings.weekdays ?? programDays

  const openEditor = () => {
    setDraftTime(settings.time)
    setDraftDays(savedDays.length ? savedDays : WORK_WEEK)
    setMessage(null)
    setEditing(true)
  }

  const save = async () => {
    if (draftDays.length === 0) {
      setMessage('Pick at least one day.')
      return
    }
    setEditing(false)
    await apply(true, draftTime, draftDays)
  }

  const toggleDraftDay = (day: number) => {
    setMessage(null)
    setDraftDays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]))
  }

  const everyDay = draftDays.length === 7
  // The "Daily" checkbox picks every day; unticking goes back to the program's days (or Mon to Fri)
  const toggleDaily = () => {
    setMessage(null)
    const back = programDays.length > 0 && programDays.length < 7 ? programDays : WORK_WEEK
    setDraftDays(everyDay ? back : ALL_DAYS)
  }

  const [clock, suffix] = formatReminderTime(settings.time).split(' ')

  const Switch = (
    <button
      type="button"
      role="switch"
      aria-label="Workout reminders"
      aria-checked={settings.enabled}
      disabled={busy || !native}
      onClick={() => (settings.enabled ? void apply(false) : openEditor())}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        settings.enabled ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', settings.enabled ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  )

  return (
    <Card id="reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" /> Workout reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 font-body text-sm">
        {editing ? (
          <>
            <TimeWheel value={draftTime} disabled={busy || !native} onChange={setDraftTime} />

            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground">{daysSummary(draftDays) ?? 'Pick your days'}</span>
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
                const on = draftDays.includes(b.day)
                return (
                  <button
                    key={b.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={b.label}
                    disabled={busy || !native}
                    onClick={() => toggleDraftDay(b.day)}
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

            {plannedDays && draftDays.length > 0 && draftDays.length !== plannedDays && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                Your program has {plannedDays} {plannedDays === 1 ? 'day' : 'days'} and you picked {draftDays.length}.{' '}
                {draftDays.length < plannedDays ? 'Some workouts will not get a reminder.' : 'Some workouts will repeat in the reminders.'}
              </p>
            )}

            <div className="flex justify-center pt-1">
              <div className="flex items-center rounded-full border border-border bg-card shadow-sm">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false)
                    setMessage(null)
                  }}
                  className="px-7 py-3 font-semibold text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <span aria-hidden="true" className="h-5 w-px bg-border" />
                <button
                  type="button"
                  disabled={busy || !native || draftDays.length === 0}
                  onClick={() => void save()}
                  className="px-7 py-3 font-semibold text-foreground disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : settings.enabled ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={openEditor} disabled={busy || !native} className="text-left disabled:opacity-60" aria-label="Edit workout reminder">
                <div className="flex items-baseline gap-1.5 text-foreground">
                  <span className="text-4xl">{clock}</span>
                  <span className="text-base">{suffix}</span>
                </div>
                <div className="mt-1.5 flex gap-2" aria-label={`Reminder days: ${daysSummary(savedDays) ?? ''}`}>
                  {DAY_CIRCLES.map((b) => (
                    <span key={b.day} className={cn('text-sm', savedDays.includes(b.day) ? 'font-semibold text-primary' : 'text-muted-foreground/60')}>
                      {b.letter}
                    </span>
                  ))}
                </div>
              </button>
              {Switch}
            </div>
            {native && (
              <p className="text-xs text-muted-foreground">
                You'll get a reminder at {formatReminderTime(settings.time)} on your workout days. If you've already trained that day, it
                skips.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Remind me</div>
              <div className="text-xs text-muted-foreground">{daysSummary(savedDays) ?? 'A reminder on the days you train'}</div>
            </div>
            {Switch}
          </div>
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
