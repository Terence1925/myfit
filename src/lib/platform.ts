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

/**
 * Which store handles the person's payments, for wording. In the phone app it is the phone's own store. On the website it is
 * worked out from the device (an Android phone, an iPhone or iPad), and only a computer names both.
 */
export function storeName(): string {
  const p = nativePlatform()
  if (p === 'ios') return 'the App Store'
  if (p === 'android') return 'Google Play'
  const nav = typeof navigator === 'undefined' ? undefined : navigator
  const ua = nav?.userAgent ?? ''
  if (/android/i.test(ua)) return 'Google Play'
  // iPadOS reports itself as a Mac, so a touch screen on a "Mac" is an iPad
  if (/iphone|ipad|ipod/i.test(ua) || (nav?.platform === 'MacIntel' && (nav?.maxTouchPoints ?? 0) > 1)) return 'the App Store'
  return 'Google Play or the App Store'
}
