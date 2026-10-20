import { registerPlugin } from '@capacitor/core'
import { programs, sessions } from '@/lib/backend/api'
import { nativePlatform } from '@/lib/platform'
import { buildWidgetData } from '@/lib/widgetData'

// Keeps the Android home-screen widget up to date (see android/.../MyFitWidgetProvider.java). Android only; everywhere
// else these do nothing. Failures are swallowed: the widget is a bonus and must never get in the app's way.
const Widget = registerPlugin<{ update(data: object): Promise<void>; clear(): Promise<void> }>('MyFitWidget')

const onAndroid = () => nativePlatform() === 'android'

/** Sends today's workout, the week and the streak to the widget. */
export async function syncWidget(userId: string, firstName?: string): Promise<void> {
  if (!onAndroid()) return
  try {
    const list = await programs.listForUser(userId)
    const program = list[0]
    if (!program) {
      await Widget.clear()
      return
    }
    const saved = await sessions.listForUser(userId)
    await Widget.update(buildWidgetData({ firstName, days: program.programData.days, programId: program.id, saved }))
  } catch {
    /* the widget keeps what it last showed */
  }
}

/** Signed out: the widget goes back to "Open MyFit to set up your plan". */
export async function clearWidget(): Promise<void> {
  if (!onAndroid()) return
  try {
    await Widget.clear()
  } catch {
    /* nothing to do */
  }
}
