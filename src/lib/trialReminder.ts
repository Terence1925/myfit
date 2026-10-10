import { LocalNotifications } from '@capacitor/local-notifications'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { configureRevenueCat, PRO_ENTITLEMENT_ID } from './backend/revenuecat'
import { isNativeApp } from './platform'

const REMINDER_ID = 4101
const CHANNEL_ID = 'trial-reminders'
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Keeps one on-device notification in sync with the user's real trial: "your trial ends tomorrow".
 * Safe to call as often as we like (after purchase, on app start) — it always cancels the old
 * reminder first, and only schedules a new one if the user is still in a trial that will convert
 * to a paid subscription. So cancelling in Google Play removes the reminder on the next app open.
 * Best-effort by design: no notification permission, no network, or RevenueCat not set up yet
 * should never break the app.
 */
export async function syncTrialReminder(userId: string): Promise<void> {
  if (!isNativeApp()) return
  try {
    await configureRevenueCat(userId)
    const { customerInfo } = await Purchases.getCustomerInfo()
    const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]

    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })

    const inConvertingTrial =
      entitlement &&
      entitlement.periodType?.toUpperCase() === 'TRIAL' &&
      entitlement.willRenew &&
      entitlement.expirationDate
    if (!inConvertingTrial) return

    const remindAt = new Date(new Date(entitlement.expirationDate as string).getTime() - DAY_MS)
    if (remindAt.getTime() <= Date.now()) return

    let permission = await LocalNotifications.checkPermissions()
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Trial reminders',
      description: 'A heads-up before your free trial turns into a paid subscription',
      importance: 3,
    })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          channelId: CHANNEL_ID,
          title: 'Your MyFit free trial ends tomorrow',
          body: "You'll be charged when it ends unless you cancel in Google Play → Subscriptions.",
          // Same reason as the rest timer: never send the user to the exact-alarm settings screen.
          isExactNotification: false,
          schedule: { at: remindAt, allowWhileIdle: true },
        },
      ],
    })
  } catch {
    // Best-effort — see above.
  }
}
