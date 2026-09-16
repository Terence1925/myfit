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

const MONTHLY_PRICE = 399.99
const YEARLY_PRICE = 3999
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

export const FREE_FEATURES = [
  '1 active AI-generated program',
  'Full TDEE & macro breakdown',
  'Recovery-adjusted training volume',
  'Exercise swap & form demos',
]

export const PRO_FEATURES = [
  'Unlimited saved programs',
  'Regenerate anytime — no cooldown',
  'Progressive overload tracking with PR alerts',
  'Progress tracking & body-metric charts',
  'PDF export of any program',
  'Priority AI regeneration queue',
  'Early access to new training templates',
]

export function isPro(profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus'> | null): boolean {
  if (!profile) return false
  return profile.subscriptionTier === 'pro' && profile.subscriptionStatus === 'active'
}

export function planLabel(profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus'>): string {
  if (isPro(profile)) return 'Pro'
  return 'Free'
}

/** Admins get every Pro feature for free — use this (not isPro) for feature gating. */
export function hasProAccess(
  profile: Pick<Profile, 'subscriptionTier' | 'subscriptionStatus'> | null,
  role: Role,
): boolean {
  return role === 'admin' || isPro(profile)
}
