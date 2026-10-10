import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, ClipboardList, History, Save } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExerciseCard } from './ExerciseCard'
import { sessions } from '@/lib/backend/api'
import { parseRestSeconds } from '@/lib/restTimer'
import { startRestTimer, stopRestTimer, type RestState } from '@/lib/restTimerStore'
import { buildLog, clearDraft, loadDraft, reconcileLog, saveDraft } from '@/lib/workoutLog'
import type { ExerciseLog, ProgramData, WorkoutSession } from '@/lib/types'

export function WeeklyPlanTab({
  program,
  programId,
  userId,
  activeDay,
  onActiveDayChange,
  onSwapExercise,
  hasProgressAccess,
}: {
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

  const day = program.days.find((d) => d.day === activeDay) ?? program.days[0]

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

  const handleSave = async () => {
    await sessions.save({
      userId,
      programId,
      day: day.day,
      dayName: day.name,
      date: new Date().toISOString(),
      exercises: log,
    })
    setHistory(await sessions.listForProgramDay(programId, day.day))
    setUserSessions(await sessions.listForUser(userId))
    clearDraft(programId, day.day)
    setLog(buildLog(day.exercises))
    setLoggingMode(false)
    stopRestTimer()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <Tabs value={String(activeDay)} onValueChange={(v) => onActiveDayChange(Number(v))}>
        <TabsList>
          {program.days.map((d) => (
            <TabsTrigger key={d.day} value={String(d.day)}>
              Day {d.day}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="font-display text-2xl tracking-wide">{day.name}</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {day.duration}
            </div>
            <Button
              size="sm"
              variant={loggingMode ? 'secondary' : 'outline'}
              className="gap-1.5"
              onClick={toggleLogging}
            >
              <ClipboardList className="h-4 w-4" />
              {loggingMode ? 'Cancel Log' : 'Log Workout'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize mb-6">{day.focus}</p>

        {justSaved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" /> Session saved to your history.
          </motion.div>
        )}

        {loggingMode && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-body text-muted-foreground">
              {completedSets}/{totalSets} {mindBody ? 'done' : 'sets logged'}
            </span>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
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
            />
          ))}
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <h4 className="flex items-center gap-2 font-body font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
              <History className="h-4 w-4" /> Session History
            </h4>
            <div className="space-y-2">
              {history.map((s) => {
                const done = s.exercises.reduce((sum, e) => sum + e.sets.filter((set) => set.completed).length, 0)
                const total = s.exercises.reduce((sum, e) => sum + e.sets.length, 0)
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <span className="text-muted-foreground">{new Date(s.date).toLocaleDateString()}</span>
                    <Badge variant={done === total ? 'success' : 'outline'}>
                      {done}/{total} {mindBody ? 'completed' : 'sets completed'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
