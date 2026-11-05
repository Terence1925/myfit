import * as React from 'react'
import { Eye } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OverviewTab } from './OverviewTab'
import { WeeklyPlanTab } from './WeeklyPlanTab'
import { NutritionTab } from './NutritionTab'
import { RecoveryTab } from './RecoveryTab'
import { loadView, saveView } from '@/lib/workoutLog'
import { programs } from '@/lib/backend/api'
import { withExercise } from '@/lib/programEdit'
import { hasProAccess } from '@/lib/billing'
import { useAuth } from '@/context/AuthContext'
import type { Exercise, WorkoutProgram } from '@/lib/types'

/** The four tabs of a program (Overview, Weekly plan, Nutrition, Recovery). They live on their own page, opened from My programs. */
export function ProgramTabs({
  program,
  userId,
  onProgramUpdate,
  readOnly = false,
}: {
  program: WorkoutProgram
  userId: string
  onProgramUpdate: (p: WorkoutProgram) => void
  /** A finished 12-week program can be looked at, but not trained from. */
  readOnly?: boolean
}) {
  const { profile, role } = useAuth()
  // Reopen where the person left off (e.g. Weekly plan, Day 3), or on the day chosen with Start workout on Home.
  const [tab, setTab] = React.useState(() => loadView(program.id)?.tab ?? 'overview')
  const [activeDay, setActiveDay] = React.useState(() => loadView(program.id)?.day ?? 1)
  React.useEffect(() => {
    saveView(program.id, tab, activeDay)
  }, [program.id, tab, activeDay])
  const proAccess = hasProAccess(profile, role)

  const handleSwap = async (dayNumber: number, exerciseIndex: number, exerciseName: string, dayFocus: string) => {
    const today = program.programData.days.find((d) => d.day === dayNumber)?.exercises.map((e) => e.name) ?? []
    const swap = await programs.alternate(userId, exerciseName, dayFocus, program.answers, today)
    // Nothing similar to offer: keep the exercise (false tells the screen to say so)
    if (swap.name === exerciseName) return false
    const updatedDays = program.programData.days.map((d) =>
      d.day === dayNumber
        ? { ...d, exercises: d.exercises.map((e, i) => (i === exerciseIndex ? swap : e)) }
        : d,
    )
    const updatedProgramData = { ...program.programData, days: updatedDays }
    onProgramUpdate({ ...program, programData: updatedProgramData })
    await programs.update(program.id, updatedProgramData)
  }

  const handleCustom = async (dayNumber: number, exerciseIndex: number, exercise: Exercise) => {
    const updatedProgramData = withExercise(program.programData, dayNumber, exerciseIndex, exercise)
    onProgramUpdate({ ...program, programData: updatedProgramData })
    await programs.update(program.id, updatedProgramData)
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4">
          <Eye className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-display text-xl tracking-wide">Finished program</div>
            <p className="mt-0.5 font-body text-sm text-muted-foreground">
              You are looking back at a program you completed. It is view only. Generate a new program to keep training.
            </p>
          </div>
        </div>
      )}

      <Tabs id="plan-tabs" value={tab} onValueChange={setTab} className="scroll-mt-20">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly plan</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            program={program.programData}
            createdAt={program.createdAt}
            onSelectDay={(day) => {
              setActiveDay(day)
              setTab('weekly')
            }}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyPlanTab
            program={program.programData}
            programId={program.id}
            userId={userId}
            activeDay={activeDay}
            onActiveDayChange={setActiveDay}
            onSwapExercise={handleSwap}
            onCustomExercise={handleCustom}
            hasProgressAccess={proAccess}
            readOnly={readOnly}
            startedAt={program.createdAt}
          />
        </TabsContent>

        <TabsContent value="nutrition" className="mt-6">
          <NutritionTab nutrition={program.nutrition} tips={program.programData.nutritionTips} />
        </TabsContent>

        <TabsContent value="recovery" className="mt-6">
          <RecoveryTab
            recoveryScore={program.recoveryScore}
            answers={program.answers}
            advice={program.programData.recoveryAdvice}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
