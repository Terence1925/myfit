import { PRO_PRICES } from './billing'

// The store (Google Play / App Store) knows the real price in each person's own currency. These helpers turn what the
// store reports into the wording the app shows, so nobody outside the Philippines reads pesos. The peso prices in
// billing.ts are only the fallback (web, or the store could not be reached).
export interface StoreProduct {
  price: number
  priceString: string
  currencyCode: string
}

export interface PriceLabels {
  monthly: string
  yearly: string
  /** What a month costs on the yearly plan, e.g. "$7.49". */
  yearlyPerMonth: string
  /** e.g. "Save $9.89 a year", or null when yearly is not cheaper. */
  savingsAmount: string | null
  /** e.g. "Save 17%", or null. */
  savingsPercent: string | null
  /** 'store' = real prices in the buyer's currency; 'fallback' = the fixed peso prices. */
  source: 'store' | 'fallback'
}

export const FALLBACK_PRICES: PriceLabels = {
  monthly: PRO_PRICES.monthly.priceLabel,
  yearly: PRO_PRICES.yearly.priceLabel,
  yearlyPerMonth: PRO_PRICES.yearly.perMonthLabel.replace('/mo', ''),
  savingsAmount: PRO_PRICES.yearly.savingsAmountLabel ?? null,
  savingsPercent: PRO_PRICES.yearly.savingsLabel ?? null,
  source: 'fallback',
}

function money(amount: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** Build the price wording from the two store products. Falls back to pesos if either is missing. */
export function describePrices(monthly?: StoreProduct | null, yearly?: StoreProduct | null, locale?: string): PriceLabels {
  if (!monthly || !yearly || monthly.currencyCode !== yearly.currencyCode || !(monthly.price > 0) || !(yearly.price > 0)) {
    return FALLBACK_PRICES
  }
  const code = monthly.currencyCode
  const yearOfMonthly = monthly.price * 12
  const saved = yearOfMonthly - yearly.price
  const percent = Math.round((saved / yearOfMonthly) * 100)
  return {
    monthly: monthly.priceString,
    yearly: yearly.priceString,
    yearlyPerMonth: money(yearly.price / 12, code, locale),
    savingsAmount: saved > 0 ? `Save ${money(saved, code, locale)} a year` : null,
    savingsPercent: saved > 0 && percent > 0 ? `Save ${percent}%` : null,
    source: 'store',
  }
}
