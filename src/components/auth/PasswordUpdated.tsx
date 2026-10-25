import { CircleCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isNativeApp } from '@/lib/platform'

/** A Chrome link that opens the installed MyFit app, and falls back to this website when the app is not installed. */
function appLink(): string {
  const fallback = encodeURIComponent(`${window.location.origin}/`)
  return `intent://open#Intent;scheme=myfit;package=com.myfit.app;S.browser_fallback_url=${fallback};end`
}

/** Shown after the new password is saved. On an Android browser the person can go back to the app they came from. */
export function PasswordUpdated() {
  const onAndroidBrowser = /Android/i.test(navigator.userAgent) && !isNativeApp()
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <CircleCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl tracking-wide">Password updated</h1>
        <p className="mt-3 font-body text-sm text-muted-foreground">
          {onAndroidBrowser ? 'Sign in with your new password in the app, or keep going here in your browser.' : 'You can now sign in with your new password.'}
        </p>
        <div className="mt-6 space-y-3">
          {onAndroidBrowser && (
            <a href={appLink()} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              Open the MyFit app
            </a>
          )}
          <a href="/" className={cn(buttonVariants({ size: 'lg', variant: onAndroidBrowser ? 'outline' : 'default' }), 'w-full')}>
            Continue in browser
          </a>
        </div>
      </div>
    </div>
  )
}
