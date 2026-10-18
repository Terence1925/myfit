import { Capacitor } from '@capacitor/core'

export function isNativeApp(): boolean {
  if (Capacitor.isNativePlatform()) return true
  // Development only (never in a real build): lets the phone-only screens be previewed in the browser
  try {
    return !!import.meta.env?.DEV && localStorage.getItem('myfit_preview_native') === '1'
  } catch {
    return false
  }
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
