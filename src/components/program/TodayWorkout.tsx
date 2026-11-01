import * as React from 'react'
import { ExerciseCard } from './ExerciseCard'
import { sessions } from '@/lib/backend/api'
import { blockStatus } from '@/lib/programBlock'
import { dayForWeek, suggestFor, weekTarget } from '@/lib/weekPlan'
import { warmupFor } from '@/lib/warmup'
import { buildLog, clearDraft, loadDraft, reconcileLog, saveDraft } from '@/lib/workoutLog'
import { dayProgress } from '@/lib/streak'
import { parseRestSeconds } from '@/lib/restTimer'
import { startRestTimer, stopRestTimer } from '@/lib/restTimerStore'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Save } from 'lucide-react'
import { useWeightUnit } from '@/lib/weightUnit'
import { cn } from '@/lib/utils'
import type { ExerciseLog, WorkoutProgram, WorkoutSession } from '@/lib/types'

/**
 * Today's workout on the Home screen, one exercise per page. Swipe sideways like an Instagram post; the dots show
 * where you are. Only the chosen day is shown, never the whole program. Sets are logged here (saved as you type,
 * with the rest timer), and Save session adds the workout to the week.
 */
export function TodayWorkout({ program, userId, dayNumber }: { program: WorkoutProgram; userId: string; dayNumber: number }) {
  const [unit] = useWeightUnit()
  const planned = program.programData.days.find((d) => d.day === dayNumber)
  const block = blockStatus(program.createdAt)
  const target = weekTarget(block.week)
  const day = planned ? dayForWeek(planned, target) : null
  const [userSessions, setUserSessions] = React.useState<WorkoutSession[]>([])
  const [log, setLog] = React.useState<ExerciseLog[]>(() => (day ? reconcileLog(day.exercises, loadDraft(program.id, day.day)) : []))
  const [todays, setTodays] = React.useState<WorkoutSession[]>([])
  const [justSaved, setJustSaved] = React.useState(false)
  const [page, setPage] = React.useState(0)
  const scroller = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let cancelled = false
    sessions.listForUser(userId).then((s) => {
      if (!cancelled) setUserSessions(s)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const refreshToday = React.useCallback(async () => {
    setTodays(await sessions.listForProgramDay(program.id, dayNumber))
  }, [program.id, dayNumber])
  React.useEffect(() => {
    void refreshToday()
  }, [refreshToday])

  // The section is only as tall as the page you are on, so a short exercise does not leave a gap below it
  const [height, setHeight] = React.useState<number | undefined>(undefined)
  const pageCount = day?.exercises.length ?? 0
  React.useEffect(() => {
    const slide = scroller.current?.children[page] as HTMLElement | undefined
    if (!slide) return
    const update = () => setHeight(slide.offsetHeight)
    update()
    const watcher = new ResizeObserver(update)
    watcher.observe(slide)
    return () => watcher.disconnect()
  }, [page, pageCount])

  if (!day) return null
  const count = day.exercises.length
  const suggestions = day.exercises.map((ex, i) => suggestFor(userSessions, ex, target, { main: i < 2, unit }))

  const startRest = (exerciseIndex: number, setIndex: number) => {
    const ex = day.exercises[exerciseIndex]
    if (ex && (ex.format === 'yoga' || ex.format === 'pilates')) return
    // No rest after the last set of an exercise: you are moving on to the next one
    if (!ex || setIndex + 1 >= ex.sets) {
      stopRestTimer()
      return
    }
    const totalSeconds = parseRestSeconds(ex.rest)
    startRestTimer({ endsAt: Date.now() + totalSeconds * 1000, totalSeconds, nextLabel: `start set ${setIndex + 2}`, exerciseName: ex.name })
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: number | boolean) => {
    if (field === 'completed' && value === true) startRest(exerciseIndex, setIndex)
    const next = log.map((exLog, i) =>
      i !== exerciseIndex ? exLog : { ...exLog, sets: exLog.sets.map((s, si) => (si !== setIndex ? s : { ...s, [field]: value })) },
    )
    setLog(next)
    // Saved as you type, so leaving the app does not lose the workout
    saveDraft(program.id, day.day, next)
  }

  const totalSets = log.reduce((sum, e) => sum + e.sets.length, 0)
  const completedSets = log.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0)
  const mindBody = day.exercises.some((e) => e.format === 'yoga' || e.format === 'pilates')
  const doneToday = dayProgress(todays.filter((h) => new Date(h.date).toDateString() === new Date().toDateString())).counts

  const handleSave = async () => {
    if (completedSets === 0) return
    await sessions.save({ userId, programId: program.id, day: day.day, dayName: day.name, date: new Date().toISOString(), exercises: log })
    clearDraft(program.id, day.day)
    setLog(buildLog(day.exercises))
    stopRestTimer()
    await refreshToday()
    setUserSessions(await sessions.listForUser(userId))
    // Lets the week counter, streak and workout reminders update straight away
    window.dispatchEvent(new Event('myfit:session-saved'))
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  // The pages are a little further apart than the screen is wide (there is a gap between them), so work from the pages themselves
  const goTo = (i: number) => {
    const slide = scroller.current?.children[i] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <section id="today-workout" aria-label={`Day ${day.day}: ${day.name}`} className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Day {day.day}</div>
          <h2 className="truncate font-display text-2xl tracking-wide">{day.name}</h2>
        </div>
        <span className="sr-only" aria-live="polite">
          Exercise {page + 1} of {count}
        </span>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget
          const second = el.children[1] as HTMLElement | undefined
          const pitch = second ? second.offsetLeft - (el.children[0] as HTMLElement).offsetLeft : el.clientWidth
          setPage(Math.round(el.scrollLeft / pitch))
        }}
        style={{ height }}
        className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overflow-y-hidden transition-[height] duration-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {day.exercises.map((ex, i) => (
          <div key={`${day.day}-${i}-${ex.name}`} className="w-full shrink-0 snap-center snap-always">
            <ExerciseCard
              exercise={ex}
              index={i}
              swapping={false}
              onSwap={() => undefined}
              readOnly
              logging
              setLogs={log[i]?.sets}
              onSetChange={(setIndex, field, value) => updateSet(i, setIndex, field, value)}
              userSessions={userSessions}
              hasProgressAccess
              suggestion={suggestions[i]}
              warmup={warmupFor(day.exercises, i, suggestions[i]?.weight, target, unit)}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
        <span className="text-sm text-muted-foreground">
          {doneToday ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Done today
            </span>
          ) : justSaved ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Workout saved
            </span>
          ) : (
            <>
              {completedSets}/{totalSets} {mindBody ? 'done' : 'sets logged'}
            </>
          )}
        </span>
        <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={completedSets === 0}>
          <Save className="h-3.5 w-3.5" /> Save session
        </Button>
      </div>

      {/* Instagram-style dots under the pages: the current one is coloured, and the dots shrink the further away they are.
          They stay just above the bottom bar while the workout is on screen. */}
      <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 mt-4 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-2 shadow-sm backdrop-blur" role="tablist" aria-label="Exercises">
          {day.exercises.map((ex, i) => {
            const distance = Math.abs(i - page)
            const size = distance <= 2 ? 8 : distance === 3 ? 6 : 4
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Exercise ${i + 1}: ${ex.name}`}
                onClick={() => goTo(i)}
                style={{ width: size, height: size }}
                className={cn('rounded-full transition-all', i === page ? 'bg-primary' : 'bg-foreground/25')}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
