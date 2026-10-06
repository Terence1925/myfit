import * as React from 'react'
import { motion } from 'framer-motion'
import { Dumbbell, Loader2, MailCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/backend/api'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const { signIn, signUp, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [checkEmail, setCheckEmail] = React.useState(false)
  const [resetSent, setResetSent] = React.useState(false)

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
            <a href="mailto:ttagayona1985@outlook.com" className="text-primary underline underline-offset-2">
              ttagayona1985@outlook.com
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg animate-float">
              <Dumbbell className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
            </div>
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
                  <a href="mailto:ttagayona1985@outlook.com" className="text-primary underline underline-offset-2">
                    ttagayona1985@outlook.com
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg animate-float">
            <Dumbbell className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-gradient-gold">FORGEFIT</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">AI-forged training programs, built around you.</p>
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
                Demo admin: <span className="text-foreground/80">admin@forgefit.app</span> / admin123
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
