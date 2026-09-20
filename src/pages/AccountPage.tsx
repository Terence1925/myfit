import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Crown, Loader2, Lock, ShieldCheck, Trash2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { hasProAccess, isPro, PRO_PRICES } from '@/lib/billing'
import { isNativeApp } from '@/lib/platform'

// Must match capacitor.config.ts's appId
const ANDROID_PACKAGE_ID = 'com.forgefit.app'

// Must match supabase/functions/delete-account's OWNER_EMAIL — the server is the real
// enforcement; this just avoids offering a delete flow that would only fail at the last step.
const OWNER_EMAIL = 'ttagayona1985@gmail.com'

export default function AccountPage() {
  const { profile, refreshProfile, role, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [syncing, setSyncing] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

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
  const native = isNativeApp()
  const isOwner = profile.email === OWNER_EMAIL

  const handleManageNative = () => {
    // Google requires subscription management to go through Play Store's own UI.
    const sku = profile.subscriptionPeriod === 'monthly' ? 'pro_monthly' : 'pro_yearly'
    window.location.href = `https://play.google.com/store/account/subscriptions?sku=${sku}&package=${ANDROID_PACKAGE_ID}`
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
      <h1 className="font-display text-4xl tracking-wide mb-8">ACCOUNT</h1>

      {syncing && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Confirming your{' '}
          {native ? 'Google Play' : 'PayMongo'} payment...
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-body">
            <p><span className="text-muted-foreground">Name:</span> {profile.displayName}</p>
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
                  {profile.subscriptionPeriod === 'yearly' ? 'Yearly' : 'Monthly'} plan —{' '}
                  {profile.subscriptionPeriod ? PRO_PRICES[profile.subscriptionPeriod].priceLabel : ''}
                  {profile.subscriptionPeriod === 'yearly' ? '/yr' : '/mo'}
                </p>
                {profile.subscriptionRenewsAt && (
                  <p className="text-muted-foreground">
                    {native ? 'Renews on' : 'Pro access until'}{' '}
                    {new Date(profile.subscriptionRenewsAt).toLocaleDateString()}
                    {!native && ' — renew below anytime before then to keep it active.'}
                  </p>
                )}
                {native ? (
                  <Button variant="outline" size="sm" onClick={handleManageNative}>
                    Manage in Google Play
                  </Button>
                ) : (
                  <Button size="sm" className="gap-1.5" onClick={() => navigate('/pricing')}>
                    <Crown className="h-3.5 w-3.5" /> Renew Now
                  </Button>
                )}
              </>
            ) : isAdmin ? (
              <p className="text-muted-foreground">
                Admins get every Pro feature automatically — unlimited programs, progress tracking, PDF
                export — no subscription needed.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  You're on the Free plan — 1 active program, core features.
                </p>
                <Button className="gap-2" onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Button>
              </>
            )}
          </CardContent>
        </Card>

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
