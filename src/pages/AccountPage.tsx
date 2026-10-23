import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, Crown, KeyRound, Loader2, Lock, LogOut, ShieldCheck, Trash2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured, profiles } from '@/lib/backend/api'
import { hasProAccess, isOnTrial, isPro } from '@/lib/billing'
import { useStorePrices } from '@/lib/storePrices'
import { nativePlatform, storeName } from '@/lib/platform'
import { RestAlarmCheck } from '@/components/account/RestAlarmCheck'
import { WorkoutReminders } from '@/components/account/WorkoutReminders'
import { useTheme, type ThemeChoice } from '@/lib/theme'

// Must match capacitor.config.ts's appId
const ANDROID_PACKAGE_ID = 'com.myfit.app'

// Must match supabase/functions/delete-account's OWNER_EMAIL — the server is the real
// enforcement; this just avoids offering a delete flow that would only fail at the last step.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

export default function AccountPage() {
  const { profile, refreshProfile, role, deleteAccount, updatePassword, signOut } = useAuth()
  const { prices, loading: pricesLoading } = useStorePrices(profile?.id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [syncing, setSyncing] = React.useState(false)
  const { choice: themeChoice, setChoice: setThemeChoice } = useTheme()
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [changingPassword, setChangingPassword] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [passwordSaving, setPasswordSaving] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordChanged, setPasswordChanged] = React.useState(false)
  const [editingName, setEditingName] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState('')
  const [nameSaving, setNameSaving] = React.useState(false)
  const [nameError, setNameError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (searchParams.get('checkout') !== 'success') return
    setSyncing(true)
    refreshProfile()
    const t = setTimeout(() => {
      refreshProfile()
      setSyncing(false)
    }, 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return null
  const pro = isPro(profile)
  const isAdmin = role === 'admin'
  const proAccess = hasProAccess(profile, role)
  const isOwner = profile.email === OWNER_EMAIL

  const handleSaveName = async () => {
    const name = nameDraft.trim()
    if (!name) return
    setNameSaving(true)
    setNameError(null)
    try {
      await profiles.updateDisplayName(profile.id, name)
      refreshProfile()
      setEditingName(false)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not save your name.')
    } finally {
      setNameSaving(false)
    }
  }

  const handleManageNative = () => {
    // Each store requires subscription management to go through its own screen.
    if (nativePlatform() === 'ios') {
      window.location.href = 'https://apps.apple.com/account/subscriptions'
      return
    }
    const sku = profile.subscriptionPeriod === 'monthly' ? 'pro_monthly' : 'pro_yearly'
    window.location.href = `https://play.google.com/store/account/subscriptions?sku=${sku}&package=${ANDROID_PACKAGE_ID}`
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setPasswordSaving(true)
    try {
      await updatePassword(newPassword)
      setPasswordChanged(true)
      setChangingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/auth')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="container py-8 sm:py-12 max-w-2xl">
      <h1 className="font-display text-4xl tracking-wide mb-8">Account</h1>

      {syncing && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Confirming your payment with {storeName()}...
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-body">
            {editingName ? (
              <div className="space-y-2">
                <label className="text-muted-foreground" htmlFor="display-name">Name</label>
                <Input
                  id="display-name"
                  value={nameDraft}
                  maxLength={40}
                  autoFocus
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                />
                {nameError && <p className="text-destructive">{nameError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" disabled={nameSaving || !nameDraft.trim()} onClick={handleSaveName}>
                    {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={nameSaving} onClick={() => setEditingName(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-muted-foreground">Name:</span> {profile.displayName}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNameDraft(profile.displayName)
                    setNameError(null)
                    setEditingName(true)
                  }}
                >
                  Edit
                </Button>
              </p>
            )}
            <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
            {role === 'admin' && <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" /> Admin</Badge>}
          </CardContent>
        </Card>

        <Card className={proAccess ? 'border-primary/40 shadow-glow' : ''}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              {proAccess && <Crown className="h-5 w-5 text-primary" />} Subscription
            </CardTitle>
            <Badge variant={proAccess ? 'default' : 'outline'}>
              {pro ? 'Pro' : isAdmin ? 'Admin' : 'Free'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-body">
            {pro ? (
              <>
                <p className="text-muted-foreground">
                  {profile.subscriptionPeriod === 'yearly' ? 'Yearly' : 'Monthly'} plan
                  {!pricesLoading && profile.subscriptionPeriod
                    ? ` — ${profile.subscriptionPeriod === 'yearly' ? prices.yearly + '/yr' : prices.monthly + '/mo'}`
                    : ''}
                </p>
                {isOnTrial(profile) && (
                  <p className="text-muted-foreground">
                    You're on your free trial. PDF export unlocks once your first payment goes through.
                  </p>
                )}
                {profile.subscriptionRenewsAt && (
                  <p className="text-muted-foreground">
                    Renews on {new Date(profile.subscriptionRenewsAt).toLocaleDateString()}
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={handleManageNative}>
                  Manage in {nativePlatform() === 'ios' ? 'the App Store' : 'Google Play'}
                </Button>
              </>
            ) : isAdmin ? (
              <p className="text-muted-foreground">
                Admins get every Pro feature automatically — unlimited programs, progress tracking, PDF
                export — no subscription needed.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  You don't have an active subscription. Subscribe to unlock your program and everything in Pro.
                </p>
                <Button className="gap-2" onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4" /> See Plans
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            signOut()
            navigate('/auth')
          }}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex rounded-lg border border-border p-1">
              {(['light', 'dark', 'system'] as ThemeChoice[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setThemeChoice(option)}
                  className={
                    'min-h-[44px] flex-1 rounded-md text-sm font-semibold capitalize transition-colors ' +
                    (themeChoice === option ? 'bg-gold-gradient text-primary-foreground' : 'text-muted-foreground')
                  }
                >
                  {option === 'system' ? 'Auto' : option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Auto follows your phone's light or dark setting.</p>
          </CardContent>
        </Card>

        <WorkoutReminders userId={profile.id} />

        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <div className="font-body text-sm font-bold">Welcome tour</div>
              <div className="text-xs text-muted-foreground">A 3-screen look at what MyFit can do.</div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate('/?tour=1')}>
              Take the tour again
            </Button>
          </CardContent>
        </Card>

        {nativePlatform() === 'android' && <RestAlarmCheck />}

        {isSupabaseConfigured && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-body">
              {passwordChanged && !changingPassword && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> Password updated.
                </div>
              )}
              {!changingPassword ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPasswordChanged(false)
                    setChangingPassword(true)
                  }}
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3 max-w-xs">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    minLength={6}
                    required
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  {passwordError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                      {passwordError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="gap-1.5" disabled={passwordSaving}>
                      {passwordSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setChangingPassword(false)
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-body">
            {isOwner ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0" /> This is the app's owner account — it can't be deleted
                from here. Contact support if you ever genuinely need this done.
              </p>
            ) : !confirmingDelete ? (
              <>
                <p className="text-muted-foreground">
                  Permanently delete your account and all data — programs, progress history, and body-metric
                  logs. This cannot be undone.
                </p>
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete Account
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Type <span className="font-bold text-foreground">DELETE</span> to confirm. This immediately and
                  permanently erases your account — there is no recovery.
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="max-w-xs"
                />
                {deleteError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {deleteError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                    onClick={handleDeleteAccount}
                  >
                    {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Permanently Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfirmingDelete(false)
                      setDeleteConfirmText('')
                      setDeleteError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
