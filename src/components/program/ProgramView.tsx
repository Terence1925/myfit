import * as React from 'react'
import { motion } from 'framer-motion'
import { Crown, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './OverviewTab'
import { WeeklyPlanTab } from './WeeklyPlanTab'
import { NutritionTab } from './NutritionTab'
import { RecoveryTab } from './RecoveryTab'
import { ProgramPrintView } from './ProgramPrintView'
import { GOAL_TAILWIND_CLASS, GOAL_LABELS } from '@/lib/tdee'
import { programs } from '@/lib/backend/api'
import { hasProAccess } from '@/lib/billing'
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
  const [tab, setTab] = React.useState('overview')
  const [activeDay, setActiveDay] = React.useState(1)
  const proAccess = hasProAccess(profile, role)

  const handleSwap = async (dayNumber: number, exerciseIndex: number, exerciseName: string, dayFocus: string) => {
    const swap = await programs.alternate(userId, exerciseName, dayFocus, program.answers)
    const updatedDays = program.programData.days.map((d) =>
      d.day === dayNumber
        ? { ...d, exercises: d.exercises.map((e, i) => (i === exerciseIndex ? swap : e)) }
        : d,
    )
    onProgramUpdate({ ...program, programData: { ...program.programData, days: updatedDays } })
  }

  const handleExportPdf = () => {
    if (!profile || !proAccess) {
      navigate('/pricing')
      return
    }
    window.print()
  }

  return (
    <div className="space-y-8">
      <div className="print:hidden space-y-8">
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
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0 bg-background/40" onClick={handleExportPdf}>
              {proAccess ? <FileDown className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
              Export PDF
            </Button>
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

      <ProgramPrintView program={program} />
    </div>
  )
}
