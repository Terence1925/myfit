import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getRecoveryBreakdown } from '@/lib/tdee'
import { cn } from '@/lib/utils'
import type { IntakeAnswers, RecoveryTier } from '@/lib/types'

type TierName = RecoveryTier['tier']

const TIERS: {
  tier: TierName
  range: string
  from: number
  to: number
  bar: string
  meaning: string
  plan: string
  planMindBody: string
}[] = [
  {
    tier: 'Poor',
    range: 'Under 50',
    from: 0,
    to: 50,
    bar: 'bg-red-500/80',
    meaning: 'Your body is short on rest right now, so it needs more time to bounce back between workouts.',
    plan: 'About 25% fewer sets, focused on the big main lifts, plus an extra rest day.',
    planMindBody: 'About 25% fewer poses per session, with gentler poses and more restorative holds, plus an extra rest day.',
  },
  {
    tier: 'Moderate',
    range: '50 to 69',
    from: 50,
    to: 70,
    bar: 'bg-amber-500/80',
    meaning: 'Your recovery is okay but not great. Hard training could pile up faster than you can recover from it.',
    plan: 'About 10 to 15% fewer sets, and an extra rest day.',
    planMindBody: 'About 10 to 15% fewer poses per session, and an extra rest day.',
  },
  {
    tier: 'Good',
    range: '70 to 84',
    from: 70,
    to: 85,
    bar: 'bg-emerald-500/80',
    meaning: 'Your body recovers well. You can handle a normal amount of training.',
    plan: 'The standard program, with no cuts and no extra rest days.',
    planMindBody: 'The standard program, with no cuts and no extra rest days.',
  },
  {
    tier: 'Elite',
    range: '85 to 100',
    from: 85,
    to: 100,
    bar: 'bg-primary',
    meaning: 'You sleep well and manage stress well, so you can recover from more training than most people.',
    plan: 'A little extra volume and tougher top sets.',
    planMindBody: 'A few extra poses per session and slightly longer holds.',
  },
]

/** One plain-English sentence about the user's current level. */
export function tierMeaning(tier: TierName): string {
  return TIERS.find((t) => t.tier === tier)?.meaning ?? ''
}

/** A 4-colour bar (Poor to Elite) with a marker showing where the score sits. */
export function RecoveryScale({ score, currentTier }: { score: number; currentTier: TierName }) {
  const pos = Math.min(100, Math.max(0, score))
  return (
    <div>
      <div className="relative pt-3">
        <div className="flex h-3 gap-1">
          {TIERS.map((t) => (
            <div
              key={t.tier}
              className={cn('rounded-full', t.bar, t.tier !== currentTier && 'opacity-35')}
              style={{ width: `${t.to - t.from}%` }}
            />
          ))}
        </div>
        <div
          className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-foreground"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1.5 flex gap-1 text-[11px] text-muted-foreground">
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className={cn('truncate', t.tier === currentTier && 'font-bold text-foreground')}
            style={{ width: `${t.to - t.from}%` }}
          >
            {t.tier}
          </div>
        ))}
      </div>
    </div>
  )
}

function signed(value: number) {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'
}

/** Four tiles showing exactly where the score came from. */
export function ScoreBreakdown({ answers, score }: { answers: IntakeAnswers; score: number }) {
  const b = getRecoveryBreakdown(answers)
  const tiles = [
    { label: 'Starting point', value: String(b.base), sub: 'everyone begins here', points: 0 },
    { label: 'Sleep amount', value: signed(b.sleepHours), sub: `${answers.sleepHours} hours a night`, points: b.sleepHours },
    { label: 'Sleep quality', value: signed(b.sleepQuality), sub: answers.sleepQuality, points: b.sleepQuality },
    { label: 'Stress level', value: signed(b.stress), sub: answers.stressLevel.replace('-', ' '), points: b.stress },
  ]
  return (
    <section>
      <h3 className="mb-3 font-display text-xl tracking-wide">Where your score comes from</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div
                className={cn(
                  'mt-1 font-display text-3xl tracking-wide tabular-nums',
                  t.points > 0 && 'text-emerald-400',
                  t.points < 0 && 'text-destructive',
                )}
              >
                {t.value}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground first-letter:uppercase">{t.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Add these up and you get your score of {score}
        {b.raw !== score ? ` (the total was ${b.raw}, but scores stay between 0 and 100)` : ''}. It's a training
        guide based on your answers, not a medical test.
      </p>
    </section>
  )
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-xl border border-border bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-body text-sm font-bold"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-border/60 px-4 py-4 text-sm font-body text-muted-foreground">{children}</div>}
    </div>
  )
}

