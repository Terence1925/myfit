import * as React from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, Check, Dumbbell, Flame, Play, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressRing } from '@/components/ui/progress-ring'
import { useAuth } from '@/context/AuthContext'
import { sessions } from '@/lib/backend/api'
import { allDoneMessage, greeting, pepTalk } from '@/lib/encouragement'
import { computeStreak, countedDates } from '@/lib/streak'
import { nextWorkoutDay, ringText, setsThisWeek, weekDots, workoutsThisMonth } from '@/lib/todayPlan'
import { liftedComparison } from '@/lib/lifted'
import type { WorkoutProgram, WorkoutSession } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * The first thing on the Workout page: a friendly greeting, this week at a glance, and one big button for the next
 * workout. It answers "what do I do now?" in a second.
 */
export function TodayCard({ program, userId, onStart }: { program: WorkoutProgram; userId: string; onStart: (day: number) => void }) {
  const { profile } = useAuth()
  const [saved, setSaved] = React.useState<WorkoutSession[] | null>(null)

  const refresh = React.useCallback(async () => {
    setSaved(await sessions.listForUser(userId))
  }, [userId])

  React.useEffect(() => {
    void refresh()
    window.addEventListener('myfit:session-saved', refresh)
    return () => window.removeEventListener('myfit:session-saved', refresh)
  }, [refresh])

  const days = program.programData.days
  const firstName = profile?.displayName?.trim().split(/\s+/)[0]
  const now = new Date()
  const list = saved ?? []

  const dots = weekDots(list, now)
  const nextDayNumber = nextWorkoutDay(list, program.id, days.map((d) => d.day), now)
  const next = days.find((d) => d.day === nextDayNumber)
  const streak = computeStreak(countedDates(list), days.length, now)
  const month = workoutsThisMonth(list, now)
  const sets = setsThisWeek(list, now)
  const ring = ringText(streak.doneThisWeek, streak.needed, days.length)
  const lifted = liftedComparison(list, now)
  const mindBody = next?.exercises.some((e) => e.format === 'yoga' || e.format === 'pilates')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-5 shadow-card sm:p-7"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <h2 className="font-display text-3xl tracking-wide sm:text-4xl">{greeting(firstName, now)}</h2>
        <p className="mt-0.5 font-body text-sm text-muted-foreground">{pepTalk(now)}</p>

        <div className="mt-5 flex items-center justify-between gap-1.5" aria-label="This week">
          {dots.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 360, damping: 20 }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold sm:h-10 sm:w-10',
                  d.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : d.isToday
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground',
                  d.future && !d.done && 'opacity-50',
                )}
              >
                {d.done ? <Check className="h-4 w-4" strokeWidth={3} /> : d.label}
              </motion.div>
              <span className={cn('text-[10px] font-semibold uppercase tracking-widest', d.isToday ? 'text-primary' : 'text-muted-foreground/70')}>
                {d.isToday ? 'Today' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-secondary/40 px-4 py-3">
          <ProgressRing value={Math.min(streak.doneThisWeek, days.length)} goal={days.length} label={ring.title} />
          <div className="min-w-0">
            <div className="font-body text-sm font-bold">{ring.title}</div>
            <div className="mt-0.5 font-body text-xs text-muted-foreground">{ring.note}</div>
          </div>
        </div>

        {next ? (
          <div className="mt-3 rounded-2xl border border-border bg-background/50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Next up · Day {next.day}</div>
            <div className="mt-1 font-display text-2xl tracking-wide">{next.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm capitalize text-muted-foreground">
              <span>{next.focus}</span>
              <span className="inline-flex items-center gap-1 normal-case">
                <Dumbbell className="h-3.5 w-3.5" /> {next.exercises.length} {mindBody ? 'moves' : 'exercises'}
              </span>
              <span className="normal-case">{next.duration}</span>
            </div>
            <Button
              size="lg"
              className="mt-4 w-full gap-2"
              onClick={() => onStart(next.day)}
            >
              <Play className="h-5 w-5 fill-current" /> Start workout
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <CalendarCheck className="h-8 w-8 shrink-0 text-primary" />
            <div className="font-body text-sm font-semibold">{allDoneMessage()}</div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Flame className={cn('h-4 w-4', streak.weeks > 0 ? 'fill-orange-500/40 text-orange-500' : 'text-muted-foreground')} />} value={`${streak.weeks}`} label={streak.weeks === 1 ? 'week streak' : 'week streak'} />
          <Stat icon={<CalendarCheck className="h-4 w-4 text-primary" />} value={`${month}`} label="this month" />
          <Stat icon={<Dumbbell className="h-4 w-4 text-primary" />} value={`${sets}`} label={mindBody ? 'moves this week' : 'sets this week'} />
        </div>
        {lifted.message && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5 font-body text-sm">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{lifted.message}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 px-2 py-2.5">
      <div className="flex items-center justify-center gap-1.5 font-display text-2xl leading-none">
        {icon}
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
