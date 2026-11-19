import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { PasswordUpdated } from '@/components/auth/PasswordUpdated'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/backend/supabaseClient'
import { cn } from '@/lib/utils'

/**
 * The page the sign-in email links to: /go?th=<token hash>. It signs the person in here, then (on an Android phone)
 * offers an "Open the MyFit app" button that opens the installed app already signed in.
 * The token is used by this page's code, not by loading the address, so an email scanner that only fetches the link does not use it up.
 */
export default function GoPage() {
  const [state, setState] = React.useState<'checking' | 'done' | 'failed'>('checking')
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null)
  const started = React.useRef(false)

  React.useEffect(() => {
    if (started.current) return
    started.current = true
    const hash = new URLSearchParams(window.location.search).get('th')
    if (!supabase || !hash) {
      setState('failed')
      return
    }
    void supabase.auth.verifyOtp({ token_hash: hash, type: 'email' }).then(({ data, error }) => {
      if (error || !data.session) {
        setState('failed')
        return
      }
      setRefreshToken(data.session.refresh_token)
      setState('done')
    })
  }, [])

  if (state === 'done') return <PasswordUpdated refreshToken={refreshToken} title="You are signed in" desktopText="You are signed in on the website." />

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
        {state === 'checking' ? (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <h1 className="mt-4 font-display text-3xl tracking-wide">Signing you in</h1>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl tracking-wide">This link did not work</h1>
            <p className="mt-3 font-body text-sm text-muted-foreground">
              It may have expired or already been used. Open MyFit and ask for a new one, or type the 6-digit code from the email.
            </p>
            <a href="/auth" className={cn(buttonVariants({ size: 'lg' }), 'mt-6 w-full')}>
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}
