import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNativeApp } from './platform'

// A small physical "tick" when something good happens. On the phone app it uses the real haptic motor; in a browser
// it uses the vibration API where the device has one. It never throws: no vibration is better than an error.
export type Buzz = 'tap' | 'set' | 'done'

export function buzz(kind: Buzz): void {
  try {
    if (isNativeApp()) {
      if (kind === 'done') void Haptics.notification({ type: NotificationType.Success })
      else void Haptics.impact({ style: kind === 'set' ? ImpactStyle.Medium : ImpactStyle.Light })
      return
    }
    navigator.vibrate?.(kind === 'done' ? [30, 50, 30] : kind === 'set' ? 18 : 8)
  } catch {
    /* no vibration available */
  }
}

export interface CelebrationDetail {
  title: string
  subtitle?: string
  /** 'done' = a finished workout, 'record' = a personal record, 'badge' = a badge unlocked. */
  kind?: 'done' | 'record' | 'badge'
  /** A big emoji shown instead of the icon (badges). */
  emoji?: string
}

/** Shows the confetti and the message (see Celebration.tsx), and gives a success buzz. */
export function celebrate(detail: CelebrationDetail): void {
  buzz('done')
  window.dispatchEvent(new CustomEvent<CelebrationDetail>('myfit:celebrate', { detail }))
}
