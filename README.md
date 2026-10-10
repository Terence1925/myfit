# MyFit

AI-powered workout & nutrition program generator, with Pro subscriptions (₱299/mo or ₱2,999/yr, 7-day free trial).

## Run it locally (demo mode, no setup)

```bash
npm install
npm run dev
```

Demo admin account: `admin@myfit.app` / `admin123`. Data lives in your browser's `localStorage` — nothing is shared across devices, and no real payment is ever collected. This mode requires zero configuration and is what runs when no Supabase env vars are set.

## Going to production

The app automatically switches from the mock backend to a real one the moment `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set (see `src/lib/backend/api.ts` — it picks `mockApi.ts` or `supabaseApi.ts` based on that). Here's the full checklist to go live for real:

### 1. Supabase (database + auth)

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_billing_and_progress.sql`, in that order.
3. Project Settings → API → copy the **Project URL** and **anon/public key** into `.env.local` (copy `.env.example` first):
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Authentication → Providers → Email should already be on. Decide whether to require email confirmation (Authentication → Settings) — the app handles both (shows a "check your email" screen if confirmation is required).
5. Restart `npm run dev` — the app now talks to real Supabase: real accounts, real database, admin dashboard sees every real user.

### 2. Stripe (real payments)

1. Create an account at [stripe.com](https://stripe.com) and complete business/payout details.
2. Products → create two recurring Products in **PHP**: Monthly ₱299, Yearly ₱2,999. Copy each `price_...` id.
3. Deploy the three billing edge functions (they use the Stripe Deno SDK, no extra install needed):
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy billing-portal
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. Set the secrets those functions need:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_... \
     STRIPE_PRICE_MONTHLY=price_... \
     STRIPE_PRICE_YEARLY=price_... \
     SITE_URL=https://your-deployed-domain.com \
     SUPABASE_URL=https://xxxx.supabase.co \
     SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Project Settings -> API -> service_role, keep secret
   ```
5. Stripe Dashboard → Developers → Webhooks → Add endpoint → paste the deployed `stripe-webhook` function URL → subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret it gives you and add it:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. That's it — `billing.subscribe()` now redirects to real Stripe Checkout, and the webhook activates Pro on your `profiles` row when payment succeeds. `billing.cancel()` redirects to the real Stripe Customer Portal.

### 3. Play Store (native Android app + Google Play Billing)

Google requires in-app digital subscriptions to go through Google Play Billing, not Stripe — so the app detects whether it's running as a native app (`src/lib/platform.ts`) and switches checkout flow accordingly: Stripe on web, RevenueCat (which wraps Play Billing) inside the Android app.

1. **Google Play Console** — [play.google.com/console](https://play.google.com/console), $25 one-time developer fee. Create the app (package name must match `capacitor.config.ts`'s `appId`: `com.myfit.app`, or change both to match). Under Monetize → Products → Subscriptions, create two products with these exact IDs: `pro_monthly` (₱299/mo) and `pro_yearly` (₱2,999/yr), each with a 7-day free-trial offer.
2. **RevenueCat** — [revenuecat.com](https://revenuecat.com), free up to $2.5k/mo tracked revenue. Create a project, add a Google Play app, and link it to your Play Console app (RevenueCat's setup wizard walks you through creating a Google service account key for this — needed so RevenueCat can verify purchases server-side).
   - Products: add `pro_monthly` and `pro_yearly` (matching Play Console).
   - Entitlements: create one called `pro`, attach both products to it.
   - Offerings: create a default Offering with a Monthly and an Annual package pointing at those products.
   - Copy the **Google Play public API key** (Project Settings → API Keys) into `.env.local`:
     ```
     VITE_REVENUECAT_ANDROID_KEY=goog_...
     ```
3. **Sync the webhook** so purchases update Supabase: deploy `revenuecat-webhook`, set its secret, then add the URL in RevenueCat (Project Settings → Integrations → Webhooks):
   ```bash
   supabase functions deploy revenuecat-webhook --no-verify-jwt
   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<any long random string> \
     SUPABASE_URL=https://xxxx.supabase.co \
     SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
   Paste the same random string into RevenueCat's webhook "Authorization header value" field.
4. **Build the Android app** (needs Android Studio + JDK installed locally — this part can't be done from this environment):
   ```bash
   npm run android:open   # builds the web app, syncs it into android/, opens Android Studio
   ```
   From Android Studio you can run it on an emulator/device, and eventually build a signed `.aab` to upload to Play Console.
5. Test purchases using a Play Console **license tester** account (Play Console → Setup → License testing) before going live — real Google accounts get charged real money otherwise.

### 4. (Optional) Real LLM instead of the deterministic generator

Program generation (`src/lib/backend/programGenerator.ts`) is a fast, free, deterministic rules engine by default — it doesn't call any AI API. If you want an actual LLM writing the programs:

1. Deploy `supabase/functions/generate-program/index.ts` and set an `ANTHROPIC_API_KEY` secret on it.
2. Point `programs.generate()` in `supabaseApi.ts` at that function instead of the local `generateProgram()` call.

### 5. Legal pages

`/terms`, `/privacy`, and `/refund-policy` are already built and linked from the footer — they're a starting template, not legal advice. **Have a Philippines-licensed lawyer review them** before relying on them commercially, especially the Data Privacy Act (RA 10173) section and Stripe's own requirements.

### 6. Hosting

Any static host works (`npm run build` → deploy `dist/`): Vercel, Netlify, Cloudflare Pages, etc. Set the two `VITE_SUPABASE_*` env vars in that host's dashboard too — they're baked in at build time.

## Architecture notes

- `src/lib/backend/api.ts` is a facade — every page imports from here, never from `mockApi.ts` / `supabaseApi.ts` directly, so the whole app is backend-agnostic.
- `src/lib/backend/types.ts` defines the shared interface both implementations must satisfy — if you extend the backend, add the method there first so TypeScript catches any drift between mock and real.
- The TDEE/recovery math (`src/lib/tdee.ts`) is deterministic and client-side either way — it doesn't change when you swap backends.
