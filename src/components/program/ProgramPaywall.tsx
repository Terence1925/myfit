import * as React from 'react'
import { motion } from 'framer-motion'
import { BellRing, CalendarDays, Check, CircleDollarSign, Crown, Gift, Lock, Moon, Sparkles, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { WeeklyPlanTab } from './WeeklyPlanTab'
import { programs, sessions } from '@/lib/backend/api'
import { TRIAL_DAYS, firstPaymentDate } from '@/lib/billing'
import { useStorePrices } from '@/lib/storePrices'
import { storeName } from '@/lib/platform'
import { countedDates } from '@/lib/streak'
import { goalLabelOf } from '@/lib/goalLabel'
import type { Equipment, FocusArea, ProgramData, WorkoutProgram } from '@/lib/types'
import { BLOCK_WEEKS } from '@/lib/programBlock'

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'full-gym': 'Full gym',
  'dumbbells-only': 'Dumbbells only',
  'home-workout': 'Home workout',
  calisthenics: 'Bodyweight',
  'resistance-bands': 'Resistance bands',
  yoga: 'Yoga',
  pilates: 'Pilates',
}

const FOCUS_LABELS: Record<FocusArea, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  'full-body': 'Full body',
}

/** Keep a note to its first clause so it reads as one line on a phone. */
function shortNote(note: string): string {
  const first = note.split(' — ')[0].trim()
  return /[.!?]$/.test(first) ? first : `${first}.`
}

/**
 * Shown to people without a subscription once their program is built. Day 1 is fully usable and free (demos, rest timer and
 * workout log all work), so they feel the product before they pay. The other days are locked.
 */
