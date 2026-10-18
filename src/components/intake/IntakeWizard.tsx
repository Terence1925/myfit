import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Flame,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ChoiceGrid, MultiChoiceGrid, type ChoiceOption } from './ChoiceGrid'
import { cn } from '@/lib/utils'
import type { IntakeAnswers } from '@/lib/types'
import { disciplineOf, isMindBody } from '@/lib/discipline'
import { MIND_BODY_DAY_OPTIONS, MIND_BODY_STYLE_BY_ID, stylesFor, weekdaysFor } from '@/lib/backend/mindBodyStyles'


const DEFAULT_ANSWERS: Partial<IntakeAnswers> = {
  weightUnit: 'lbs',
  focusAreas: [],
}

interface StepProps {
  answers: Partial<IntakeAnswers>
  update: <K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) => void
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">{title}</h2>
        <p className="mt-1.5 font-body text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Step1Sex({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ]
  return (
    <StepShell title="Biological Sex" subtitle="Used to calculate your BMR accurately.">
      <ChoiceGrid options={options} value={answers.sex} onChange={(v) => update('sex', v as IntakeAnswers['sex'])} />
    </StepShell>
  )
}

function Step2Age({ answers, update }: StepProps) {
  return (
    <StepShell title="Your Age" subtitle="Between 16 and 80 years old.">
      <div className="max-w-xs">
        <Label htmlFor="age">Age (years)</Label>
        <Input
          id="age"
          type="number"
          min={16}
          max={80}
          value={answers.age ?? ''}
          onChange={(e) => update('age', Number(e.target.value))}
          className="mt-2 text-lg h-14"
          placeholder="e.g. 28"
        />
      </div>
    </StepShell>
  )
}

