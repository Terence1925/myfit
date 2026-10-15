import { motion } from 'framer-motion'
import { BellRing, Check, Crown, Flame, Lock, Moon, Sparkles, Utensils } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { PRO_PRICES, TRIAL_DAYS } from '@/lib/billing'
import { storeName } from '@/lib/platform'
import { GOAL_LABELS } from '@/lib/tdee'
import type { Equipment, FocusArea, WorkoutProgram } from '@/lib/types'

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

// Warm-up style moves are a weak first impression; lead the sneak peek with the main lifts.
const FILLER_MOVE = /crunch|plank|sit-?up|leg raise|twist|dead bug|bird dog|mountain climber|hollow|russian/i

/** Keep a note to its first clause so it reads as one line on a phone. */
function shortNote(note: string): string {
  const first = note.split(' — ')[0].trim()
  return /[.!?]$/.test(first) ? first : `${first}.`
}

/** Shown to non-subscribers once their program is built: enough to see it's personal, not enough to use. */
export function ProgramPaywall({ program }: { program: WorkoutProgram }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { programData: p, nutrition: n, answers } = program
  const firstName = profile?.displayName?.trim().split(/\s+/)[0]
  const firstDay = p.days[0]
  const peek = firstDay
    ? [...firstDay.exercises.filter((ex) => !FILLER_MOVE.test(ex.name)), ...firstDay.exercises.filter((ex) => FILLER_MOVE.test(ex.name))].slice(0, 3)
    : []
  const monthly = PRO_PRICES.monthly
  const yearly = PRO_PRICES.yearly

  const chips = [
    GOAL_LABELS[answers.goal],
    EQUIPMENT_LABELS[answers.equipment],
    ...answers.focusAreas.map((f) => `${FOCUS_LABELS[f]} focus`),
    `${p.days.length} days / week`,
  ]

  return (
    <div className="container max-w-3xl py-10 pb-28 sm:py-14 sm:pb-28">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Built just for you</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-gradient-gold">
          {firstName ? `${firstName.toUpperCase()}, YOUR PROGRAM IS READY` : 'YOUR PROGRAM IS READY'}
        </h1>
        <p className="mt-3 font-body text-muted-foreground">
          {p.programName} — {p.tagline}
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
          { icon: Crown, label: 'Training days', value: `${p.days.length} / week` },
          { icon: Flame, label: 'Daily target', value: `${n.calorieTarget} kcal` },
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

      {p.personalizationNotes.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-4 w-4" /> Why this program fits you
            </div>
            <ul className="mt-3 space-y-2">
              {p.personalizationNotes.slice(0, 3).map((note) => (
                <li key={note} className="flex gap-2 font-body text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{shortNote(note)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {firstDay && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
              Sneak peek · Day {firstDay.day}
            </div>
            <div className="mt-1 font-body font-bold">{firstDay.name}</div>
            <div className="text-xs text-muted-foreground">{firstDay.duration}</div>
            <div className="mt-3 space-y-2">
              {peek.map((ex) => (
                <div key={ex.name} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                  <span className="truncate font-body text-sm font-semibold">{ex.name}</span>
                  <span className="flex shrink-0 select-none items-center gap-1 text-xs text-muted-foreground blur-[3px]">
                    {ex.sets} × {ex.reps}
                  </span>
                </div>
              ))}
              {firstDay.exercises.length > 3 && (
                <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> +{firstDay.exercises.length - 3} more exercises
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 space-y-2">
        {p.days.slice(1).map((day) => (
          <div
            key={day.day}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Day {day.day}</div>
              <div className="truncate font-body font-bold">{day.name}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span>{day.exercises.length} exercises</span>
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="p-5 text-center">
          <div className="font-display text-2xl tracking-wide">START YOUR {TRIAL_DAYS}-DAY FREE TRIAL</div>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Then {monthly.priceLabel}/month or {yearly.priceLabel}/year ({yearly.savingsLabel?.toLowerCase()}). Cancel anytime
            in {storeName()}.
          </p>
          <Button size="lg" className="mt-4 w-full gap-2 sm:w-auto" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4" /> Unlock My Program
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <BellRing className="h-3.5 w-3.5" /> We remind you 1 day before your trial ends, so you're never surprised.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Includes full exercises, sets and reps, nutrition plan, recovery plan, and progress tracking.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="font-body text-sm font-bold">Track your food, free</div>
            <div className="text-xs text-muted-foreground">Log meals against your daily calories and macros.</div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => navigate('/food')}>
            <Utensils className="h-4 w-4" /> Open
          </Button>
        </CardContent>
      </Card>

      {/* Always in reach, so the button doesn't sit three screens down on a phone. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Button size="lg" className="w-full gap-2" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4" /> Start {TRIAL_DAYS}-day free trial
          </Button>
        </div>
      </div>
    </div>
  )
}
