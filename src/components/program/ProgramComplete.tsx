import * as React from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, Dumbbell, Eye, PartyPopper, Plus, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sessions } from '@/lib/backend/api'
import { formatLbs } from '@/lib/lifted'
import { BLOCK_WEEKS, COMPLETE_NOTE, blockStatus } from '@/lib/programBlock'
import { countedDates } from '@/lib/streak'
import type { WorkoutProgram, WorkoutSession } from '@/lib/types'
import { BlockBars } from './BlockTimeline'

/** Shown when a program has finished its 12 weeks and the deload week: a short summary and the way to the next program. */
export function ProgramComplete({
  program,
  userId,
  onGenerate,
  onView,
}: {
  program: WorkoutProgram
  userId: string
  onGenerate: () => void
  onView: () => void
}) {
  const [saved, setSaved] = React.useState<WorkoutSession[] | null>(null)
  React.useEffect(() => {
    let cancelled = false
    sessions
      .listForUser(userId)
      .then((s) => !cancelled && setSaved(s.filter((x) => x.programId === program.id)))
      .catch(() => !cancelled && setSaved([]))
    return () => {
      cancelled = true
    }
  }, [userId, program.id])

  const list = saved ?? []
  const workouts = countedDates(list).length
  let sets = 0
  let volume = 0
  for (const s of list)
    for (const e of s.exercises)
      for (const x of e.sets)
        if (x.completed) {
          sets++
          volume += (x.weight ?? 0) * (x.reps ?? 0)
        }

  const tiles = [
    { icon: <CalendarCheck className="h-4 w-4" />, value: String(workouts), label: workouts === 1 ? 'workout done' : 'workouts done' },
    { icon: <Dumbbell className="h-4 w-4" />, value: String(sets), label: 'sets done' },
    { icon: <Scale className="h-4 w-4" />, value: volume > 0 ? formatLbs(Math.round(volume)) : '0', label: 'lbs lifted' },
  ]

  return (
    <div className="container max-w-xl py-10 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-glow-lg">
          <PartyPopper className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{program.programName}</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">{BLOCK_WEEKS} WEEKS DONE</h1>
        <p className="mx-auto mt-3 max-w-md font-body text-muted-foreground">
          {COMPLETE_NOTE} Your next program will use what you learned here, with your updated weight and goal.
        </p>
      </motion.div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <BlockBars status={blockStatus(program.createdAt)} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-secondary/50 px-2 py-3">
              <div className="flex items-center justify-center gap-1.5 font-display text-2xl leading-none text-primary">
                {t.icon}
                {t.value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button size="lg" className="w-full gap-2" onClick={onGenerate}>
          <Plus className="h-5 w-5" /> Generate your next {BLOCK_WEEKS} weeks
        </Button>
        <Button size="lg" variant="outline" className="w-full gap-2" onClick={onView}>
          <Eye className="h-5 w-5" /> Look back at this program
        </Button>
      </div>
    </div>
  )
}
