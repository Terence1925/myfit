import { LegalLayout } from './LegalLayout'

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" updated="September 6, 2026">
      <h2>Free Trial</h2>
      <p>
        Cancelling before a free trial ends means you are never charged. Once a trial converts into a paid
        subscription, the rules below apply.
      </p>

      <h2>Monthly Pro</h2>
      <p>
        Monthly Pro is purchased through Google Play or the Apple App Store and auto-renews each month. You can
        cancel anytime from your Google Play or Apple ID subscription settings; cancelling stops future billing and you keep Pro until the end
        of the period you already paid for. We do not provide partial refunds for unused days within a billing
        period.
      </p>

      <h2>Yearly Pro</h2>
      <p>
        Yearly Pro follows the same rules as Monthly: cancel anytime in Google Play or your Apple ID subscriptions to stop renewal,
        with no partial refund for the remainder of the paid year. Because purchases are processed by Google
        Play or Apple, refund requests are also subject to their refund policies.
      </p>

      <h2>How to Request a Refund</h2>
      <p>
        You can request a refund directly from Google Play (play.google.com → Order history) or from Apple
        (reportaproblem.apple.com). If something
        went wrong with a purchase, email ttagayona1985@outlook.com with your account email and the reason,
        and we'll look into it and respond within 2 business days. Approved refunds are returned to your
        original payment method.
      </p>

      <h2>Exceptions</h2>
      <p>
        Nothing in this policy limits any refund right you have under the Philippine Consumer Act or other
        applicable law.
      </p>
    </LegalLayout>
  )
}
