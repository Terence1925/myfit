import * as React from 'react'
import { motion } from 'framer-motion'
import { Crown, Loader2, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { billing, isSupabaseConfigured } from '@/lib/backend/api'
import { hasProAccess, isPro, PRO_PRICES } from '@/lib/billing'
import { isNativeApp } from '@/lib/platform'

// Must match capacitor.config.ts's appId
const ANDROID_PACKAGE_ID = 'com.forgefit.app'

export default function AccountPage() {
  const { profile, refreshProfile, role } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [canceling, setCanceling] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)

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

  const handleCancel = async () => {
    if (native) {
      // Google requires subscription management to go through Play Store's own UI, not a custom cancel flow.
      const sku = profile.subscriptionPeriod === 'monthly' ? 'pro_monthly' : 'pro_yearly'
      window.location.href = `https://play.google.com/store/account/subscriptions?sku=${sku}&package=${ANDROID_PACKAGE_ID}`
      return
    }
    setCanceling(true)
    try {
      const result = await billing.cancel(profile.id)
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
        return
      }
      refreshProfile()
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="container py-8 sm:py-12 max-w-2xl">
      <h1 className="font-display text-4xl tracking-wide mb-8">ACCOUNT</h1>

      {syncing && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Confirming your subscription with{' '}
          {native ? 'Google Play' : 'Stripe'}...
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
                    Renews on {new Date(profile.subscriptionRenewsAt).toLocaleDateString()}
                  </p>
                )}
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleCancel} disabled={canceling}>
                  {canceling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {native
                    ? 'Manage in Google Play'
                    : isSupabaseConfigured
                      ? 'Manage / Cancel Subscription'
                      : 'Cancel Subscription'}
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
                  You're on the Free plan — 1 active program, core features.
                </p>
                <Button className="gap-2" onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4" /> Upgrade to Pro
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
