import { useNavigate } from 'react-router-dom'
import { BlockBanner, BlockChip } from './BlockTimeline'
import { DELOAD_ADVICE, FINAL_WEEK_NOTE, blockStatus } from '@/lib/programBlock'
import { TodayCard } from './TodayCard'
import { saveView } from '@/lib/workoutLog'
import type { WorkoutProgram } from '@/lib/types'

/**
 * The Home screen for a member's current program: today's card, and which week of the 12 they are on. The program's
 * tabs (Overview, Weekly plan, Nutrition, Recovery) are on their own page, opened from My programs.
 */
export function ProgramView({ program, userId }: { program: WorkoutProgram; userId: string }) {
  const navigate = useNavigate()
  const block = blockStatus(program.createdAt)

  return (
    <div className="space-y-8">
      <BlockBanner status={block} note={block.phase === 'deload' ? DELOAD_ADVICE : FINAL_WEEK_NOTE} />
      <TodayCard
        program={program}
        userId={userId}
        onStart={(day) => {
          // Logging a workout is in the Weekly plan, so open the program page there, on this day
          saveView(program.id, 'weekly', day)
          navigate(`/saved/${program.id}`)
        }}
      />
      {/* Which week of the 12: the last thing on the page, 12px under the card */}
      <BlockChip status={block} className="!mt-3" />
    </div>
  )
}
