// The link that takes a person from the password-reset web page back into the installed MyFit app, already signed in.
// The page builds a Chrome "intent:" link that is pinned to this app's package, so no other app can receive it; the app
// then reads the one-time login token from the link and signs in.

const APP_PACKAGE = 'com.myfit.app'

/** The login token carried by a myfit://open?rt=... link, or null when the link has none (or it looks wrong). */
export function refreshTokenFromAppLink(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol !== 'myfit:' || u.hostname !== 'open') return null
    const token = u.searchParams.get('rt')
    return token && token.length >= 6 && token.length <= 512 && /^[\w.-]+$/.test(token) ? token : null
  } catch {
    return null
  }
}

/**
 * The link for the "Open the MyFit app" button. It opens the app only (package is fixed), and falls back to `fallbackUrl`
 * (the website) when the app is not installed. With no token it simply opens the app.
 */
export function openAppLink(refreshToken: string | null, fallbackUrl: string): string {
  const query = refreshToken ? `?rt=${encodeURIComponent(refreshToken)}` : ''
  return `intent://open${query}#Intent;scheme=myfit;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`
}
