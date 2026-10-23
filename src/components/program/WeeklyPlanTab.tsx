import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, ClipboardList, History, Save } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExerciseCard } from './ExerciseCard'
import { WeekTargetCard } from './WeekTargetCard'
import { blockStatus } from '@/lib/programBlock'
import { dayForWeek, suggestFor, weekTarget } from '@/lib/weekPlan'
import { warmupFor } from '@/lib/warmup'
import { sessions } from '@/lib/backend/api'
import { parseRestSeconds } from '@/lib/restTimer'
import { startRestTimer, stopRestTimer, type RestState } from '@/lib/restTimerStore'
import { buildLog, clearDraft, loadDraft, reconcileLog, saveDraft } from '@/lib/workoutLog'
import { dayProgress, historyRows } from '@/lib/streak'
import type { ExerciseLog, ProgramData, WorkoutSession } from '@/lib/types'

export function WeeklyPlanTab({
  program,
  programId,
  userId,
  activeDay,
  onActiveDayChange,
  onSwapExercise,
  hasProgressAccess,
  readOnly,
  startedAt,
}: {
  /** When the program was generated: it sets which week's targets show. Leave out to show the plan as written. */
  startedAt?: string
  /** A finished program is view only: no logging, no swapping. */
  readOnly?: boolean
  program: ProgramData
  programId: string
  userId: string
  activeDay: number
  onActiveDayChange: (day: number) => void
  onSwapExercise: (dayNumber: number, exerciseIndex: number, exerciseName: string, dayFocus: string) => Promise<void>
  hasProgressAccess: boolean
}) {
  const [swappingKey, setSwappingKey] = React.useState<string | null>(null)
  const [loggingMode, setLoggingMode] = React.useState(false)
  const loggingRef = React.useRef(false)
  loggingRef.current = loggingMode
  const [log, setLog] = React.useState<ExerciseLog[]>([])
  const [history, setHistory] = React.useState<WorkoutSession[]>([])
  const [userSessions, setUserSessions] = React.useState<WorkoutSession[]>([])
  const [justSaved, setJustSaved] = React.useState(false)

  // This week's targets (effort, aim for each exercise, half the sets in the deload week). A finished program is shown as written.
  const target = startedAt && !readOnly ? weekTarget(blockStatus(startedAt).week) : null
  const planned = program.days.find((d) => d.day === activeDay) ?? program.days[0]
  const day = target ? dayForWeek(planned, target) : planned
  const suggestions = day.exercises.map((ex, i) => (target ? suggestFor(userSessions, ex, target, { main: i < 2 }) : null))

  const startRest = (exerciseIndex: number, setIndex: number) => {
    const ex = day.exercises[exerciseIndex]
    // No rest timer for yoga or Pilates: they flow from one move to the next.
    if (ex && (ex.format === 'yoga' || ex.format === 'pilates')) return
    // No rest after the last set of an exercise — you're moving on to the next one.
    if (!ex || setIndex + 1 >= ex.sets) {
      stopRestTimer()
      return
    }
    const totalSeconds = parseRestSeconds(ex.rest)
    const next: RestState = {
      endsAt: Date.now() + totalSeconds * 1000,
      totalSeconds,
      nextLabel: `start set ${setIndex + 2}`,
      exerciseName: ex.name,
    }
    startRestTimer(next)
  }

  // What the log screen currently shows, and for which program + day, so the effect below can tell a real
  // change of day from the program simply being re-delivered with the same contents.
  const logKeyRef = React.useRef<string | null>(null)
  const logRef = React.useRef<ExerciseLog[]>([])
  logRef.current = log
  const exerciseSignature = day.exercises.map((e) => `${e.name}:${e.sets}`).join('|')

  React.useEffect(() => {
    const key = `${programId}:${day.day}`
    if (logKeyRef.current !== key) {
      // A different day or program (or first open): pick up an unsaved workout if there is one.
      logKeyRef.current = key
      const draft = loadDraft(programId, day.day)
      setLog(reconcileLog(day.exercises, draft))
      setLoggingMode(draft !== null)
      setJustSaved(false)
    } else if (logRef.current.length > 0) {
      // Same day, but the exercises changed (a swap): keep what was already typed for the rest.
      // (Skipped while the log has not been set up yet, so a restored draft is never overwritten.)
      const next = reconcileLog(day.exercises, logRef.current)
      setLog(next)
      if (loggingRef.current) saveDraft(programId, day.day, next)
    }
    // Keyed on stable values on purpose, not on the `day` object (see logKeyRef above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, day.day, exerciseSignature])

  React.useEffect(() => {
    let cancelled = false
    sessions.listForProgramDay(programId, day.day).then((h) => {
      if (!cancelled) setHistory(h)
    })
    return () => {
      cancelled = true
    }
  }, [programId, day.day])

  React.useEffect(() => {
    let cancelled = false
    sessions.listForUser(userId).then((s) => {
      if (!cancelled) setUserSessions(s)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleSwap = async (exerciseIndex: number, exerciseName: string) => {
    const key = `${day.day}-${exerciseIndex}`
    setSwappingKey(key)
    try {
      await onSwapExercise(day.day, exerciseIndex, exerciseName, day.focus)
    } finally {
      setSwappingKey(null)
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: number | boolean) => {
    if (field === 'completed' && value === true) startRest(exerciseIndex, setIndex)
    const next = log.map((exLog, i) =>
      i !== exerciseIndex
        ? exLog
        : {
            ...exLog,
            sets: exLog.sets.map((s, si) => (si !== setIndex ? s : { ...s, [field]: value })),
          },
    )
    setLog(next)
    // Saved as you type, so leaving the app (or Android reloading it) does not lose the workout.
    saveDraft(programId, day.day, next)
  }

  const toggleLogging = () => {
    if (loggingMode) {
      // Cancel: forget the unsaved entries.
      stopRestTimer()
      clearDraft(programId, day.day)
      setLog(buildLog(day.exercises))
      setLoggingMode(false)
    } else {
      saveDraft(programId, day.day, log)
      setLoggingMode(true)
    }
  }

  const mindBody = day.exercises.some((e) => e.format === 'yoga' || e.format === 'pilates')
  const totalSets = log.reduce((sum, e) => sum + e.sets.length, 0)
  const completedSets = log.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0)

  const today = new Date().toDateString()
  // Everything saved for this day today, added up (saving exercise by exercise works: the sets add together).
  // "Mark as done" with one tap shows up as a save with no exercises.
  const todayProgress = dayProgress(history.filter((h) => new Date(h.date).toDateString() === today))
  const doneToday = todayProgress.counts
  const [markingDone, setMarkingDone] = React.useState(false)

  const afterSessionSaved = async () => {
    setHistory(await sessions.listForProgramDay(programId, day.day))
    setUserSessions(await sessions.listForUser(userId))
    // Lets the streak card and the workout reminders update straight away
    window.dispatchEvent(new Event('myfit:session-saved'))
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  const handleMarkDone = async () => {
    if (markingDone || doneToday) return
    setMarkingDone(true)
    try {
      await sessions.save({ userId, programId, day: day.day, dayName: day.name, date: new Date().toISOString(), exercises: [] })
      await afterSessionSaved()
    } finally {
      setMarkingDone(false)
    }
  }

  const handleSave = async () => {
    // An empty log is not a workout: at least one set has to be ticked
    if (completedSets === 0) return
    await sessions.save({
      userId,
      programId,
      day: day.day,
      dayName: day.name,
      date: new Date().toISOString(),
      exercises: log,
    })
    clearDraft(programId, day.day)
    setLog(buildLog(day.exercises))
    setLoggingMode(false)
    stopRestTimer()
    await afterSessionSaved()
  }

  return (
    <div className="space-y-6">
      {/* A one-day view (the free Day 1) needs no day picker */}
      {program.days.length > 1 && (
        <Tabs value={String(activeDay)} onValueChange={(v) => onActiveDayChange(Number(v))}>
          <TabsList>
            {program.days.map((d) => (
              <TabsTrigger key={d.day} value={String(d.day)}>
                Day {d.day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {target && <WeekTargetCard target={target} />}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="font-display text-2xl tracking-wide">{day.name}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {day.duration}
            </div>
            {!readOnly && (
              <Button
                size="sm"
                variant={loggingMode ? 'secondary' : 'outline'}
                className="gap-1.5"
                onClick={toggleLogging}
              >
                <ClipboardList className="h-4 w-4" />
                {loggingMode ? 'Cancel Log' : 'Log Workout'}
              </Button>
            )}
            {!readOnly && !loggingMode &&
              (doneToday ? (
                <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Done today
                </span>
              ) : (
                <>
                  {todayProgress.done > 0 && (
                    <span className="inline-flex h-9 items-center rounded-md border border-border bg-secondary/50 px-3 text-sm font-semibold text-muted-foreground">
                      Started: {todayProgress.done} of {todayProgress.planned} {mindBody ? 'done' : 'sets'}
                    </span>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleMarkDone} disabled={markingDone}>
                    <CheckCircle2 className="h-4 w-4" /> Mark as done
                  </Button>
                </>
              ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize mb-6">{day.focus}</p>

        {justSaved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" /> Workout saved.
          </motion.div>
        )}

        {loggingMode && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-body text-muted-foreground">
              {completedSets}/{totalSets} {mindBody ? 'done' : 'sets logged'}
              {completedSets === 0 && <span className="block text-xs">{mindBody ? 'Tick at least one to save.' : 'Tick at least one set to save.'}</span>}
            </span>
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={completedSets === 0}>
              <Save className="h-3.5 w-3.5" /> Save Session
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {day.exercises.map((ex, i) => (
            <ExerciseCard
              key={`${day.day}-${i}-${ex.name}`}
              exercise={ex}
              index={i}
              swapping={swappingKey === `${day.day}-${i}`}
              onSwap={() => handleSwap(i, ex.name)}
              logging={loggingMode}
              setLogs={log[i]?.sets}
              onSetChange={(setIndex, field, value) => updateSet(i, setIndex, field, value)}
              userSessions={userSessions}
              hasProgressAccess={hasProgressAccess}
              readOnly={readOnly}
              suggestion={suggestions[i]}
              warmup={target ? warmupFor(day.exercises, i, suggestions[i]?.weight, target) : null}
            />
          ))}
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <h4 className="flex items-center gap-2 font-body font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
              <History className="h-4 w-4" /> Session History
            </h4>
            <div className="space-y-2">
              {historyRows(history).map((row) => (
                <div key={row.date} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span className="text-muted-foreground">{new Date(row.date).toLocaleDateString()}</span>
                  {row.markedDone ? (
                    <Badge variant="success">Marked as done</Badge>
                  ) : (
                    <Badge variant={row.done === row.planned ? 'success' : 'outline'}>
                      {row.done}/{row.planned} {mindBody ? 'completed' : 'sets completed'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
