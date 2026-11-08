import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { TRIAL_DAYS, hasSubscribedBefore } from '@/lib/billing'
import { isNativeApp, nativePlatform } from '@/lib/platform'
import { syncTrialReminder } from '@/lib/trialReminder'
import { useStorePrices } from '@/lib/storePrices'
import { codes } from '@/lib/backend/api'
import { configureRevenueCat, getOfferingPackages, purchase, purchaseWithOfferTag } from '@/lib/backend/revenuecat'
import { cn } from '@/lib/utils'
import type { AppliedCode, SubscriptionPeriod } from '@/lib/types'

/**
 * The plan picker that slides up from the bottom when someone taps Subscribe, so they stay on the screen they were on.
 * Kept to the essentials: two plans, one button and one line with the price and renewal terms.
 * The price that is billed is always the one shown, in the larger type.
 */
export function SubscribeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const native = isNativeApp()
  const { prices, loading: pricesLoading } = useStorePrices(profile?.id)
  const [packages, setPackages] = React.useState<PurchasesPackage[]>([])
  const [ready, setReady] = React.useState(!native)
  const [period, setPeriod] = React.useState<SubscriptionPeriod>('yearly')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [webNote, setWebNote] = React.useState(false)
  const [codeOpen, setCodeOpen] = React.useState(false)
  const [codeInput, setCodeInput] = React.useState('')
  const [codeChecking, setCodeChecking] = React.useState(false)
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [appliedCode, setAppliedCode] = React.useState<AppliedCode | null>(null)

  // Opening it fresh each time
  React.useEffect(() => {
    if (!open) return
    setPeriod('yearly')
    setError(null)
    setWebNote(false)
    setCodeOpen(false)
  }, [open])

  // The store's own prices and trial offers (phone app only)
  React.useEffect(() => {
    if (!open || !native || !profile) return
    let cancelled = false
    configureRevenueCat(profile.id)
      .then(getOfferingPackages)
      .then((p) => !cancelled && setPackages(p))
      .catch(() => {
        // the peso prices below are shown instead
      })
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [open, native, profile])

  // The Android Back button (and the browser's) closes the sheet instead of leaving the page
  React.useEffect(() => {
    if (!open) return
    window.history.pushState({ subscribeSheet: true }, '')
    const onPop = () => onClose()
    window.addEventListener('popstate', onPop)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('keydown', onKey)
      if (window.history.state?.subscribeSheet) window.history.back()
    }
  }, [open, onClose])

  if (!profile) return null
  const lapsed = hasSubscribedBefore(profile)
  const pkgFor = (p: SubscriptionPeriod) => (native ? packages.find((x) => x.packageType === (p === 'monthly' ? 'MONTHLY' : 'ANNUAL')) : undefined)
  const priceOf = (p: SubscriptionPeriod) => pkgFor(p)?.product.priceString ?? (p === 'yearly' ? prices.yearly : prices.monthly)
  // A new member is shown the 7-day trial on both plans. The only time it is left out is when the store has answered with plans
  // and none of them has a free trial, so nobody is promised something the store will not give.
  const storeAnswered = native && packages.length > 0
  const trialOn = (p: SubscriptionPeriod) => !lapsed && (!storeAnswered || !!pkgFor(p)?.product.introPrice)
  const loadingPrices = pricesLoading || !ready
  const unit = period === 'yearly' ? 'year' : 'month'
  const hasTrial = trialOn(period)
  const finePrint = loadingPrices
    ? 'Renewing automatically. Cancel any time and you pay nothing.'
    : hasTrial
      ? `${TRIAL_DAYS} days free, then ${priceOf(period)}/${unit} renewing automatically. Cancel any time before then and you pay nothing.`
      : `${priceOf(period)}/${unit} renewing automatically. Cancel any time and you pay nothing.`

  const subscribe = async () => {
    // The store purchase only exists in the phone app. On the web the button still looks the same and says so when tapped.
    if (!native) {
      setWebNote(true)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await configureRevenueCat(profile.id)
      const list = await getOfferingPackages()
      const pkg = list.find((p: PurchasesPackage) => p.packageType === (period === 'monthly' ? 'MONTHLY' : 'ANNUAL'))
      if (!pkg) throw new Error('That plan is not available right now.')
      const entitled = appliedCode ? await purchaseWithOfferTag(pkg, appliedCode.offerTag, appliedCode.code) : await purchase(pkg)
      if (entitled) {
        void syncTrialReminder(profile.id)
        onClose()
        navigate('/account?checkout=success')
      }
    } catch (err) {
      const isCancel = err instanceof Error && err.message.toLowerCase().includes('cancel')
      if (!isCancel) {
        const message = err instanceof Error ? err.message : ''
        // A set-up problem is not something to show a customer
        setError(/VITE_|must be configured|not set/i.test(message) || !message ? 'Subscriptions are not available right now. Please try again later.' : message)
      }
    } finally {
      setBusy(false)
    }
  }

  const applyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = codeInput.trim()
    if (!value) return setCodeError('Enter a code first.')
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

  const goTo = (path: string) => {
    onClose()
    // after the sheet's own history entry is gone
    window.setTimeout(() => navigate(path), 60)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Choose your plan">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl border border-b-0 border-border bg-background px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-glow-lg"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-border" />

            <div role="radiogroup" aria-label="Plan" className="space-y-3">
              {(['yearly', 'monthly'] as const).map((p) => {
                const selected = period === p
                const saving = p === 'yearly' && !loadingPrices ? prices.savingsPercent : null
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
                    )}
                  >
                    {saving && (
                      <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                        {saving}
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-lg font-bold">{p === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                      <span className="block text-sm text-muted-foreground">
                        {loadingPrices ? '\u00a0' : p === 'yearly' ? `${prices.yearlyPerMonth} / month` : 'Billed monthly'}
                      </span>
                    </span>
                    <span className="shrink-0 font-body text-xl font-bold">{loadingPrices ? '…' : `${priceOf(p)} / ${p === 'yearly' ? 'yr' : 'mo'}`}</span>
                  </button>
                )
              })}
            </div>

            {native && nativePlatform() !== 'ios' && (
              <div className="mt-3 text-center">
                {appliedCode ? (
                  <span className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Tag className="h-4 w-4" />
                    <span className="font-bold">{appliedCode.code}</span> applied{appliedCode.percentOff ? `, ${appliedCode.percentOff}% off` : ''}
                    <button type="button" onClick={() => setAppliedCode(null)} className="text-xs font-semibold underline underline-offset-2">
                      Remove
                    </button>
                  </span>
                ) : codeOpen ? (
                  <form onSubmit={applyCode} className="space-y-2">
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
                    {codeError && <p className="text-left text-sm text-destructive">{codeError}</p>}
                  </form>
                ) : (
                  <button type="button" onClick={() => setCodeOpen(true)} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    Have a discount code?
                  </button>
                )}
              </div>
            )}

            {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

            <Button size="lg" className="mt-4 h-14 w-full rounded-2xl text-base" onClick={subscribe} disabled={busy || loadingPrices}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
            {webNote && <p className="mt-2 text-center text-sm text-muted-foreground">Subscriptions are bought in the MyFit app on your phone.</p>}

            <p className="mt-3 text-center text-sm leading-snug text-muted-foreground">{finePrint}</p>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              <button type="button" onClick={() => goTo('/terms')} className="underline underline-offset-2">
                Terms of Use
              </button>
              {' · '}
              <button type="button" onClick={() => goTo('/privacy')} className="underline underline-offset-2">
                Privacy Policy
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
