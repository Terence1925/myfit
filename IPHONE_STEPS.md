# MyFit on iPhone: steps to do on the MacBook

The iPhone project already exists in the `ios` folder (it was added from Windows, so it has **never been built or run**;
expect to fix small things on the first build). Everything below is done on the Mac unless it says otherwise.

## A. One-time setup
1. Install **Xcode** (Mac App Store) and open it once to accept the license.
2. Install **Node.js (LTS)** from nodejs.org. Git comes with Xcode's command line tools.
3. Join the **Apple Developer Program** ($99/year): developer.apple.com/programs/enroll. Approval can take a day or two.
4. Get the project: `git clone https://github.com/Terence1925/myfit.git`, then `cd myfit` and `npm install`.
5. Copy `.env.local` from the Windows PC into the `myfit` folder (it is not in GitHub). Add one more line later:
   `VITE_REVENUECAT_IOS_KEY=` (the iPhone key from RevenueCat, section C).

## B. Run it
1. In Terminal, inside `myfit`: `npm run ios:open`. This builds the web app, copies it into the iPhone project, and opens Xcode.
2. In Xcode click the blue **App** project, choose the **App** target, open **Signing & Capabilities**:
   - Tick **Automatically manage signing** and pick your **Team** (your Apple Developer account).
   - Bundle Identifier must be `com.myfit.app`.
   - Click **+ Capability** and add **In-App Purchase**.
3. Pick an iPhone simulator (top bar) and press **Run**. To use your own iPhone: plug it in, enable Developer Mode on it
   (Settings > Privacy & Security), choose it in the top bar, press Run.
4. After changing any web code, run `npm run ios:sync` again, then Run.

## C. Subscriptions (App Store Connect + RevenueCat)
1. App Store Connect (appstoreconnect.apple.com) > My Apps > **+** > New App: name MyFit, bundle ID `com.myfit.app`.
2. In the app: **Subscriptions** > create a Subscription Group, then two auto-renewable subscriptions with the product IDs
   `pro_monthly` and `pro_yearly`. Choose the nearest Apple price points to PHP 199/month and PHP 1,790/year.
3. On each, add an **Introductory Offer**: Free, 1 week (7 days).
4. RevenueCat dashboard: add an **App Store** app, link your App Store Connect In-App Purchase key, add the same two
   products, attach both to the entitlement `pro`, and put them in the current offering as monthly and annual packages.
5. Copy the iPhone **public SDK key** into `.env.local` as `VITE_REVENUECAT_IOS_KEY`, then `npm run ios:sync`.
6. Test purchases with a **Sandbox tester** (App Store Connect > Users and Access > Sandbox).

## D. Send it to TestFlight, then the App Store
1. In Xcode choose **Any iOS Device (arm64)**, then **Product > Archive**, then **Distribute App > App Store Connect > Upload**.
2. In App Store Connect > TestFlight, add testers.
3. For the App Store listing you need: screenshots (iPhone sizes Xcode/App Store Connect asks for), description, keywords, support
   URL, privacy policy URL (`https://getmyfit.vercel.app/privacy`), age rating, and the **App Privacy** answers.
4. Apple requires a **demo account** in the review notes: create a test user (email + password) that can sign in and has Pro.

## E. What differs on iPhone (already handled in the code)
- The rest timer is a normal notification (the ringing alarm is Android-only).
- Discount codes are hidden (they unlock Google Play offers only).
- Subscription wording says "App Store" and "Manage" opens Apple's subscriptions page.
- A **Restore purchases** button and Terms/Privacy links are on the Pricing screen (Apple requires them).
- Google sign-in is off. If you turn it on, Apple also requires **Sign in with Apple**.

## F. Known gaps to check on a real iPhone
- First build on a Mac is untested. Notifications (rest timer, trial reminder), PDF share sheet, Demo videos, delete account,
  restore purchases and the top bar near the notch all need a real look.
- The app icon was enlarged from a 512px logo; replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
  with a true 1024x1024 version if you have one.
- Legal pages were updated to mention the App Store but have not been reviewed by a lawyer.
