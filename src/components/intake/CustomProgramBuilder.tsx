import * as React from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ExercisePicker } from './ExercisePicker'
import { CustomExerciseDialog } from '@/components/program/CustomExerciseDialog'
import { ensureDays, exerciseIsValid } from '@/lib/backend/customProgram'
import type { Exercise, IntakeAnswers, ProgramDay } from '@/lib/types'

interface BuilderProps {
  answers: Partial<IntakeAnswers>
  update: <K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) => void
}

/**
 * "Build my own": one tab per training day. Each day has a name and a list of exercises the person adds from the exercise
 * library (by body part) or types in themselves, with sets and reps they can change, and a way to reorder or remove them.
 */
export function CustomProgramBuilder({ answers, update }: BuilderProps) {
  const count = answers.trainingDays ?? 3
  const days = React.useMemo(() => ensureDays(answers.customDays, count), [answers.customDays, count])
  const [active, setActive] = React.useState(0)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [typeOpen, setTypeOpen] = React.useState(false)

  // Keep the saved list exactly as long as the number of days chosen (days added or dropped if it changed)
  React.useEffect(() => {
    if (!answers.customDays || answers.customDays.length !== count) update('customDays', days)
  }, [answers.customDays, count, days, update])

  const dayIndex = Math.min(active, days.length - 1)
  const day = days[dayIndex]
  const setDay = (patch: Partial<ProgramDay>) => update('customDays', days.map((d, i) => (i === dayIndex ? { ...d, ...patch } : d)))
  const setExercises = (exercises: Exercise[]) => setDay({ exercises })
  const patchExercise = (i: number, patch: Partial<Exercise>) => setExercises(day.exercises.map((e, k) => (k === i ? { ...e, ...patch } : e)))
  const move = (i: number, by: number) => {
    const to = i + by
    if (to < 0 || to >= day.exercises.length) return
    const next = [...day.exercises]
    ;[next[i], next[to]] = [next[to], next[i]]
    setExercises(next)
  }
  const addExercise = async (exercise: Exercise) => {
    // read the latest list: the picker stays open, so several can be added one after the other
    setExercises([...day.exercises, exercise])
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">Build your days</h2>
        <p className="mt-1.5 font-body text-muted-foreground">
          Add exercises from the library, or type your own. Every day needs at least one.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Training days">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === dayIndex}
            onClick={() => setActive(i)}
            className={cn(
              'flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
              i === dayIndex ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50',
            )}
          >
            Day {i + 1}
            <span className={cn('rounded-full px-1.5 text-xs', d.exercises.length === 0 ? 'bg-destructive/15 text-destructive' : i === dayIndex ? 'bg-primary-foreground/20' : 'bg-muted')}>
              {d.exercises.length}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <label htmlFor="custom-day-name" className="text-sm font-semibold">
          Day name
        </label>
        <Input
          id="custom-day-name"
          value={day.name}
          maxLength={30}
          onChange={(e) => setDay({ name: e.target.value })}
          placeholder={`Day ${dayIndex + 1}`}
          className="mt-1.5"
        />
      </div>

      <ul className="space-y-3">
        {day.exercises.map((e, i) => (
          <li key={`${e.name}-${i}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-body text-sm font-bold leading-snug">{e.name}</div>
                {e.custom && <div className="text-xs text-muted-foreground">Your own exercise</div>}
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${e.name} up`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === day.exercises.length - 1} aria-label={`Move ${e.name} down`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setExercises(day.exercises.filter((_, k) => k !== i))} aria-label={`Remove ${e.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`sets-${dayIndex}-${i}`} className="text-xs font-semibold text-muted-foreground">
                  Sets
                </label>
                <Input
                  id={`sets-${dayIndex}-${i}`}
                  inputMode="numeric"
                  maxLength={2}
                  value={Number.isFinite(e.sets) && e.sets > 0 ? String(e.sets) : ''}
                  onChange={(ev) => patchExercise(i, { sets: Number(ev.target.value.replace(/\D/g, '')) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor={`reps-${dayIndex}-${i}`} className="text-xs font-semibold text-muted-foreground">
                  Reps
                </label>
                <Input id={`reps-${dayIndex}-${i}`} value={e.reps} maxLength={10} onChange={(ev) => patchExercise(i, { reps: ev.target.value })} className="mt-1" />
              </div>
            </div>
            {!exerciseIsValid(e) && <p className="mt-2 text-xs text-destructive">Sets should be 1 to 10. Reps like 10, 8-12 or 30 sec.</p>}
          </li>
        ))}
        {day.exercises.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No exercises on {day.name || `Day ${dayIndex + 1}`} yet.
          </li>
        )}
      </ul>

      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setPickerOpen(true)}>
        <Plus className="h-4 w-4" /> Add exercise
      </Button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        dayLabel={day.name || `Day ${dayIndex + 1}`}
        chosen={day.exercises.map((e) => e.name)}
        answers={{ goal: answers.goal ?? 'build-muscle', experience: answers.experience ?? '2-3' }}
        onAdd={addExercise}
        onTypeOwn={() => setTypeOpen(true)}
      />
      <CustomExerciseDialog
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        current={null}
        onSave={async (exercise) => {
          setExercises([...day.exercises, exercise])
        }}
      />
    </div>
  )
}
