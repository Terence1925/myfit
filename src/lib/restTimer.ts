import { registerPlugin } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeApp, nativePlatform } from './platform'

// Our own small Android plugin (android/app/src/main/java/com/myfit/app/RestAlarmPlugin.java).
interface RestAlarmPlugin {
  start(options: { endsAt: number; title: string; body: string }): Promise<void>
  stop(): Promise<void>
  isRinging(): Promise<{ ringing: boolean }>
  canExact(): Promise<{ allowed: boolean }>
  openExactSettings(): Promise<void>
  diagnose(): Promise<{
    canScheduleExact?: boolean
    sdk?: number
    notificationsEnabled?: boolean
    channelImportance?: number
    channelVibrates?: boolean
    channelHasSound?: boolean
    interruptionFilter?: number
    ringerMode?: number
    alarmVolume?: number
    alarmVolumeMax?: number
    hasVibrator?: boolean
  }>
}
const RestAlarm = registerPlugin<RestAlarmPlugin>('RestAlarm')

/**
 * The custom phone alarm (RestAlarmPlugin). It needs Android's "Alarms & reminders" permission, which the
 * person switches on once. Without it the alert falls back to a standard notification (one buzz, no ring that
 * repeats). Set to false to force that fallback everywhere.
 */
export const NATIVE_ALARM_ENABLED = true

/** The custom ringing alarm only exists on Android. On iPhone the alert is a normal notification. */
const usesNativeAlarm = () => NATIVE_ALARM_ENABLED && nativePlatform() === 'android'

const FALLBACK_NOTIFICATION_ID = 4102
const FALLBACK_CHANNEL_ID = 'rest-timer'

/**
 * Turns a program rest string into seconds. Programs store ranges like "45-60 sec" or "2-3 min";
 * we start the timer at the top of the range (the full prescribed rest) — the user can skip early
 * or add 15 sec. Falls back to 60 sec if the text is something unexpected.
 */
export function parseRestSeconds(rest: string): number {
  const numbers = rest.match(/\d+(\.\d+)?/g)?.map(Number)
  if (!numbers?.length) return 60
  const top = Math.max(...numbers)
  const seconds = /min/i.test(rest) ? top * 60 : top
  return Math.min(Math.max(Math.round(seconds), 10), 600)
}

export interface AlertResult {
  /** Plain-English reason the full alert could not be set, or null if it was. */
  problem: string | null
  /** True when the only thing missing is Android's "Alarms & reminders" switch for this app. */
  needsExactPermission: boolean
}

const OK: AlertResult = { problem: null, needsExactPermission: false }

/**
 * Sets an alert for the end of the rest. With the exact-alarm permission, the phone itself fires it exactly on
 * time, even with the screen off or another app open, and it rings and vibrates until the user taps "Got it".
 * Without the permission (or if anything fails) a standard notification is scheduled instead, so there is
 * always at least one buzz, and the reason is returned so it can be shown instead of failing silently.
 */
export async function scheduleRestAlert(endsAt: number, title: string, body: string): Promise<AlertResult> {
  if (!isNativeApp()) return OK
  if (!usesNativeAlarm()) return { problem: await scheduleFallbackAlert(endsAt, title, body), needsExactPermission: false }
  try {
    // Android 13+ needs the notification permission for any alert to show.
    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') {
      return {
        problem: 'Notifications are turned off for MyFit, so the phone alert cannot show. Turn them on in Settings > Apps > MyFit > Notifications.',
        needsExactPermission: false,
      }
    }

    const { allowed } = await RestAlarm.canExact()
    if (!allowed) {
      await scheduleFallbackAlert(endsAt, title, body)
      return {
        problem: 'For an alert that rings and keeps going until you tap Got it, allow "Alarms & reminders" for MyFit.',
        needsExactPermission: true,
      }
    }

    await RestAlarm.start({ endsAt, title, body })
    return OK
  } catch (err) {
    console.warn('Rest alarm could not be set', err)
    // Still give the person a normal alert rather than nothing.
    await scheduleFallbackAlert(endsAt, title, body)
    const reason = (err as { message?: string } | null)?.message ?? String(err)
    return { problem: `The ringing alert could not be set (${reason}). A normal notification will be used instead.`, needsExactPermission: false }
  }
}

/** Opens Android's "Alarms & reminders" screen for MyFit. */
export async function openExactAlarmSettings(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await RestAlarm.openExactSettings()
  } catch (err) {
    console.warn('Could not open the alarm settings', err)
  }
}

/** Safe mode: a standard notification (no repeating ring), scheduled without any exact-alarm permission. */
async function scheduleFallbackAlert(endsAt: number, title: string, body: string): Promise<string | null> {
  try {
    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') {
      return 'Notifications are turned off for MyFit, so the phone alert cannot show. Turn them on in Settings > Apps > MyFit > Notifications.'
    }
    await LocalNotifications.cancel({ notifications: [{ id: FALLBACK_NOTIFICATION_ID }] })
    // Notification channels are an Android idea; iPhone has none.
    if (nativePlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: FALLBACK_CHANNEL_ID,
        name: 'Rest timer',
        description: 'Vibrates when your rest between sets is over',
        importance: 4,
        vibration: true,
      })
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: FALLBACK_NOTIFICATION_ID,
          channelId: FALLBACK_CHANNEL_ID,
          title,
          body,
          // Never ask for exact alarms: the plugin would otherwise open Android's "Alarms & reminders" screen.
          isExactNotification: false,
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
        },
      ],
    })
    return null
  } catch (err) {
    console.warn('Rest alert could not be set', err)
    return `The phone alert could not be set (${(err as { message?: string } | null)?.message ?? String(err)}).`
  }
}

