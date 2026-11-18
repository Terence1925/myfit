# Play Console answers for MyFit

Answers for each form in Play Console > Policy and programs > App content (and the related screens). They come from what the app does today (permissions from the built release manifest, data from the privacy policy and the code). Review each one before you submit: you are the one making these declarations to Google.

## 1. Privacy policy

https://getmyfit.vercel.app/privacy

## 2. App access

Choose "All or some functionality is restricted", then add instructions:

- Sign-in: email and password (or "Continue with Google"). A reviewer needs an account.
- Create a reviewer account in the live app, and give it Pro with a redeem code (Admin > Codes) so the reviewer sees every screen. Do not use your own admin account. The food log, the cookbook and a read-only view of the plan are free; logging workouts, the rest timer, demos and progress need Pro.
- Put the reviewer email and password here in the Play Console form only. Do not write the password into this file or anywhere in the repository.

## 3. Ads

No, the app does not contain ads. (No advertising SDK, and the built app has no advertising ID permission, so the "Advertising ID" question is also **No**.)

## 4. Content rating (IARC questionnaire)

Category: Utility, Productivity, Communication, or Other (a fitness app). Answer **No** to: violence, blood, sexual content, nudity, profanity, drugs or alcohol, gambling, scary content, and user-generated content or chat between users. Does the app share the user's location? **No**. Does it allow digital purchases? **Yes** (subscriptions). Expected result: rated for everyone.

## 5. Target audience and content

- Target age groups: **16-17** and **18 and over**. Do not select anything under 16: the Terms and the sign-up questions require users to be at least 16, and selecting younger groups would bring in Google's Families policy.
- Does the app appeal to children? **No**.

## 6. Health apps declaration

The app has fitness and nutrition features, so complete the Health apps declaration.

- Features: activity and fitness (workout plans and logging), and nutrition and weight management (calorie target and food log).
- It is **not** a medical device or a diagnostic tool, and it does not give medical advice. The Terms of Service and the store description both say so and tell users to talk to a doctor first.
- The privacy policy explains how body and health data is used.

## 7. Data safety

Does the app collect or share any of the required user data types? **Yes**.

**Collected:**

