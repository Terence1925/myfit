# Google Play store listing: MyFit

Paste each field into Play Console > Grow > Store presence > Main store listing.
Limits: title 30 characters, short description 80, full description 4000.

## App name (30 max)

MyFit: 12-Week Workout Plan

Why this name: it names the strongest feature (a 12-week plan that fits your equipment), it matches what people search for, and it is 27 characters. The calorie log goes in the short description, where there is room for it. The name on the phone's home screen stays "MyFit": a long label would be cut off there.

## Short description (80 max)

12-week workout plan that fits your gear + a free calorie log with barcode scan

## Full description (4000 max)

MyFit gives you a 12-week workout plan built around your goal, your equipment and how well you recover, and tells you what to lift each week. It also has a free food log with a barcode scanner and a cookbook of healthy recipes.

A 12-WEEK PLAN THAT FITS YOU
- Answer a few questions and get a plan for your goal: lose weight, build muscle, get stronger, or lose fat and build muscle together.
- Choose a full gym, dumbbells only, bodyweight, resistance bands, yoga or Pilates.
- Every week has a clear target, the weight to aim for, and a coaching tip based on what you logged last time.
- Warm-up sets for your heavy lifts, and a lighter week after week 12 so your body can recover.
- Weights in pounds or kilograms, whichever you prefer.
- Short video demos for nearly every exercise.

A FREE FOOD LOG
- Log breakfast, lunch, dinner and snacks, and see your calories, protein, carbs and fat for the day.
- Scan a package barcode to add a food in seconds.
- Search hundreds of everyday and Filipino foods, plus millions of products from around the world.
- A cookbook of healthy recipes with photos and steps, including high-protein desserts.
- Save your favorite foods and meals.

CALORIES AND RECOVERY, WORKED OUT FOR YOU
- A daily calorie, protein, carb and fat target based on your body, activity, sleep and stress.
- A recovery score that shows how your sleep and stress affect your training, and trims your sets when you need it.

STAY ON TRACK
- A rest timer that alerts you even when the app is in the background.
- Workout reminders on the days you train.
- A home screen widget with your next workout and your weekly streak.
- Progress history with personal-record alerts, and weight and body-measurement charts.

FREE AND PRO
Free: the first workout of every plan, the full food log with barcode scanning, and the cookbook.
Pro: every training day with sets, reps and rest, the workout log, progress history and charts, your nutrition and recovery plan, unlimited saved plans and PDF export. Try Pro free for 7 days. After the trial, the subscription renews at the price shown in your local currency, and you can cancel any time in Google Play.

MyFit is a training and nutrition guide, not medical advice. Talk to your doctor before you start a new exercise or eating plan.

## What's new (release notes for the first release, 500 max)

First release: your 12-week workout plan, a free food log with barcode scanning, a rest timer, workout reminders and progress charts.

## Before you submit

- App category: Health & Fitness. Tags: workout, fitness, nutrition.
- Contact email: joinmyfit@gmail.com (the address the app and the legal pages already show). Play shows it publicly on the store page.
- Website: https://getmyfit.vercel.app
- Privacy policy URL: https://getmyfit.vercel.app/privacy
- The text says "Try Pro free for 7 days". The app shows a trial only when the Play subscription has a free-trial offer, and it expects 7 days (TRIAL_DAYS in src/lib/billing.ts). In Play Console > Monetize > Subscriptions, make sure each base plan has a 7-day free-trial offer. If you change the length, change both the text and TRIAL_DAYS.
- The text says "video demos", not "animated demos", on purpose: the rights to the animated clips are still unconfirmed.
- Free-vs-Pro lines follow the app today (Day 1 free; food log, scanner and cookbook free).
- The screenshots show a demo account named Alex with sample meals and weights. Nothing in them is a real person's data.

## Graphics (in this folder)

- icon-512.png: app icon, 512 x 512
- feature-graphic.jpg: 1024 x 500
- phone-1.jpg ... phone-8.jpg: phone screenshots, 1080 x 1920 (Play needs at least 2, up to 8). In this order:
  1. Your week at a glance (home screen with the weekly streak)
  2. Know what to lift each week (a training day with the weight to aim for)
  3. Log every set in seconds (set logging with the rest timer)
  4. A free food log
  5. Find any food fast (search)
  6. Calories set for your goal
  7. Watch your progress (weight chart)
  8. Train to match your recovery
