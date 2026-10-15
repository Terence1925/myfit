import { Capacitor } from '@capacitor/core'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/** Which store handles the person's payments, for wording: the website names both. */
export function storeName(): string {
  const p = nativePlatform()
  if (p === 'ios') return 'the App Store'
  if (p === 'android') return 'Google Play'
  return 'Google Play or the App Store'
}
