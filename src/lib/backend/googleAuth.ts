import { SocialLogin } from '@capgo/capacitor-social-login'

// Google sign-in. In the phone app this uses Android's own Google account picker (Credential Manager),
// which hands back an ID token that we exchange with Supabase for a session. Google never shares a
// password, and Google has already verified the person's email address.
//
// Needs the Google "Web application" OAuth client ID in VITE_GOOGLE_WEB_CLIENT_ID. Until it is set the
// button stays hidden, so nothing breaks before Google Cloud is set up.

export const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined
export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID)

/** Thrown when the person closed the Google picker. Not an error worth showing. */
export const GOOGLE_CANCELLED = 'GOOGLE_CANCELLED'

let initialized: Promise<void> | null = null

function initialize(): Promise<void> {
  if (!GOOGLE_WEB_CLIENT_ID) return Promise.reject(new Error('Google sign-in is not set up yet.'))
  if (!initialized) {
    initialized = SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID } }).catch((err) => {
      initialized = null
      throw err
    })
  }
  return initialized
}

/** Opens the phone's Google account picker and returns the signed ID token. */
export async function getGoogleIdToken(): Promise<string> {
  await initialize()
  try {
    const res = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } })
    const result = res.result as { idToken?: string | null }
    if (!result.idToken) throw new Error('Google did not return a sign-in token. Please try again.')
    return result.idToken
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/cancel|dismiss|closed|no credential/i.test(message)) throw new Error(GOOGLE_CANCELLED)
    throw err
  }
}

/** Forgets the Google account on this phone so the next sign-in shows the account picker again. */
export async function googleSignOut(): Promise<void> {
  if (!GOOGLE_WEB_CLIENT_ID) return
  try {
    await initialize()
    await SocialLogin.logout({ provider: 'google' })
  } catch {
    // Best-effort: there may be no Google session to clear.
  }
}
