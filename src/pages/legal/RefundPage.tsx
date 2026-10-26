import { LegalLayout } from './LegalLayout'

export default function RefundPage() {
  return (
    <LegalLayout title="Refund policy" updated="October 26, 2026">
      <p>MyFit is operated by Terence Tagayona. Subscriptions are bought through Google Play or the Apple App Store, which process all payments and refunds.</p>
      <h2>Free Trial</h2>
      <p>
        Cancelling in Google Play or the Apple App Store before a free trial ends means you are never charged. Once a trial converts into a paid
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
        (reportaproblem.apple.com). If something went wrong with a purchase, email joinmyfit@gmail.com with your account email and the reason. We will help you send the request to Google Play or Apple, and reply within 2 business days. Google Play or Apple then returns any approved refund to your original payment method.
      </p>

      <h2>Exceptions</h2>
      <p>
        Nothing in this policy limits any refund or withdrawal right you have under consumer law in your country. Where the law gives you a right to withdraw from a purchase within a set period (for example 14 days in the EU and UK), that right applies. Google Play and Apple handle those refunds.
      </p>
    </LegalLayout>
  )
}