| Data type | Category | Required? | Purpose |
|---|---|---|---|
| Name | Personal info | Required | Account management, app functionality |
| Email address | Personal info | Required | Account management, app functionality, developer communications (account emails, such as the account-deleted confirmation) |
| User IDs | Personal info | Required | Account management, app functionality |
| Health info (weight, body fat, age, sex, height, sleep, stress, food log) | Health and fitness | Required for the plan; body fat and notes are optional | App functionality, personalization |
| Fitness info (training goal, equipment, logged workouts) | Health and fitness | Required | App functionality, personalization |
| Purchase history (subscription plan and status) | Financial info | Required for Pro | App functionality, account management |
| Photos (the optional profile photo) | Photos and videos | **Optional** | App functionality (shown next to the user's name). Not shared. |

The profile photo is chosen from the phone and shrunk to a small square picture before it is stored with the profile. It is deleted when the user removes it or deletes the account. Answer the "optional" question for Photos as **users can choose whether to provide it**.

Not collected: location, contacts, videos, audio, other files, messages, web browsing, device or advertising IDs, crash logs or diagnostics. The app has no analytics or crash-reporting library and does not use the camera permission.

**Payment details:** handled entirely by Google Play. The app never sees card numbers, so do not declare "payment info".

**Shared with third parties:** Google's rules do not count data sent to service providers that process it on your behalf, so these are not "sharing": Supabase (database and sign-in), RevenueCat (subscription status), Brevo (account emails), Vercel (website host). Two cases to decide on yourself, because they are borderline:
- **YouTube:** a few exercise videos play from YouTube, which collects its own data (such as IP address) when a user presses play. The conservative answer is to disclose this as sharing "Device or other IDs" with a third party for app functionality.
- **Food databases (USDA, Open Food Facts):** the server sends them only the search text or barcode, with no name, email or account ID, and MyFit stores no search history. This does not need to be disclosed as sharing personal data.

**Security practices:**
- Data is encrypted in transit: **Yes** (HTTPS).
- Users can request that data is deleted: **Yes**. In the app: Account > Delete account. On the web: https://getmyfit.vercel.app/delete-account (enter this URL in the data-deletion question).
- Committed to follow the Play Families policy: **No** (not designed for children).
- Independent security review: **No**.

## 8. Permissions you may be asked to justify

| Permission | Why the app needs it |
|---|---|
| `SCHEDULE_EXACT_ALARM` | The rest timer must ring at the exact second your rest ends, including with the screen off. The app checks whether the permission is granted and asks the user to allow it if it is not. |
| `POST_NOTIFICATIONS` | Rest-timer alerts and workout reminders. |
| `RECEIVE_BOOT_COMPLETED` | Re-schedules workout reminders after the phone restarts. |
| `WAKE_LOCK`, `VIBRATE` | The rest-timer alert. |
| `com.android.vending.BILLING` | Pro subscriptions through Google Play. |

The camera permission is not requested: barcode scanning uses Google's code scanner.

The built app also lists `ACCESS_NETWORK_STATE`, `USE_BIOMETRIC`, `USE_FINGERPRINT` and `USE_CREDENTIALS`. They come from the sign-in and networking libraries, they are normal permissions with no prompt, and Play Console does not ask you to justify them. There is no advertising ID and no location permission.

## 9. Other App content forms

Government apps: **No**. Financial features: **No** (subscriptions are sold through Google Play). News app: **No**. COVID-19 contact tracing or status app: **No**.

## 10. Subscriptions (Monetize > Products > Subscriptions)

Create two subscriptions. The app reads a free trial from the Google Play base plan, so the trial must be an offer on each base plan.

| | Monthly | Yearly |
|---|---|---|
| Product ID | `pro_monthly` | `pro_yearly` |
| Name (users see it) | MyFit Pro Monthly | MyFit Pro Yearly |
| Base plan | Auto-renewing, billing period 1 month | Auto-renewing, billing period 1 year |
| Price (Philippines) | PHP 149 | PHP 1,290 |
| Free-trial offer | Offer type: new customer acquisition, eligibility: new customers, phase: free trial, **7 days** | Same |

- Let Google convert the price for other countries, then check them.
- The prices in the app (PHP 149 and PHP 1,290) are only a fallback. The real prices come from what you set here.
- Link Play to RevenueCat: create the Google service account, upload its JSON key in RevenueCat, and import the two products. Attach both to the `pro` entitlement and to the `default` offering as the Monthly and Annual packages.
- Add yourself under **Settings > License testing**, so test purchases are free.
- Add the RevenueCat webhook (URL in `PROJECT_NOTES.md`) so Supabase learns about purchases.

## 11. Release

- Upload `app-release.aab` (Android App Bundle) to your track.
- Turn on Play App Signing and keep a backup of your upload keystore and its password somewhere other than this computer.
- Each new upload needs a higher `versionCode` (it is 1 for the first release).

## 12. Store settings and testing

- **Main store listing:** title, short and full description from `final-listing.md`; icon `icon-512.png`; feature graphic and 6 phone screenshots from `google-play-upload/` (or the zip `MyFit-google-play-graphics.zip`).
- **Store settings:** category **Health & Fitness**; tags: workout, fitness, nutrition; contact email **joinmyfit@gmail.com**; website https://getmyfit.vercel.app.
- **Closed testing (personal account):** create a closed track, add a tester list (a Google Group or emails), share the opt-in link, and keep **12 testers opted in for 14 days in a row** before applying for production access.
- **Google sign-in on Play-installed builds:** after the first upload, copy the **app signing SHA-1** from Play Console (Test and release > App integrity) and add it to the Android OAuth client in Google Cloud.