/** Cancels a pending alert and silences one that is already ringing. */
export async function cancelRestAlert(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: FALLBACK_NOTIFICATION_ID }] })
  } catch {
    // Nothing to cancel.
  }
  if (!usesNativeAlarm()) return
  try {
    await RestAlarm.stop()
  } catch {
    // Nothing to cancel.
  }
}

/** True while the rest-over notification is on screen and buzzing. Null if unknown (web, or an error). */
export async function isRestAlarmRinging(): Promise<boolean | null> {
  if (!isNativeApp() || !usesNativeAlarm()) return null
  try {
    return (await RestAlarm.isRinging()).ringing
  } catch {
    return null
  }
}

export interface CheckLine {
  /** true = fine, false = a problem, null = just information. */
  ok: boolean | null
  text: string
}

const errorText = (err: unknown) => (err as { message?: string } | null)?.message ?? String(err)

/**
 * Walks through everything that has to be true for the rest alert to ring and vibrate, then sets a real
 * alert 10 seconds out and checks that it actually shows up. Reports each step as it goes so the
 * result can be read on the phone, with no log reading needed.
 */
export async function runRestAlarmCheck(report: (lines: CheckLine[]) => void): Promise<void> {
  const lines: CheckLine[] = []
  const add = (ok: boolean | null, text: string) => {
    lines.push({ ok, text })
    report([...lines])
  }

  if (!isNativeApp()) {
    add(null, 'This check only works in the phone app.')
    return
  }

  try {
    const info = await RestAlarm.diagnose()
    add(true, 'The app can reach the phone alarm code.')
    add(info.notificationsEnabled === true, info.notificationsEnabled ? 'Notifications are allowed for MyFit.' : 'Notifications are OFF for MyFit. Turn them on in Settings > Apps > MyFit > Notifications.')
    if (info.channelImportance !== undefined) {
      const loud = info.channelImportance >= 4
      add(loud, loud ? 'The "Rest timer alarm" notification type is set to urgent.' : `The "Rest timer alarm" notification type is set to quiet (level ${info.channelImportance}). In Settings > Apps > MyFit > Notifications > Rest timer alarm, choose Urgent.`)
      add(info.channelHasSound === true, info.channelHasSound ? 'Sound is on for it.' : 'Sound is OFF for the "Rest timer alarm" notification type. Turn it on in the same place.')
      add(info.channelVibrates === true, info.channelVibrates ? 'Vibration is on for it.' : 'Vibration is OFF for the "Rest timer alarm" notification type. Turn it on in the same place.')
    }
    const dndOff = info.interruptionFilter === undefined || info.interruptionFilter <= 1
    add(dndOff, dndOff ? 'Do Not Disturb is off.' : 'Do Not Disturb is ON, which can silence the alert. Turn it off for this test.')
    if (info.alarmVolume !== undefined) {
      const heard = info.alarmVolume > 0
      add(heard, heard ? `Alarm volume is ${info.alarmVolume} of ${info.alarmVolumeMax}.` : 'Alarm volume is 0. Raise it in Settings > Sounds and vibration > Volume > Alarm.')
    }
    if (info.ringerMode !== undefined) {
      add(null, `Phone mode: ${info.ringerMode === 2 ? 'Sound' : info.ringerMode === 1 ? 'Vibrate' : 'Silent'}.${info.ringerMode === 0 ? ' Silent mode can block vibration.' : ''}`)
    }
    add(info.hasVibrator === true, info.hasVibrator ? 'This phone can vibrate.' : 'This phone reports no vibration motor.')
    if (info.canScheduleExact === false) {
      add(false, 'Exact alarms are NOT allowed for MyFit. Tap "Allow exact alerts" above, switch it on, then come back and test again.')
      return
    }
    add(true, 'Exact alarms are allowed for MyFit.')
  } catch (err) {
    add(false, `The app cannot reach the phone alarm code (${errorText(err)}). The app may need a fresh install with Run in Android Studio.`)
    return
  }

  try {
    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    add(permission.display === 'granted', permission.display === 'granted' ? 'The notification permission is granted.' : 'The notification permission is NOT granted. The alert cannot show.')
  } catch (err) {
    add(false, `Could not check the notification permission (${errorText(err)}).`)
  }

  try {
    await RestAlarm.start({ endsAt: Date.now() + 10_000, title: 'Rest over (test)', body: 'If you can hear and feel this, the alert works.' })
    add(true, 'A test alert was set for 10 seconds from now. Keep the screen on or lock the phone, and wait.')
  } catch (err) {
    add(false, `Setting the test alert FAILED: ${errorText(err)}`)
    return
  }

  await new Promise((resolve) => setTimeout(resolve, 12_000))
  try {
    const { ringing } = await RestAlarm.isRinging()
    add(ringing, ringing ? 'The alert is showing now. Did it ring and vibrate? Tap "Got it" on it to stop.' : 'The alert did NOT show up. The phone did not fire the alarm.')
  } catch (err) {
    add(false, `Could not check whether the alert showed (${errorText(err)}).`)
  }
}

/** Silences a test (or any) alert that is still ringing. */
export const stopRestAlarmNow = cancelRestAlert
