import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2, MailCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { Wordmark } from '@/components/ui/Wordmark'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/backend/api'
import { GOOGLE_CANCELLED, isGoogleSignInConfigured } from '@/lib/backend/googleAuth'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [checkEmail, setCheckEmail] = React.useState(false)
  const [resetSent, setResetSent] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setResetSent(true)
    } catch (err) {
      if (err instanceof Error && err.message === 'DEMO_MODE_NOT_SUPPORTED') {
        setError('Password reset needs a real backend and isn’t available in this demo. Use the demo admin login below.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      // Closing the Google picker is not an error.
      if (!(err instanceof Error && err.message === GOOGLE_CANCELLED)) {
        setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName)
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_CONFIRMATION_REQUIRED') {
        setCheckEmail(true)
      } else if (err instanceof Error && /already registered/i.test(err.message)) {
        setError(
          'An account with this email already exists. Switch to Sign In above — and tap "Forgot password?" there if you can\'t remember it.',
        )
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
            <MailCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gradient-gold">CHECK YOUR EMAIL</h1>
          <p className="mt-3 text-sm text-muted-foreground font-body">
            We sent a confirmation link to <span className="text-foreground">{email}</span>. Click it, then come
            back and sign in.
          </p>
          <Button className="mt-6" onClick={() => setCheckEmail(false)}>
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    )
  }

  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
            <MailCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gradient-gold">CHECK YOUR EMAIL</h1>
          <p className="mt-3 text-sm text-muted-foreground font-body">
            If an account exists for <span className="text-foreground">{email}</span>, we sent a link to reset your
            password. Click it to set a new one.
          </p>
          <p className="mt-3 text-xs text-muted-foreground font-body">
            Nothing after a couple of minutes? Check your spam folder and make sure you used the email you signed up
            with. Still stuck? Email{' '}
            <a href="mailto:joinmyfit@gmail.com" className="text-primary underline underline-offset-2">
              joinmyfit@gmail.com
            </a>{' '}
            and we'll help you get back in.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setResetSent(false)
              setMode('signin')
            }}
          >
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    )
  }

  if (mode === 'forgot') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo className="mb-4 h-16 w-16 rounded-2xl shadow-glow-lg" />
            <h1 className="font-display text-4xl tracking-wide text-gradient-gold">RESET PASSWORD</h1>
            <p className="mt-1 text-sm text-muted-foreground font-body">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <Card className="shadow-glow-lg border-primary/10">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="forgotEmail">Email</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5"
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Can't get the email? Contact{' '}
                  <a href="mailto:joinmyfit@gmail.com" className="text-primary underline underline-offset-2">
                    joinmyfit@gmail.com
                  </a>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setMode('signin')
                  }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-4 h-16 w-16 rounded-2xl shadow-glow-lg" />
          <h1>
            <Wordmark className="text-5xl" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">All-in-One Workout &amp; Calorie Tracker</p>
        </div>

        <Card className="shadow-glow-lg border-primary/10">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex rounded-lg border border-border p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
                    mode === m ? 'bg-gold-gradient text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {isSupabaseConfigured && isGoogleSignInConfigured && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-3 bg-white text-[#1f1f1f] hover:bg-white/90 hover:text-[#1f1f1f]"
                  onClick={handleGoogle}
                  disabled={googleLoading || loading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  Continue with Google
                </Button>
                <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  or use your email
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="mt-1.5"
                    placeholder="Alex Rivera"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5"
                  placeholder="••••••••"
                />
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null)
                      setMode('forgot')
                    }}
                    className="mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {!isSupabaseConfigured && (
              <p className="mt-5 text-center text-xs text-muted-foreground">
                Demo admin: <span className="text-foreground/80">admin@myfit.app</span> / admin123
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
