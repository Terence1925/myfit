import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeApp } from './platform'

const REST_NOTIFICATION_ID = 4102
const CHANNEL_ID = 'rest-timer'

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

/**
 * Asks the phone to alert the user when rest ends. The phone, not the app, fires this — so it works
 * with the screen off or while another app is open. Best-effort: no permission or web = no alert here
 * (the on-screen timer still works).
 */
export async function scheduleRestAlert(endsAt: number, title: string, body: string): Promise<void> {
  if (!isNativeApp()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] })
    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Rest timer',
      description: 'Vibrates when your rest between sets is over',
      importance: 4,
      vibration: true,
    })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_NOTIFICATION_ID,
          channelId: CHANNEL_ID,
          title,
          body,
          schedule: { at: new Date(endsAt), allowWhileIdle: true },
        },
      ],
    })
  } catch {
    // Best-effort — the on-screen countdown still works.
  }
}

export async function cancelRestAlert(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] })
  } catch {
    // Nothing to cancel.
  }
}
