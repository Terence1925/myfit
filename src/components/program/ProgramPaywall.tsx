import * as React from 'react'
import { CalendarDays, Check, Lock, Moon, Sparkles, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useSubscribeSheet } from '@/context/SubscribeSheetContext'
import { WeeklyPlanTab } from './WeeklyPlanTab'
import { TRIAL_DAYS, hasSubscribedBefore } from '@/lib/billing'
import { useStorePrices } from '@/lib/storePrices'
import { goalLabelOf } from '@/lib/goalLabel'
import { firstNameOf } from '@/lib/displayName'
import type { Equipment, FocusArea, WorkoutProgram } from '@/lib/types'
import { BLOCK_WEEKS } from '@/lib/programBlock'

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  'full-gym': 'Full gym',
  'dumbbells-only': 'Dumbbells only',
  'home-workout': 'Home workout',
  calisthenics: 'Bodyweight',
  'resistance-bands': 'Resistance bands',
  yoga: 'Yoga',
  pilates: 'Pilates',
  custom: 'Custom plan',
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
 * Shown to people without an active subscription.
 * - A new member (never subscribed): the subscribe screen. Starting the free trial is how they subscribe.
 * - Someone whose trial or subscription ended: their plan stays on screen but blurred behind a lock, with one Subscribe button.
 * The food log stays free for everyone.
 */
export function ProgramPaywall({ program }: { program: WorkoutProgram }) {
  const navigate = useNavigate()
  const { openSubscribe } = useSubscribeSheet()
  const { profile } = useAuth()
  const { nutrition: n, answers } = program
  const data = program.programData
  const lapsed = hasSubscribedBefore(profile)
  const [activeDay, setActiveDay] = React.useState(1)
  const firstName = firstNameOf(profile?.displayName)
  const { prices, loading: pricesLoading } = useStorePrices(profile?.id)
  const subscribeLine = pricesLoading
    ? 'Renews automatically. Cancel any time in Settings.'
    : `${prices.monthly}/month or ${prices.yearly}/year. Renews automatically. Cancel any time in Settings.`

  const chips = [
    goalLabelOf(answers),
    EQUIPMENT_LABELS[answers.equipment],
    ...answers.focusAreas.map((f) => `${FOCUS_LABELS[f]} focus`),
    `${data.days.length} days / week`,
  ]

  // Trial or subscription ended: the plan is there but blurred and locked, with one Subscribe button
  if (lapsed) {
    return (
      <div className="container max-w-3xl py-8 pb-44 sm:py-12 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl">
          <div aria-hidden="true" inert className="pointer-events-none max-h-[68vh] select-none overflow-hidden blur-md">
            {profile && (
              <WeeklyPlanTab
                program={data}
                programId={program.id}
                userId={profile.id}
                activeDay={activeDay}
                onActiveDayChange={setActiveDay}
                onSwapExercise={async () => undefined}
                hasProgressAccess={false}
                demoLocked
                readOnly
                startedAt={program.createdAt}
              />
            )}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-start bg-background/40 px-6 pt-[202px] text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-glow-lg">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <p className="mt-3 max-w-xs font-body text-xs text-muted-foreground">Your plan is locked. Subscribe to open it again, log your workouts and keep your progress.</p>
            <Card className="mt-4 w-full text-left">
              <CardContent className="flex items-center justify-between gap-2 p-4">
                <div>
                  <div className="whitespace-nowrap font-body text-sm font-bold">Your food log is always free</div>
                  <div className="text-xs text-muted-foreground">Log meals against your calories, protein, carbs and fat.</div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5 px-3" onClick={() => navigate('/food')}>
                  <Utensils className="h-4 w-4" /> Open
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-background/95 p-3 backdrop-blur sm:bottom-0">
          <div className="mx-auto max-w-3xl">
            <Button size="lg" className="w-full" onClick={openSubscribe}>
              Subscribe
            </Button>
            <p className="mt-1.5 text-center text-[11px] leading-tight text-muted-foreground">{subscribeLine}</p>
          </div>
        </div>
      </div>
    )
  }

  // A new member: the subscribe screen
  return (
    <div className="container max-w-3xl py-10 pb-10 sm:py-14 sm:pb-10">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Built just for you</p>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          {firstName ? `${firstName}, your ${BLOCK_WEEKS}-week program is ready!` : `Your ${BLOCK_WEEKS}-week program is ready!`}
        </h1>
        <p className="mt-3 font-body text-sm text-foreground">
          {data.programName} — {data.tagline}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <Badge key={chip} variant="outline" className="text-foreground">
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
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Why this program fits you</div>
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

      <div className="mt-8 text-center">
        <Button size="lg" className="w-full" onClick={openSubscribe}>
          Start {TRIAL_DAYS}-day free trial
        </Button>
        <p className="mt-3 text-left text-xs leading-relaxed font-body text-muted-foreground">
          Log every workout with the rest timer, watch the demos, swap or add your own exercises, and see your progress history and charts. Food calorie tracker for free.
        </p>
      </div>

    </div>
  )
}

