import { LegalLayout } from './LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="October 26, 2026">
      <p>
        MyFit ("we") respects your privacy. The controller of your personal data is Terence Tagayona, who operates MyFit. This policy explains what data we collect, why, and the
        rights you have over it under the Philippines' Data Privacy Act of 2012 (RA 10173), and under the data protection law where you live (for example the GDPR in the EU and UK).
      </p>

      <h2>1. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email address, and a hashed password (if you sign up with email). If you choose "Continue with Google", we receive your name and email address from Google. We never receive your Google password.</li>
        <li><strong>Body &amp; lifestyle data:</strong> age, sex, weight, height, sleep, stress, activity level, training goal — used to calculate your BMR/TDEE and generate your program.</li>
        <li><strong>Usage data:</strong> generated programs, logged workouts, body-metric entries, activity history.</li>
        <li><strong>Support access:</strong> if you ask us for help, MyFit administrators can view your workout program and account details so they can fix the problem or send you a copy of your program by email.</li>
        <li><strong>Billing data:</strong> your subscription plan and status. Payments are handled entirely by Google Play or the Apple App Store — we never see or store your card number.</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>
        To generate and personalize your training/nutrition programs, calculate your recovery score, operate
        your account, process billing, and improve the Service. We do not sell your personal data.
      </p>

      <h2>3. Who We Share It With</h2>
      <p>
        Only the service providers necessary to run MyFit: our database and sign-in provider (Supabase), our website host (Vercel), Brevo (to send the account-deleted email), Google (for Continue with Google), and our payment provider (Google Play or the Apple App Store, via RevenueCat for subscription status). Exercise videos are played from YouTube, which may collect data under its own policy. Food searches go to the USDA and Open Food Facts databases without your name or account details. We do not share your health or body data with advertisers.
      </p>

      <h2>4. Data Storage &amp; Security</h2>
      <p>
        Data is stored with row-level security so only you (and authorized admins, for support purposes) can
        access your records. Data is encrypted in transit. Your data may be stored and processed in countries other than the one you live in, by the providers listed in section 3.
      </p>

      <h2>5. Your Rights</h2>
      <p>Under the Data Privacy Act of 2012, and similar laws where you live, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your account and data — see <a href="/delete-account">how to delete your account</a></li>
        <li>Object to or restrict certain processing</li>
        <li>Data portability (receive a copy of your data)</li>
        <li>File a complaint with the National Privacy Commission (Philippines), or with the data protection authority in your country</li>
      </ul>
      <p>To exercise any of these rights, contact joinmyfit@gmail.com.</p>

      <h2>6. Data Retention</h2>
      <p>
        We retain your data while your account is active. If you delete your account, your personal data is
        removed within a reasonable period, except where we're required to retain records by law (e.g. billing history).
      </p>

      <h2>7. Cookies &amp; Local Storage</h2>
      <p>We use local browser storage to keep you signed in and remember your preferences. We do not use third-party advertising trackers.</p>

      <h2>8. Children's Privacy</h2>
      <p>MyFit is not directed at children under 16 and we do not knowingly collect their data. If you believe a child under 16 has given us their details, contact joinmyfit@gmail.com and we will delete them.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We'll post updates here and update the date above. Material changes will be notified to you by email.</p>

      <h2>10. Contact</h2>
      <p>Data privacy questions or requests: joinmyfit@gmail.com.</p>
    </LegalLayout>
  )
}