function Step3Weight({ answers, update }: StepProps) {
  const unit = answers.weightUnit ?? 'lbs'
  return (
    <StepShell title="Current Weight" subtitle="We'll use this for your calorie and macro targets.">
      <div className="max-w-sm space-y-4">
        <div className="inline-flex rounded-lg border border-border p-1">
          {(['lbs', 'kg'] as const).map((u) => (
            <button
              key={u}
              onClick={() => update('weightUnit', u)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold transition-colors',
                unit === u ? 'bg-gold-gradient text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={0}
          value={answers.weight ?? ''}
          onChange={(e) => update('weight', Number(e.target.value))}
          className="text-lg h-14"
          placeholder={unit === 'lbs' ? 'e.g. 165' : 'e.g. 75'}
        />
      </div>
    </StepShell>
  )
}

function Step4Height({ answers, update }: StepProps) {
  return (
    <StepShell title="Your Height" subtitle="Feet and inches.">
      <div className="flex max-w-sm gap-4">
        <div className="flex-1">
          <Label>Feet</Label>
          <Input
            type="number"
            min={3}
            max={8}
            value={answers.heightFeet ?? ''}
            onChange={(e) => update('heightFeet', Number(e.target.value))}
            className="mt-2 text-lg h-14"
            placeholder="5"
          />
        </div>
        <div className="flex-1">
          <Label>Inches</Label>
          <Input
            type="number"
            min={0}
            max={11}
            value={answers.heightInches ?? ''}
            onChange={(e) => update('heightInches', Number(e.target.value))}
            className="mt-2 text-lg h-14"
            placeholder="10"
          />
        </div>
      </div>
    </StepShell>
  )
}

function Step5Experience({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: '0-1', label: 'Beginner', description: '0-1 years training' },
    { value: '2-3', label: 'Intermediate', description: '2-3 years training' },
    { value: '3-5', label: 'Advanced', description: '3-5 years training' },
    { value: '5+', label: 'Elite', description: '5+ years training' },
  ]
  return (
    <StepShell title="Training Experience" subtitle="How long have you been training with intent?">
      <ChoiceGrid
        options={options}
        value={answers.experience}
        onChange={(v) => update('experience', v as IntakeAnswers['experience'])}
      />
    </StepShell>
  )
}

function Step6Activity({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: 'sedentary', label: 'Sedentary', description: 'Desk job, little movement' },
    { value: 'light', label: 'Lightly Active', description: 'Light exercise 1-3 days/wk' },
    { value: 'moderate', label: 'Moderately Active', description: 'On your feet most of the day' },
    { value: 'active', label: 'Active', description: 'Physical job or daily training' },
    { value: 'athlete', label: 'Athlete', description: 'Intense daily training' },
  ]
  return (
    <StepShell title="Daily Activity" subtitle="Outside of the gym — how much do you move day to day?">
      <ChoiceGrid
        options={options}
        value={answers.activityLevel}
        onChange={(v) => update('activityLevel', v as IntakeAnswers['activityLevel'])}
        columns={1}
      />
    </StepShell>
  )
}

function Step7Sleep({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: '<5', label: '< 5 hours' },
    { value: '5-6', label: '5-6 hours' },
    { value: '6-7', label: '6-7 hours' },
    { value: '7-8', label: '7-8 hours' },
    { value: '8+', label: '8+ hours' },
  ]
  return (
    <StepShell title="Sleep Duration" subtitle="Average hours of sleep per night.">
      <ChoiceGrid
        options={options}
        value={answers.sleepHours}
        onChange={(v) => update('sleepHours', v as IntakeAnswers['sleepHours'])}
        columns={3}
      />
    </StepShell>
  )
}

function Step8SleepQuality({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ]
  return (
    <StepShell title="Sleep Quality" subtitle="How rested do you generally feel?">
      <ChoiceGrid
        options={options}
        value={answers.sleepQuality}
        onChange={(v) => update('sleepQuality', v as IntakeAnswers['sleepQuality'])}
      />
    </StepShell>
  )
}

function Step9Stress({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' },
    { value: 'very-high', label: 'Very High' },
  ]
  return (
    <StepShell title="Daily Stress" subtitle="Your typical day-to-day stress level.">
      <ChoiceGrid
        options={options}
        value={answers.stressLevel}
        onChange={(v) => update('stressLevel', v as IntakeAnswers['stressLevel'])}
      />
    </StepShell>
  )
}

/** Yoga and Pilates: pick the kind of session (a style) instead of a lifting level. */
function StepStyle({ answers, update }: StepProps) {
  const discipline = disciplineOf(answers.equipment ?? '') === 'pilates' ? 'pilates' : 'yoga'
  const options: ChoiceOption[] = stylesFor(discipline).map((st) => ({
    value: st.id,
    label: st.label,
    description: `${st.blurb} ${st.minutes[0]}-${st.minutes[1]} min a session.`,
  }))
  return (
    <StepShell
      title={discipline === 'yoga' ? 'What Do You Want From Yoga?' : 'What Do You Want From Pilates?'}
      subtitle="This is your goal. Pick the kind of session that fits it. Each one is a set sequence you repeat."
    >
      <ChoiceGrid
        options={options}
        value={answers.mindBodyStyle}
        onChange={(v) => {
          update('mindBodyStyle', v as IntakeAnswers['mindBodyStyle'])
          const style = MIND_BODY_STYLE_BY_ID.get(v as NonNullable<IntakeAnswers['mindBodyStyle']>)
          if (style) {
            // The style decides the level and the calorie goal, so yoga and Pilates do not ask those questions again
            update('experience', style.experience)
            update('goal', style.goal)
          }
        }}
      />
    </StepShell>
  )
}

/** The goal question: lifting has four goals, while yoga and Pilates have their own (the style), so it is asked only once. */
function StepGoalOrStyle(props: StepProps) {
  return isMindBody(props.answers.equipment ?? '') ? <StepStyle {...props} /> : <Step11Goal {...props} />
}

function Step10Days({ answers, update }: StepProps) {
  const mindBody = isMindBody(answers.equipment ?? '')
  const discipline = disciplineOf(answers.equipment ?? '') === 'pilates' ? 'pilates' : 'yoga'
  const style = answers.mindBodyStyle ? MIND_BODY_STYLE_BY_ID.get(answers.mindBodyStyle) : undefined
  const options: ChoiceOption[] = mindBody
    ? MIND_BODY_DAY_OPTIONS[discipline].map((n) => ({
        value: String(n),
        label: n === 7 ? '7 Days/Week' : `${n} Days/Week`,
        description: n === 7 ? 'Every day' : weekdaysFor(n).map((d) => d.slice(0, 3)).join(', '),
      }))
    : [
        { value: '3', label: '3 Days/Week' },
        { value: '4', label: '4 Days/Week' },
        { value: '5', label: '5 Days/Week' },
        { value: '6', label: '6 Days/Week' },
      ]
  return (
    <StepShell
      title={mindBody ? 'Sessions per Week' : 'Training Frequency'}
      subtitle={
        mindBody
          ? style
            ? `${style.label} is usually done ${style.recommended}. How many days can you commit to?`
            : 'How many days a week would you like to practice?'
          : 'How many days per week can you commit to training?'
      }
    >
      <ChoiceGrid
        options={options}
        value={answers.trainingDays ? String(answers.trainingDays) : undefined}
        onChange={(v) => update('trainingDays', Number(v) as IntakeAnswers['trainingDays'])}
      />
    </StepShell>
  )
}

function Step11Goal({ answers, update }: StepProps) {
  const options: (ChoiceOption & { dot: string })[] = [
    { value: 'lose-weight', label: 'Lose Weight', description: 'Fat loss, calorie deficit', dot: 'bg-goal-lose' },
    { value: 'build-muscle', label: 'Build Muscle', description: 'Hypertrophy, calorie surplus', dot: 'bg-goal-muscle' },
    { value: 'strength-power', label: 'Strength & Power', description: 'Max strength, low reps', dot: 'bg-goal-strength' },
    { value: 'body-recomposition', label: 'Body Recomposition', description: 'Lose fat, build muscle', dot: 'bg-goal-recomp' },
  ]
  return (
    <StepShell title="Primary Goal" subtitle="What's the main outcome you're training for?">
      <ChoiceGrid
        options={options.map(({ dot, ...o }) => ({
          ...o,
          icon: <span className={cn('block h-2.5 w-2.5 rounded-full', dot)} />,
        }))}
        value={answers.goal}
        onChange={(v) => update('goal', v as IntakeAnswers['goal'])}
      />
    </StepShell>
  )
}

function Step12Equipment({ answers, update }: StepProps) {
  const options: ChoiceOption[] = [
    { value: 'full-gym', label: 'Full Commercial Gym' },
    { value: 'dumbbells-only', label: 'Dumbbells Only' },
    { value: 'calisthenics', label: 'Bodyweight / Calisthenics' },
    { value: 'resistance-bands', label: 'Resistance Bands' },
    { value: 'yoga', label: 'Yoga', description: 'Mat only. Poses held for time, no sets or reps' },
    { value: 'pilates', label: 'Pilates', description: 'Mat Pilates. Slow, controlled moves, no machine' },
  ]
  return (
    <StepShell title="How Do You Want to Train?" subtitle="Pick what you have or what you enjoy. We only program moves you can actually do.">
      <ChoiceGrid
        options={options}
        value={answers.equipment}
        onChange={(v) => update('equipment', v as IntakeAnswers['equipment'])}
      />
    </StepShell>
  )
}

function Step13Focus({ answers, update }: StepProps) {
  const focusOptions: ChoiceOption[] = [
    { value: 'chest', label: 'Chest' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'arms', label: 'Arms' },
    { value: 'legs', label: 'Legs' },
    { value: 'glutes', label: 'Glutes' },
    { value: 'core', label: 'Core' },
    { value: 'full-body', label: 'Full Body' },
  ]
  const injuryOptions: ChoiceOption[] = [
    { value: 'none', label: 'None' },
    { value: 'knee', label: 'Knee' },
    { value: 'shoulder', label: 'Shoulder' },
    { value: 'lower-back', label: 'Lower Back' },
    { value: 'other', label: 'Other' },
  ]
  const mindBody = isMindBody(answers.equipment ?? '')
  return (
    <StepShell
      title={mindBody ? 'Limitations' : 'Focus Areas & Limitations'}
      subtitle={
        mindBody
          ? 'Flag any injury so we swap out poses and moves that are not right for you.'
          : 'Pick any muscle groups to emphasize, and flag any injuries.'
      }
    >
      <div className="space-y-6">
        {!mindBody && (
          <div>
            <Label className="mb-3 block">Focus areas (select any)</Label>
            <MultiChoiceGrid
              options={focusOptions}
              values={answers.focusAreas ?? []}
              onChange={(v) => update('focusAreas', v as IntakeAnswers['focusAreas'])}
              columns={3}
            />
          </div>
        )}
        <div>
          <Label className="mb-3 block">Injuries / limitations</Label>
          <ChoiceGrid
            options={injuryOptions}
            value={answers.injuries}
            onChange={(v) => update('injuries', v as IntakeAnswers['injuries'])}
            columns={3}
          />
        </div>
      </div>
    </StepShell>
  )
}

type StepDef = { Component: (props: StepProps) => React.ReactElement; valid: (a: Partial<IntakeAnswers>) => boolean }

const STEP_EQUIPMENT: StepDef = { Component: Step12Equipment, valid: (a) => !!a.equipment }
const STEP_GOAL: StepDef = { Component: StepGoalOrStyle, valid: (a) => (isMindBody(a.equipment ?? '') ? !!a.mindBodyStyle && !!a.goal : !!a.goal) }
const STEP_LEVEL: StepDef = { Component: Step5Experience, valid: (a) => !!a.experience }
const STEP_DAYS: StepDef = {
  Component: Step10Days,
  valid: (a) =>
    !!a.trainingDays &&
    (!isMindBody(a.equipment ?? '') ||
      MIND_BODY_DAY_OPTIONS[disciplineOf(a.equipment ?? '') === 'pilates' ? 'pilates' : 'yoga'].includes(a.trainingDays)),
}
const BODY_STEPS: StepDef[] = [
  { Component: Step1Sex, valid: (a) => !!a.sex },
  { Component: Step2Age, valid: (a) => !!a.age && a.age >= 16 && a.age <= 80 },
  { Component: Step3Weight, valid: (a) => !!a.weight && a.weight > 0 },
  { Component: Step4Height, valid: (a) => a.heightFeet !== undefined && a.heightInches !== undefined && a.heightFeet > 0 },
  { Component: Step6Activity, valid: (a) => !!a.activityLevel },
  { Component: Step7Sleep, valid: (a) => !!a.sleepHours },
  { Component: Step8SleepQuality, valid: (a) => !!a.sleepQuality },
  { Component: Step9Stress, valid: (a) => !!a.stressLevel },
  { Component: Step13Focus, valid: (a) => !!a.injuries },
]

/**
 * What you want to do comes first (training type, then the goal), then the plan details, then the questions about your body.
 * Yoga and Pilates skip the level question (the style sets it), so they have one step fewer.
 */
function stepsFor(a: Partial<IntakeAnswers>): StepDef[] {
  return [STEP_EQUIPMENT, STEP_GOAL, ...(isMindBody(a.equipment ?? '') ? [] : [STEP_LEVEL]), STEP_DAYS, ...BODY_STEPS]
}

export function IntakeWizard({
  onComplete,
  submitting,
  error,
}: {
  onComplete: (answers: IntakeAnswers) => void
  submitting: boolean
  error: string | null
}) {
  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [answers, setAnswers] = React.useState<Partial<IntakeAnswers>>(DEFAULT_ANSWERS)

  const update = React.useCallback(<K extends keyof IntakeAnswers>(key: K, value: IntakeAnswers[K]) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'equipment' && prev.equipment && prev.equipment !== value) {
        const before = disciplineOf(prev.equipment)
        const after = disciplineOf(value as string)
        if (before !== after) {
          // Lifting, yoga and Pilates ask different level / frequency questions, so start those again
          next.trainingDays = undefined
          next.mindBodyStyle = undefined
          next.experience = undefined
          next.goal = undefined
        }
      }
      return next
    })
  }, [])

  const steps = stepsFor(answers)
  const TOTAL_STEPS = steps.length
  const StepComponent = steps[step].Component
  const valid = steps[step].valid(answers)
  const isLast = step === TOTAL_STEPS - 1

  const goNext = () => {
    if (!valid) return
    if (isLast) {
      onComplete(answers as IntakeAnswers)
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  if (submitting) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient shadow-glow-lg">
            <Loader2 className="h-9 w-9 animate-spin text-primary-foreground" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-3xl tracking-wide text-gradient-gold">FORGING YOUR PROGRAM</h2>
          <p className="mt-2 font-body text-muted-foreground max-w-sm">
            Calculating your TDEE, recovery score, and building a periodized training split tailored to your answers...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-16">
      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-body text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <Flame className="h-4 w-4 text-accent" />
        </div>
        <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative min-h-[380px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <StepComponent answers={answers} update={update} />
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} disabled={step === 0} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={goNext} disabled={!valid} size="lg" className="gap-1.5">
          {isLast ? (
            <>
              <Dumbbell className="h-4 w-4" />
              Generate My Program
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
