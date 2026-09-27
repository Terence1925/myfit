import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { billing } from '@/lib/backend/api'
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICES, isPro } from '@/lib/billing'
import { isNativeApp } from '@/lib/platform'
import { configureRevenueCat, getOfferingPackages, purchase } from '@/lib/backend/revenuecat'
import { cn } from '@/lib/utils'
import type { SubscriptionPeriod } from '@/lib/types'

export default function PricingPage() {
  const { profile, refreshProfile, role } = useAuth()
  const navigate = useNavigate()
  const [loadingPeriod, setLoadingPeriod] = React.useState<SubscriptionPeriod | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [nativePackages, setNativePackages] = React.useState<PurchasesPackage[]>([])
  const native = isNativeApp()

  React.useEffect(() => {
    if (!native || !profile) return
    configureRevenueCat(profile.id)
      .then(getOfferingPackages)
      .then(setNativePackages)
      .catch(() => {
        // fall back to the static PHP price labels below
      })
  }, [native, profile])

  if (!profile) return null
  const isAdmin = role === 'admin'
  const alreadyPro = isPro(profile)
  const nativePkgFor = (period: SubscriptionPeriod) =>
    native ? nativePackages.find((p) => p.packageType === (period === 'monthly' ? 'MONTHLY' : 'ANNUAL')) : undefined

  const handleSubscribeWeb = async (period: SubscriptionPeriod) => {
    setLoadingPeriod(period)
    try {
      const result = await billing.subscribe(profile.id, period)
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
        return
      }
      refreshProfile()
      navigate('/account')
    } finally {
      setLoadingPeriod(null)
    }
  }

  const handleSubscribeNative = async (period: SubscriptionPeriod) => {
    setLoadingPeriod(period)
    setError(null)
    try {
      await configureRevenueCat(profile.id)
      const packages = await getOfferingPackages()
      const wantedType = period === 'monthly' ? 'MONTHLY' : 'ANNUAL'
      const pkg = packages.find((p: PurchasesPackage) => p.packageType === wantedType)
      if (!pkg) throw new Error('That plan is not available right now.')
      const entitled = await purchase(pkg)
      if (entitled) {
        navigate('/account?checkout=success')
      }
    } catch (err) {
      const isCancel = err instanceof Error && err.message.toLowerCase().includes('cancel')
      if (!isCancel) setError(err instanceof Error ? err.message : 'Purchase failed.')
    } finally {
      setLoadingPeriod(null)
    }
  }

  const handleSubscribe = native ? handleSubscribeNative : handleSubscribeWeb

  if (isAdmin && !alreadyPro) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-glow">
            <ShieldCheck className="h-9 w-9 text-primary" />
          </div>
          <h2 className="font-display text-4xl tracking-wide text-gradient-gold">YOU'RE ALREADY COVERED</h2>
          <p className="mt-3 max-w-md font-body text-muted-foreground">
            Admin accounts get every Pro feature automatically — no subscription needed.
          </p>
          <Button size="lg" className="mt-6" onClick={() => navigate('/')}>
            Back to FORGEFIT
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container py-12 sm:py-16 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Go Pro</span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-gradient-gold">
          TRAIN WITHOUT LIMITS
        </h1>
        <p className="mt-3 font-body text-muted-foreground max-w-lg mx-auto">
          Unlock unlimited programs, progress tracking, and priority AI regeneration.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardContent className="p-8 flex flex-col h-full">
              <h3 className="font-display text-2xl tracking-wide">FREE</h3>
              <div className="mt-3 font-display text-4xl">₱0</div>
              <p className="text-sm text-muted-foreground mt-1">Forever</p>
              <ul className="mt-6 space-y-3 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2 text-sm font-body">
                    <Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8" disabled>
                {alreadyPro ? 'Downgrade in Account' : 'Current Plan'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {(['monthly', 'yearly'] as const).map((period, i) => {
          const plan = PRO_PRICES[period]
          const nativePkg = nativePkgFor(period)
          const isYearly = period === 'yearly'
          return (
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className={cn('h-full relative overflow-hidden', isYearly && 'border-primary/40 shadow-glow-lg')}>
                {isYearly && (
                  <div className="absolute top-0 right-0 bg-gold-gradient text-primary-foreground text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Best Value
                  </div>
                )}
                <CardContent className="p-8 flex flex-col h-full">
                  <h3 className={cn('font-display text-2xl tracking-wide', isYearly && 'text-gradient-gold')}>
                    PRO {period === 'monthly' ? 'MONTHLY' : 'YEARLY'}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-4xl">{nativePkg?.product.priceString ?? plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">/{period === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    {isYearly
                      ? `${plan.perMonthLabel} effective`
                      : native
                        ? 'Billed monthly, cancel anytime'
                        : 'One-time payment for 30 days — renew anytime after'}
                    {isYearly && plan.savingsLabel && (
                      <Badge variant="success" className="py-0 px-1.5">
                        {plan.savingsLabel}
                      </Badge>
                    )}
                  </p>
                  {error && loadingPeriod === null && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                  <ul className="mt-6 space-y-3 flex-1">
                    {PRO_FEATURES.map((f) => (
                      <li key={f} className="flex gap-2 text-sm font-body">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  {alreadyPro ? (
                    <Button className="mt-8 gap-2" onClick={() => navigate('/account')}>
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className="mt-8 gap-2"
                      size="lg"
                      onClick={() => handleSubscribe(period)}
                      disabled={loadingPeriod !== null}
                    >
                      {loadingPeriod === period ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                      Upgrade to Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        {native
          ? 'Payment is processed securely by Google Play.'
          : 'Payment is processed securely by PayMongo.'}
      </p>
    </div>
  )
}
