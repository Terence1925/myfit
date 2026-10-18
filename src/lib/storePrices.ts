import * as React from 'react'
import { isNativeApp } from '@/lib/platform'
import { describePrices, FALLBACK_PRICES, type PriceLabels, type StoreProduct } from './priceLabels'

export { describePrices, FALLBACK_PRICES, type PriceLabels, type StoreProduct } from './priceLabels'

// One lookup shared by every screen that shows a price
let cached: PriceLabels | null = null
let inflight: Promise<PriceLabels> | null = null

async function loadStorePrices(userId: string): Promise<PriceLabels> {
  if (cached) return cached
  // Dev-only preview of another country's prices: localStorage.myfit_preview_prices = '{"monthly":{...},"yearly":{...}}'
  if (import.meta.env?.DEV) {
    try {
      const raw = localStorage.getItem('myfit_preview_prices')
      if (raw) {
        const fake = JSON.parse(raw) as { monthly: StoreProduct; yearly: StoreProduct }
        return describePrices(fake.monthly, fake.yearly)
      }
    } catch {
      /* ignore a bad preview value */
    }
  }
  if (!inflight) {
    inflight = import('@/lib/backend/revenuecat')
      .then(async ({ configureRevenueCat, getOfferingPackages }) => {
        await configureRevenueCat(userId)
        const packages = await getOfferingPackages()
        const find = (type: string) => packages.find((p) => p.packageType === type)?.product
        const labels = describePrices(find('MONTHLY'), find('ANNUAL'))
        // Only remember a real answer, so a bad connection is retried next time
        if (labels.source === 'store') cached = labels
        return labels
      })
      .catch(() => FALLBACK_PRICES)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/**
 * The prices to show. In the phone app: the store's own prices in the buyer's currency (`loading` is true until they
 * arrive, so a euro buyer never sees a flash of pesos). On the web there is no store, so the peso prices are shown.
 */
export function useStorePrices(userId: string | undefined): { prices: PriceLabels; loading: boolean } {
  const native = isNativeApp()
  const [state, setState] = React.useState<{ prices: PriceLabels; loading: boolean }>(() =>
    native && userId ? { prices: cached ?? FALLBACK_PRICES, loading: !cached } : { prices: FALLBACK_PRICES, loading: false },
  )

  React.useEffect(() => {
    if (!native || !userId) return
    let cancelled = false
    void loadStorePrices(userId).then((prices) => !cancelled && setState({ prices, loading: false }))
    return () => {
      cancelled = true
    }
  }, [native, userId])

  return state
}
