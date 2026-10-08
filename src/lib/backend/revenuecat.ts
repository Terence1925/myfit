// Wraps the RevenueCat Capacitor SDK, which handles Google Play Billing for us —
// no hand-rolled receipt validation. Only usable inside the native Android app
// (see src/lib/platform.ts); the web app doesn't sell subscriptions — it just honors Pro status.
//
// Setup required in the RevenueCat dashboard (once you have an account):
//   1. Create a Play Store app entry, link it to your Play Console app + service account.
//   2. Create products matching your Play Console subscription products: pro_monthly, pro_yearly.
//   3. Create an Entitlement called "pro" and attach both products to it.
//   4. Create an Offering with a "$rc_monthly" and "$rc_annual" package pointing at those products.
//   5. Copy the public "Google Play API key" into VITE_REVENUECAT_ANDROID_KEY (.env.local) — this
//      key is meant to ship in client apps (unlike a secret/server key).

import { Purchases, type PurchasesPackage, type SubscriptionOption } from '@revenuecat/purchases-capacitor'

export const PRO_ENTITLEMENT_ID = 'pro'

const apiKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined

let configured = false

export async function configureRevenueCat(userId: string): Promise<void> {
  if (!apiKey) throw new Error('VITE_REVENUECAT_ANDROID_KEY is not set.')
  if (configured) {
    await Purchases.logIn({ appUserID: userId })
    return
  }
  await Purchases.configure({ apiKey, appUserID: userId })
  configured = true
}

export async function getOfferingPackages(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings()
  return offerings.current?.availablePackages ?? []
}

export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID])
}

/**
 * The Google Play offer on this package that carries the given tag (set when the offer was created in
 * Play Console). Null if the offer doesn't exist or the user isn't eligible for it.
 */
export function findOptionByTag(pkg: PurchasesPackage, tag: string): SubscriptionOption | null {
  return pkg.product.subscriptionOptions?.find((o) => o.tags.includes(tag)) ?? null
}

/** The price a customer pays once any free trial ends, for display. */
export function discountedPriceLabel(option: SubscriptionOption): string | undefined {
  return option.pricingPhases.find((p) => p.price.amountMicros > 0)?.price.formatted
}

/**
 * Buys the discounted Play offer behind a discount code. The code is also attached to the purchase
 * (a RevenueCat subscriber attribute) so revenuecat-webhook can credit it to the right influencer.
 */
export async function purchaseWithOfferTag(pkg: PurchasesPackage, tag: string, code: string): Promise<boolean> {
  const option = findOptionByTag(pkg, tag)
  if (!option) throw new Error('That discount is not available for this plan right now.')
  await Purchases.setAttributes({ promo_code: code })
  const { customerInfo } = await Purchases.purchaseSubscriptionOption({ subscriptionOption: option })
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID])
}

export async function restorePurchases(): Promise<boolean> {
  const { customerInfo } = await Purchases.restorePurchases()
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID])
}

export async function isEntitledToPro(): Promise<boolean> {
  const { customerInfo } = await Purchases.getCustomerInfo()
  return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT_ID])
}