/** The extra detail, tucked into dropdowns so the page stays easy to scan. */
export function RecoveryLearnMore({ currentTier, mindBody = false }: { currentTier: TierName; mindBody?: boolean }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-xl tracking-wide">Learn more</h3>

      <Disclosure title="What each level means">
        <div className="space-y-2">
          {TIERS.map((t) => {
            const here = t.tier === currentTier
            return (
              <div
                key={t.tier}
                className={cn('rounded-lg border p-3', here ? 'border-primary/60 bg-primary/5' : 'border-border/60')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-foreground">
                    {t.tier} <span className="font-normal text-muted-foreground">({t.range})</span>
                  </span>
                  {here && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                      You are here
                    </span>
                  )}
                </div>
                <p className="mt-1">{t.meaning}</p>
                <p className="mt-1 text-foreground/90">
                  <span className="font-semibold">Your program:</span> {mindBody ? t.planMindBody : t.plan}
                </p>
              </div>
            )
          })}
        </div>
      </Disclosure>

      <Disclosure title="New to training? Quick words">
        {mindBody ? (
          <ul className="space-y-2">
            <li>
              <span className="font-semibold text-foreground">Hold time:</span> how long you stay in a pose, shown in
              seconds. Breathe slowly through your nose the whole time. If a pose feels too strong, ease out of it
              early or make it smaller.
            </li>
            <li>
              <span className="font-semibold text-foreground">Each side:</span> do the pose on one side, then repeat it
              on the other so your body stays balanced.
            </li>
            <li>
              <span className="font-semibold text-foreground">Round:</span> one full pass through a Pilates move. A
              beginner does one round, and you add a second as it gets easier.
            </li>
            <li>
              <span className="font-semibold text-foreground">Savasana:</span> the final rest at the end of yoga. You
              lie still and let your body relax. It is part of the practice, not a break from it.
            </li>
            <li>
              <span className="font-semibold text-foreground">Rest day:</span> a day with no training. Your body
              repairs itself and recovers, so it can do more next time.
            </li>
          </ul>
        ) : (
          <ul className="space-y-2">
            <li>
              <span className="font-semibold text-foreground">Volume:</span> the total number of sets you do in a
              week. More sets means more work for your body to recover from.
            </li>
            <li>
              <span className="font-semibold text-foreground">RIR (reps in reserve):</span> how many more reps you
              could still do when you stop a set. "3 RIR" means you stop with 3 reps left in the tank, so it feels
              challenging but not all-out. Newer lifters should keep a few reps in reserve to learn good form and
              avoid injury.
            </li>
            <li>
              <span className="font-semibold text-foreground">Rest day:</span> a day with no lifting. This is when
              your body repairs itself and gets stronger.
            </li>
          </ul>
        )}
      </Disclosure>

      <Disclosure title="How to raise your score">
        <ul className="list-disc space-y-1 pl-5">
          <li>Sleep 7 to 9 hours, and go to bed and wake up at about the same time each day.</li>
          <li>Keep your room dark and cool, and put your phone away 30 minutes before bed.</li>
          <li>Make time to unwind: a walk, stretching, or a few minutes of quiet breathing.</li>
          <li>When your sleep or stress improves, create a new program and your score will update.</li>
        </ul>
      </Disclosure>
    </section>
  )
}
