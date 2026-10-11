import { LegalLayout } from './LegalLayout'

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" updated="September 6, 2026">
      <h2>Free Trial</h2>
      <p>
        Cancelling before a free trial ends means you are never charged. Once a trial converts into a paid
        subscription, the rules below apply.
      </p>

      <h2>Monthly Pro (₱199/mo)</h2>
      <p>
        Monthly Pro is purchased through Google Play and auto-renews each month. You can cancel anytime from
        your Google Play subscription settings; cancelling stops future billing and you keep Pro until the end
        of the period you already paid for. We do not provide partial refunds for unused days within a billing
        period.
      </p>

      <h2>Yearly Pro (₱1,790/yr)</h2>
      <p>
        Yearly Pro follows the same rules as Monthly: cancel anytime in Google Play to stop renewal, with no
        partial refund for the remainder of the paid year. Because purchases are processed by Google Play,
        refund requests are also subject to Google Play's refund policy.
      </p>

      <h2>How to Request a Refund</h2>
      <p>
        You can request a refund directly from Google Play (play.google.com → Order history). If something
        went wrong with a purchase, email ttagayona1985@outlook.com with your account email and the reason,
        and we'll look into it and respond within 2 business days. Approved refunds are returned to your
        original Google Play payment method.
      </p>

      <h2>Exceptions</h2>
      <p>
        Nothing in this policy limits any refund right you have under the Philippine Consumer Act or other
        applicable law.
      </p>
    </LegalLayout>
  )
}
