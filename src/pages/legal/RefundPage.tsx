import { LegalLayout } from './LegalLayout'

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" updated="September 6, 2026">
      <h2>Free Plan</h2>
      <p>The Free plan costs nothing and never requires a refund.</p>

      <h2>Monthly Pro (₱399.99/mo)</h2>
      <p>
        <strong>On the web,</strong> Monthly Pro is a one-time payment covering 30 days, processed by
        PayMongo. It does not auto-renew, so there's no future billing to cancel; we do not provide partial
        refunds for unused days within a period. <strong>On the Android app,</strong> Monthly Pro auto-renews
        through Google Play — you can cancel anytime from your Google Play subscription settings, and Google
        Play's own refund policy applies to that purchase.
      </p>

      <h2>Yearly Pro (₱3,999/yr)</h2>
      <p>
        First-time yearly subscribers may request a full refund within <strong>7 days</strong> of the
        initial purchase if unsatisfied (web purchases: email us; Android purchases: Google Play's refund
        process). After 7 days, the same policy as Monthly applies — no partial refund for the remainder of
        the paid year.
      </p>

      <h2>How to Request a Refund</h2>
      <p>
        Email billing@forgefit.app with your account email and the reason for your request. We aim to
        respond within 2 business days; approved refunds are returned to your original payment method within
        5–10 business days depending on your bank/card issuer.
      </p>

      <h2>Exceptions</h2>
      <p>
        Nothing in this policy limits any refund right you have under the Philippine Consumer Act or other
        applicable law.
      </p>
    </LegalLayout>
  )
}
