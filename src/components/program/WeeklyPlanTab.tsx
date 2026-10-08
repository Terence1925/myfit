import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Clock, ClipboardList, History, Save } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExerciseCard } from './ExerciseCard'
import { RestTimerBar, type RestState } from './RestTimerBar'
import { sessions } from '@/lib/backend/api'
import { cancelRestAlert, parseRestSeconds, scheduleRestAlert } from '@/lib/restTimer'
import type { ExerciseLog, ProgramData, WorkoutSession } from '@/lib/types'

function buildLog(exercises: ProgramData['days'][number]['exercises']): ExerciseLog[] {
  return exercises.map((ex) => ({
    name: ex.name,
    sets: Array.from({ length: ex.sets }, (_, i) => ({
      setNumber: i + 1,
      weight: null,
      reps: null,
      completed: false,
    })),
  }))
}

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
  const [log, setLog] = React.useState<ExerciseLog[]>([])
  const [history, setHistory] = React.useState<WorkoutSession[]>([])
  const [userSessions, setUserSessions] = React.useState<WorkoutSession[]>([])
  const [justSaved, setJustSaved] = React.useState(false)
  const [rest, setRest] = React.useState<RestState | null>(null)

  const day = program.days.find((d) => d.day === activeDay) ?? program.days[0]

  const stopRest = React.useCallback(() => {
    setRest(null)
    void cancelRestAlert()
  }, [])

  // Don't leave a phone alert scheduled if the user navigates away mid-rest.
  React.useEffect(() => () => void cancelRestAlert(), [])

  React.useEffect(() => {
    if (!loggingMode) stopRest()
  }, [loggingMode, stopRest])

  const startRest = (exerciseIndex: number, setIndex: number) => {
    const ex = day.exercises[exerciseIndex]
    // No rest after the last set of an exercise — you're moving on to the next one.
    if (!ex || setIndex + 1 >= ex.sets) {
      stopRest()
      return
    }
    const totalSeconds = parseRestSeconds(ex.rest)
    const next: RestState = {
      endsAt: Date.now() + totalSeconds * 1000,
      totalSeconds,
      nextLabel: `start set ${setIndex + 2}`,
      exerciseName: ex.name,
    }
    setRest(next)
    void scheduleRestAlert(next.endsAt, `Rest over — ${next.nextLabel}`, ex.name)
  }

  const addRestTime = () => {
    if (!rest) return
    const next = { ...rest, endsAt: Math.max(rest.endsAt, Date.now()) + 15_000, totalSeconds: rest.totalSeconds + 15 }
    setRest(next)
    void scheduleRestAlert(next.endsAt, `Rest over — ${next.nextLabel}`, next.exerciseName)
  }

  React.useEffect(() => {
    let cancelled = false
    setLog(buildLog(day.exercises))
    setLoggingMode(false)
    setJustSaved(false)
    stopRest()
    sessions.listForProgramDay(programId, day.day).then((h) => {
      if (!cancelled) setHistory(h)
    })
    return () => {
      cancelled = true
    }
  }, [day, programId, stopRest])

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
    setLog((prev) =>
      prev.map((exLog, i) =>
        i !== exerciseIndex
          ? exLog
          : {
              ...exLog,
              sets: exLog.sets.map((s, si) => (si !== setIndex ? s : { ...s, [field]: value })),
            },
      ),
    )
  }

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
    setLog(buildLog(day.exercises))
    setLoggingMode(false)
    stopRest()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  return (
    <div className={rest ? 'space-y-6 pb-40' : 'space-y-6'}>
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
              onClick={() => setLoggingMode((v) => !v)}
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
              {completedSets}/{totalSets} sets logged
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
                      {done}/{total} sets completed
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {rest && <RestTimerBar key={rest.exerciseName + rest.nextLabel} rest={rest} onAddTime={addRestTime} onSkip={stopRest} />}
      </AnimatePresence>
    </div>
  )
}
