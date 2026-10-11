import type { Profile, Role, SubscriptionPeriod } from './types'

export interface PlanPrice {
  period: SubscriptionPeriod
  price: number
  priceLabel: string
  perMonthLabel: string
  savingsLabel?: string
}

const PHP_FORMATTER = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

function php(amount: number): string {
  return `₱${PHP_FORMATTER.format(amount)}`
}

const MONTHLY_PRICE = 199
const YEARLY_PRICE = 1790
const YEARLY_PER_MONTH = YEARLY_PRICE / 12
const SAVINGS_PERCENT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100)

export const PRO_PRICES: Record<SubscriptionPeriod, PlanPrice> = {
  monthly: {
    period: 'monthly',
    price: MONTHLY_PRICE,
    priceLabel: php(MONTHLY_PRICE),
    perMonthLabel: `${php(MONTHLY_PRICE)}/mo`,
  },
  yearly: {
    period: 'yearly',
    price: YEARLY_PRICE,
    priceLabel: php(YEARLY_PRICE),
    perMonthLabel: `${php(YEARLY_PER_MONTH)}/mo`,
    savingsLabel: `Save ${SAVINGS_PERCENT}%`,
  },
}

/** Must match the free-trial length configured on the Play Console subscription offers. */
export const TRIAL_DAYS = 7

export const PRO_FEATURES = [
  'Unlimited saved programs',
  'Regenerate anytime — no cooldown',
  'Progressive overload tracking with PR alerts',
  'Progress tracking & body-metric charts',
  'PDF export of any program (after your free trial)',
  'Priority AI regeneration queue',
  'Early access to new training templates',
]

export function isPro(
  profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus' | 'subscriptionRenewsAt'> | null,
): boolean {
  if (!profile) return false
  if (profile.subscriptionTier !== 'pro' || profile.subscriptionStatus !== 'active') return false
  // Pro comes from Google Play (via the RevenueCat webhook), which keeps the renewal date current; access ends at that
  // date if the subscription lapses and no renewal arrives.
  if (profile.subscriptionRenewsAt && new Date(profile.subscriptionRenewsAt).getTime() < Date.now()) return false
  return true
}

export function planLabel(profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus' | 'subscriptionRenewsAt'>): string {
  if (isPro(profile)) return 'Pro'
  return 'Free'
}

/** Admins get every Pro feature for free — use this (not isPro) for feature gating. */
export function hasProAccess(
  profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus' | 'subscriptionRenewsAt'> | null,
  role: Role,
): boolean {
  return role === 'admin' || isPro(profile)
}

/** True while the user has Pro only because of a free trial — no payment taken yet. */
export function isOnTrial(profile: Pick<Profile, 'subscriptionIsTrial'> | null): boolean {
  return !!profile?.subscriptionIsTrial
}

/**
 * PDF export is held back until the first real payment, so nobody can start a free trial, export
 * their program, and cancel before paying. Admins are never restricted.
 */
export function canExportPdf(
  profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus' | 'subscriptionRenewsAt' | 'subscriptionIsTrial'> | null,
  role: Role,
): boolean {
  if (role === 'admin') return true
  return isPro(profile) && !isOnTrial(profile)
}
