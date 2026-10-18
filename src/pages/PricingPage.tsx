import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Loader2, ShieldCheck, Sparkles, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { PRO_FEATURES, TRIAL_DAYS, firstPaymentDate, isPro } from '@/lib/billing'
import { isNativeApp, nativePlatform, storeName } from '@/lib/platform'
import { syncTrialReminder } from '@/lib/trialReminder'
import { useStorePrices } from '@/lib/storePrices'
import { codes } from '@/lib/backend/api'
import {
  configureRevenueCat,
  discountedPriceLabel,
  findOptionByTag,
  getOfferingPackages,
  purchase,
  purchaseWithOfferTag,
  restorePurchases,
} from '@/lib/backend/revenuecat'
import { cn } from '@/lib/utils'
import type { AppliedCode, SubscriptionPeriod } from '@/lib/types'

export default function PricingPage() {
  const { profile, role } = useAuth()
  const navigate = useNavigate()
  const [loadingPeriod, setLoadingPeriod] = React.useState<SubscriptionPeriod | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [nativePackages, setNativePackages] = React.useState<PurchasesPackage[]>([])
  const [codeOpen, setCodeOpen] = React.useState(false)
  const [codeInput, setCodeInput] = React.useState('')
  const [codeChecking, setCodeChecking] = React.useState(false)
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [appliedCode, setAppliedCode] = React.useState<AppliedCode | null>(null)
  const native = isNativeApp()
  const { prices, loading: pricesLoading } = useStorePrices(profile?.id)
  const [restoring, setRestoring] = React.useState(false)
  const [restoreNote, setRestoreNote] = React.useState<string | null>(null)

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

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = codeInput.trim()
    if (!value) {
      setCodeError('Enter a code first.')
      return
    }
    setCodeChecking(true)
    setCodeError(null)
    try {
      const result = await codes.apply(value)
      if (result) {
        setAppliedCode(result)
        setCodeOpen(false)
        setCodeInput('')
      } else {
        setCodeError("That code isn't valid. Check the spelling, or it may have expired.")
      }
    } catch {
      setCodeError('Could not check the code. Please try again.')
    } finally {
      setCodeChecking(false)
    }
  }

  const handleSubscribe = async (period: SubscriptionPeriod) => {
    setLoadingPeriod(period)
    setError(null)
    try {
      await configureRevenueCat(profile.id)
      const packages = await getOfferingPackages()
      const wantedType = period === 'monthly' ? 'MONTHLY' : 'ANNUAL'
      const pkg = packages.find((p: PurchasesPackage) => p.packageType === wantedType)
      if (!pkg) throw new Error('That plan is not available right now.')
      const entitled = appliedCode
        ? await purchaseWithOfferTag(pkg, appliedCode.offerTag, appliedCode.code)
        : await purchase(pkg)
      if (entitled) {
        void syncTrialReminder(profile.id)
        navigate('/account?checkout=success')
      }
    } catch (err) {
      const isCancel = err instanceof Error && err.message.toLowerCase().includes('cancel')
      if (!isCancel) setError(err instanceof Error ? err.message : 'Purchase failed.')
    } finally {
      setLoadingPeriod(null)
    }
  }

  // Apple requires a Restore Purchases button; it also helps anyone who reinstalls or changes phones.
  const handleRestore = async () => {
    setRestoring(true)
    setRestoreNote(null)
    try {
      await configureRevenueCat(profile.id)
      const found = await restorePurchases()
      setRestoreNote(found ? 'Your subscription was restored.' : 'No active subscription was found for this account.')
      if (found) navigate('/account?checkout=success')
    } catch {
      setRestoreNote('Could not restore purchases. Please try again.')
    } finally {
      setRestoring(false)
    }
  }

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
            Back to MyFit
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
          Unlock every day of your personalized program, your progress history and your nutrition plan. Day 1 is always free.
        </p>
      </motion.div>

      {/* Discount codes unlock Google Play offers, which don't exist on the App Store. */}
      {native && nativePlatform() !== 'ios' && !alreadyPro && (
        <div className="mx-auto mb-8 max-w-md text-center">
          {appliedCode ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Tag className="h-4 w-4" />
              <span>
                <span className="font-bold">{appliedCode.code}</span> applied
                {appliedCode.percentOff ? ` — ${appliedCode.percentOff}% off` : ''}
              </span>
              <button
                type="button"
                onClick={() => setAppliedCode(null)}
                className="text-xs font-semibold underline underline-offset-2"
              >
                Remove
              </button>
            </div>
          ) : codeOpen ? (
            <form onSubmit={handleApplyCode} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase())
                    setCodeError(null)
                  }}
                  placeholder="Enter your code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={32}
                />
                <Button type="submit" disabled={codeChecking} className="gap-1.5">
                  {codeChecking && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply
                </Button>
              </div>
              {codeError && <p className="text-sm text-destructive">{codeError}</p>}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              <Tag className="h-4 w-4" /> Have a discount code?
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {(['monthly', 'yearly'] as const).map((period, i) => {
          const planPrice = period === 'yearly' ? prices.yearly : prices.monthly
          const nativePkg = nativePkgFor(period)
          const discountOption = appliedCode && nativePkg ? findOptionByTag(nativePkg, appliedCode.offerTag) : null
          const isYearly = period === 'yearly'
          // Only promise a trial when the store actually reports one on this product.
          const hasTrial = !!nativePkg?.product.introPrice
          return (
            <motion.div
              key={period}
              className={isYearly ? 'order-first md:order-none' : undefined}
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
                    <span className="font-display text-4xl">{pricesLoading ? '…' : (nativePkg?.product.priceString ?? planPrice)}</span>
                    <span className="text-sm text-muted-foreground">/{period === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {hasTrial && (
                    <>
                      <p className="mt-2 inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {TRIAL_DAYS}-day free trial included
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        Today: free <span className="font-normal text-muted-foreground">· {firstPaymentDate()}: {planPrice}</span>
                      </p>
                    </>
                  )}
                  {appliedCode && nativePkg && (
                    <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {discountOption
                        ? `With ${appliedCode.code}: ${discountedPriceLabel(discountOption) ?? 'discounted price'}`
                        : "This code isn't available for this plan."}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    {isYearly ? (pricesLoading ? 'Billed yearly' : `Just ${prices.yearlyPerMonth}/mo`) : 'Billed monthly, cancel anytime'}
                    {isYearly && !pricesLoading && prices.savingsAmount && (
                      <Badge variant="success" className="py-0 px-1.5">
                        {prices.savingsAmount}
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
                  ) : native ? (
                    <Button
                      className="mt-8 gap-2"
                      size="lg"
                      onClick={() => handleSubscribe(period)}
                      disabled={loadingPeriod !== null}
                    >
                      {loadingPeriod === period ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                      {hasTrial ? 'Start Free Trial' : 'Subscribe'}
                    </Button>
                  ) : (
                    <Button className="mt-8" variant="outline" size="lg" disabled>
                      Subscribe in the mobile app
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto leading-relaxed">
        {native
          ? `Payment is processed securely by ${storeName()}. Subscriptions renew automatically each period until you cancel in your ${nativePlatform() === 'ios' ? 'Apple ID subscription settings' : 'Google Play subscription settings'}. If a free trial is shown, it converts to a paid subscription at the price above unless you cancel at least 24 hours before it ends. PDF export unlocks after your first payment.`
          : 'Pro is purchased in the MyFit mobile app through Google Play or the App Store — once subscribed, it also unlocks Pro when you sign in on the web.'}
      </p>
      {native && (
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <button onClick={handleRestore} disabled={restoring} className="font-semibold underline underline-offset-2 hover:text-foreground">
            {restoring ? 'Restoring…' : 'Restore purchases'}
          </button>
          {restoreNote && <p className="mt-2">{restoreNote}</p>}
          <p className="mt-3">
            <button onClick={() => navigate('/terms')} className="underline underline-offset-2 hover:text-foreground">
              Terms of Use
            </button>
            {' · '}
            <button onClick={() => navigate('/privacy')} className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </button>
          </p>
        </div>
      )}
    </div>
  )
}
