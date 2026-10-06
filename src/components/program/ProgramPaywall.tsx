import { motion } from 'framer-motion'
import { Crown, Flame, Lock, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GOAL_LABELS } from '@/lib/tdee'
import type { WorkoutProgram } from '@/lib/types'

/** Shown to non-subscribers once their program is built: enough to see it's personal, not enough to use. */
export function ProgramPaywall({ program }: { program: WorkoutProgram }) {
  const navigate = useNavigate()
  const { programData: p, nutrition: n } = program

  return (
    <div className="container py-10 sm:py-14 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
          <Lock className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {GOAL_LABELS[program.answers.goal]}
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl tracking-wide text-gradient-gold">
          YOUR PROGRAM IS READY
        </h1>
        <p className="mt-3 font-body text-muted-foreground">{p.programName} — {p.tagline}</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Crown, label: 'Training days', value: `${p.days.length} / week` },
          { icon: Flame, label: 'Daily target', value: `${n.calorieTarget} kcal` },
          { icon: Moon, label: 'Recovery score', value: `${n.recoveryScore} / 100` },
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

      <div className="mt-6 space-y-2">
        {p.days.map((day) => (
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

      <div className="mt-8 text-center">
        <Button size="lg" className="gap-2" onClick={() => navigate('/pricing')}>
          <Crown className="h-4 w-4" /> Unlock My Program
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Full exercises, sets and reps, nutrition plan, recovery plan, and progress tracking.
        </p>
      </div>
    </div>
  )
}
