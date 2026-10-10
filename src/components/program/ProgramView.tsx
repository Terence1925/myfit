import * as React from 'react'
import { motion } from 'framer-motion'
import { Crown, FileDown, Loader2, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './OverviewTab'
import { WeeklyPlanTab } from './WeeklyPlanTab'
import { NutritionTab } from './NutritionTab'
import { RecoveryTab } from './RecoveryTab'
import { exportProgramPdf } from '@/lib/exportProgramPdf'
import { loadView, saveView } from '@/lib/workoutLog'
import { GOAL_TAILWIND_CLASS, GOAL_LABELS } from '@/lib/tdee'
import { programs } from '@/lib/backend/api'
import { canExportPdf, hasProAccess } from '@/lib/billing'
import { useAuth } from '@/context/AuthContext'
import type { WorkoutProgram } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProgramView({
  program,
  userId,
  onProgramUpdate,
}: {
  program: WorkoutProgram
  userId: string
  onProgramUpdate: (p: WorkoutProgram) => void
}) {
  const { profile, role } = useAuth()
  const navigate = useNavigate()
  // Reopen where the person left off (e.g. Weekly Plan, Day 3) if the app was closed or reloaded while
  // it was in the background.
  const [tab, setTab] = React.useState(() => loadView(program.id)?.tab ?? 'overview')
  const [activeDay, setActiveDay] = React.useState(() => loadView(program.id)?.day ?? 1)
  React.useEffect(() => {
    saveView(program.id, tab, activeDay)
  }, [program.id, tab, activeDay])
  const [exporting, setExporting] = React.useState(false)
  const [exportError, setExportError] = React.useState<string | null>(null)
  const proAccess = hasProAccess(profile, role)
  const exportAllowed = canExportPdf(profile, role)

  const handleSwap = async (dayNumber: number, exerciseIndex: number, exerciseName: string, dayFocus: string) => {
    const today = program.programData.days.find((d) => d.day === dayNumber)?.exercises.map((e) => e.name) ?? []
    const swap = await programs.alternate(userId, exerciseName, dayFocus, program.answers, today)
    const updatedDays = program.programData.days.map((d) =>
      d.day === dayNumber
        ? { ...d, exercises: d.exercises.map((e, i) => (i === exerciseIndex ? swap : e)) }
        : d,
    )
    const updatedProgramData = { ...program.programData, days: updatedDays }
    onProgramUpdate({ ...program, programData: updatedProgramData })
    await programs.update(program.id, updatedProgramData)
  }

  const handleExportPdf = async () => {
    if (!profile || !proAccess) {
      navigate('/pricing')
      return
    }
    if (!exportAllowed) {
      // Subscribed, but still inside the free trial.
      setExportError('PDF export unlocks after your free trial ends and your first payment goes through.')
      return
    }
    setExporting(true)
    setExportError(null)
    try {
      await exportProgramPdf(program)
    } catch (err) {
      // Dismissing the share sheet rejects on some Android versions — that's not a failure.
      const msg = err instanceof Error ? err.message : ''
      if (!/cancel|dismiss/i.test(msg)) setExportError('Could not create the PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn('relative overflow-hidden rounded-2xl border p-6 sm:p-10', GOAL_TAILWIND_CLASS[program.answers.goal])}
        >
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                {GOAL_LABELS[program.answers.goal]}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground">
                {program.programData.programName}
              </h1>
              <p className="mt-3 font-body text-foreground/80 max-w-2xl">{program.programData.tagline}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0 bg-background/40"
                onClick={handleExportPdf}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exportAllowed ? (
                  <FileDown className="h-4 w-4" />
                ) : proAccess ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
                Export PDF
              </Button>
              {exportError && <p className="max-w-[16rem] text-right text-xs text-destructive">{exportError}</p>}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-current opacity-[0.08] blur-3xl" />
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              program={program.programData}
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
              hasProgressAccess={proAccess}
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
    </div>
  )
}