export function ProgramPaywall({ program }: { program: WorkoutProgram }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { nutrition: n, answers } = program
  const [data, setData] = React.useState<ProgramData>(program.programData)
  const firstName = profile?.displayName?.trim().split(/\s+/)[0]
  const firstDay = data.days[0]
  const { prices, loading: pricesLoading } = useStorePrices(profile?.id)
  const payDate = firstPaymentDate()
  // Day 1 finished (at least half its sets, or marked done): the natural moment to offer the trial
  const [day1Done, setDay1Done] = React.useState(false)
  React.useEffect(() => {
    if (!profile) return
    let cancelled = false
    const check = async () => {
      const saved = await sessions.listForUser(profile.id).catch(() => [])
      if (!cancelled) setDay1Done(countedDates(saved.filter((x) => x.programId === program.id && x.day === 1)).length > 0)
    }
    void check()
    window.addEventListener('myfit:session-saved', check)
    return () => {
      cancelled = true
      window.removeEventListener('myfit:session-saved', check)
    }
  }, [profile, program.id])
  const trialLine = pricesLoading
    ? `${TRIAL_DAYS} days free. Cancel any time and you pay nothing.`
    : `${TRIAL_DAYS} days free, then ${prices.monthly}/month or ${prices.yearly}/year. Cancel any time before then and you pay nothing.`

  const chips = [
    goalLabelOf(answers),
    EQUIPMENT_LABELS[answers.equipment],
    ...answers.focusAreas.map((f) => `${FOCUS_LABELS[f]} focus`),
    `${data.days.length} days / week`,
  ]

  // Swapping an exercise on Day 1 works the same as in a full program, and is saved.
  const handleSwap = async (dayNumber: number, exerciseIndex: number, exerciseName: string, dayFocus: string) => {
    if (!profile) return
    const today = data.days.find((d) => d.day === dayNumber)?.exercises.map((e) => e.name) ?? []
    const swap = await programs.alternate(profile.id, exerciseName, dayFocus, answers, today)
    const next: ProgramData = {
      ...data,
      days: data.days.map((d) => (d.day === dayNumber ? { ...d, exercises: d.exercises.map((e, i) => (i === exerciseIndex ? swap : e)) } : d)),
    }
    setData(next)
    await programs.update(program.id, next)
  }

  return (
    <div className="container max-w-3xl py-10 pb-44 sm:py-14 sm:pb-28">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Built just for you</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-gradient-gold">
          {firstName ? `${firstName}, your ${BLOCK_WEEKS}-week program is ready` : `Your ${BLOCK_WEEKS}-week program is ready`}
        </h1>
        <p className="mt-3 font-body text-muted-foreground">
          {data.programName} — {data.tagline}
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <Badge key={chip} variant="outline">
            {chip}
          </Badge>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, label: 'Training days', value: `${data.days.length} / week` },
          { icon: Utensils, label: 'Daily calories', value: `${n.calorieTarget} kcal` },
          { icon: Moon, label: 'Recovery score', value: `${n.recoveryScore} / 100 · ${n.recoveryTier}` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-display text-xl tracking-wide">{value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data.personalizationNotes?.length ?? 0) > 0 && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" /> Why this program fits you
            </div>
            <ul className="mt-3 space-y-2">
              {data.personalizationNotes.slice(0, 3).map((note) => (
                <li key={note} className="flex gap-2 font-body text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{shortNote(note)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {firstDay && profile && (
        <section className="mt-10">
          {day1Done ? (
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-gradient">
                  <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-wide text-gradient-gold">Day 1 done</h2>
                  <p className="mt-0.5 font-body text-sm text-muted-foreground">
                    Your plan has {data.days.length - 1} more {data.days.length - 1 === 1 ? 'day' : 'days'} built for you. Start your {TRIAL_DAYS}-day free trial to unlock {data.days.length - 1 === 1 ? 'it' : 'them'}.
                  </p>
                </div>
              </div>
              <Button size="lg" className="mt-4 w-full gap-2" onClick={() => navigate('/pricing')}>
                <Crown className="h-4 w-4" /> Start free trial
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">{trialLine}</p>
            </div>
          ) : (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-gradient">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wide text-gradient-gold">Day 1 is free</h2>
                <p className="mt-0.5 font-body text-sm text-muted-foreground">
                  Do your first workout right now. Demos, the rest timer and your workout log all work. No trial and no card needed.
                </p>
              </div>
            </div>
          </div>
          )}
          <div className="mt-5">
            <WeeklyPlanTab
              program={{ ...data, days: [firstDay] }}
              programId={program.id}
              userId={profile.id}
              activeDay={firstDay.day}
              onActiveDayChange={() => undefined}
              onSwapExercise={handleSwap}
              hasProgressAccess={false}
              startedAt={program.createdAt}
            />
          </div>
        </section>
      )}

      {data.days.length > 1 && (
        <div className="mt-8">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">The rest of your week</div>
          <p className="mb-3 font-body text-sm text-muted-foreground">These days unlock when you start your {TRIAL_DAYS}-day free trial.</p>
          <div className="space-y-2">
            {data.days.slice(1).map((day) => (
              <button
                key={day.day}
                type="button"
                onClick={() => navigate('/pricing')}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-primary">Day {day.day}</div>
                  <div className="truncate font-body font-bold">{day.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {day.exercises.length} {day.exercises[0]?.format === 'yoga' ? 'poses' : day.exercises[0]?.format === 'pilates' ? 'moves' : 'exercises'} · unlocks with your free trial
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
                  <Lock className="h-3.5 w-3.5" /> Unlock
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="p-5">
          <div className="text-center">
            <div className="font-display text-2xl tracking-wide">START YOUR {TRIAL_DAYS}-DAY FREE TRIAL</div>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Unlock all {data.days.length} days of your program, your nutrition plan, progress history and charts.
            </p>
          </div>

          <ol className="mt-5 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CircleDollarSign className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="font-bold">Today: free.</span> <span className="text-muted-foreground">Everything unlocks right away.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <BellRing className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="font-bold">Day {TRIAL_DAYS - 1}: a reminder.</span>{' '}
                <span className="text-muted-foreground">We tell you the day before, so you're never surprised.</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="font-bold">{payDate}: your first payment.</span>{' '}
                <span className="text-muted-foreground">
                  {pricesLoading
                    ? 'The price is shown before you start.'
                    : `${prices.yearly} a year (${prices.yearlyPerMonth}/mo) or ${prices.monthly} a month.`}{' '}
                  Cancel any time before then in {storeName()} and you pay nothing.
                </span>
              </span>
            </li>
          </ol>

          <Button size="lg" className="mt-5 w-full gap-2" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4" /> Unlock My Program
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="font-body text-sm font-bold">Track your food, free</div>
            <div className="text-xs text-muted-foreground">Log meals against your daily calories, protein, carbs and fat.</div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => navigate('/food')}>
            <Utensils className="h-4 w-4" /> Open
          </Button>
        </CardContent>
      </Card>

      {/* Always in reach, so the button doesn't sit three screens down on a phone (and above the bottom tab bar there). */}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-background/95 p-3 backdrop-blur sm:bottom-0">
        <div className="mx-auto max-w-3xl">
          <Button size="lg" className="w-full gap-2" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4" /> Start {TRIAL_DAYS}-day free trial
          </Button>
          <p className="mt-1.5 text-center text-[11px] leading-tight text-muted-foreground">{trialLine}</p>
        </div>
      </div>
    </div>
  )
}
