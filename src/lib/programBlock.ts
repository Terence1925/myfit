// A program is a 12-week block: 12 weeks of training, then a deload week, then it is complete and a new program is made.
// Week 1 starts the day the program is generated. Everything here is worked out from that date, so it applies to every
// program (no stored state to keep in step).

export const BLOCK_WEEKS = 12
export const DELOAD_WEEKS = 1
export const TOTAL_WEEKS = BLOCK_WEEKS + DELOAD_WEEKS
export const BLOCK_DAYS = TOTAL_WEEKS * 7

const DAY_MS = 24 * 60 * 60 * 1000

/** training = weeks 1-11, final = week 12 (test week), deload = week 13, complete = after week 13. */
export type BlockPhase = 'training' | 'final' | 'deload' | 'complete'

export interface BlockStatus {
  phase: BlockPhase
  /** The current week, 1 to 13 (stays 13 once complete). */
  week: number
  /** Whole days until the program ends (0 once complete). */
  daysLeft: number
  /** When the program ends (the end of week 13). */
  endsAt: Date
  complete: boolean
  /** "Week 5 of 12", "Final week", "Deload week" or "Complete". */
  label: string
}

export function blockStatus(createdAt: string | Date, now: Date = new Date()): BlockStatus {
  const start = new Date(createdAt).getTime()
  const endsAt = new Date(start + BLOCK_DAYS * DAY_MS)
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - start) / DAY_MS))
  const rawWeek = Math.floor(elapsedDays / 7) + 1
  const complete = now.getTime() >= endsAt.getTime()
  const week = Math.min(rawWeek, TOTAL_WEEKS)
  const phase: BlockPhase = complete ? 'complete' : week <= BLOCK_WEEKS - 1 ? 'training' : week === BLOCK_WEEKS ? 'final' : 'deload'
  const daysLeft = complete ? 0 : Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS))
  const label =
    phase === 'training' ? `Week ${week} of ${BLOCK_WEEKS}` : phase === 'final' ? 'Final week' : phase === 'deload' ? 'Deload week' : 'Complete'
  return { phase, week, daysLeft, endsAt, complete, label }
}

/** When the program should be marked as ending (for new programs). */
export function blockEndsAt(createdAt: Date = new Date()): Date {
  return new Date(createdAt.getTime() + BLOCK_DAYS * DAY_MS)
}

// The words used on screen, so they read the same everywhere (overview, plan-ready screen, PDF).
export const BLOCK_NOTE = `This program is built for ${BLOCK_WEEKS} weeks. After week ${BLOCK_WEEKS}, take a deload week, then generate a new program.`

export const DELOAD_ADVICE =
  'Deload week: use about 40-60% of your usual weights, do about half the sets, and stay well away from failure. Light cardio and mobility are welcome. Your program ends after this week, then you generate your next one.'

export const FINAL_WEEK_NOTE = 'Final week of this block. Test your main lifts to see how far you have come. A deload week follows.'

export const COMPLETE_NOTE = `Your ${BLOCK_WEEKS} weeks are done. Generate a new program to keep progressing.`

// A year is four blocks. Each new program is the next block, so the training changes instead of repeating:
// the main lifts stay (so strength carries over), about a third of the accessories rotate, and the rep ranges move.
export interface TrainingBlock {
  /** 1 to 4 (it starts again at 1 after the fourth block). */
  number: number
  name: string
  summary: string
  /** Rep ranges for the main lifts and the accessories; undefined keeps what the program already has. */
  mainReps?: string
  accessoryReps?: string
  mainRest?: string
}

export const TRAINING_BLOCKS: TrainingBlock[] = [
  { number: 1, name: 'Foundation', summary: 'Learn the lifts, build a base and get used to the weekly routine.' },
  { number: 2, name: 'Strength', summary: 'Heavier main lifts in lower rep ranges, with fresh accessory exercises.', mainReps: '4-6', mainRest: '2-3 min' },
  { number: 3, name: 'Size', summary: 'More reps and more muscle work, with fresh accessory exercises.', mainReps: '8-10', accessoryReps: '10-15' },
  { number: 4, name: 'Peak', summary: 'Your heaviest block: low reps on the main lifts, short and sharp accessories.', mainReps: '3-5', accessoryReps: '6-8', mainRest: '2-3 min' },
]

/** Which block the next program is, given how many 12-week programs the person has already finished. */
export function trainingBlockFor(finishedPrograms: number): TrainingBlock {
  return TRAINING_BLOCKS[Math.max(0, finishedPrograms) % TRAINING_BLOCKS.length]
}
