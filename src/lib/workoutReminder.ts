import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { programs, sessions } from './backend/api'
import { DEFAULT_REMINDER_TIME, HORIZON_DAYS, ID_BASE, planReminders } from './reminderPlan'
import { countedDates } from './streak'
import { isNativeApp, nativePlatform } from './platform'

// Workout reminders: a notification on the person's training days at the time they choose. They live on the phone (the
// settings are saved on the phone too), so they work offline. We schedule the next two weeks of reminders and refresh them
// whenever the app opens, a workout is saved, or the settings change. If today's workout is already saved, today's reminder
// is skipped.

export interface ReminderSettings {
  enabled: boolean
  /** 24-hour "HH:MM". */
  time: string
}

export { DEFAULT_REMINDER_TIME, formatReminderTime } from './reminderPlan'
const CHANNEL_ID = 'workout-reminders'

const storageKey = (userId: string) => `myfit_reminders_${userId}`

export function loadReminderSettings(userId: string): ReminderSettings {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReminderSettings>
      return { enabled: !!parsed.enabled, time: /^\d{2}:\d{2}$/.test(parsed.time ?? '') ? (parsed.time as string) : DEFAULT_REMINDER_TIME }
    }
  } catch {
    /* fall through to the defaults */
  }
  return { enabled: false, time: DEFAULT_REMINDER_TIME }
}

export function saveReminderSettings(userId: string, settings: ReminderSettings): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings))
  } catch {
    /* private mode etc.: the reminders just are not remembered */
  }
}

const allIds = () => Array.from({ length: HORIZON_DAYS }, (_, i) => ({ id: ID_BASE + i }))

export type ReminderResult = 'on' | 'off' | 'no-permission' | 'unavailable' | 'no-program'

/** Makes the phone's scheduled reminders match the saved settings, the latest program and today's progress. */
export async function syncWorkoutReminders(userId: string): Promise<ReminderResult> {
  if (!isNativeApp()) return 'unavailable'
  try {
    const settings = loadReminderSettings(userId)
    // The browser preview pretends to be a phone, but has no notifications to schedule
    if (!Capacitor.isNativePlatform()) return settings.enabled ? 'on' : 'off'
    await LocalNotifications.cancel({ notifications: allIds() })
    if (!settings.enabled) return 'off'

    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return 'no-permission'

    const list = await programs.listForUser(userId)
    const latest = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
    if (!latest) return 'no-program'
    const saved = await sessions.listForUser(userId)
    const today = new Date().toDateString()
    // A little logged this morning should not switch off this evening's reminder: only a workout that counts does
    const doneToday = countedDates(saved).some((d) => new Date(d).toDateString() === today)

    const planned = planReminders({ now: new Date(), days: latest.programData.days, time: settings.time, doneToday })
    if (planned.length === 0) return 'on'

    if (nativePlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Workout reminders',
        description: 'A reminder on the days you train',
        importance: 3,
      })
    }
    await LocalNotifications.schedule({
      notifications: planned.map((r) => ({
        id: r.id,
        channelId: CHANNEL_ID,
        title: r.title,
        body: r.body,
        // Inexact is fine for a reminder and never sends the person to the exact-alarm settings screen
        isExactNotification: false,
        schedule: { at: r.at, allowWhileIdle: true },
      })),
    })
    return 'on'
  } catch {
    // Best-effort: a missing permission or plugin must never break the app
    return 'unavailable'
  }
}

/** Turn reminders on or off from a screen. Saves the choice, then updates the phone. */
export async function setWorkoutReminders(userId: string, enabled: boolean, time?: string): Promise<ReminderResult> {
  const current = loadReminderSettings(userId)
  saveReminderSettings(userId, { enabled, time: time ?? current.time })
  const result = await syncWorkoutReminders(userId)
  window.dispatchEvent(new Event('myfit:reminders-changed'))
  return result
}
