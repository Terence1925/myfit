import * as React from 'react'
import { BlockBanner, BlockChip } from './BlockTimeline'
import { DELOAD_ADVICE, FINAL_WEEK_NOTE, blockStatus } from '@/lib/programBlock'
import { TodayCard } from './TodayCard'
import { TodayWorkout } from './TodayWorkout'
import type { WorkoutProgram } from '@/lib/types'

/**
 * The Home screen for a member's current program: today's card, and which week of the 12 they are on. Start workout
 * scrolls down to that day's exercises, one page each. The program's tabs are on their own page, opened from My programs.
 */
export function ProgramView({ program, userId, onProgramUpdate }: { program: WorkoutProgram; userId: string; onProgramUpdate: (p: WorkoutProgram) => void }) {
  const block = blockStatus(program.createdAt)
  const [startedDay, setStartedDay] = React.useState<number | null>(null)

  return (
    <div className="space-y-8">
      <BlockBanner status={block} note={block.phase === 'deload' ? DELOAD_ADVICE : FINAL_WEEK_NOTE} />
      <TodayCard
        program={program}
        userId={userId}
        onStart={(day) => {
          setStartedDay(day)
          // once the workout is on the page, glide down to it
          setTimeout(() => document.getElementById('today-workout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
        }}
      />
      {startedDay !== null && <TodayWorkout key={startedDay} program={program} userId={userId} dayNumber={startedDay} onProgramUpdate={onProgramUpdate} />}
      {/* Which week of the 12: always the last thing on the page (12px under the card until a workout opens) */}
      <BlockChip status={block} className={startedDay === null ? '!mt-3' : '!mt-4'} />
    </div>
  )
}
