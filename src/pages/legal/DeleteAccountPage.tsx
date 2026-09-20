import { LegalLayout } from './LegalLayout'

export default function DeleteAccountPage() {
  return (
    <LegalLayout title="Delete Your Account" updated="September 20, 2026">
      <h2>In the App (fastest)</h2>
      <p>
        Sign in to FORGEFIT, go to <strong>Account</strong>, scroll to the <strong>Danger Zone</strong> section,
        and select <strong>Delete Account</strong>. You'll be asked to type "DELETE" to confirm. Deletion is
        immediate and permanent.
      </p>

      <h2>Can't Sign In?</h2>
      <p>
        Email <a href="mailto:privacy@forgefit.app">privacy@forgefit.app</a> from the address on your account
        (or with whatever proof of ownership you can provide) and ask us to delete it. We'll confirm your
        identity and complete the deletion within 5 business days.
      </p>

      <h2>What Gets Deleted</h2>
      <p>Deleting your account permanently removes:</p>
      <ul>
        <li>Your profile (name, email, body stats, goals)</li>
        <li>Every generated workout program</li>
        <li>Logged workout sessions and progressive-overload history</li>
        <li>Body-metric entries (weight, body fat, notes)</li>
        <li>Your account's activity history</li>
      </ul>
      <p>
        Billing records may be retained separately by our payment processors (PayMongo, Google Play) as
        required for tax, accounting, and fraud-prevention law — we don't control retention on their systems.
      </p>

      <h2>Questions</h2>
      <p>See our <a href="/privacy">Privacy Policy</a> for the full picture of what we collect and why.</p>
    </LegalLayout>
  )
}
